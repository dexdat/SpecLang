/**
 * SPECLANG-GENERATED: Splitting strategies implementation
 * Source: @speclang/dynamic-split/strategy @block:split/logic
 */
import type { SplitResult, SplitFile, SplitBlock, SplitStrategy, SplitConfig } from './types';
import { TokenCounter } from './token-counter';
/** Parsed spec content with blocks */
interface ParsedContent {
    header: string;
    blocks: SplitBlock[];
    otherContent: string;
}
/**
 * Base class for all splitting strategies
 */
export declare abstract class SplitStrategyBase {
    protected config: SplitConfig;
    protected counter: TokenCounter;
    constructor(config?: Partial<SplitConfig>);
    /**
     * Execute the split strategy
     */
    abstract split(specPath: string, content: string, metadata: Record<string, unknown>): SplitResult;
    /**
     * Parse spec content into blocks
     */
    protected parseBlocks(content: string): ParsedContent;
    /**
     * Calculate how many parts are needed
     */
    protected calculatePartCount(tokens: number): number;
    /**
     * Generate parent index content
     */
    protected generateParentIndex(parentPath: string, children: SplitFile[], metadata: Record<string, unknown>): string;
    /**
     * Generate child spec content
     */
    protected generateChildSpec(parentPath: string, childPath: string, content: string, part: number, totalParts: number, metadata: Record<string, unknown>, siblings?: {
        prev?: string;
        next?: string;
    }): string;
    /**
     * Convert path to spec ID
     */
    protected pathToId(filePath: string): string;
    /**
     * Generate short description from content
     */
    protected generateShortDescription(content: string, part: number): string;
}
/**
 * Smart splitting strategy - groups related blocks together
 */
export declare class SmartSplitStrategy extends SplitStrategyBase {
    split(specPath: string, content: string, metadata: Record<string, unknown>): SplitResult;
    /**
     * Group blocks into balanced parts
     */
    private groupBlocks;
    /**
     * Split block content that exceeds limit
     */
    private splitBlockContent;
}
/**
 * By-section splitting strategy - splits at section boundaries
 */
export declare class BySectionSplitStrategy extends SplitStrategyBase {
    split(specPath: string, content: string, metadata: Record<string, unknown>): SplitResult;
    /**
     * Split content by h2 headers
     */
    private splitBySections;
}
/**
 * By-token splitting strategy - evenly splits by token count
 */
export declare class ByTokenSplitStrategy extends SplitStrategyBase {
    split(specPath: string, content: string, metadata: Record<string, unknown>): SplitResult;
    /**
     * Split content evenly by token count
     */
    private splitByTokens;
}
/**
 * Create a split strategy by name
 */
export declare function createStrategy(strategy: SplitStrategy, config?: Partial<SplitConfig>): SplitStrategyBase;
export {};
//# sourceMappingURL=strategy.d.ts.map