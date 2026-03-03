/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/error-handling.spec.md
 * Generated: 2026-03-03T04:15:00.000Z
 *
 * Edit the spec, not this file.
 */

// ============================================
// Error Types
// ============================================

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

// ============================================
// Recovery Strategies
// ============================================

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

// ============================================
// Error Handler
// ============================================

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
