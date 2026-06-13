---
id: "@speclang/stdlib/types"
parent: "@ref:specs/stdlib"
short: "Standard library type definitions"
project_level: Alpha
agent_support: agent_autonomous
tags: [stdlib, types, definitions]
version: 0.1.0
layer: 1
target_lang: ts
output: .speclang/assembled/stdlib-types.spec.ts
owned-by: stdlib
model_pool: code-gen
max_concurrent: 1
seed: false
status: draft
---

# Standard Library Types

Core type definitions used across SpecLang.

## Implementation

```typescript
// @block:primitives — Primitive type definitions
export type String = string;
export type Number = number;
export type Boolean = boolean;
export type Date = string & { __brand: 'Date' };
export type UUID = string & { __brand: 'UUID' };
export type Path = string & { __brand: 'Path' };
```

```typescript
// @block:composite — Composite types
export type SpecRef = string & { __brand: 'SpecRef' };
export type Layer = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type MaturityLevel =
  | 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Production'
  | 'Startup' | 'SMB' | 'MSB' | 'Enterprise';
export type AgentRole =
  | 'NorthStar' | 'SpecWriter' | 'CodeGen' | 'TestWriter'
  | 'Orchestrator' | 'BackSync';
```

```typescript
// @block:utility — Utility types
export type Optional<T> = T | undefined;
export type List<T> = T[];
export type Map<K extends string | number | symbol, V> = Record<K, V>;
```

```typescript
// @block:result — Result<T, E> class for error handling
// Represents either a successful value or an error.
// Provides chainable methods for transforming and unwrapping values.

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
```

```typescript
// @block:option — Option<T> class for nullable values
// Represents either Some(value) or None.
// Provides chainable methods for transforming and unwrapping values.

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
```

```typescript
// @block:validation — Validator<T> class for chainable validation
// Builds a validation pipeline with chainable rule additions.
// validate() returns Result<T, ValidationError[]>.

export type ValidationError = {
  field?: string;
  message: string;
  code: string;
};

export class ValidatorClass<T> {
  private rules: Array<{
    validate: (value: T) => boolean;
    message: string;
    code: string;
  }> = [];

  static create<T>(): ValidatorClass<T> {
    return new ValidatorClass<T>();
  }

  addRule(
    validate: (value: T) => boolean,
    message: string,
    code: string
  ): ValidatorClass<T> {
    this.rules.push({ validate, message, code });
    return this;
  }

  validate(value: T): Result<T, ValidationError[]> {
    const errors: ValidationError[] = [];
    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push({ message: rule.message, code: rule.code });
      }
    }
    if (errors.length > 0) {
      return { ok: false, error: errors };
    }
    return { ok: true, value };
  }

  isValid(value: T): boolean {
    return this.validate(value).ok;
  }

  getRuleCount(): number {
    return this.rules.length;
  }
}
```

```typescript
// @block:collection — Collection<T> with iterator methods
// Wraps an array with chainable functional methods.
// Provides filter, map, reduce, find, every, some.

export class CollectionClass<T> {
  constructor(private _items: T[] = []) {}

  static of<T>(...items: T[]): CollectionClass<T> {
    return new CollectionClass<T>(items);
  }

  static from<T>(items: T[]): CollectionClass<T> {
    return new CollectionClass<T>([...items]);
  }

  get items(): T[] {
    return [...this._items];
  }

  get length(): number {
    return this._items.length;
  }

  filter(predicate: (value: T, index: number) => boolean): CollectionClass<T> {
    return new CollectionClass(this._items.filter(predicate));
  }

  map<U>(fn: (value: T, index: number) => U): CollectionClass<U> {
    return new CollectionClass(this._items.map(fn));
  }

  reduce<U>(fn: (acc: U, value: T, index: number) => U, initialValue: U): U {
    return this._items.reduce(fn, initialValue);
  }

  find(predicate: (value: T, index: number) => boolean): T | undefined {
    return this._items.find(predicate);
  }

  every(predicate: (value: T, index: number) => boolean): boolean {
    return this._items.every(predicate);
  }

  some(predicate: (value: T, index: number) => boolean): boolean {
    return this._items.some(predicate);
  }

  forEach(fn: (value: T, index: number) => void): void {
    this._items.forEach(fn);
  }

  includes(value: T): boolean {
    return this._items.includes(value);
  }

  indexOf(value: T): number {
    return this._items.indexOf(value);
  }

  slice(start: number, end?: number): CollectionClass<T> {
    return new CollectionClass(this._items.slice(start, end));
  }

  concat(other: CollectionClass<T>): CollectionClass<T> {
    return new CollectionClass(this._items.concat(other._items));
  }

  reverse(): CollectionClass<T> {
    return new CollectionClass([...this._items].reverse());
  }

  sort(comparator?: (a: T, b: T) => number): CollectionClass<T> {
    return new CollectionClass([...this._items].sort(comparator));
  }

  first(): T | undefined {
    return this._items[0];
  }

  last(): T | undefined {
    return this._items[this._items.length - 1];
  }

  toArray(): T[] {
    return [...this._items];
  }

  isEmpty(): boolean {
    return this._items.length === 0;
  }

  count(predicate: (value: T) => boolean): number {
    return this._items.filter(predicate).length;
  }

  distinct(): CollectionClass<T> {
    return new CollectionClass([...new Set(this._items)]);
  }

  take(n: number): CollectionClass<T> {
    return new CollectionClass(this._items.slice(0, n));
  }

  skip(n: number): CollectionClass<T> {
    return new CollectionClass(this._items.slice(n));
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this._items;
    return {
      next(): IteratorResult<T> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}
```
