import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { DependencyTracker, CascadeState, TreeNode } from './dependency.js';
import {
  AgentInvoker,
  InvocationOptions,
  InvocationResult,
  getAgentForTrigger,
} from './invocation.js';
import type { ThinkingLevel } from 'parser.spec.dir/src/types.js';

export interface VerificationGate {
  name: string;
  check: () => Promise<GateResult>;
}

export interface GateResult {
  passed: boolean;
  message: string;
  details?: string[];
}

export interface CoordinatorOptions {
  maxDepth?: number;
  verbose?: boolean;
  skipTests?: boolean;
  /**
   * ARCH-003: when true (default), independent cascade nodes are invoked
   * concurrently via `AgentInvoker.invokeMany`. When false, the legacy
   * sequential loop is used (one node at a time).
   */
  parallel?: boolean;
  /**
   * Optional cap on concurrent agent invocations within a wave. `undefined`
   * = unbounded (all agents in a wave fire in parallel).
   */
  concurrency?: number;
  /**
   * THINK-002: reasoning-depth map by agent name. When set, the coordinator
   * looks up the agent for each cascade node and forwards the configured
   * ThinkingLevel to the invocation. Agents not present in the map fall back
   * to DEFAULT_THINKING_BY_AGENT. Pass an explicit `{}` to disable the
   * defaults entirely.
   */
  thinking?: Record<string, ThinkingLevel>;
}

/**
 * THINK-002: default reasoning-depth per agent role.
 *   - spec-writer (spec_expand)  → low
 *   - code-gen    (code_generate) → high
 *   - test-writer                 → medium
 *   - coordinator (spec_read)     → none
 *
 * Token budget scales roughly with reasoning depth, so gating here is the
 * primary lever for reducing cascade token usage.
 */
export const DEFAULT_THINKING_BY_AGENT: Record<string, ThinkingLevel> = {
  'speclang-spec-writer': 'low',
  'speclang-code-gen': 'high',
  'speclang-test-writer': 'medium',
  'speclang-coordinator': 'none',
};

export class CascadeCoordinator {
  private tracker: DependencyTracker;
  private state: CascadeState;
  private options: CoordinatorOptions;
  private gates: VerificationGate[] = [];
  private invoker: AgentInvoker;

  constructor(
    indexPath: string = '_index.json',
    options: CoordinatorOptions = {}
  ) {
    this.tracker = new DependencyTracker(indexPath);
    this.options = {
      maxDepth: 5,
      verbose: false,
      parallel: true,
      ...options,
    };
    this.state = this.tracker.createInitialState('', this.options.maxDepth);
    this.invoker = new AgentInvoker(this.options.verbose ?? false);

    this.setupGates();
  }

  /**
   * ARCH-003: Replace the default executor with an injectable AgentInvoker.
   * Used by tests to inject a fake executor that sleeps/asserts concurrency
   * without shelling out to real `speclang agent` invocations.
   */
  setInvoker(invoker: AgentInvoker): void {
    this.invoker = invoker;
  }

  /**
   * ARCH-003: Access the underlying invoker (for tests + advanced use).
   */
  getInvoker(): AgentInvoker {
    return this.invoker;
  }

  private setupGates(): void {
    this.gates = [
      {
        name: 'reference-validation',
        check: async () => this.runReferenceValidation()
      },
      {
        name: 'compilation',
        check: async () => this.runCompilationCheck()
      },
      {
        name: 'tests',
        check: async () => this.runTestExecution()
      }
    ];
  }

  private async runReferenceValidation(): Promise<GateResult> {
    try {
      execSync('python3 scripts/validate_refs.py', { stdio: 'pipe' });
      return { passed: true, message: 'All references valid' };
    } catch {
      return {
        passed: false,
        message: 'Reference validation failed',
        details: ['Run: python3 scripts/validate_refs.py for details']
      };
    }
  }

  private async runCompilationCheck(): Promise<GateResult> {
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      return { passed: true, message: 'Code compiles successfully' };
    } catch {
      return {
        passed: false,
        message: 'Compilation failed',
        details: ['Run: npx tsc --noEmit --skipLibCheck for details']
      };
    }
  }

  private async runTestExecution(): Promise<GateResult> {
    if (this.options.skipTests) {
      return { passed: true, message: 'Tests skipped' };
    }

    try {
      const output = execSync('python3 -m pytest tests/ -v --tb=short 2>&1 || true', {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });

      const passed = output.includes('passed');
      const failed = output.includes('failed');

      return {
        passed: !failed,
        message: passed ? 'Tests passed' : 'Some tests failed',
        details: [output.slice(-500)]
      };
    } catch {
      return { passed: false, message: 'Test execution failed' };
    }
  }

  async runGate(gateName: string): Promise<GateResult> {
    const gate = this.gates.find(g => g.name === gateName);
    if (!gate) {
      return { passed: false, message: `Gate not found: ${gateName}` };
    }
    return gate.check();
  }

  async runAllGates(): Promise<Record<string, GateResult>> {
    const results: Record<string, GateResult> = {};

    for (const gate of this.gates) {
      results[gate.name] = await gate.check();
    }

    return results;
  }

  start(triggerFile: string): void {
    this.state = this.tracker.createInitialState(triggerFile, this.options.maxDepth);
    this.state.status = 'running';
    // ARCH-003: load the index lazily at start time so the cascade can be
    // triggered without requiring callers to remember to call loadIndex()
    // first. Existing callers that pre-loaded still work (loadIndex is
    // idempotent — it just rebuilds the graph from the same file).
    this.tracker.loadIndex();
    this.saveState();

    if (this.options.verbose) {
      console.log(`[Coordinator] Started cascade: ${this.state.cascade_id}`);
    }
  }

  async processTree(
    treeType: 'spec' | 'code' | 'test' | 'doc',
    onNode?: (node: TreeNode) => Promise<void>
  ): Promise<{ processed: number; failed: number }> {
    const nodes = this.tracker.getTree(treeType);
    let processed = 0;
    let failed = 0;

    for (const node of nodes) {
      try {
        if (onNode) {
          await onNode(node);
        }
        processed++;
        this.state.depth_by_tree[treeType]++;
      } catch {
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Build the per-node InvocationOptions used by the swarm.
   * Exposed so tests can verify routing logic without running the cascade.
   *
   * THINK-002: resolves the reasoning-depth for the node's agent from
   * `options.thinking` (user overrides) falling back to
   * DEFAULT_THINKING_BY_AGENT. Pass `thinking: {}` in CoordinatorOptions to
   * disable thinking entirely.
   */
  buildInvocation(node: TreeNode): InvocationOptions {
    const agent = getAgentForTrigger(node.filePath);
    const thinking = this.resolveThinking(agent);
    const opts: InvocationOptions = {
      agent,
      trigger: node.filePath,
      params: { layer: node.layer, type: node.type, id: node.id },
    };
    if (thinking !== undefined) {
      opts.thinking = thinking;
    }
    return opts;
  }

  /**
   * THINK-002: look up the ThinkingLevel for an agent.
   * User-supplied `options.thinking` wins over the defaults. Returns
   * `undefined` when the caller explicitly disabled gating with `{}`.
   */
  private resolveThinking(agent: string): ThinkingLevel | undefined {
    const overrides = this.options.thinking;
    if (overrides !== undefined) {
      return overrides[agent];
    }
    return DEFAULT_THINKING_BY_AGENT[agent];
  }

  /**
   * ARCH-003: Run a cascade by fanning out per-wave in parallel.
   *
   * Algorithm:
   *   1. Topologically order the cascade (respect dependencies within a wave).
   *   2. Partition into waves by `layer` — all nodes in a wave are independent.
   *   3. For each wave, invoke all agents concurrently via `AgentInvoker.invokeMany`.
   *   4. After each wave, run verification gates (compilation, refs, tests).
   *
   * Wall-clock cost = sum of wave costs (≈ slowest agent per wave),
   * NOT sum of all agents — this is the speedup vs. the sequential loop.
   */
  async cascadeFrom(triggerId: string): Promise<CascadeResult> {
    const result: CascadeResult = {
      success: false,
      stepsCompleted: 0,
      gatesPassed: 0,
      gatesFailed: 0,
      errors: [],
      mode: this.options.parallel ? 'swarm' : 'sequential',
      waves: 0,
      parallelism: 0,
    };

    try {
      this.start(triggerId);

      // ARCH-003: use the dependent tree (trigger → all dependents) instead
      // of the dependency tree (trigger → its own deps). For a cascade
      // triggered by a spec change, we want to fan out to the spec's
      // downstream targets (codegen, tests, docs), not its upstream deps.
      const orderedNodes = this.tracker.getDependentsTree(triggerId);

      if (this.options.parallel) {
        await this.cascadeFromSwarm(orderedNodes, result);
      } else {
        await this.cascadeFromSequential(orderedNodes, result);
      }

      result.success = result.gatesFailed === 0;
      this.state.status = result.success ? 'completed' : 'failed';
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      this.state.status = 'failed';
    }

    this.saveState();
    return result;
  }

  /**
   * Sequential path — preserves the original ARCH-001/002 behavior.
   */
  private async cascadeFromSequential(
    orderedNodes: TreeNode[],
    result: CascadeResult
  ): Promise<void> {
    for (const node of orderedNodes) {
      if (this.state.depth >= this.state.max_depth) {
        result.errors.push('Max depth reached');
        break;
      }

      this.state.depth++;
      result.stepsCompleted++;

      if (this.options.verbose) {
        console.log(`[Coordinator] Processing: ${node.id} (depth ${node.layer})`);
      }

      const opts = this.buildInvocation(node);
      const invocation = await this.invoker.invoke(opts);
      this.recordInvocation(invocation);

      const gateResults = await this.runAllGates();
      this.recordGateResults(gateResults, result);
    }
  }

  /**
   * ARCH-003: Parallel path — fan out per-wave via `AgentInvoker.invokeMany`.
   */
  private async cascadeFromSwarm(
    orderedNodes: TreeNode[],
    result: CascadeResult
  ): Promise<void> {
    const waves = this.tracker.partitionByDepth(orderedNodes);
    result.waves = waves.length;
    result.parallelism = waves.reduce((max, w) => Math.max(max, w.length), 0);

    if (this.options.verbose) {
      console.log(
        `[Coordinator] Swarm: ${orderedNodes.length} nodes across ${waves.length} waves ` +
          `(max parallelism: ${result.parallelism})`
      );
    }

    for (const wave of waves) {
      if (this.state.depth >= this.state.max_depth) {
        result.errors.push('Max depth reached');
        break;
      }

      this.state.depth++;
      result.stepsCompleted += wave.length;
      this.state.depth_by_tree[wave[0]?.type ?? 'specs'] += wave.length;

      if (this.options.verbose) {
        const ids = wave.map((n) => `${n.id}@L${n.layer}`).join(', ');
        console.log(`[Coordinator] Wave ${this.state.depth}: ${wave.length} agents [${ids}]`);
      }

      const optsList = wave.map((n) => this.buildInvocation(n));
      const invocations = await this.invoker.invokeMany(optsList, this.options.concurrency);

      for (const inv of invocations) {
        this.recordInvocation(inv);
      }

      // Gates run once per wave (not per agent) — they're expensive
      // and observe the post-wave file system state.
      const gateResults = await this.runAllGates();
      this.recordGateResults(gateResults, result);
    }
  }

  private recordInvocation(invocation: InvocationResult): void {
    this.state.current_agent = invocation.agent;
    this.state.agents_invoked.push({
      agent: invocation.agent,
      timestamp: invocation.timestamp,
      result: invocation.success ? 'success' : 'failure',
      files_modified: invocation.files_modified,
    });
  }

  private recordGateResults(
    gateResults: Record<string, GateResult>,
    result: CascadeResult
  ): void {
    for (const [gate, res] of Object.entries(gateResults)) {
      if (res.passed) {
        result.gatesPassed++;
      } else {
        result.gatesFailed++;
        result.errors.push(`${gate}: ${res.message}`);
      }
    }
  }

  canContinue(): boolean {
    return this.state.status === 'running' &&
           this.state.depth < this.state.max_depth;
  }

  pause(): void {
    this.state.status = 'paused';
    this.saveState();
  }

  resume(): void {
    this.state.status = 'running';
    this.saveState();
  }

  getState(): CascadeState {
    return { ...this.state };
  }

  saveState(): void {
    this.tracker.saveState(this.state);
  }

  loadState(): boolean {
    const state = this.tracker.loadState();
    if (state) {
      this.state = state;
      return true;
    }
    return false;
  }
}

export interface CascadeResult {
  success: boolean;
  stepsCompleted: number;
  gatesPassed: number;
  gatesFailed: number;
  errors: string[];
  /**
   * ARCH-003: 'swarm' = parallel fan-out (default), 'sequential' = legacy loop.
   */
  mode?: 'swarm' | 'sequential';
  /** ARCH-003: number of parallel waves executed. */
  waves?: number;
  /** ARCH-003: max agents invoked concurrently within a single wave. */
  parallelism?: number;
}