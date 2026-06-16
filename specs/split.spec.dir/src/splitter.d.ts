/**
 * SPECLANG-GENERATED: Splitter - main split logic
 * Source: @speclang/dynamic-split/strategy @block:split/logic
 */
import type { SplitResult, SplitConfig, SplitOptions, SplitDecision } from './types';
/**
 * Main splitter class
 * Coordinates size checking, strategy selection, and execution
 */
export declare class Splitter {
    private config;
    private sizeChecker;
    private defaultStrategy;
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
     * Check if content needs splitting
     */
    needsSplit(content: string): boolean;
    /**
     * Get split decision
     */
    getDecision(content: string): SplitDecision;
    /**
     * Split spec content
     * Returns SplitResult with parent and children
     */
    split(specPath: string, content: string, metadata: Record<string, unknown>, options?: SplitOptions): SplitResult;
    /**
     * Split spec from file
     */
    splitFile(specPath: string, options?: SplitOptions): SplitResult;
    /**
     * Extract basic metadata from content
     */
    private extractMetadata;
    /**
     * Execute split and write files
     * Returns the split result
     */
    splitAndWrite(specPath: string, options?: SplitOptions): SplitResult;
    /**
     * Check if a path is a split spec directory
     */
    static isSplitDir(specPath: string): boolean;
    /**
     * Get parent path from split child path
     */
    static getParentPath(childPath: string): string | null;
}
/**
 * Create a splitter with default config
 */
export declare function createSplitter(config?: Partial<SplitConfig>): Splitter;
/**
 * Utility function to check if content needs splitting
 */
export declare function checkSplitNeeded(content: string, config?: Partial<SplitConfig>): boolean;
/**
 * Utility function to split content
 */
export declare function splitContent(specPath: string, content: string, metadata: Record<string, unknown>, options?: SplitOptions): SplitResult;
//# sourceMappingURL=splitter.d.ts.map