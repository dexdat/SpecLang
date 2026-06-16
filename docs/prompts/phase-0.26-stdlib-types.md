# Bootstrap Phase 0.26: Standard Library Types

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.26 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.25 complete
- Core parser and indexer working
- Validation rules defined

## Your Task
Implement the SpecLang standard library type system. All types defined here are available to specs without import.

## Read These Specs First
1. `specs/stdlib.spec.dir/types.spec.md` - Type definitions
2. `specs/stdlib.spec.md` - Standard library overview
3. `specs/stdlib.spec.dir/mapping.spec.md` - Function and assertion types

## What to Build

### Files to Create
```
src/stdlib/
├── types/
│   ├── index.ts           # Type exports
│   ├── primitives.ts      # String, Int, Float, Bool
│   ├── composites.ts      # List, Map, Set
│   ├── results.ts         # Option, Result
│   ├── common.ts          # UUID, DateTime, Duration
│   └── predicates.ts      # Type checking functions

tests/stdlib/
└── types.test.ts
```

### Requirements

#### 1. Primitive Types

```typescript
// src/stdlib/types/primitives.ts

export interface StringType {
  description: "Text value";
  operations: {
    concat: (a: string, b: string) => string;
    split: (s: string, delimiter: string) => string[];
    length: (s: string) => number;
    contains: (s: string, substring: string) => boolean;
    trim: (s: string) => string;
    upper: (s: string) => string;
    lower: (s: string) => string;
  };
}

export interface IntType {
  description: "Integer number";
  operations: {
    add: (a: number, b: number) => number;
    subtract: (a: number, b: number) => number;
    multiply: (a: number, b: number) => number;
    divide: (a: number, b: number) => number | Error;
    modulo: (a: number, b: number) => number;
    range: (start: number, end: number) => number[];
  };
}

export interface FloatType {
  description: "Floating point number";
  operations: {
    add: (a: number, b: number) => number;
    subtract: (a: number, b: number) => number;
    multiply: (a: number, b: number) => number;
    divide: (a: number, b: number) => number;
    round: (n: number, precision: number) => number;
    floor: (n: number) => number;
    ceil: (n: number) => number;
  };
}

export interface BoolType {
  description: "True or false";
  operations: {
    and: (a: boolean, b: boolean) => boolean;
    or: (a: boolean, b: boolean) => boolean;
    not: (a: boolean) => boolean;
    xor: (a: boolean, b: boolean) => boolean;
  };
}

export const Primitives = {
  String: {
    concat: (a: string, b: string) => a + b,
    split: (s: string, delimiter: string) => s.split(delimiter),
    length: (s: string) => s.length,
    contains: (s: string, substring: string) => s.includes(substring),
    trim: (s: string) => s.trim(),
    upper: (s: string) => s.toUpperCase(),
    lower: (s: string) => s.toLowerCase(),
  },
  
  Int: {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b,
    divide: (a: number, b: number) => b === 0 ? new Error('Division by zero') : Math.floor(a / b),
    modulo: (a: number, b: number) => a % b,
    range: (start: number, end: number) => Array.from({ length: end - start }, (_, i) => start + i),
  },
  
  Float: {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b,
    divide: (a: number, b: number) => a / b,
    round: (n: number, precision: number) => Number(n.toFixed(precision)),
    floor: (n: number) => Math.floor(n),
    ceil: (n: number) => Math.ceil(n),
  },
  
  Bool: {
    and: (a: boolean, b: boolean) => a && b,
    or: (a: boolean, b: boolean) => a || b,
    not: (a: boolean) => !a,
    xor: (a: boolean, b: boolean) => a !== b,
  },
};
```

#### 2. Composite Types

```typescript
// src/stdlib/types/composites.ts

export interface ListType<T> {
  description: "Ordered collection";
  operations: {
    map: <U>(list: T[], fn: (item: T) => U) => U[];
    filter: (list: T[], predicate: (item: T) => boolean) => T[];
    reduce: <U>(list: T[], fn: (acc: U, item: T) => U, initial: U) => U;
    find: (list: T[], predicate: (item: T) => boolean) => T | undefined;
    includes: (list: T[], item: T) => boolean;
    length: (list: T[]) => number;
    push: (list: T[], item: T) => T[];
    pop: (list: T[]) => [T | undefined, T[]];
    first: (list: T[]) => T | undefined;
    last: (list: T[]) => T | undefined;
    sort: (list: T[], compare?: (a: T, b: T) => number) => T[];
    reverse: (list: T[]) => T[];
  };
}

export interface MapType<K, V> {
  description: "Key-value collection";
  operations: {
    get: (map: Map<K, V>, key: K) => V | undefined;
    set: (map: Map<K, V>, key: K, value: V) => Map<K, V>;
    has: (map: Map<K, V>, key: K) => boolean;
    delete: (map: Map<K, V>, key: K) => Map<K, V>;
    keys: (map: Map<K, V>) => K[];
    values: (map: Map<K, V>) => V[];
    entries: (map: Map<K, V>) => [K, V][];
    size: (map: Map<K, V>) => number;
  };
}

export interface SetType<T> {
  description: "Unique collection";
  operations: {
    add: (set: Set<T>, item: T) => Set<T>;
    has: (set: Set<T>, item: T) => boolean;
    delete: (set: Set<T>, item: T) => Set<T>;
    union: (a: Set<T>, b: Set<T>) => Set<T>;
    intersect: (a: Set<T>, b: Set<T>) => Set<T>;
    diff: (a: Set<T>, b: Set<T>) => Set<T>;
  };
}

export const Composites = {
  List: {
    map: <T, U>(list: T[], fn: (item: T) => U): U[] => list.map(fn),
    filter: <T>(list: T[], predicate: (item: T) => boolean): T[] => list.filter(predicate),
    reduce: <T, U>(list: T[], fn: (acc: U, item: T) => U, initial: U): U => list.reduce(fn, initial),
    find: <T>(list: T[], predicate: (item: T) => boolean): T | undefined => list.find(predicate),
    includes: <T>(list: T[], item: T): boolean => list.includes(item),
    length: <T>(list: T[]): number => list.length,
    push: <T>(list: T[], item: T): T[] => [...list, item],
    pop: <T>(list: T[]): [T | undefined, T[]] => [list[list.length - 1], list.slice(0, -1)],
    first: <T>(list: T[]): T | undefined => list[0],
    last: <T>(list: T[]): T | undefined => list[list.length - 1],
    sort: <T>(list: T[], compare?: (a: T, b: T) => number): T[] => [...list].sort(compare),
    reverse: <T>(list: T[]): T[] => [...list].reverse(),
  },
  
  Map: {
    get: <K, V>(map: Map<K, V>, key: K): V | undefined => map.get(key),
    set: <K, V>(map: Map<K, V>, key: K, value: V): Map<K, V> => new Map(map).set(key, value),
    has: <K, V>(map: Map<K, V>, key: K): boolean => map.has(key),
    delete: <K, V>(map: Map<K, V>, key: K): Map<K, V> => {
      const newMap = new Map(map);
      newMap.delete(key);
      return newMap;
    },
    keys: <K, V>(map: Map<K, V>): K[] => Array.from(map.keys()),
    values: <K, V>(map: Map<K, V>): V[] => Array.from(map.values()),
    entries: <K, V>(map: Map<K, V>): [K, V][] => Array.from(map.entries()),
    size: <K, V>(map: Map<K, V>): number => map.size,
  },
  
  Set: {
    add: <T>(set: Set<T>, item: T): Set<T> => new Set(set).add(item),
    has: <T>(set: Set<T>, item: T): boolean => set.has(item),
    delete: <T>(set: Set<T>, item: T): Set<T> => {
      const newSet = new Set(set);
      newSet.delete(item);
      return newSet;
    },
    union: <T>(a: Set<T>, b: Set<T>): Set<T> => new Set([...a, ...b]),
    intersect: <T>(a: Set<T>, b: Set<T>): Set<T> => new Set([...a].filter(x => b.has(x))),
    diff: <T>(a: Set<T>, b: Set<T>): Set<T> => new Set([...a].filter(x => !b.has(x))),
  },
};
```

#### 3. Result Types

```typescript
// src/stdlib/types/results.ts

export type Option<T> = { kind: 'Some'; value: T } | { kind: 'None' };

export type Result<T, E = Error> = { kind: 'Ok'; value: T } | { kind: 'Err'; error: E };

export const Option = {
  Some: <T>(value: T): Option<T> => ({ kind: 'Some', value }),
  None: (): Option<never> => ({ kind: 'None' }),
  
  map: <T, U>(opt: Option<T>, fn: (v: T) => U): Option<U> =>
    opt.kind === 'Some' ? { kind: 'Some', value: fn(opt.value) } : { kind: 'None' },
  
  flatMap: <T, U>(opt: Option<T>, fn: (v: T) => Option<U>): Option<U> =>
    opt.kind === 'Some' ? fn(opt.value) : { kind: 'None' },
  
  unwrap: <T>(opt: Option<T>): T => {
    if (opt.kind === 'None') throw new Error('Called unwrap on None');
    return opt.value;
  },
  
  unwrapOr: <T>(opt: Option<T>, defaultValue: T): T =>
    opt.kind === 'Some' ? opt.value : defaultValue,
  
  isSome: <T>(opt: Option<T>): opt is { kind: 'Some'; value: T } => opt.kind === 'Some',
  isNone: <T>(opt: Option<T>): opt is { kind: 'None' } => opt.kind === 'None',
};

export const Result = {
  Ok: <T, E = Error>(value: T): Result<T, E> => ({ kind: 'Ok', value }),
  Err: <T, E = Error>(error: E): Result<T, E> => ({ kind: 'Err', error }),
  
  map: <T, U, E>(result: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
    result.kind === 'Ok' ? { kind: 'Ok', value: fn(result.value) } : result,
  
  mapErr: <T, E, F>(result: Result<T, E>, fn: (e: E) => F): Result<T, F> =>
    result.kind === 'Err' ? { kind: 'Err', error: fn(result.error) } : result as Result<T, F>,
  
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.kind === 'Err') throw result.error;
    return result.value;
  },
  
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T =>
    result.kind === 'Ok' ? result.value : defaultValue,
  
  isOk: <T, E>(result: Result<T, E>): result is { kind: 'Ok'; value: T } => result.kind === 'Ok',
  isErr: <T, E>(result: Result<T, E>): result is { kind: 'Err'; error: E } => result.kind === 'Err',
};
```

#### 4. Common Types

```typescript
// src/stdlib/types/common.ts

export type UUID = string & { readonly __brand: unique symbol };
export type DateTime = string & { readonly __brand: unique symbol };
export type Duration = { ms: number };

export const UUID = {
  generate: (): UUID => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }) as UUID;
  },
  
  parse: (s: string): UUID | Error => {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return pattern.test(s) ? s as UUID : new Error('Invalid UUID format');
  },
  
  validate: (s: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  },
};

export const DateTime = {
  now: (): DateTime => new Date().toISOString() as DateTime,
  
  parse: (s: string): DateTime | Error => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Error('Invalid date format') : d.toISOString() as DateTime;
  },
  
  format: (dt: DateTime, pattern: string): string => {
    const d = new Date(dt);
    return pattern
      .replace('YYYY', d.getFullYear().toString())
      .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', d.getDate().toString().padStart(2, '0'))
      .replace('HH', d.getHours().toString().padStart(2, '0'))
      .replace('mm', d.getMinutes().toString().padStart(2, '0'))
      .replace('ss', d.getSeconds().toString().padStart(2, '0'));
  },
  
  add: (dt: DateTime, duration: Duration): DateTime => {
    const d = new Date(dt);
    return new Date(d.getTime() + duration.ms).toISOString() as DateTime;
  },
  
  diff: (a: DateTime, b: DateTime): Duration => ({
    ms: new Date(a).getTime() - new Date(b).getTime()
  }),
  
  isBefore: (a: DateTime, b: DateTime): boolean => new Date(a) < new Date(b),
  isAfter: (a: DateTime, b: DateTime): boolean => new Date(a) > new Date(b),
};

export const Duration = {
  fromMs: (ms: number): Duration => ({ ms }),
  fromSeconds: (s: number): Duration => ({ ms: s * 1000 }),
  fromMinutes: (m: number): Duration => ({ ms: m * 60 * 1000 }),
  fromHours: (h: number): Duration => ({ ms: h * 60 * 60 * 1000 }),
  fromDays: (d: number): Duration => ({ ms: d * 24 * 60 * 60 * 1000 }),
  toMs: (d: Duration): number => d.ms,
  add: (a: Duration, b: Duration): Duration => ({ ms: a.ms + b.ms }),
};
```

#### 5. Type Predicates

```typescript
// src/stdlib/types/predicates.ts

export const isString = (x: unknown): x is string => typeof x === 'string';
export const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);
export const isFloat = (x: unknown): x is number => typeof x === 'number' && !Number.isNaN(x);
export const isBool = (x: unknown): x is boolean => typeof x === 'boolean';
export const isList = (x: unknown): x is unknown[] => Array.isArray(x);
export const isMap = (x: unknown): x is Map<unknown, unknown> => x instanceof Map;
export const isSet = (x: unknown): x is Set<unknown> => x instanceof Set;
export const isNull = (x: unknown): x is null => x === null;
export const isUndefined = (x: unknown): x is undefined => x === undefined;
export const isFunction = (x: unknown): x is Function => typeof x === 'function';
export const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
```

### Type Exports

```typescript
// src/stdlib/types/index.ts

export * from './primitives';
export * from './composites';
export * from './results';
export * from './common';
export * from './predicates';

export type SpecLangType = 
  | 'String' | 'Int' | 'Float' | 'Bool'
  | 'List' | 'Map' | 'Set'
  | 'Option' | 'Result'
  | 'UUID' | 'DateTime' | 'Duration';

export const TypeRegistry = {
  String: { operations: ['concat', 'split', 'length', 'contains', 'trim', 'upper', 'lower'] },
  Int: { operations: ['add', 'subtract', 'multiply', 'divide', 'modulo', 'range'] },
  Float: { operations: ['add', 'subtract', 'multiply', 'divide', 'round', 'floor', 'ceil'] },
  Bool: { operations: ['and', 'or', 'not', 'xor'] },
  List: { operations: ['map', 'filter', 'reduce', 'find', 'includes', 'length', 'push', 'pop', 'first', 'last', 'sort', 'reverse'] },
  Map: { operations: ['get', 'set', 'has', 'delete', 'keys', 'values', 'entries', 'size'] },
  Set: { operations: ['add', 'has', 'delete', 'union', 'intersect', 'diff'] },
  Option: { operations: ['map', 'flatMap', 'unwrap', 'unwrapOr', 'isSome', 'isNone'] },
  Result: { operations: ['map', 'mapErr', 'unwrap', 'unwrapOr', 'isOk', 'isErr'] },
  UUID: { operations: ['generate', 'parse', 'validate'] },
  DateTime: { operations: ['now', 'parse', 'format', 'add', 'diff', 'isBefore', 'isAfter'] },
  Duration: { operations: ['fromMs', 'fromSeconds', 'toMs', 'add'] },
};
```

## Test Cases
1. Primitive operations work correctly
2. List operations are immutable (return new arrays)
3. Map/Set operations preserve immutability
4. Option Some/None handling
5. Result Ok/Err handling
6. UUID generation and validation
7. DateTime formatting and arithmetic
8. Duration conversions
9. Type predicates work correctly
10. All types available without import

## Validation
```bash
bun test tests/stdlib/types.test.ts
npx tsc --noEmit src/stdlib/types/
```

## Output Format
After completing, output:
1. Primitive types implemented
2. Composite types implemented
3. Result types implemented
4. Common types implemented
5. Type predicates implemented
6. Test results
