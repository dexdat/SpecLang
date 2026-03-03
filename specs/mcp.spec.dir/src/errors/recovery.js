"use strict";
/**
 * SPECLANG-GENERATED: MCP Error Recovery
 * Source: @speclang/mcp.error-handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RECONNECT_OPTIONS = void 0;
exports.calculateBackoff = calculateBackoff;
exports.withRetry = withRetry;
exports.attemptReconnect = attemptReconnect;
const types_js_1 = require("./types.js");
function calculateBackoff(attempt, strategy, baseDelay, maxDelay) {
    switch (strategy) {
        case types_js_1.BackoffStrategy.LINEAR:
            return Math.min(baseDelay * attempt, maxDelay);
        case types_js_1.BackoffStrategy.EXPONENTIAL:
            return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        case types_js_1.BackoffStrategy.NONE:
        default:
            return baseDelay;
    }
}
async function withRetry(fn, options) {
    let lastError;
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
        try {
            const result = await fn();
            return {
                success: true,
                result,
                attempts: attempt,
            };
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < options.maxRetries) {
                const delay = calculateBackoff(attempt, options.backoff, options.baseDelay, options.maxDelay);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    return {
        success: false,
        error: lastError,
        attempts: options.maxRetries,
    };
}
exports.DEFAULT_RECONNECT_OPTIONS = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
};
async function attemptReconnect(connectFn, options = exports.DEFAULT_RECONNECT_OPTIONS) {
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
            await connectFn();
            return true;
        }
        catch {
            if (attempt < options.maxAttempts) {
                const delay = calculateBackoff(attempt, types_js_1.BackoffStrategy.EXPONENTIAL, options.baseDelay, options.maxDelay);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    return false;
}
//# sourceMappingURL=recovery.js.map