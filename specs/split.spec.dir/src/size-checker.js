"use strict";
/**
 * SPECLANG-GENERATED: Size checker implementation
 * Source: @speclang/dynamic-split/strategy @block:split/logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SizeChecker = void 0;
exports.createSizeChecker = createSizeChecker;
const types_1 = require("./types");
const token_counter_1 = require("./token-counter");
/**
 * Size checker for determining if a spec needs to be split
 */
class SizeChecker {
    config;
    counter;
    constructor(config = {}) {
        this.config = { ...types_1.DEFAULT_SPLIT_CONFIG, ...config };
        this.counter = new token_counter_1.TokenCounter();
    }
    /**
     * Update configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Check if a spec needs to be split
     * Returns a SizeCheckResult with detailed information
     */
    check(content) {
        const size = this.counter.getSize(content);
        const userLimit = this.config.max_tokens;
        const budgetLimit = this.config.max_tokens + this.config.budget_overhead;
        // Determine threshold
        let threshold;
        let needsSplit;
        if (size.tokens <= userLimit) {
            // Safe zone - no split needed
            threshold = 'safe';
            needsSplit = false;
        }
        else if (size.tokens <= budgetLimit) {
            // Warning zone - split optional, try optimization first
            threshold = 'warning';
            needsSplit = true; // Recommend split but allow optimization
        }
        else {
            // Critical zone - must split
            threshold = 'critical';
            needsSplit = true;
        }
        return {
            needsSplit,
            size,
            threshold,
            userLimit,
            budgetLimit,
        };
    }
    /**
     * Get a simple split decision
     */
    getDecision(content) {
        const result = this.check(content);
        if (!result.needsSplit) {
            return 'no-split';
        }
        if (result.threshold === 'warning') {
            return 'try-optimize';
        }
        return 'must-split';
    }
    /**
     * Check size against a specific limit
     */
    checkLimit(content, limitType) {
        const size = this.counter.getSize(content);
        switch (limitType) {
            case 'tokens':
                return size.tokens > this.config.max_tokens;
            case 'lines':
                return size.lines > this.config.max_lines;
            case 'chars':
                return size.chars > this.config.max_chars;
        }
    }
    /**
     * Get remaining budget
     */
    getRemainingBudget(content) {
        const size = this.counter.getSize(content);
        return Math.max(0, this.config.max_tokens - size.tokens);
    }
    /**
     * Calculate how much over budget
     */
    getOverBudget(content) {
        const size = this.counter.getSize(content);
        return Math.max(0, size.tokens - this.config.max_tokens);
    }
}
exports.SizeChecker = SizeChecker;
/**
 * Create a size checker with default config
 */
function createSizeChecker(config) {
    return new SizeChecker(config);
}
//# sourceMappingURL=size-checker.js.map