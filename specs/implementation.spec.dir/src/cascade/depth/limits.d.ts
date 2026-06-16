import { DepthConfig } from './types.js';
/**
 * Depth limits configuration and validation
 */
export interface LimitViolation {
    limit: string;
    current: number;
    max: number;
    message: string;
}
export interface LimitCheckResult {
    valid: boolean;
    violations: LimitViolation[];
}
/**
 * Manages depth limits and validates against them
 */
export declare class DepthLimits {
    private config;
    constructor(config?: Partial<DepthConfig>);
    /**
     * Validate depth against all limits
     */
    validate(depth: number, filesChanged: number, elapsedMs: number): LimitCheckResult;
    /**
     * Get the current config
     */
    getConfig(): DepthConfig;
    /**
     * Update config
     */
    updateConfig(config: Partial<DepthConfig>): void;
    /**
     * Get a human-readable summary of limits
     */
    getLimitsSummary(): string;
    private formatDuration;
}
//# sourceMappingURL=limits.d.ts.map