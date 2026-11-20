import { CascadeState, TreeNode } from './dependency.js';
import { AgentInvoker, InvocationOptions } from './invocation.js';
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
    /**
     * THINK-004: when true, the cascade coordinator collects token-level
     * metrics from each invocation and includes a token-breakdown summary
     * in the cascade result and printed output.
     */
    metrics?: boolean;
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
export declare const DEFAULT_THINKING_BY_AGENT: Record<string, ThinkingLevel>;
export declare class CascadeCoordinator {
    private tracker;
    private state;
    private options;
    private gates;
    private invoker;
    /**
     * THINK-004: per-invocation metrics store. Index-aligned with
     * `state.agents_invoked`. Entries are null when no metrics were
     * collected for that invocation.
     */
    private invocationMetrics;
    constructor(indexPath?: string, options?: CoordinatorOptions);
    /**
     * ARCH-003: Replace the default executor with an injectable AgentInvoker.
     * Used by tests to inject a fake executor that sleeps/asserts concurrency
     * without shelling out to real `speclang agent` invocations.
     */
    setInvoker(invoker: AgentInvoker): void;
    /**
     * DF-SPECLANG-015: persist an agent's stdout. The agent CLI emits its whole
     * response on stdout; when a seed asks for several artifacts the model
     * separates them with `# generated/<path>` section markers (observed
     * behaviour: one marker line per requested file). Split on those markers so
     * ONE seed produces EVERY artifact it asked for; fall back to the routed
     * task's single target when no markers are present.
     *
     * Returns the list of paths written. Refuses paths outside the project cwd.
     */
    static persistAgentOutput(output: string, fallbackTarget: string | undefined, projectRoot: string): string[];
    /**
     * ARCH-003: Access the underlying invoker (for tests + advanced use).
     */
    getInvoker(): AgentInvoker;
    /**
     * DF-SPECLANG-015: consume routed tasks from a live daemon.
     *
     * The daemon routes AgentTasks (see Daemon.emit('task')) but nothing in the
     * shipped code consumed them — routed spec_writer tasks produced no agent
     * session, so reactive expansion generated nothing. This subscribes to the
     * daemon's 'task' events and invokes the matching agent through the same
     * AgentInvoker used by cascadeFrom (i.e. the proven `speclang agent` path).
     *
     * Dedup: the daemon re-converges on unchanged files every poll cycle, so
     * identical triggers are suppressed while in flight and for ttlMs
     * (default 10 min) after a dispatch — without this, every 30s reconvergence
     * would re-invoke the agent and burn tokens in a loop.
     */
    watchDaemon(daemon: {
        on(event: string, cb: (payload: any) => void): unknown;
    }, options?: {
        ttlMs?: number;
        verbose?: boolean;
    }): void;
    private setupGates;
    private runReferenceValidation;
    private runCompilationCheck;
    private runTestExecution;
    runGate(gateName: string): Promise<GateResult>;
    runAllGates(): Promise<Record<string, GateResult>>;
    start(triggerFile: string): void;
    processTree(treeType: 'spec' | 'code' | 'test' | 'doc', onNode?: (node: TreeNode) => Promise<void>): Promise<{
        processed: number;
        failed: number;
    }>;
    /**
     * Build the per-node InvocationOptions used by the swarm.
     * Exposed so tests can verify routing logic without running the cascade.
     *
     * THINK-002: resolves the reasoning-depth for the node's agent from
     * `options.thinking` (user overrides) falling back to
     * DEFAULT_THINKING_BY_AGENT. Pass `thinking: {}` in CoordinatorOptions to
     * disable thinking entirely.
     */
    buildInvocation(node: TreeNode): InvocationOptions;
    /**
     * THINK-002: look up the ThinkingLevel for an agent.
     * User-supplied `options.thinking` wins over the defaults. Returns
     * `undefined` when the caller explicitly disabled gating with `{}`.
     */
    private resolveThinking;
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
    cascadeFrom(triggerId: string): Promise<CascadeResult>;
    /**
     * Sequential path — preserves the original ARCH-001/002 behavior.
     */
    private cascadeFromSequential;
    /**
     * ARCH-003: Parallel path — fan out per-wave via `AgentInvoker.invokeMany`.
     */
    private cascadeFromSwarm;
    private recordInvocation;
    private recordGateResults;
    canContinue(): boolean;
    pause(): void;
    resume(): void;
    getState(): CascadeState;
    saveState(): void;
    loadState(): boolean;
    /**
     * THINK-004: collate token metrics from all recorded invocations
     * into a per-phase summary.
     */
    collateMetrics(): MetricsSummary;
    /**
     * THINK-004: print a human-readable token-breakdown summary to stdout.
     */
    printMetricsSummary(summary: MetricsSummary): void;
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
    /**
     * THINK-004: per-phase token breakdown. Present when `metrics: true`
     * is passed in CoordinatorOptions.
     */
    metrics_summary?: MetricsSummary;
}
/**
 * THINK-004: token-breakdown summary across all cascade phases.
 */
export interface MetricsSummary {
    /** Total tokens consumed across all phases. */
    total_input_tokens: number;
    total_output_tokens: number;
    total_reasoning_tokens: number;
    /** Per-phase breakdown, keyed by agent name. */
    phases: Record<string, {
        input_tokens: number;
        output_tokens: number;
        reasoning_tokens: number;
        invocations: number;
    }>;
}
//# sourceMappingURL=index.d.ts.map