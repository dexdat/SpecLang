/**
 * SPECLANG-GENERATED: Size checker implementation
 * Source: @speclang/dynamic-split/strategy @block:split/logic
 */
import type { SplitConfig, SplitDecision, SizeCheckResult } from './types';
/**
 * Size checker for determining if a spec needs to be split
 */
export declare class SizeChecker {
    private config;
    private counter;
    constructor(config?: Partial<SplitConfig>);
    /**
     * Update configuration
     */
    setConfig(config: Partial<SplitConfig>): void;
    /**
     * Get current config
     */
    getConfig(): SplitConfig;
    /**
     * Check if a spec needs to be split
     * Returns a SizeCheckResult with detailed information
     */
    check(content: string): SizeCheckResult;
    /**
     * Get a simple split decision
     */
    getDecision(content: string): SplitDecision;
    /**
     * Check size against a specific limit
     */
    checkLimit(content: string, limitType: 'tokens' | 'lines' | 'chars'): boolean;
    /**
     * Get remaining budget
     */
    getRemainingBudget(content: string): number;
    /**
     * Calculate how much over budget
     */
    getOverBudget(content: string): number;
}
/**
 * Create a size checker with default config
 */
export declare function createSizeChecker(config?: Partial<SplitConfig>): SizeChecker;
//# sourceMappingURL=size-checker.d.ts.map