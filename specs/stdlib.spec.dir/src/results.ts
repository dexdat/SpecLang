// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY

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
 * Type guard to check if result is Success
 */
function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok === true;
}

/**
 * Type guard to check if result is Failure
 */
function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.ok === false;
}

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
export const Results = {
  /**
   * Create a success result
   */
  success: <T>(value: T): Success<T> => ({
    ok: true,
    value
  }),
  
  /**
   * Create a failure result
   */
  failure: <E = Error>(error: E): Failure<E> => ({
    ok: false,
    error
  }),
  
  /**
   * Try to execute a function and wrap result
   */
  fromTry: <T>(fn: () => T): Result<T, Error> => {
    try {
      return Results.success(fn());
    } catch (e) {
      return Results.failure(e instanceof Error ? e : new Error(String(e)));
    }
  },
  
  /**
   * Wrap a promise
   */
  fromPromise: async <T>(promise: Promise<T>): Promise<Result<T, Error>> => {
    try {
      const value = await promise;
      return Results.success(value);
    } catch (e) {
      return Results.failure(e instanceof Error ? e : new Error(String(e)));
    }
  },
  
  /**
   * Check if result is success
   */
  isOk: <T, E>(result: Result<T, E>): result is Success<T> =>
    result.ok === true,
  
  /**
   * Check if result is failure
   */
  isError: <T, E>(result: Result<T, E>): result is Failure<E> =>
    result.ok === false,
  
  /**
   * Map success value
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (isSuccess(result)) {
      return Results.success(fn(result.value));
    }
    return Results.failure(result.error);
  },
  
  /**
   * Map error value
   */
  mapError: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    if (isSuccess(result)) {
      return Results.success(result.value);
    }
    return Results.failure(fn(result.error));
  },
  
  /**
   * FlatMap/chain result
   */
  flatMap: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
    if (isSuccess(result)) {
      return fn(result.value);
    }
    return Results.failure(result.error);
  },
  
  /**
   * Unwrap result or throw
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (isSuccess(result)) return result.value;
    throw result.error;
  },
  
  /**
   * Unwrap result or return default
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    if (isSuccess(result)) return result.value;
    return defaultValue;
  },
  
  /**
   * Unwrap result or compute from error
   */
  unwrapOrElse: <T, E>(result: Result<T, E>, fn: (error: E) => T): T => {
    if (isSuccess(result)) return result.value;
    return fn(result.error);
  },
  
  /**
   * Get value or undefined
   */
  ok: <T, E>(result: Result<T, E>): T | undefined => {
    if (isSuccess(result)) return result.value;
    return undefined;
  },
  
  /**
   * Get error or undefined
   */
  err: <T, E>(result: Result<T, E>): E | undefined => {
    if (isFailure(result)) return result.error;
    return undefined;
  }
};

/**
 * Option operations
 */
export const Options = {
  /**
   * Create Some variant
   */
  some: <T>(value: T): Some<T> => ({
    some: true,
    value
  }),
  
  /**
   * Create None variant
   */
  none: <T>(): None => ({
    some: false
  }),
  
  /**
   * Wrap value in Option
   */
  of: <T>(value: T | null | undefined): Option<T> =>
    value !== null && value !== undefined ? Options.some(value) : Options.none(),
  
  /**
   * Check if Option is Some
   */
  isSome: <T>(option: Option<T>): option is Some<T> =>
    option.some === true,
  
  /**
   * Check if Option is None
   */
  isNone: <T>(option: Option<T>): option is None =>
    option.some === false,
  
  /**
   * Map Option value
   */
  map: <T, U>(option: Option<T>, fn: (value: T) => U): Option<U> =>
    option.some ? Options.some(fn(option.value)) : Options.none(),
  
  /**
   * FlatMap Option
   */
  flatMap: <T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U> =>
    option.some ? fn(option.value) : Options.none(),
  
  /**
   * Unwrap Option or throw
   */
  unwrap: <T>(option: Option<T>): T => {
    if (option.some) return option.value;
    throw new Error('Option is None');
  },
  
  /**
   * Unwrap Option or return default
   */
  unwrapOr: <T>(option: Option<T>, defaultValue: T): T =>
    option.some ? option.value : defaultValue,
  
  /**
   * Unwrap Option or compute from None
   */
  unwrapOrElse: <T>(option: Option<T>, fn: () => T): T =>
    option.some ? option.value : fn()
};
