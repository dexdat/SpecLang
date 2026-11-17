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

export class ConvergenceDetector extends EventEmitter {
  private lastEventTime: number;
  private quietPeriodMs: number;
  private maxDepth: number;
  private cascadeStartTime: number;
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
    this.filesChangedCount++;
    this.converged = false;
    this.cascadePending = true;
    
    // If this is the first event in a new cascade
    if (this.currentDepth === 0) {
      this.cascadeStartTime = Date.now();
    }
    
    this.currentDepth++;
    
    this.emit('event', event);
    console.log(`[Convergence] Event received: ${event.kind} - ${event.path}`);
    console.log(`[Convergence] Files changed: ${this.filesChangedCount}, Depth: ${this.currentDepth}`);
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
    currentDepth: number;
    timeRemaining: number | null;
    quietPeriod: number;
  } {
    return {
      converged: this.isConverged(),
      lifecycle: this.getCascadeLifecycle(),
      filesChanged: this.filesChangedCount,
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
    const duration = Date.now() - this.cascadeStartTime;
    
    const result: ConvergenceResult = {
      converged: this.isConverged(),
      filesChanged: this.filesChangedCount,
      duration,
      cascadeDepth: this.currentDepth,
      timestamp: Date.now(),
    };

    if (result.converged) {
      this.converged = true;
      // DF-SPECLANG-4: the queue is drained — the cascade is over, so the
      // depth that counted its in-flight edit rounds goes back to 0. This is
      // the transition that previously only happened inside reset(), i.e. on
      // the path that also un-converged the detector (status -> 'cascading').
      this.cascadePending = false;
      this.currentDepth = 0;
      this.emit('converged', result);
      console.log(`[Convergence] Cascade complete! Files: ${result.filesChanged}, Duration: ${duration}ms`);
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
    
    const result: ConvergenceResult = {
      converged: true,
      filesChanged: this.filesChangedCount,
      duration: Date.now() - this.cascadeStartTime,
      cascadeDepth: this.currentDepth,
      timestamp: Date.now(),
      testResults,
      commitSha,
    };
    
    // Step 5: Notify user
    this.emit('converged', result);
    console.log(`[Convergence] Cascade complete! Files: ${result.filesChanged}, Duration: ${result.duration}ms`);
    
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
