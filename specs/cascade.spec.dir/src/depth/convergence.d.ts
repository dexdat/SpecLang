import { ConvergenceStatus } from './types.js';
/**
 * Detects convergence when the cascade has been quiet for a specified period
 */
export declare class ConvergenceDetector {
    private quietPeriodMs;
    private lastActivity;
    private timeoutId;
    private onConverge;
    constructor(quietPeriodMs?: number);
    /**
     * Record an activity (file change) to reset the quiet timer
     */
    recordActivity(): void;
    /**
     * Set a callback to be called when convergence is detected
     */
    onConvergeCallback(callback: () => void): void;
    /**
     * Reset the convergence timer
     */
    private resetTimer;
    /**
     * Check the current convergence status
     */
    checkConvergence(): ConvergenceStatus;
    /**
     * Get the time since last activity
     */
    getTimeSinceLastActivity(): number;
    /**
     * Get the configured quiet period
     */
    getQuietPeriod(): number;
    /**
     * Set a new quiet period
     */
    setQuietPeriod(ms: number): void;
    /**
     * Check if there's any recorded activity
     */
    hasActivity(): boolean;
    /**
     * Reset the detector
     */
    reset(): void;
}
//# sourceMappingURL=convergence.d.ts.map