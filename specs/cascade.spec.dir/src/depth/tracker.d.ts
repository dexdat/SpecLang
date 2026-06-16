import { DepthConfig, DepthState, DepthResult } from './types.js';
/**
 * Tracks the depth of a cascade to prevent infinite loops
 */
export declare class DepthTracker {
    private config;
    private state;
    private hasCycleChecker;
    constructor(config?: Partial<DepthConfig>);
    /**
     * Set a cycle checker function to be called during limit checks
     */
    setCycleChecker(checker: () => boolean): void;
    /**
     * Start a new cascade with the given ID
     */
    startCascade(cascadeId: string): void;
    /**
     * Increment depth for a new file change
     */
    increment(file: string, agent: string): DepthResult;
    /**
     * Check if any limits have been reached
     */
    private checkLimits;
    /**
     * Reset the tracker state
     */
    reset(): void;
    /**
     * Get the current state
     */
    getState(): DepthState | null;
    /**
     * Get the configuration
     */
    getConfig(): DepthConfig;
    /**
     * Check if a cascade is currently active
     */
    isActive(): boolean;
}
//# sourceMappingURL=tracker.d.ts.map