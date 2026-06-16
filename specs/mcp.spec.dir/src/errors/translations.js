"use strict";
/**
 * SPECLANG-GENERATED: MCP Error Translations
 * Source: @speclang/mcp.error-handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_TRANSLATIONS = void 0;
exports.translateError = translateError;
exports.createToolError = createToolError;
const types_js_1 = require("./types.js");
exports.ERROR_TRANSLATIONS = {
    [types_js_1.MCPErrors.SQLITE_BUSY]: 'The database is busy. Please try again.',
    [types_js_1.MCPErrors.SQLITE_CONSTRAINT]: 'The operation could not be completed due to a data constraint.',
    [types_js_1.MCPErrors.SQLITE_CORRUPT]: 'The database appears to be corrupted. Please contact support.',
    [types_js_1.MCPErrors.INVALID_PARAMS]: 'The provided parameters are invalid.',
    [types_js_1.MCPErrors.NOT_FOUND]: 'The requested resource was not found.',
    [types_js_1.MCPErrors.UNAUTHORIZED]: 'You are not authorized to perform this operation.',
    [types_js_1.MCPErrors.CONNECTION_LOST]: 'The connection was lost. Attempting to reconnect...',
    [types_js_1.MCPErrors.PARSE_ERROR]: 'Failed to parse the request. Please check your input.',
};
function translateError(error) {
    return exports.ERROR_TRANSLATIONS[error] || 'An unknown error occurred.';
}
function createToolError(error) {
    return {
        error: translateError(error),
        code: error,
    };
}
//# sourceMappingURL=translations.js.map