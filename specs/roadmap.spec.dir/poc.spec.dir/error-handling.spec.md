# speclang-header lines:10
id: "@speclang/roadmap/poc/error-handling"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Error recovery strategies for POC"
tags: [poc, errors, recovery, handling, resilience]
project_level: Alpha
agent_support: agent_autonomous
---

# POC: Error Handling

Error recovery strategies and patterns for the POC.

## Error Types

### @poc/errors/types

```typescript
/**
 * POC Error Codes
 */
export type POCErrorCode =
  | 'WATCH_ERROR'       // File watching failed
  | 'PARSE_ERROR'       // Spec parsing failed
  | 'GENERATION_ERROR'  // Code generation failed
  | 'WRITE_ERROR'       // File write failed
  | 'SYMLINK_ERROR'     // Symlink creation failed
  | 'CONVERGENCE_ERROR' // Convergence detection failed
  | 'TIMEOUT_ERROR'     // Task timeout
  | 'HEADER_ERROR'      // Invalid spec header
  | 'TEMPLATE_ERROR'    // Template not found
  | 'VALIDATION_ERROR'  // Spec validation failed
  | 'DATABASE_ERROR'   // Database operation failed
  | 'UNKNOWN_ERROR';    // Catch-all

/**
 * POC Error class
 */
export class POCError extends Error {
  /** Error code */
  code: POCErrorCode;
  
  /** File path (if applicable) */
  filePath?: string;
  
  /** Stack trace */
  stack?: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Original error (if wrapped) */
  cause?: Error;
  
  constructor(code: POCErrorCode, message: string, filePath?: string, cause?: Error) {
    super(message);
    this.code = code;
    this.filePath = filePath;
    this.timestamp = Date.now();
    this.cause = cause;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, POCError);
    }
  }
  
  /**
   * Convert to user-friendly message
   */
  toUserMessage(): string {
    const messages: Record<POCErrorCode, string> = {
      'WATCH_ERROR': 'Failed to watch directory',
      'PARSE_ERROR': 'Failed to parse spec file',
      'GENERATION_ERROR': 'Failed to generate code',
      'WRITE_ERROR': 'Failed to write file',
      'SYMLINK_ERROR': 'Failed to create symlink',
      'CONVERGENCE_ERROR': 'Convergence detection failed',
      'TIMEOUT_ERROR': 'Operation timed out',
      'HEADER_ERROR': 'Invalid spec header',
      'TEMPLATE_ERROR': 'Template not found',
      'VALIDATION_ERROR': 'Spec validation failed',
      'DATABASE_ERROR': 'Database operation failed',
      'UNKNOWN_ERROR': 'An unexpected error occurred'
    };
    
    let msg = `[${this.code}] ${messages[this.code]}`;
    if (this.filePath) {
      msg += `\n  File: ${this.filePath}`;
    }
    if (this.message) {
      msg += `\n  Details: ${this.message}`;
    }
    
    return msg;
  }
}
```

## Recovery Strategies

### @poc/errors/recovery

```typescript
/**
 * Recovery strategies per error type
 */
export type RecoveryStrategy =
  | 'skip'              // Skip this file, continue with others
  | 'retry'             // Retry immediately
  | 'retry-delayed'     // Retry after delay
  | 'stop'              // Stop processing current cascade
  | 'fatal';            // Stop daemon

/**
 * Recovery configuration
 */
export interface ErrorRecoveryConfig {
  /** Strategy per error code */
  strategies: Partial<Record<POCErrorCode, RecoveryStrategy>>;
  
  /** Max retries per operation */
  maxRetries: number;
  
  /** Delay between retries (ms) */
  retryDelayMs: number;
  
  /** Max consecutive errors before stopping */
  maxConsecutiveErrors: number;
  
  /** Should retry on failure? */
  shouldRetry: (error: POCError, attempt: number) => boolean;
}

/**
 * Default recovery configuration
 */
export const DEFAULT_RECOVERY_CONFIG: ErrorRecoveryConfig = {
  strategies: {
    'WATCH_ERROR': 'fatal',           // Can't recover from watcher failure
    'PARSE_ERROR': 'skip',            // Skip invalid specs
    'GENERATION_ERROR': 'retry',      // Retry generation once
    'WRITE_ERROR': 'retry-delayed',   // Retry write after delay
    'SYMLINK_ERROR': 'skip',          // Skip symlinks on error
    'CONVERGENCE_ERROR': 'stop',      // Stop current cascade
    'TIMEOUT_ERROR': 'retry-delayed', // Retry with longer timeout
    'HEADER_ERROR': 'skip',           // Skip bad headers
    'TEMPLATE_ERROR': 'fatal',        // Can't recover
    'VALIDATION_ERROR': 'skip',       // Skip invalid
    'DATABASE_ERROR': 'stop',         // Stop, may need cleanup
    'UNKNOWN_ERROR': 'skip'           // Skip unknown errors
  },
  maxRetries: 3,
  retryDelayMs: 1000,
  maxConsecutiveErrors: 5,
  shouldRetry: (error, attempt) => {
    // Don't retry parse errors or fatal errors
    if (error.code === 'PARSE_ERROR' || 
        error.code === 'HEADER_ERROR' ||
        error.code === 'TEMPLATE_ERROR') {
      return false;
    }
    return attempt < 3;
  }
};
```

## Error Handler

### @poc/errors/handler

```typescript
import { POCError, RecoveryStrategy, ErrorRecoveryConfig } from './types';

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  /** Is circuit open (failing fast) */
  isOpen: boolean;
  /** Number of consecutive failures */
  failures: number;
  /** Threshold before opening circuit */
  threshold: number;
  /** Timeout before attempting reset */
  timeoutMs: number;
  /** Last failure timestamp */
  lastFailure: number;
}

/**
 * Error metrics for monitoring
 */
export interface ErrorMetrics {
  /** Total errors by code */
  byCode: Record<POCErrorCode, number>;
  /** Total errors by file */
  byFile: Record<string, number>;
  /** Consecutive current errors */
  consecutive: number;
  /** Circuit breaker state */
  circuitBreaker: CircuitBreakerState;
  /** Start time of current error window */
  windowStart: number;
}

/**
 * Enhanced recovery config with circuit breaker
 */
export interface EnhancedErrorConfig extends ErrorRecoveryConfig {
  /** Circuit breaker threshold */
  circuitBreakerThreshold: number;
  /** Circuit breaker timeout */
  circuitBreakerTimeoutMs: number;
  /** Error window for rate calculation */
  errorWindowMs: number;
  /** Max errors per window before throttling */
  maxErrorsPerWindow: number;
  /** Exponential backoff base */
  backoffBaseMs: number;
  /** Exponential backoff max */
  backoffMaxMs: number;
}

/**
 * Enhanced default config with circuit breaker
 */
export const ENHANCED_DEFAULT_CONFIG: EnhancedErrorConfig = {
  ...DEFAULT_RECOVERY_CONFIG,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeoutMs: 30000, // 30 seconds
  errorWindowMs: 60000, // 1 minute
  maxErrorsPerWindow: 10,
  backoffBaseMs: 1000,
  backoffMaxMs: 30000
};

/**
 * Maximum error log size to prevent unbounded growth
 */
const MAX_ERROR_LOG_SIZE = 1000;

/**
 * Maximum retry attempts map size to prevent memory leaks
 */
const MAX_RETRY_MAP_SIZE = 1000;

/**
 * Central error handler with circuit breaker and exponential backoff
 */
export class ErrorHandler {
  private config: EnhancedErrorConfig;
  private consecutiveErrors: number = 0;
  private errorLog: POCError[] = [];
  private circuitBreaker: CircuitBreakerState;
  private errorWindow: POCError[] = [];
  private retryAttempts: Map<string, number> = new Map();
  
  constructor(config: Partial<EnhancedErrorConfig> = {}) {
    this.config = { ...ENHANCED_DEFAULT_CONFIG, ...config };
    this.circuitBreaker = {
      isOpen: false,
      failures: 0,
      threshold: this.config.circuitBreakerThreshold,
      timeoutMs: this.config.circuitBreakerTimeoutMs,
      lastFailure: 0
    };
  }
  
  /**
   * Handle an error with circuit breaker protection
   */
  async handle(error: POCError): Promise<RecoveryStrategy> {
    // Check circuit breaker first
    if (this.isCircuitOpen()) {
      console.error(`[ErrorHandler] Circuit breaker OPEN - failing fast for ${this.config.circuitBreakerTimeoutMs}ms`);
      return 'fatal';
    }
    
    // Log and track
    this.logError(error);
    this.updateCircuitBreaker();
    this.updateErrorWindow();
    
    // Check rate limiting
    if (this.isRateLimited()) {
      console.error(`[ErrorHandler] Rate limit exceeded (${this.config.maxErrorsPerWindow} errors in ${this.config.errorWindowMs}ms)`);
      this.openCircuit();
      return 'stop';
    }
    
    // Increment consecutive errors
    this.consecutiveErrors++;
    
    // Check max consecutive
    if (this.consecutiveErrors >= this.config.maxConsecutiveErrors) {
      console.error(`[ErrorHandler] Max consecutive errors reached (${this.config.maxConsecutiveErrors})`);
      this.openCircuit();
      return 'fatal';
    }
    
    // Get strategy for error code
    const strategy = this.config.strategies[error.code] || 'skip';
    
    // Execute recovery
    return await this.executeRecovery(error, strategy);
  }
  
  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (!this.circuitBreaker.isOpen) return false;
    
    // Check if it's time to try again
    const elapsed = Date.now() - this.circuitBreaker.lastFailure;
    if (elapsed > this.circuitBreaker.timeoutMs) {
      console.log('[ErrorHandler] Circuit breaker closing - attempting recovery');
      this.closeCircuit();
      return false;
    }
    
    return true;
  }
  
  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.openCircuit();
    }
  }
  
  /**
   * Open circuit breaker
   */
  private openCircuit(): void {
    this.circuitBreaker.isOpen = true;
    console.error(`[ErrorHandler] Circuit breaker OPENED after ${this.circuitBreaker.threshold} failures`);
  }
  
  /**
   * Close circuit breaker
   */
  private closeCircuit(): void {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failures = 0;
    this.consecutiveErrors = 0;
    console.log('[ErrorHandler] Circuit breaker CLOSED');
  }
  
  /**
   * Check if error rate is limited
   */
  private isRateLimited(): boolean {
    return this.errorWindow.length >= this.config.maxErrorsPerWindow;
  }
  
  /**
   * Update error window
   */
  private updateErrorWindow(): void {
    const cutoff = Date.now() - this.config.errorWindowMs;
    this.errorWindow = this.errorWindow.filter(e => e.timestamp > cutoff);
  }
  
  /**
   * Execute recovery with exponential backoff
   */
  private async executeRecovery(error: POCError, strategy: RecoveryStrategy): Promise<RecoveryStrategy> {
    const key = `${error.code}:${error.filePath || 'unknown'}`;
    const attempts = this.retryAttempts.get(key) || 0;
    
    if (strategy === 'retry' || strategy === 'retry-delayed') {
      if (attempts < this.config.maxRetries) {
        const delay = strategy === 'retry-delayed' 
          ? Math.min(this.config.backoffBaseMs * Math.pow(2, attempts), this.config.backoffMaxMs)
          : 0;
        
        if (delay > 0) {
          console.log(`[ErrorHandler] Retrying in ${delay}ms (attempt ${attempts + 1}/${this.config.maxRetries})`);
          await this.sleep(delay);
        }
        
        this.retryAttempts.set(key, attempts + 1);
        
        // ENFORCE BOUND: Clean up oldest entries if map gets too large
        if (this.retryAttempts.size > MAX_RETRY_MAP_SIZE) {
          // Remove 10% of oldest entries to keep map size manageable
          const entriesToRemove = Math.floor(MAX_RETRY_MAP_SIZE * 0.1);
          const iterator = this.retryAttempts.keys();
          for (let i = 0; i < entriesToRemove; i++) {
            const key = iterator.next().value;
            if (key === undefined) break;
            this.retryAttempts.delete(key);
          }
        }
        
        return 'retry';
      } else {
        console.log(`[ErrorHandler] Max retries exceeded for ${error.code}`);
        this.retryAttempts.delete(key);
      }
    }
    
    return strategy;
  }
  
  /**
   * Reset error tracking on success
   */
  reset(): void {
    this.consecutiveErrors = 0;
    this.errorWindow = [];
    this.retryAttempts.clear();
    if (this.circuitBreaker.isOpen) {
      this.closeCircuit();
    }
  }

  

  
  /**
   * Log error to file/database with bounded growth
   */
  private logError(error: POCError): void {
    this.errorLog.push(error);
    
    // ENFORCE BOUND: Remove oldest errors when exceeding max size
    if (this.errorLog.length > MAX_ERROR_LOG_SIZE) {
      this.errorLog.shift(); // Remove oldest error
    }
    
    console.error(error.toUserMessage());
  }
  
  /**
   * Handle skip strategy

  
  /**
   * Get error statistics
   */
  getStats(): { total: number; byCode: Record<POCErrorCode, number> } {
    const byCode: Partial<Record<POCErrorCode, number>> = {};
    
    for (const error of this.errorLog) {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    }
    
    return {
      total: this.errorLog.length,
      byCode: byCode as Record<POCErrorCode, number>
    };
  }
  
  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Component Integration

### @poc/errors/integration

**SimpleAgent with Error Handling:**
```typescript
import { ErrorHandler } from './error-handling';

export class SimpleAgent {
  private errorHandler: ErrorHandler;
  
  constructor() {
    this.errorHandler = new ErrorHandler();
  }
  
  async onFileChanged(event: FileEvent): Promise<void> {
    try {
      // Process file
      await this.processFile(event.path);
      
      // Reset error counter on success
      this.errorHandler.reset();
    } catch (error) {
      const pocError = this.wrapError(error, event.path);
      const strategy = await this.errorHandler.handle(pocError);
      
      if (strategy === 'retry') {
        // Retry immediately
        await this.onFileChanged(event);
      } else if (strategy === 'stop') {
        // Stop processing this cascade
        throw pocError;
      }
      // Otherwise continue (skip or fatal handled by ErrorHandler)
    }
  }
  
  private wrapError(error: any, filePath?: string): POCError {
    if (error instanceof POCError) {
      return error;
    }
    
    return new POCError(
      'UNKNOWN_ERROR',
      error?.message || String(error),
      filePath,
      error instanceof Error ? error : undefined
    );
  }
}
```

**Daemon with Error Handling:**
```typescript
export class PocDaemon {
  private errorHandler: ErrorHandler;
  
  constructor() {
    this.errorHandler = new ErrorHandler();
  }
  
  private setupErrorHandling(): void {
    // Watcher errors
    this.watcher.on('error', async (error: POCError) => {
      const strategy = await this.errorHandler.handle(error);
      
      if (strategy === 'fatal') {
        await this.stop();
        process.exit(1);
      }
    });
    
    // Agent errors
    this.agent.on('task-error', async (event) => {
      const error = new POCError(
        'GENERATION_ERROR',
        event.error,
        event.filePath
      );
      await this.errorHandler.handle(error);
    });
  }
}
```

## Error Messages

### @poc/errors/messages

**User-Facing Messages:**

| Code | User Message |
|------|--------------|
| WATCH_ERROR | Failed to watch directory |
| PARSE_ERROR | Failed to parse spec file |
| GENERATION_ERROR | Failed to generate code |
| WRITE_ERROR | Failed to write file |
| SYMLINK_ERROR | Failed to create symlink |
| TIMEOUT_ERROR | Operation timed out |
| HEADER_ERROR | Invalid spec header |
| TEMPLATE_ERROR | Template not found |
| VALIDATION_ERROR | Spec validation failed |
| DATABASE_ERROR | Database operation failed |

**Actionable Suggestions:**

```typescript
const ERROR_SUGGESTIONS: Record<POCErrorCode, string[]> = {
  'WATCH_ERROR': [
    'Check directory permissions',
    'Ensure directory exists',
    'Try running with sudo (Linux/Mac)'
  ],
  'PARSE_ERROR': [
    'Check spec syntax',
    'Validate YAML header',
    'Check for unclosed blocks'
  ],
  'WRITE_ERROR': [
    'Check disk space',
    'Check file permissions',
    'Try different output directory'
  ],
  'SYMLINK_ERROR': [
    'On Windows, run as administrator',
    'Use --no-symlinks flag',
    'Enable Developer Mode (Windows)'
  ],
  'HEADER_ERROR': [
    'Ensure header starts with # speclang-header',
    'Check required fields (id, version, layer)',
    'Validate spec ID format (@specs/name)'
  ],
  // ... etc
};
```

## Testing

### @poc/errors/testing

```typescript
describe('ErrorHandler', () => {
  let handler: ErrorHandler;
  
  beforeEach(() => {
    handler = new ErrorHandler();
  });
  
  it('should skip parse errors', async () => {
    const error = new POCError('PARSE_ERROR', 'Invalid syntax');
    const strategy = await handler.handle(error);
    
    expect(strategy).toBe('skip');
  });
  
  it('should retry generation errors', async () => {
    const error = new POCError('GENERATION_ERROR', 'Template failed');
    const strategy = await handler.handle(error);
    
    expect(strategy).toBe('retry');
  });
  
  it('should become fatal after max consecutive errors', async () => {
    const config = { ...DEFAULT_RECOVERY_CONFIG, maxConsecutiveErrors: 3 };
    handler = new ErrorHandler(config);
    
    // 3 consecutive errors
    await handler.handle(new POCError('PARSE_ERROR', 'Error 1'));
    await handler.handle(new POCError('PARSE_ERROR', 'Error 2'));
    const strategy = await handler.handle(new POCError('PARSE_ERROR', 'Error 3'));
    
    expect(strategy).toBe('fatal');
  });
  
  it('should reset consecutive errors on success', async () => {
    await handler.handle(new POCError('PARSE_ERROR', 'Error 1'));
    await handler.handle(new POCError('PARSE_ERROR', 'Error 2'));
    
    handler.reset();
    
    const strategy = await handler.handle(new POCError('PARSE_ERROR', 'Error 3'));
    expect(strategy).toBe('skip'); // Not fatal
  });
});
```

## Best Practices

### @poc/errors/best-practices

1. **Always wrap errors** in POCError for consistent handling
2. **Log errors immediately** with full context
3. **Reset error counter** on successful operations
4. **Provide actionable suggestions** to users
5. **Fail fast** on unrecoverable errors (fatal strategy)
6. **Retry transient errors** (network, file locks)
7. **Skip bad files** instead of crashing entire cascade
