/**
 * SPECLANG-GENERATED: MCP Error Handler
 * Source: @speclang/mcp.error-handling
 */

import { MCPErrors, ErrorAction, BackoffStrategy, type ErrorConfig, type MCPToolError, DEFAULT_RETRY_OPTIONS } from './types.js';
import { translateError, createToolError } from './translations.js';
import { withRetry, attemptReconnect, DEFAULT_RECONNECT_OPTIONS } from './recovery.js';

export const DATABASE_ERROR_CONFIG: Record<string, ErrorConfig> = {
  [MCPErrors.SQLITE_BUSY]: {
    retry: true,
    backoff: BackoffStrategy.EXPONENTIAL,
    max_retries: 3,
  },
  [MCPErrors.SQLITE_CONSTRAINT]: {
    log: true,
    notify: false,
    return: 'user-friendly message',
  },
  [MCPErrors.SQLITE_CORRUPT]: {
    action: ErrorAction.EXIT,
    notify: true,
  },
};

export const TOOL_ERROR_CONFIG: Record<string, ErrorConfig> = {
  [MCPErrors.INVALID_PARAMS]: {
    return: { error: '', code: MCPErrors.INVALID_PARAMS },
  },
  [MCPErrors.NOT_FOUND]: {
    return: { error: '', code: MCPErrors.NOT_FOUND },
  },
  [MCPErrors.UNAUTHORIZED]: {
    return: { error: '', code: MCPErrors.UNAUTHORIZED },
  },
};

export const TRANSPORT_ERROR_CONFIG: Record<string, ErrorConfig> = {
  [MCPErrors.CONNECTION_LOST]: {
    action: ErrorAction.ATTEMPT_RECONNECT,
    max_attempts: 3,
  },
  [MCPErrors.PARSE_ERROR]: {
    action: ErrorAction.RETURN,
    return: 'Failed to parse request',
  },
};

export class MCPErrorHandler {
  private adminNotify: boolean = false;

  constructor(options?: { adminNotify?: boolean }) {
    this.adminNotify = options?.adminNotify ?? false;
  }

  handleDatabaseError(error: Error & { code?: string }): void {
    const sqliteCode = error.code || '';
    const config = DATABASE_ERROR_CONFIG[sqliteCode as MCPErrors] || DATABASE_ERROR_CONFIG[MCPErrors.SQLITE_CONSTRAINT];

    if (config.log) {
      console.error('[MCP Error]', error.message);
    }

    if (config.notify || this.adminNotify) {
      this.notifyAdmin(error.message);
    }

    if (config.action === ErrorAction.EXIT) {
      console.error('[MCP] Critical database error, exiting...');
      process.exit(1);
    }
  }

  handleToolError(errorType: MCPErrors): MCPToolError {
    const config = TOOL_ERROR_CONFIG[errorType];
    const toolError = createToolError(errorType);

    if (config?.return && typeof config.return === 'object') {
      return { ...toolError, ...config.return as Record<string, unknown> } as MCPToolError;
    }

    return toolError;
  }

  async handleTransportError(
    error: Error,
    reconnectFn?: () => Promise<void>
  ): Promise<boolean> {
    const config = TRANSPORT_ERROR_CONFIG[MCPErrors.CONNECTION_LOST];

    console.error('[MCP Transport Error]', error.message);

    if (reconnectFn && config?.action === ErrorAction.ATTEMPT_RECONNECT) {
      return attemptReconnect(reconnectFn, {
        maxAttempts: config.max_attempts || DEFAULT_RECONNECT_OPTIONS.maxAttempts,
        baseDelay: DEFAULT_RECONNECT_OPTIONS.baseDelay,
        maxDelay: DEFAULT_RECONNECT_OPTIONS.maxDelay,
      });
    }

    return false;
  }

  async withDatabaseRetry<T>(
    operation: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: Error }> {
    return withRetry(operation, {
      ...DEFAULT_RETRY_OPTIONS,
      maxRetries: 3,
      backoff: BackoffStrategy.EXPONENTIAL,
    });
  }

  private notifyAdmin(message: string): void {
    console.error('[MCP Admin Notification]', message);
  }
}

let defaultHandler: MCPErrorHandler | null = null;

export function getDefaultHandler(): MCPErrorHandler {
  if (!defaultHandler) {
    defaultHandler = new MCPErrorHandler();
  }
  return defaultHandler;
}

export function createErrorHandler(options?: { adminNotify?: boolean }): MCPErrorHandler {
  return new MCPErrorHandler(options);
}
