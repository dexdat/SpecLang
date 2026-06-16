/**
 * Convergence detection for speclangd
 *
 * Generated from: @speclang/daemon/convergence
 *
 * Detects when the cascade has settled (no events for quiet period)
 */
import { EventEmitter } from 'events';
import { FileEvent, ConvergenceResult, DaemonConfig, AgentStatus, AgentStatusKind, TestResults } from './types';
export declare class ConvergenceDetector extends EventEmitter {
    private lastEventTime;
    private quietPeriodMs;
    private maxDepth;
    private cascadeStartTime;
    private filesChangedCount;
    private currentDepth;
    private converged;
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
        filesChanged: number;
        currentDepth: number;
        timeRemaining: number | null;
        quietPeriod: number;
    };
    /**
     * Get convergence result
     */
    getConvergenceResult(): ConvergenceResult;
    /**
     * Reset convergence state
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