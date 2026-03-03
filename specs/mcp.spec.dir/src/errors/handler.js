"use strict";
/**
 * SPECLANG-GENERATED: MCP Error Handler
 * Source: @speclang/mcp.error-handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPErrorHandler = exports.TRANSPORT_ERROR_CONFIG = exports.TOOL_ERROR_CONFIG = exports.DATABASE_ERROR_CONFIG = void 0;
exports.getDefaultHandler = getDefaultHandler;
exports.createErrorHandler = createErrorHandler;
const types_js_1 = require("./types.js");
const translations_js_1 = require("./translations.js");
const recovery_js_1 = require("./recovery.js");
exports.DATABASE_ERROR_CONFIG = {
    [types_js_1.MCPErrors.SQLITE_BUSY]: {
        retry: true,
        backoff: types_js_1.BackoffStrategy.EXPONENTIAL,
        max_retries: 3,
    },
    [types_js_1.MCPErrors.SQLITE_CONSTRAINT]: {
        log: true,
        notify: false,
        return: 'user-friendly message',
    },
    [types_js_1.MCPErrors.SQLITE_CORRUPT]: {
        action: types_js_1.ErrorAction.EXIT,
        notify: true,
    },
};
exports.TOOL_ERROR_CONFIG = {
    [types_js_1.MCPErrors.INVALID_PARAMS]: {
        return: { error: '', code: types_js_1.MCPErrors.INVALID_PARAMS },
    },
    [types_js_1.MCPErrors.NOT_FOUND]: {
        return: { error: '', code: types_js_1.MCPErrors.NOT_FOUND },
    },
    [types_js_1.MCPErrors.UNAUTHORIZED]: {
        return: { error: '', code: types_js_1.MCPErrors.UNAUTHORIZED },
    },
};
exports.TRANSPORT_ERROR_CONFIG = {
    [types_js_1.MCPErrors.CONNECTION_LOST]: {
        action: types_js_1.ErrorAction.ATTEMPT_RECONNECT,
        max_attempts: 3,
    },
    [types_js_1.MCPErrors.PARSE_ERROR]: {
        action: types_js_1.ErrorAction.RETURN,
        return: 'Failed to parse request',
    },
};
class MCPErrorHandler {
    adminNotify = false;
    constructor(options) {
        this.adminNotify = options?.adminNotify ?? false;
    }
    handleDatabaseError(error) {
        const sqliteCode = error.code || '';
        const config = exports.DATABASE_ERROR_CONFIG[sqliteCode] || exports.DATABASE_ERROR_CONFIG[types_js_1.MCPErrors.SQLITE_CONSTRAINT];
        if (config.log) {
            console.error('[MCP Error]', error.message);
        }
        if (config.notify || this.adminNotify) {
            this.notifyAdmin(error.message);
        }
        if (config.action === types_js_1.ErrorAction.EXIT) {
            console.error('[MCP] Critical database error, exiting...');
            process.exit(1);
        }
    }
    handleToolError(errorType) {
        const config = exports.TOOL_ERROR_CONFIG[errorType];
        const toolError = (0, translations_js_1.createToolError)(errorType);
        if (config?.return && typeof config.return === 'object') {
            return { ...toolError, ...config.return };
        }
        return toolError;
    }
    async handleTransportError(error, reconnectFn) {
        const config = exports.TRANSPORT_ERROR_CONFIG[types_js_1.MCPErrors.CONNECTION_LOST];
        console.error('[MCP Transport Error]', error.message);
        if (reconnectFn && config?.action === types_js_1.ErrorAction.ATTEMPT_RECONNECT) {
            return (0, recovery_js_1.attemptReconnect)(reconnectFn, {
                maxAttempts: config.max_attempts || recovery_js_1.DEFAULT_RECONNECT_OPTIONS.maxAttempts,
                baseDelay: recovery_js_1.DEFAULT_RECONNECT_OPTIONS.baseDelay,
                maxDelay: recovery_js_1.DEFAULT_RECONNECT_OPTIONS.maxDelay,
            });
        }
        return false;
    }
    async withDatabaseRetry(operation) {
        return (0, recovery_js_1.withRetry)(operation, {
            ...types_js_1.DEFAULT_RETRY_OPTIONS,
            maxRetries: 3,
            backoff: types_js_1.BackoffStrategy.EXPONENTIAL,
        });
    }
    notifyAdmin(message) {
        console.error('[MCP Admin Notification]', message);
    }
}
exports.MCPErrorHandler = MCPErrorHandler;
let defaultHandler = null;
function getDefaultHandler() {
    if (!defaultHandler) {
        defaultHandler = new MCPErrorHandler();
    }
    return defaultHandler;
}
function createErrorHandler(options) {
    return new MCPErrorHandler(options);
}
//# sourceMappingURL=handler.js.map