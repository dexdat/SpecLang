/**
 * SPECLANG-GENERATED: Token counting implementation
 * Source: @speclang/dynamic-split/token-budget @block:split/tokens
 */
import type { SpecSize } from './types';
/**
 * Token counter using approximation
 * Uses cl100k_base encoding approximation: 1 token ≈ 4 characters (English)
 *
 * Note: For production use, consider installing 'tiktoken' package
 * and uncommenting the tiktoken integration below.
 */
export declare class TokenCounter {
    private useApproximation;
    constructor();
    /**
     * Count tokens in content
     * Uses cl100k_base approximation: 1 token ≈ 4 characters (English)
     */
    count(content: string): number;
    /**
     * Count tokens in content with better accuracy for code
     * Code tends to have higher token density (more tokens per char)
     */
    countWithCode(content: string): number;
    /**
     * Estimate overhead for child specs
     * Base: 200 tokens (header)
     * Per child: +50 tokens
     * Per sibling link: +30 tokens
     */
    estimateOverhead(childCount: number, siblingLinks?: number): number;
    /**
     * Get full size metrics for content
     */
    getSize(content: string): SpecSize;
    /**
     * Estimate tokens from word count
     * 1 token ≈ 0.75 words
     */
    static estimateFromWords(wordCount: number): number;
    /**
     * Estimate tokens from line count
     * Average: 1 line ≈ 10-20 tokens
     */
    static estimateFromLines(lineCount: number): number;
}
/**
 * Singleton instance
 */
export declare const tokenCounter: TokenCounter;
//# sourceMappingURL=token-counter.d.ts.map