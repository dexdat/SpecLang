class ResultClassImpl<T, E> {
  private readonly _ok: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(ok: boolean, value?: T, error?: E) {
    this._ok = ok;
    this._value = value;
    this._error = error;
  }

  static ok<T>(value: T): ResultClass<T, any> {
    return new ResultClassImpl(true, value, undefined) as unknown as ResultClass<T, any>;
  }

  static err<E>(error: E): ResultClass<any, E> {
    return new ResultClassImpl(false, undefined, error) as unknown as ResultClass<any, E>;
  }

  static fromTry<T>(fn: () => T): ResultClass<T, Error> {
    try {
      return ResultClassImpl.ok(fn());
    } catch (e) {
      return ResultClassImpl.err(e instanceof Error ? e : new Error(String(e)));
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
    if (this._ok) return this._value as T;
    return defaultValue;
  }

  map<U>(fn: (value: T) => U): ResultClass<U, E> {
    if (this._ok) return ResultClassImpl.ok(fn(this._value as T));
    return ResultClassImpl.err(this._error as E);
  }

  mapError<F>(fn: (error: E) => F): ResultClass<T, F> {
    if (this._ok) return ResultClassImpl.ok(this._value as T);
    return ResultClassImpl.err(fn(this._error as E));
  }

  andThen<U>(fn: (value: T) => ResultClass<U, E>): ResultClass<U, E> {
    if (this._ok) return fn(this._value as T);
    return ResultClassImpl.err(this._error as E);
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    if (this._ok) return handlers.ok(this._value as T);
    return handlers.err(this._error as E);
  }

  unwrapOrElse(fn: (error: E) => T): T {
    if (this._ok) return this._value as T;
    return fn(this._error as E);
  }

  err(): E {
    return this._error as E;
  }
}

type ResultClass<T, E> = ResultClassImpl<T, E>;
const ResultClass = ResultClassImpl;

class OptionClassImpl<T> {
  private readonly _some: boolean;
  private readonly _value?: T;

  private constructor(some: boolean, value?: T) {
    this._some = some;
    this._value = value;
  }

  static some<T>(value: T): OptionClass<T> {
    return new OptionClassImpl(true, value) as unknown as OptionClass<T>;
  }

  static none<T>(): OptionClass<T> {
    return new OptionClassImpl(false) as unknown as OptionClass<T>;
  }

  static of<T>(value: T | null | undefined): OptionClass<T> {
    if (value !== null && value !== undefined) return OptionClassImpl.some(value);
    return OptionClassImpl.none();
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
    if (this._some) return this._value as T;
    return defaultValue;
  }

  map<U>(fn: (value: T) => U): OptionClass<U> {
    if (this._some) return OptionClassImpl.some(fn(this._value as T));
    return OptionClassImpl.none();
  }

  andThen<U>(fn: (value: T) => OptionClass<U>): OptionClass<U> {
    if (this._some) return fn(this._value as T);
    return OptionClassImpl.none();
  }

  filter(predicate: (value: T) => boolean): OptionClass<T> {
    if (this._some && predicate(this._value as T)) return OptionClassImpl.some(this._value as T);
    return OptionClassImpl.none();
  }

  toResult<E>(errorMessage: E): ResultClass<T, E> {
    if (this._some) return ResultClassImpl.ok(this._value as T);
    return ResultClassImpl.err(errorMessage);
  }
}

type OptionClass<T> = OptionClassImpl<T>;
const OptionClass = OptionClassImpl;

export { ResultClass, OptionClass };
export type Result<T, E = Error> = ResultClass<T, E>;
export type Success<T> = ResultClass<T, never>;
export type Failure<E> = ResultClass<never, E>;
export type Option<T> = OptionClass<T>;
export type Some<T> = OptionClass<T>;
export type None = OptionClass<never>;
