"use strict";
/**
 * SPECLANG-GENERATED: Token counting implementation
 * Source: @speclang/dynamic-split/token-budget @block:split/tokens
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenCounter = exports.TokenCounter = void 0;
/**
 * Token counter using approximation
 * Uses cl100k_base encoding approximation: 1 token ≈ 4 characters (English)
 *
 * Note: For production use, consider installing 'tiktoken' package
 * and uncommenting the tiktoken integration below.
 */
class TokenCounter {
    useApproximation = true;
    constructor() {
        // Using approximation method (1 token ≈ 4 chars)
        // For production with tiktoken:
        // 1. npm install tiktoken
        // 2. Uncomment the dynamic import below
        this.useApproximation = true;
    }
    /**
     * Count tokens in content
     * Uses cl100k_base approximation: 1 token ≈ 4 characters (English)
     */
    count(content) {
        if (!content || content.length === 0) {
            return 0;
        }
        // Approximation: 1 token ≈ 4 characters for English text
        // This is the standard approximation for cl100k_base
        return Math.ceil(content.length / 4);
    }
    /**
     * Count tokens in content with better accuracy for code
     * Code tends to have higher token density (more tokens per char)
     */
    countWithCode(content) {
        if (!content || content.length === 0) {
            return 0;
        }
        // Detect if content is mostly code
        const codeIndicators = ['```', 'function', 'const ', 'class ', 'import ', 'export '];
        const isCode = codeIndicators.some(indicator => content.includes(indicator));
        if (isCode) {
            // Code has higher token density: ~3 chars per token
            return Math.ceil(content.length / 3);
        }
        // Regular text: ~4 chars per token
        return Math.ceil(content.length / 4);
    }
    /**
     * Estimate overhead for child specs
     * Base: 200 tokens (header)
     * Per child: +50 tokens
     * Per sibling link: +30 tokens
     */
    estimateOverhead(childCount, siblingLinks = 0) {
        const baseOverhead = 200;
        const perChildOverhead = 50 * childCount;
        const perSiblingOverhead = 30 * siblingLinks;
        return baseOverhead + perChildOverhead + perSiblingOverhead;
    }
    /**
     * Get full size metrics for content
     */
    getSize(content) {
        return {
            tokens: this.count(content),
            lines: content.split('\n').length,
            chars: content.length,
        };
    }
    /**
     * Estimate tokens from word count
     * 1 token ≈ 0.75 words
     */
    static estimateFromWords(wordCount) {
        return Math.ceil(wordCount / 0.75);
    }
    /**
     * Estimate tokens from line count
     * Average: 1 line ≈ 10-20 tokens
     */
    static estimateFromLines(lineCount) {
        return Math.ceil(lineCount * 15); // Middle of 10-20
    }
}
exports.TokenCounter = TokenCounter;
/**
 * Singleton instance
 */
exports.tokenCounter = new TokenCounter();
//# sourceMappingURL=token-counter.js.map