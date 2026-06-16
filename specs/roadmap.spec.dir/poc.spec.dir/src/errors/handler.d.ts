/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/error-handling.spec.md
 * Generated: 2026-03-03T04:15:00.000Z
 *
 * Edit the spec, not this file.
 */
/**
 * POC Error Codes
 */
export type POCErrorCode = 'WATCH_ERROR' | 'PARSE_ERROR' | 'GENERATION_ERROR' | 'WRITE_ERROR' | 'SYMLINK_ERROR' | 'CONVERGENCE_ERROR' | 'TIMEOUT_ERROR' | 'HEADER_ERROR' | 'TEMPLATE_ERROR' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNKNOWN_ERROR';
/**
 * POC Error class
 */
export declare class POCError extends Error {
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
    constructor(code: POCErrorCode, message: string, filePath?: string, cause?: Error);
    /**
     * Convert to user-friendly message
     */
    toUserMessage(): string;
}
/**
 * Recovery strategies per error type
 */
export type RecoveryStrategy = 'skip' | 'retry' | 'retry-delayed' | 'stop' | 'fatal';
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
export declare const DEFAULT_RECOVERY_CONFIG: ErrorRecoveryConfig;
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
export declare const ENHANCED_DEFAULT_CONFIG: EnhancedErrorConfig;
/**
 * Central error handler with circuit breaker and exponential backoff
 */
export declare class ErrorHandler {
    private config;
    private consecutiveErrors;
    private errorLog;
    private circuitBreaker;
    private errorWindow;
    private retryAttempts;
    constructor(config?: Partial<EnhancedErrorConfig>);
    /**
     * Handle an error with circuit breaker protection
     */
    handle(error: POCError): Promise<RecoveryStrategy>;
    /**
     * Check if circuit breaker is open
     */
    private isCircuitOpen;
    /**
     * Update circuit breaker state
     */
    private updateCircuitBreaker;
    /**
     * Open circuit breaker
     */
    private openCircuit;
    /**
     * Close circuit breaker
     */
    private closeCircuit;
    /**
     * Check if error rate is limited
     */
    private isRateLimited;
    /**
     * Update error window
     */
    private updateErrorWindow;
    /**
     * Execute recovery with exponential backoff
     */
    private executeRecovery;
    /**
     * Reset error tracking on success
     */
    reset(): void;
    /**
     * Log error to file/database with bounded growth
     */
    private logError;
    /**
     * Get error statistics
     */
    getStats(): {
        total: number;
        byCode: Record<POCErrorCode, number>;
    };
    /**
     * Sleep helper
     */
    private sleep;
}
//# sourceMappingURL=handler.d.ts.map