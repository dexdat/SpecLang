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

export function calculateBackoff(
  attempt: number,
  strategy: BackoffStrategy,
  baseDelay: number,
  maxDelay: number
): number {
  switch (strategy) {
    case BackoffStrategy.LINEAR:
      return Math.min(baseDelay * attempt, maxDelay);
    case BackoffStrategy.EXPONENTIAL:
      return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    case BackoffStrategy.NONE:
    default:
      return baseDelay;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < options.maxRetries) {
        const delay = calculateBackoff(
          attempt,
          options.backoff,
          options.baseDelay,
          options.maxDelay
        );
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

export interface ReconnectOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

export const DEFAULT_RECONNECT_OPTIONS: ReconnectOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

export async function attemptReconnect(
  connectFn: () => Promise<void>,
  options: ReconnectOptions = DEFAULT_RECONNECT_OPTIONS
): Promise<boolean> {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      await connectFn();
      return true;
    } catch {
      if (attempt < options.maxAttempts) {
        const delay = calculateBackoff(
          attempt,
          BackoffStrategy.EXPONENTIAL,
          options.baseDelay,
          options.maxDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}
