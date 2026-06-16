/**
 * SPECLANG-GENERATED: MCP Error Recovery
 * Source: @speclang/mcp.error-handling
 */
import type { RetryOptions } from './types.js';
import { BackoffStrategy } from './types.js';
export interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
}
export declare function calculateBackoff(attempt: number, strategy: BackoffStrategy, baseDelay: number, maxDelay: number): number;
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<RetryResult<T>>;
export interface ReconnectOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
}
export declare const DEFAULT_RECONNECT_OPTIONS: ReconnectOptions;
export declare function attemptReconnect(connectFn: () => Promise<void>, options?: ReconnectOptions): Promise<boolean>;
//# sourceMappingURL=recovery.d.ts.map