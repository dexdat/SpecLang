/**
 * Convergence detection for speclangd
 *
 * Generated from: @speclang/daemon/convergence
 *
 * Detects when the cascade has settled (no events for quiet period)
 */
import { EventEmitter } from 'events';
import { FileEvent, ConvergenceResult, DaemonConfig, AgentStatus, AgentStatusKind, TestResults } from './types';
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
export declare class ConvergenceDetector extends EventEmitter {
    private lastEventTime;
    private quietPeriodMs;
    private maxDepth;
    private cascadeStartTime;
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
    private inputPaths;
    /**
     * DF-SPECLANG-024: OUTPUTS — the distinct project files this convergence
     * pass actually WROTE, reported by the writer (the daemon's pipeline) via
     * `recordOutputs()`. This set is the single source of truth for the
     * user-visible changed-file count.
     */
    private outputPaths;
    /**
     * DF-SPECLANG-024: the accounting symbol every surface reports — the number
     * of OUTPUT files written by this pass (`outputPaths.size`), never the number
     * of watcher events and never the number of inputs.
     */
    private filesChangedCount;
    private currentDepth;
    private converged;
    /** DF-SPECLANG-4: true from the first file event until the cascade settles. */
    private cascadePending;
    private checkTimer?;
    private agentStatuses;
    private testOnConverge;
    private autoCommit;
    constructor(config: DaemonConfig);
    /**
     * Called when a file event occurs
     */
    onEvent(event: FileEvent): void;
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
    recordOutputs(outputs: string[], options?: {
        complete?: boolean;
        incomplete?: boolean;
    }): ConvergenceResult;
    /**
     * DF-SPECLANG-024: the ONE place a completion line is printed, so every
     * settle path reports the same shape (files-changed count + the paths).
     */
    private logOutputs;
    /**
     * DF-SPECLANG-024: the single place a ConvergenceResult is shaped, so the
     * status payload, the settle event and the completion summary can never
     * disagree about what `filesChanged` means.
     */
    private buildResult;
    /**
     * Check if the system has converged (quiet for configured period)
     */
    isConverged(): boolean;
    /**
     * Get time remaining until convergence (if not yet converged)
     */
    timeRemaining(): number | null;
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
    };
    /**
     * DF-SPECLANG-4: the cascade lifecycle — the only thing worth reporting as a
     * daemon status. `isConverged()` is a quiet-period predicate and cannot tell
     * "settled" apart from "re-armed and waiting", so status must come from here.
     */
    getCascadeLifecycle(): CascadeLifecycle;
    /**
     * Get convergence result
     */
    getConvergenceResult(): ConvergenceResult;
    /**
     * Reset convergence state.
     *
     * ARCH-004: also resets `lastEventTime` so `isConverged()` returns
     * false immediately after reset (not stuck in "converged" because
     * the old lastEventTime is still past the quiet period). After
     * reset, the next `onEvent()` re-arms the quiet-period timer
     * normally.
     */
    reset(): void;
    /**
     * Start periodic convergence checking
     */
    private startConvergenceCheck;
    /**
     * Stop convergence checking
     */
    stop(): void;
    /**
     * Wait for convergence (async)
     */
    waitForConvergence(timeoutMs?: number): Promise<ConvergenceResult>;
    /**
     * Get current cascade depth
     */
    getCascadeDepth(): number;
    /**
     * Update max depth from config
     */
    setMaxDepth(depth: number): void;
    /**
     * Update quiet period from config
     */
    setQuietPeriod(seconds: number): void;
    /**
     * Set agent status (called by agents when they start/stop work)
     */
    setAgentStatus(agentId: string, status: AgentStatusKind, currentTask?: string): void;
    /**
     * Get all agent statuses
     */
    getAllAgentStatuses(): AgentStatus[];
    /**
     * Check if all agents are idle
     */
    areAllAgentsIdle(): boolean;
    /**
     * Check if any agent has errors
     */
    hasAgentErrors(): boolean;
    /**
     * Run tests (placeholder implementation)
     */
    runTests(): Promise<TestResults>;
    /**
     * Commit changes (placeholder implementation)
     */
    commitChanges(): Promise<string | null>;
    /**
     * Check convergence - implements spec pseudocode
     * check_convergence():
     *   now = timestamp()
     *   if now - last_event_time < QUIET_SECONDS: return StillCascading
     *   for agent in all_agents:
     *     if agent.status != Idle: return StillCascading
     *   return Converged(files_changed, duration, test_results)
     */
    checkConvergence(): {
        converged: boolean;
        reason?: string;
    };
    /**
     * Execute on_converge steps from spec:
     * 1. wait for all in-flight events (done via quiet period)
     * 2. verify all agents idle
     * 3. run tests
     * 4. commit changes
     * 5. notify user
     * 6. await next input
     */
    onConverge(): Promise<ConvergenceResult>;
    /**
     * User finalize signal - /finalize in north star
     * Forces convergence regardless of quiet period
     */
    finalize(): Promise<ConvergenceResult>;
}
//# sourceMappingURL=convergence.d.ts.map