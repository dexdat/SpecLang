"use strict";
/**
 * SPECLANG-GENERATED: Validation types
 * Source: @speclang/validation/rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VALIDATION_CONFIG = void 0;
exports.createError = createError;
exports.createWarning = createWarning;
// ============================================================================
// VALIDATION ERROR CREATION HELPERS
// ============================================================================
/** Create an error result */
function createError(rule, location, message, suggestion) {
    return {
        rule,
        level: 'error',
        location,
        message,
        suggestion,
    };
}
/** Create a warning result */
function createWarning(rule, location, message, suggestion) {
    return {
        rule,
        level: 'warning',
        location,
        message,
        suggestion,
    };
}
// ============================================================================
// DEFAULT VALIDATION CONFIG
// ============================================================================
/** Default validation configuration */
exports.DEFAULT_VALIDATION_CONFIG = {
    enabled: true,
    strict: false,
    customRules: [],
    rules: {},
};
//# sourceMappingURL=types.js.map