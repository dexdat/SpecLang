import { CycleDetector } from './cycle-detection.js';
import { ConvergenceDetector } from './convergence.js';
import { DepthConfig, DepthCheckResult, CascadeStatus } from './types.js';
/**
 * Integrated cascade depth manager
 * Coordinates depth tracking, cycle detection, and convergence
 */
export declare class CascadeDepthManager {
    private tracker;
    private cycleDetector;
    private convergenceDetector;
    private stateDir;
    constructor(config?: Partial<DepthConfig>);
    /**
     * Start a new cascade
     */
    startCascade(cascadeId: string): void;
    /**
     * Handle a file change event
     * Returns whether the cascade should continue
     */
    onFileChange(file: string, agent: string): DepthCheckResult;
    /**
     * Called when convergence is detected
     */
    private onCascadeComplete;
    /**
     * Persist cascade state to disk
     */
    private persistState;
    /**
     * Get the current status of the cascade
     */
    getStatus(): CascadeStatus;
    /**
     * Check if a cascade is currently active
     */
    isActive(): boolean;
    /**
     * Get the cycle detector for external access
     */
    getCycleDetector(): CycleDetector;
    /**
     * Get the convergence detector for external access
     */
    getConvergenceDetector(): ConvergenceDetector;
    /**
     * Set the state directory for persistence
     */
    setStateDir(dir: string): void;
    /**
     * Reset all state (for testing or manual reset)
     */
    reset(): void;
}
export * from './types.js';
export { DepthTracker } from './tracker.js';
export { CycleDetector } from './cycle-detection.js';
export { ConvergenceDetector } from './convergence.js';
export { CascadeTerminator, type TerminationResult, type TerminationType } from './termination.js';
//# sourceMappingURL=index.d.ts.map