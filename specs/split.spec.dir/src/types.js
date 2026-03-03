"use strict";
/**
 * SPECLANG-GENERATED: Types for dynamic splitting
 * Source: @speclang/dynamic-split/strategy @block:split/config
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MERGE_CONFIG = exports.DEFAULT_SPLIT_CONFIG = void 0;
/** Default split configuration */
exports.DEFAULT_SPLIT_CONFIG = {
    max_tokens: 10000,
    max_lines: 800,
    max_chars: 60000,
    budget_overhead: 500,
    strategy: 'smart',
};
/** Default merge configuration */
exports.DEFAULT_MERGE_CONFIG = {
    threshold: 0.5,
};
//# sourceMappingURL=types.js.map