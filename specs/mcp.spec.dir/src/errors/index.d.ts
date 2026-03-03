/**
 * SPECLANG-GENERATED: MCP Error Handling
 * Source: @speclang/mcp.error-handling
 */
export { MCPErrors, ErrorAction, BackoffStrategy, type ErrorConfig, type MCPToolError, type ErrorContext, type DatabaseErrorContext, type ToolErrorContext, type TransportErrorContext, type RetryOptions, DEFAULT_RETRY_OPTIONS, } from './types.js';
export { withRetry, attemptReconnect, calculateBackoff, DEFAULT_RECONNECT_OPTIONS, type RetryResult, type ReconnectOptions, } from './recovery.js';
export { ERROR_TRANSLATIONS, translateError, createToolError, } from './translations.js';
export { MCPErrorHandler, DATABASE_ERROR_CONFIG, TOOL_ERROR_CONFIG, TRANSPORT_ERROR_CONFIG, createErrorHandler, getDefaultHandler, } from './handler.js';
//# sourceMappingURL=index.d.ts.map