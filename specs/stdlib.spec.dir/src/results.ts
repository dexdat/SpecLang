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

export class ResultClass<T, E = Error> {
  private constructor(
    private readonly _ok: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  static ok<T, E = Error>(value: T): ResultClass<T, E> {
    return new ResultClass<T, E>(true, value, undefined);
  }

  static err<T, E = Error>(error: E): ResultClass<T, E> {
    return new ResultClass<T, E>(false, undefined, error);
  }

  static fromTry<T, E = Error>(fn: () => T): ResultClass<T, E> {
    try {
      return ResultClass.ok<T, E>(fn());
    } catch (e) {
      return ResultClass.err<T, E>(e instanceof Error ? e as unknown as E : e as E);
    }
  }

  isOk(): boolean {
    return this._ok;
  }

  isErr(): boolean {
    return !this._ok;
  }

  unwrap(): T {
    if (this._ok) return this._value as T;
    throw this._error;
  }

  unwrapOr(defaultValue: T): T {
    return this._ok ? (this._value as T) : defaultValue;
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return this._ok ? (this._value as T) : fn(this._error as E);
  }

  map<U>(fn: (value: T) => U): ResultClass<U, E> {
    return this._ok
      ? ResultClass.ok<U, E>(fn(this._value as T))
      : ResultClass.err<U, E>(this._error as E);
  }

  mapError<F>(fn: (error: E) => F): ResultClass<T, F> {
    return this._ok
      ? ResultClass.ok<T, F>(this._value as T)
      : ResultClass.err<T, F>(fn(this._error as E));
  }

  andThen<U>(fn: (value: T) => ResultClass<U, E>): ResultClass<U, E> {
    return this._ok
      ? fn(this._value as T)
      : ResultClass.err<U, E>(this._error as E);
  }

  ok(): T | undefined {
    return this._ok ? this._value : undefined;
  }

  err(): E | undefined {
    return this._ok ? undefined : this._error;
  }

  match<U>(patterns: { ok: (value: T) => U; err: (error: E) => U }): U {
    return this._ok
      ? patterns.ok(this._value as T)
      : patterns.err(this._error as E);
  }
}

export class OptionClass<T> {
  private constructor(
    private readonly _some: boolean,
    private readonly _value?: T
  ) {}

  static some<T>(value: T): OptionClass<T> {
    return new OptionClass<T>(true, value);
  }

  static none<T>(): OptionClass<T> {
    return new OptionClass<T>(false, undefined);
  }

  static of<T>(value: T | null | undefined): OptionClass<T> {
    return value !== null && value !== undefined
      ? OptionClass.some(value)
      : OptionClass.none<T>();
  }

  isSome(): boolean {
    return this._some;
  }

  isNone(): boolean {
    return !this._some;
  }

  unwrap(): T {
    if (this._some) return this._value as T;
    throw new Error('Option is None');
  }

  unwrapOr(defaultValue: T): T {
    return this._some ? (this._value as T) : defaultValue;
  }

  unwrapOrElse(fn: () => T): T {
    return this._some ? (this._value as T) : fn();
  }

  map<U>(fn: (value: T) => U): OptionClass<U> {
    return this._some
      ? OptionClass.some(fn(this._value as T))
      : OptionClass.none<U>();
  }

  andThen<U>(fn: (value: T) => OptionClass<U>): OptionClass<U> {
    return this._some
      ? fn(this._value as T)
      : OptionClass.none<U>();
  }

  filter(predicate: (value: T) => boolean): OptionClass<T> {
    return this._some && predicate(this._value as T)
      ? this
      : OptionClass.none<T>();
  }

  match<U>(patterns: { some: (value: T) => U; none: () => U }): U {
    return this._some
      ? patterns.some(this._value as T)
      : patterns.none();
  }

  toResult<E>(error: E): ResultClass<T, E> {
    return this._some
      ? ResultClass.ok<T, E>(this._value as T)
      : ResultClass.err<T, E>(error);
  }
}
