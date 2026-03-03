/**
 * Result type for error handling
 */
/**
 * Success variant of Result
 */
export type Success<T> = {
    ok: true;
    value: T;
};
/**
 * Failure variant of Result
 */
export type Failure<E = Error> = {
    ok: false;
    error: E;
};
/**
 * Result type - represents success or failure
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;
/**
 * Option type - represents maybe has a value
 */
export type Some<T> = {
    some: true;
    value: T;
};
export type None = {
    some: false;
};
export type Option<T> = Some<T> | None;
/**
 * Result operations
 */
export declare const Results: {
    /**
     * Create a success result
     */
    success: <T>(value: T) => Success<T>;
    /**
     * Create a failure result
     */
    failure: <E = Error>(error: E) => Failure<E>;
    /**
     * Try to execute a function and wrap result
     */
    fromTry: <T>(fn: () => T) => Result<T, Error>;
    /**
     * Wrap a promise
     */
    fromPromise: <T>(promise: Promise<T>) => Promise<Result<T, Error>>;
    /**
     * Check if result is success
     */
    isOk: <T, E>(result: Result<T, E>) => result is Success<T>;
    /**
     * Check if result is failure
     */
    isError: <T, E>(result: Result<T, E>) => result is Failure<E>;
    /**
     * Map success value
     */
    map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U) => Result<U, E>;
    /**
     * Map error value
     */
    mapError: <T, E, F>(result: Result<T, E>, fn: (error: E) => F) => Result<T, F>;
    /**
     * FlatMap/chain result
     */
    flatMap: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>) => Result<U, E>;
    /**
     * Unwrap result or throw
     */
    unwrap: <T, E>(result: Result<T, E>) => T;
    /**
     * Unwrap result or return default
     */
    unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T) => T;
    /**
     * Unwrap result or compute from error
     */
    unwrapOrElse: <T, E>(result: Result<T, E>, fn: (error: E) => T) => T;
    /**
     * Get value or undefined
     */
    ok: <T, E>(result: Result<T, E>) => T | undefined;
    /**
     * Get error or undefined
     */
    err: <T, E>(result: Result<T, E>) => E | undefined;
};
/**
 * Option operations
 */
export declare const Options: {
    /**
     * Create Some variant
     */
    some: <T>(value: T) => Some<T>;
    /**
     * Create None variant
     */
    none: <T>() => None;
    /**
     * Wrap value in Option
     */
    of: <T>(value: T | null | undefined) => Option<T>;
    /**
     * Check if Option is Some
     */
    isSome: <T>(option: Option<T>) => option is Some<T>;
    /**
     * Check if Option is None
     */
    isNone: <T>(option: Option<T>) => option is None;
    /**
     * Map Option value
     */
    map: <T, U>(option: Option<T>, fn: (value: T) => U) => Option<U>;
    /**
     * FlatMap Option
     */
    flatMap: <T, U>(option: Option<T>, fn: (value: T) => Option<U>) => Option<U>;
    /**
     * Unwrap Option or throw
     */
    unwrap: <T>(option: Option<T>) => T;
    /**
     * Unwrap Option or return default
     */
    unwrapOr: <T>(option: Option<T>, defaultValue: T) => T;
    /**
     * Unwrap Option or compute from None
     */
    unwrapOrElse: <T>(option: Option<T>, fn: () => T) => T;
};
//# sourceMappingURL=results.d.ts.map