"use strict";
/**
 * SPECLANG-GENERATED: MCP Error Handling
 * Source: @speclang/mcp.error-handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultHandler = exports.createErrorHandler = exports.TRANSPORT_ERROR_CONFIG = exports.TOOL_ERROR_CONFIG = exports.DATABASE_ERROR_CONFIG = exports.MCPErrorHandler = exports.createToolError = exports.translateError = exports.ERROR_TRANSLATIONS = exports.DEFAULT_RECONNECT_OPTIONS = exports.calculateBackoff = exports.attemptReconnect = exports.withRetry = exports.DEFAULT_RETRY_OPTIONS = exports.BackoffStrategy = exports.ErrorAction = exports.MCPErrors = void 0;
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "MCPErrors", { enumerable: true, get: function () { return types_js_1.MCPErrors; } });
Object.defineProperty(exports, "ErrorAction", { enumerable: true, get: function () { return types_js_1.ErrorAction; } });
Object.defineProperty(exports, "BackoffStrategy", { enumerable: true, get: function () { return types_js_1.BackoffStrategy; } });
Object.defineProperty(exports, "DEFAULT_RETRY_OPTIONS", { enumerable: true, get: function () { return types_js_1.DEFAULT_RETRY_OPTIONS; } });
var recovery_js_1 = require("./recovery.js");
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return recovery_js_1.withRetry; } });
Object.defineProperty(exports, "attemptReconnect", { enumerable: true, get: function () { return recovery_js_1.attemptReconnect; } });
Object.defineProperty(exports, "calculateBackoff", { enumerable: true, get: function () { return recovery_js_1.calculateBackoff; } });
Object.defineProperty(exports, "DEFAULT_RECONNECT_OPTIONS", { enumerable: true, get: function () { return recovery_js_1.DEFAULT_RECONNECT_OPTIONS; } });
var translations_js_1 = require("./translations.js");
Object.defineProperty(exports, "ERROR_TRANSLATIONS", { enumerable: true, get: function () { return translations_js_1.ERROR_TRANSLATIONS; } });
Object.defineProperty(exports, "translateError", { enumerable: true, get: function () { return translations_js_1.translateError; } });
Object.defineProperty(exports, "createToolError", { enumerable: true, get: function () { return translations_js_1.createToolError; } });
var handler_js_1 = require("./handler.js");
Object.defineProperty(exports, "MCPErrorHandler", { enumerable: true, get: function () { return handler_js_1.MCPErrorHandler; } });
Object.defineProperty(exports, "DATABASE_ERROR_CONFIG", { enumerable: true, get: function () { return handler_js_1.DATABASE_ERROR_CONFIG; } });
Object.defineProperty(exports, "TOOL_ERROR_CONFIG", { enumerable: true, get: function () { return handler_js_1.TOOL_ERROR_CONFIG; } });
Object.defineProperty(exports, "TRANSPORT_ERROR_CONFIG", { enumerable: true, get: function () { return handler_js_1.TRANSPORT_ERROR_CONFIG; } });
Object.defineProperty(exports, "createErrorHandler", { enumerable: true, get: function () { return handler_js_1.createErrorHandler; } });
Object.defineProperty(exports, "getDefaultHandler", { enumerable: true, get: function () { return handler_js_1.getDefaultHandler; } });
//# sourceMappingURL=index.js.map