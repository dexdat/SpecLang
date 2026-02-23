/**
 * SPECLANG-GENERATED: MCP Error Translations
 * Source: @speclang/mcp.error-handling
 */

import { MCPErrors, type MCPToolError } from './types.js';

export const ERROR_TRANSLATIONS: Record<MCPErrors, string> = {
  [MCPErrors.SQLITE_BUSY]: 'The database is busy. Please try again.',
  [MCPErrors.SQLITE_CONSTRAINT]: 'The operation could not be completed due to a data constraint.',
  [MCPErrors.SQLITE_CORRUPT]: 'The database appears to be corrupted. Please contact support.',
  [MCPErrors.INVALID_PARAMS]: 'The provided parameters are invalid.',
  [MCPErrors.NOT_FOUND]: 'The requested resource was not found.',
  [MCPErrors.UNAUTHORIZED]: 'You are not authorized to perform this operation.',
  [MCPErrors.CONNECTION_LOST]: 'The connection was lost. Attempting to reconnect...',
  [MCPErrors.PARSE_ERROR]: 'Failed to parse the request. Please check your input.',
};

export function translateError(error: MCPErrors): string {
  return ERROR_TRANSLATIONS[error] || 'An unknown error occurred.';
}

export function createToolError(error: MCPErrors): MCPToolError {
  return {
    error: translateError(error),
    code: error,
  };
}
