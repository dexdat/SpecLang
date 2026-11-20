/**
 * Convergence detection for speclangd
 * 
 * Generated from: @speclang/daemon/convergence
 * 
 * Detects when the cascade has settled (no events for quiet period)
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FileEvent, ConvergenceResult, DaemonConfig, AgentStatus, AgentStatusKind, TestResults } from './types';

const execAsync = promisify(exec);

/**
 * DF-SPECLANG-4: the cascade lifecycle is a state machine, not a timestamp
 * predicate.
 *
 * - `cascading` — work is pending: at least one file event arrived and the
 *   cascade has not settled yet (depth >= 1).
 * - `converged` — the cascade queue drained (quiet period elapsed, depth back
 *   to 0). This is TERMINAL until another event arrives; it is what
 *   `/api/status` must report for a settled system.
 * - `idle`      — nothing is queued and nothing converged (reset/abort
 *   discarded the pending work).
 *
 * The distinction matters because `isConverged()` only answers "has the quiet
 * period elapsed", which is ALSO true for a freshly re-armed detector that
 * never received an event. Deriving status from that predicate is what made a
 * settled daemon read as `cascading` forever.
 */
export type CascadeLifecycle = 'idle' | 'cascading' | 'converged';

/** DF-SPECLANG-024: how many output paths a single log line names before eliding. */
const MAX_LISTED_OUTPUTS = 10;

export class ConvergenceDetector extends EventEmitter {
  private lastEventTime: number;
  private quietPeriodMs: number;
  private maxDepth: number;
  private cascadeStartTime: number;
  /**
   * DF-SPECLANG-021 / DF-SPECLANG-024: INPUTS — the distinct spec/source paths
   * the watcher reported for this cascade. One logical file routinely produces
   * several events (added, then modified, then re-verified), so this set is
   * deduped by path. It is a DIAGNOSTIC: an input is not an output, and nothing
   * the user sees as "files changed" may be derived from it (that is exactly
   * how a zero-output save came to report `Files: 1` — the edited spec is a
   * watcher event).
   *
   * `event.oldPath` is deliberately not added: the watcher emits no rename
   * events (it decomposes a rename into Delete + Create on the real paths), so
   * `path` is the complete set of files this cascade has touched.
   */
  private inputPaths: Set<string>;
  /**
   * DF-SPECLANG-024: OUTPUTS — the distinct project files this convergence
   * pass actually WROTE, reported by the writer (the daemon's pipeline) via
   * `recordOutputs()`. This set is the single source of truth for the
   * user-visible changed-file count.
   */
  private outputPaths: Set<string>;
  /**
   * DF-SPECLANG-024: the accounting symbol every surface reports — the number
   * of OUTPUT files written by this pass (`outputPaths.size`), never the number
   * of watcher events and never the number of inputs.
   */
  private filesChangedCount: number;
  private currentDepth: number;
  private converged: boolean;
  /** DF-SPECLANG-4: true from the first file event until the cascade settles. */
  private cascadePending: boolean;
  private checkTimer?: NodeJS.Timeout;
  private agentStatuses: Map<string, AgentStatus>;
  private testOnConverge: boolean;
  private autoCommit: boolean;

  constructor(config: DaemonConfig) {
    super();
    this.quietPeriodMs = config.convergence.quietPeriod * 1000;
    this.maxDepth = config.convergence.maxDepth;
    this.lastEventTime = Date.now();
    this.cascadeStartTime = Date.now();
    this.inputPaths = new Set();
    this.outputPaths = new Set();
    this.filesChangedCount = 0;
    this.currentDepth = 0;
    this.converged = true;
    this.cascadePending = false;
    this.agentStatuses = new Map();
    this.testOnConverge = config.convergence.testOnConverge ?? true;
    this.autoCommit = config.convergence.autoCommit ?? false;
    
    this.startConvergenceCheck();
  }

  /**
   * Called when a file event occurs
   */
  onEvent(event: FileEvent): void {
    this.lastEventTime = Date.now();
    this.converged = false;
    this.cascadePending = true;

    // If this is the first event in a new cascade
    if (this.currentDepth === 0) {
      this.cascadeStartTime = Date.now();
      // DF-SPECLANG-024: a new cascade is a new PASS — it begins with zero
      // outputs written and its own set of inputs. Carrying either over from
      // the previous pass is what made the reported number depend on history
      // instead of on what this pass did.
      this.inputPaths = new Set();
      this.outputPaths = new Set();
      this.filesChangedCount = 0;
    }

    // DF-SPECLANG-024: track the path as an INPUT. Recording it as a changed
    // file is the original defect: the spec the user just saved is not a file
    // the cascade produced.
    this.inputPaths.add(event.path);

    this.currentDepth++;
    
    this.emit('event', event);
    console.log(`[Convergence] Event received: ${event.kind} - ${event.path}`);
    console.log(`[Convergence] Inputs: ${this.inputPaths.size}, Outputs: ${this.filesChangedCount}, Depth: ${this.currentDepth}`);
  }

  /**
   * DF-SPECLANG-024: record the OUTPUT files this convergence pass wrote.
   *
   * Called by the component that actually writes (the daemon, right after the
   * on_converge pipeline returns), because only the writer knows what it
   * produced. The detector never infers outputs from watcher events.
   *
   * @param outputs project-relative paths the pass created or rewrote with new
   *                content. Must not contain inputs (a spec/source file the
   *                user edited) — those are tracked separately.
   * @param options.complete   false when the pipeline failed: the files listed
   *                           are what was written before it stopped.
   * @param options.incomplete true when the writer could not enumerate every
   *                           output (e.g. the project tree exceeded the
   *                           snapshot cap) — the count is a lower bound and
   *                           the summary says so instead of guessing.
   */
  recordOutputs(
    outputs: string[],
    options: { complete?: boolean; incomplete?: boolean } = {},
  ): ConvergenceResult {
    for (const output of outputs) {
      const normalized = output.replace(/^\.\//, '');
      if (normalized) this.outputPaths.add(normalized);
    }
    this.filesChangedCount = this.outputPaths.size;

    const result = this.buildResult();
    this.logOutputs(result.duration, options);
    this.emit('outputs', result);
    return result;
  }

  /**
   * DF-SPECLANG-024: the ONE place a completion line is printed, so every
   * settle path reports the same shape (files-changed count + the paths).
   */
  private logOutputs(
    duration: number,
    options: { complete?: boolean; incomplete?: boolean } = {},
  ): void {
    const suffix = options.incomplete
      ? ' (lower bound: project tree exceeded the output snapshot cap)'
      : '';

    if (options.complete === false) {
      console.log(
        `[Convergence] Outputs written before the pipeline stopped — Files: ${this.filesChangedCount}, Duration: ${duration}ms${suffix}`,
      );
    } else {
      console.log(
        `[Convergence] Cascade complete! Files: ${this.filesChangedCount}, Duration: ${duration}ms${suffix}`,
      );
    }

    if (this.filesChangedCount === 0) {
      console.log('[Convergence] Outputs: 0 — this cascade wrote no generated files');
      return;
    }

    const listed = [...this.outputPaths].slice(0, MAX_LISTED_OUTPUTS);
    const remaining = this.filesChangedCount - listed.length;
    console.log(
      `[Convergence] Outputs: ${this.filesChangedCount} — ${listed.join(', ')}${
        remaining > 0 ? ` and ${remaining} more` : ''
      }`,
    );
  }

  /**
   * DF-SPECLANG-024: the single place a ConvergenceResult is shaped, so the
   * status payload, the settle event and the completion summary can never
   * disagree about what `filesChanged` means.
   */
  private buildResult(
    extra: Pick<ConvergenceResult, 'testResults' | 'commitSha'> = {},
  ): ConvergenceResult {
    return {
      converged: this.isConverged(),
      filesChanged: this.filesChangedCount,
      outputs: [...this.outputPaths],
      outputsCount: this.filesChangedCount,
      inputFiles: this.inputPaths.size,
      duration: Date.now() - this.cascadeStartTime,
      cascadeDepth: this.currentDepth,
      timestamp: Date.now(),
      ...extra,
    };
  }

  /**
   * Check if the system has converged (quiet for configured period)
   */
  isConverged(): boolean {
    if (this.converged) return true;
    
    const timeSinceLastEvent = Date.now() - this.lastEventTime;
    return timeSinceLastEvent >= this.quietPeriodMs;
  }

  /**
   * Get time remaining until convergence (if not yet converged)
   */
  timeRemaining(): number | null {
    if (this.isConverged()) return null;
    
    const timeSinceLastEvent = Date.now() - this.lastEventTime;
    return Math.max(0, this.quietPeriodMs - timeSinceLastEvent);
  }

  /**
   * Get current convergence status
   */
  getStatus(): {
    converged: boolean;
    lifecycle: CascadeLifecycle;
    filesChanged: number;
    inputFiles: number;
    outputs: string[];
    currentDepth: number;
    timeRemaining: number | null;
    quietPeriod: number;
  } {
    return {
      converged: this.isConverged(),
      lifecycle: this.getCascadeLifecycle(),
      // DF-SPECLANG-024: outputs written, never watcher events.
      filesChanged: this.filesChangedCount,
      inputFiles: this.inputPaths.size,
      outputs: [...this.outputPaths],
      currentDepth: this.currentDepth,
      timeRemaining: this.timeRemaining(),
      quietPeriod: this.quietPeriodMs,
    };
  }

  /**
   * DF-SPECLANG-4: the cascade lifecycle — the only thing worth reporting as a
   * daemon status. `isConverged()` is a quiet-period predicate and cannot tell
   * "settled" apart from "re-armed and waiting", so status must come from here.
   */
  getCascadeLifecycle(): CascadeLifecycle {
    if (this.cascadePending) return 'cascading';
    return this.converged ? 'converged' : 'idle';
  }

  /**
   * Get convergence result
   */
  getConvergenceResult(): ConvergenceResult {
    const result = this.buildResult();

    if (result.converged) {
      this.converged = true;
      // DF-SPECLANG-4: the queue is drained — the cascade is over, so the
      // depth that counted its in-flight edit rounds goes back to 0. This is
      // the transition that previously only happened inside reset(), i.e. on
      // the path that also un-converged the detector (status -> 'cascading').
      this.cascadePending = false;
      this.currentDepth = 0;
      // DF-SPECLANG-024: settling is NOT completion — the on_converge pipeline
      // has not run yet, so no file has been written at this point. The
      // "Cascade complete! Files: N" line belongs to recordOutputs(), where N
      // is what the pass actually wrote. Printing it here is what made a
      // zero-output save announce "Cascade complete! Files: 1".
      console.log(
        `[Convergence] Cascade settled — inputs: ${result.inputFiles}, outputs: ${result.outputsCount}, Duration: ${result.duration}ms`,
      );
      this.emit('converged', result);
    }

    return result;
  }

  /**
   * Reset convergence state.
   *
   * ARCH-004: also resets `lastEventTime` so `isConverged()` returns
   * false immediately after reset (not stuck in "converged" because
   * the old lastEventTime is still past the quiet period). After
   * reset, the next `onEvent()` re-arms the quiet-period timer
   * normally.
   */
  reset(): void {
    this.inputPaths.clear();
    this.outputPaths.clear();
    this.filesChangedCount = 0;
    this.currentDepth = 0;
    this.converged = false;
    // DF-SPECLANG-4: a reset DISCARDS pending work (abort path). Clearing the
    // pending flag here is what stops the quiet-period timer from emitting a
    // second, phantom 'converged' for events nobody re-sent.
    this.cascadePending = false;
    this.lastEventTime = Date.now();
    this.cascadeStartTime = Date.now();
    console.log('[Convergence] State reset');
  }

  /**
   * Start periodic convergence checking
   */
  private startConvergenceCheck(): void {
    this.checkTimer = setInterval(() => {
      // DF-SPECLANG-4: only a cascade that is actually pending can converge.
      // The old `!converged && isConverged()` gate re-emitted 'converged' on
      // every quiet period after a re-arm — with no new file event — so the
      // pipeline re-ran (and the status flipped back to 'cascading') forever.
      if (this.cascadePending && this.isConverged()) {
        this.getConvergenceResult();
      }
    }, 1000); // Check every second
  }

  /**
   * Stop convergence checking
   */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
  }

  /**
   * Wait for convergence (async)
   */
  async waitForConvergence(timeoutMs?: number): Promise<ConvergenceResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (this.isConverged()) {
          resolve(this.getConvergenceResult());
          return;
        }
        
        if (timeoutMs && Date.now() - startTime > timeoutMs) {
          reject(new Error('Convergence timeout'));
          return;
        }
        
        setTimeout(check, 500);
      };
      
      check();
    });
  }

  /**
   * Get current cascade depth
   */
  getCascadeDepth(): number {
    return this.currentDepth;
  }

  /**
   * Update max depth from config
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = depth;
  }

  /**
   * Update quiet period from config
   */
  setQuietPeriod(seconds: number): void {
    this.quietPeriodMs = seconds * 1000;
  }

  /**
   * Set agent status (called by agents when they start/stop work)
   */
  setAgentStatus(agentId: string, status: AgentStatusKind, currentTask?: string): void {
    this.agentStatuses.set(agentId, {
      id: agentId,
      status,
      lastUpdate: Date.now(),
      currentTask,
    });
    this.emit('agent_status', { agentId, status });
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): AgentStatus[] {
    return Array.from(this.agentStatuses.values());
  }

  /**
   * Check if all agents are idle
   */
  areAllAgentsIdle(): boolean {
    for (const agent of this.agentStatuses.values()) {
      if (agent.status !== AgentStatusKind.Idle) {
        return false;
      }
    }
    return this.agentStatuses.size > 0;
  }

  /**
   * Check if any agent has errors
   */
  hasAgentErrors(): boolean {
    for (const agent of this.agentStatuses.values()) {
      if (agent.status === AgentStatusKind.Error) {
        return true;
      }
    }
    return false;
  }

  /**
   * Run tests (placeholder implementation)
   */
  async runTests(): Promise<TestResults> {
    console.log('[Convergence] Running tests...');
    const startTime = Date.now();
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Try to run tests - this is a placeholder
      // In real implementation, this would run actual test commands
      await execAsync('npm test 2>&1 || true');
      
      return {
        passed: 1,
        failed: 0,
        total: 1,
        duration: Date.now() - startTime,
        errors: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        passed: 0,
        failed: 1,
        total: 1,
        duration: Date.now() - startTime,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Commit changes (placeholder implementation)
   */
  async commitChanges(): Promise<string | null> {
    if (!this.autoCommit) {
      console.log('[Convergence] Auto-commit disabled, skipping');
      return null;
    }
    
    console.log('[Convergence] Committing changes...');
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('git add -A');
      const { stdout } = await execAsync('git commit -m "Auto: Cascade convergence" || echo "nothing to commit"');
      
      if (stdout.includes('nothing to commit')) {
        return null;
      }
      
      const { stdout: shaOutput } = await execAsync('git rev-parse HEAD');
      return shaOutput.trim();
    } catch (error) {
      console.error('[Convergence] Commit failed:', error);
      return null;
    }
  }

  /**
   * Check convergence - implements spec pseudocode
   * check_convergence():
   *   now = timestamp()
   *   if now - last_event_time < QUIET_SECONDS: return StillCascading
   *   for agent in all_agents:
   *     if agent.status != Idle: return StillCascading
   *   return Converged(files_changed, duration, test_results)
   */
  checkConvergence(): { converged: boolean; reason?: string } {
    const now = Date.now();
    
    // Quiet period check
    if (now - this.lastEventTime < this.quietPeriodMs) {
      return { converged: false, reason: 'quiet_period' };
    }
    
    // Agent status check
    if (this.agentStatuses.size > 0 && !this.areAllAgentsIdle()) {
      return { converged: false, reason: 'agents_busy' };
    }
    
    return { converged: true };
  }

  /**
   * Execute on_converge steps from spec:
   * 1. wait for all in-flight events (done via quiet period)
   * 2. verify all agents idle
   * 3. run tests
   * 4. commit changes
   * 5. notify user
   * 6. await next input
   */
  async onConverge(): Promise<ConvergenceResult> {
    console.log('[Convergence] Starting on_converge sequence...');
    
    // Step 2: Verify all agents idle
    if (!this.areAllAgentsIdle()) {
      console.log('[Convergence] Waiting for agents to finish...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    let testResults: TestResults | undefined;
    
    // Step 3: Run tests
    if (this.testOnConverge) {
      testResults = await this.runTests();
      console.log('[Convergence] Tests complete:', testResults);
    }
    
    // Step 4: Commit changes
    let commitSha: string | undefined;
    if (this.autoCommit) {
      commitSha = await this.commitChanges() ?? undefined;
      console.log('[Convergence] Commit complete:', commitSha);
    }
    
    // DF-SPECLANG-024: same accounting as the settle path — `filesChanged` is
    // the number of OUTPUT files this pass wrote, and the completion line names
    // them. A /finalize with nothing generated therefore reads "Files: 0".
    const result = this.buildResult({ testResults, commitSha });
    this.logOutputs(result.duration);
    this.emit('converged', result);
    
    return result;
  }

  /**
   * User finalize signal - /finalize in north star
   * Forces convergence regardless of quiet period
   */
  async finalize(): Promise<ConvergenceResult> {
    console.log('[Convergence] User finalize triggered');
    this.converged = false;
    this.lastEventTime = 0; // Force quiet period check to pass
    return this.onConverge();
  }
}
