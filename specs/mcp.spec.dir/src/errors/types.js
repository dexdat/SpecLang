"use strict";
/**
 * SPECLANG-GENERATED: MCP Error Types
 * Source: @speclang/mcp.error-handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RETRY_OPTIONS = exports.BackoffStrategy = exports.ErrorAction = exports.MCPErrors = void 0;
var MCPErrors;
(function (MCPErrors) {
    MCPErrors["SQLITE_BUSY"] = "SQLITE_BUSY";
    MCPErrors["SQLITE_CONSTRAINT"] = "SQLITE_CONSTRAINT";
    MCPErrors["SQLITE_CORRUPT"] = "SQLITE_CORRUPT";
    MCPErrors["INVALID_PARAMS"] = "INVALID_PARAMS";
    MCPErrors["NOT_FOUND"] = "NOT_FOUND";
    MCPErrors["UNAUTHORIZED"] = "UNAUTHORIZED";
    MCPErrors["CONNECTION_LOST"] = "CONNECTION_LOST";
    MCPErrors["PARSE_ERROR"] = "PARSE_ERROR";
})(MCPErrors || (exports.MCPErrors = MCPErrors = {}));
var ErrorAction;
(function (ErrorAction) {
    ErrorAction["RETRY"] = "retry";
    ErrorAction["LOG"] = "log";
    ErrorAction["NOTIFY"] = "notify";
    ErrorAction["EXIT"] = "exit";
    ErrorAction["ATTEMPT_RECONNECT"] = "attempt_reconnect";
    ErrorAction["RETURN"] = "return";
})(ErrorAction || (exports.ErrorAction = ErrorAction = {}));
var BackoffStrategy;
(function (BackoffStrategy) {
    BackoffStrategy["NONE"] = "none";
    BackoffStrategy["LINEAR"] = "linear";
    BackoffStrategy["EXPONENTIAL"] = "exponential";
})(BackoffStrategy || (exports.BackoffStrategy = BackoffStrategy = {}));
exports.DEFAULT_RETRY_OPTIONS = {
    maxRetries: 3,
    backoff: BackoffStrategy.EXPONENTIAL,
    baseDelay: 100,
    maxDelay: 5000,
};
//# sourceMappingURL=types.js.map