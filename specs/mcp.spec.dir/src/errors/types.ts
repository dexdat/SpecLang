/**
 * SPECLANG-GENERATED: MCP Error Types
 * Source: @speclang/mcp.error-handling
 */

export enum MCPErrors {
  SQLITE_BUSY = 'SQLITE_BUSY',
  SQLITE_CONSTRAINT = 'SQLITE_CONSTRAINT',
  SQLITE_CORRUPT = 'SQLITE_CORRUPT',
  INVALID_PARAMS = 'INVALID_PARAMS',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  PARSE_ERROR = 'PARSE_ERROR',
}

export enum ErrorAction {
  RETRY = 'retry',
  LOG = 'log',
  NOTIFY = 'notify',
  EXIT = 'exit',
  ATTEMPT_RECONNECT = 'attempt_reconnect',
  RETURN = 'return',
}

export enum BackoffStrategy {
  NONE = 'none',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
}

export interface ErrorConfig {
  retry?: boolean;
  backoff?: BackoffStrategy;
  max_retries?: number;
  log?: boolean;
  notify?: boolean;
  action?: ErrorAction;
  return?: string | Record<string, unknown>;
  max_attempts?: number;
}

export interface MCPToolError {
  error: string;
  code: MCPErrors;
}

export interface DatabaseErrorContext {
  operation: string;
  table?: string;
  constraint?: string;
  details?: string;
}

export interface ToolErrorContext {
  tool: string;
  params?: Record<string, unknown>;
  reason?: string;
}

export interface TransportErrorContext {
  endpoint?: string;
  transport?: string;
  details?: string;
}

export type ErrorContext = DatabaseErrorContext | ToolErrorContext | TransportErrorContext;

export interface RetryOptions {
  maxRetries: number;
  backoff: BackoffStrategy;
  baseDelay: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  backoff: BackoffStrategy.EXPONENTIAL,
  baseDelay: 100,
  maxDelay: 5000,
};
