# Bootstrap Phase 0.10: Standard Library

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.10 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.9 complete
- Core types defined
- Parser and indexer working

## Your Task
Implement the SpecLang standard library with built-in types, functions, and assertions. These are available to all specs without import.

## Read These Specs First
1. `specs/stdlib.spec.md` - Standard library overview
2. `specs/stdlib.spec.dir/types.spec.md` - Type definitions
3. `specs/stdlib.spec.dir/mapping.spec.md` - Functions and assertions

## What to Build

### Files to Create
```
src/stdlib/
├── index.ts              # Main exports
├── types.ts              # Built-in type definitions
├── primitives.ts         # Primitive types
├── composites.ts         # Composite types
├── results.ts            # Result types
├── functions.ts          # Built-in functions
├── assertions.ts         # Assertion functions
├── validators.ts         # Validation helpers
└── mapping.ts            # Type mappings

specs/stdlib.spec.dir/
├── types.spec.md         # Types spec
└── mapping.spec.md       # Mapping spec
```

### Requirements

#### 1. Primitive Types

```typescript
// src/stdlib/primitives.ts

export type SpecLangString = string;
export type SpecLangNumber = number;
export type SpecLangBoolean = boolean;
export type SpecLangNull = null;
export type SpecLangVoid = void;

export type UUID = string & { __brand: 'UUID' };
export type DateTime = string & { __brand: 'DateTime' };
export type Email = string & { __brand: 'Email' };
export type URL = string & { __brand: 'URL' };
export type Path = string & { __brand: 'Path' };

export const Primitives = {
  String: {
    validate: (value: unknown): value is string => typeof value === 'string',
    default: '',
    examples: ['hello', 'world']
  },
  
  Number: {
    validate: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
    default: 0,
    examples: [0, 1, 3.14, -42]
  },
  
  Boolean: {
    validate: (value: unknown): value is boolean => typeof value === 'boolean',
    default: false,
    examples: [true, false]
  },
  
  UUID: {
    validate: (value: unknown): value is UUID => {
      if (typeof value !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    },
    generate: (): UUID => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      }) as UUID;
    },
    default: '00000000-0000-0000-0000-000000000000' as UUID
  },
  
  DateTime: {
    validate: (value: unknown): value is DateTime => {
      if (typeof value !== 'string') return false;
      return !isNaN(Date.parse(value));
    },
    now: (): DateTime => new Date().toISOString() as DateTime,
    default: '1970-01-01T00:00:00.000Z' as DateTime
  },
  
  Email: {
    validate: (value: unknown): value is Email => {
      if (typeof value !== 'string') return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    default: '' as Email
  },
  
  URL: {
    validate: (value: unknown): value is URL => {
      if (typeof value !== 'string') return false;
      try {
        new globalThis.URL(value);
        return true;
      } catch {
        return false;
      }
    },
    default: '' as URL
  },
  
  Path: {
    validate: (value: unknown): value is Path => {
      if (typeof value !== 'string') return false;
      // Basic path validation
      return value.length > 0 && !value.includes('\0');
    },
    default: '' as Path
  }
};
```

#### 2. Composite Types

```typescript
// src/stdlib/composites.ts

export type List<T> = T[];
export type Map<K extends string, V> = Record<K, V>;
export type Set<T> = T[];
export type Optional<T> = T | null;
export type OneOf<T extends readonly unknown[]> = T[number];

export const Composites = {
  List: {
    of: <T>(itemType: TypeValidator<T>): TypeValidator<T[]> => ({
      validate: (value: unknown): value is T[] => {
        if (!Array.isArray(value)) return false;
        return value.every(item => itemType.validate(item));
      },
      default: []
    }),
    
    map: <T, U>(list: T[], fn: (item: T, index: number) => U): U[] => 
      list.map(fn),
    
    filter: <T>(list: T[], predicate: (item: T) => boolean): T[] =>
      list.filter(predicate),
    
    reduce: <T, U>(list: T[], fn: (acc: U, item: T) => U, initial: U): U =>
      list.reduce(fn, initial),
    
    find: <T>(list: T[], predicate: (item: T) => boolean): T | undefined =>
      list.find(predicate),
    
    some: <T>(list: T[], predicate: (item: T) => boolean): boolean =>
      list.some(predicate),
    
    every: <T>(list: T[], predicate: (item: T) => boolean): boolean =>
      list.every(predicate),
    
    first: <T>(list: T[]): T | undefined => list[0],
    last: <T>(list: T[]): T | undefined => list[list.length - 1],
    length: <T>(list: T[]): number => list.length,
    isEmpty: <T>(list: T[]): boolean => list.length === 0
  },
  
  Map: {
    of: <K extends string, V>(valueType: TypeValidator<V>): TypeValidator<Record<K, V>> => ({
      validate: (value: unknown): value is Record<K, V> => {
        if (typeof value !== 'object' || value === null) return false;
        return Object.values(value).every(v => valueType.validate(v));
      },
      default: {}
    }),
    
    get: <K extends string, V>(map: Record<K, V>, key: K): V | undefined =>
      map[key],
    
    set: <K extends string, V>(map: Record<K, V>, key: K, value: V): Record<K, V> =>
      ({ ...map, [key]: value }),
    
    has: <K extends string, V>(map: Record<K, V>, key: string): key is K =>
      key in map,
    
    keys: <K extends string, V>(map: Record<K, V>): string[] =>
      Object.keys(map),
    
    values: <K extends string, V>(map: Record<K, V>): V[] =>
      Object.values(map),
    
    entries: <K extends string, V>(map: Record<K, V>): [string, V][] =>
      Object.entries(map)
  },
  
  Optional: {
    of: <T>(value: T | null | undefined): T | null =>
      value ?? null,
    
    isPresent: <T>(value: T | null): value is T =>
      value !== null,
    
    isEmpty: <T>(value: T | null): value is null =>
      value === null,
    
    map: <T, U>(value: T | null, fn: (v: T) => U): U | null =>
      value === null ? null : fn(value),
    
    orElse: <T>(value: T | null, defaultValue: T): T =>
      value ?? defaultValue,
    
    orElseGet: <T>(value: T | null, supplier: () => T): T =>
      value ?? supplier()
  },
  
  OneOf: {
    validate: <T extends readonly unknown[]>(options: T) => 
      (value: unknown): value is T[number] =>
        (options as readonly unknown[]).includes(value)
  }
};
```

#### 3. Result Types

```typescript
// src/stdlib/results.ts

export type Success<T> = {
  ok: true;
  value: T;
};

export type Failure<E = Error> = {
  ok: false;
  error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;

export const Results = {
  success: <T>(value: T): Success<T> => ({
    ok: true,
    value
  }),
  
  failure: <E = Error>(error: E): Failure<E> => ({
    ok: false,
    error
  }),
  
  fromTry: <T>(fn: () => T): Result<T, Error> => {
    try {
      return Results.success(fn());
    } catch (e) {
      return Results.failure(e instanceof Error ? e : new Error(String(e)));
    }
  },
  
  fromPromise: async <T>(promise: Promise<T>): Promise<Result<T, Error>> => {
    try {
      const value = await promise;
      return Results.success(value);
    } catch (e) {
      return Results.failure(e instanceof Error ? e : new Error(String(e)));
    }
  },
  
  isOk: <T, E>(result: Result<T, E>): result is Success<T> =>
    result.ok === true,
  
  isError: <T, E>(result: Result<T, E>): result is Failure<E> =>
    result.ok === false,
  
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
    result.ok ? Results.success(fn(result.value)) : result,
  
  mapError: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
    result.ok ? result : Results.failure(fn(result.error)),
  
  flatMap: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> =>
    result.ok ? fn(result.value) : result,
  
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.ok) return result.value;
    throw result.error;
  },
  
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T =>
    result.ok ? result.value : defaultValue,
  
  unwrapOrElse: <T, E>(result: Result<T, E>, fn: (error: E) => T): T =>
    result.ok ? result.value : fn(result.error)
};
```

#### 4. Built-in Functions

```typescript
// src/stdlib/functions.ts

export const Functions = {
  String: {
    length: (s: string): number => s.length,
    concat: (...strings: string[]): string => strings.join(''),
    split: (s: string, separator: string): string[] => s.split(separator),
    join: (strings: string[], separator: string): string => strings.join(separator),
    trim: (s: string): string => s.trim(),
    toUpperCase: (s: string): string => s.toUpperCase(),
    toLowerCase: (s: string): string => s.toLowerCase(),
    startsWith: (s: string, prefix: string): boolean => s.startsWith(prefix),
    endsWith: (s: string, suffix: string): boolean => s.endsWith(suffix),
    contains: (s: string, substring: string): boolean => s.includes(substring),
    replace: (s: string, search: string, replace: string): string => 
      s.replace(search, replace),
    replaceAll: (s: string, search: string, replace: string): string =>
      s.replaceAll(search, replace),
    substring: (s: string, start: number, end?: number): string =>
      s.substring(start, end),
    repeat: (s: string, count: number): string => s.repeat(count),
    padStart: (s: string, length: number, pad: string): string =>
      s.padStart(length, pad),
    padEnd: (s: string, length: number, pad: string): string =>
      s.padEnd(length, pad)
  },
  
  Number: {
    add: (a: number, b: number): number => a + b,
    subtract: (a: number, b: number): number => a - b,
    multiply: (a: number, b: number): number => a * b,
    divide: (a: number, b: number): number => a / b,
    modulo: (a: number, b: number): number => a % b,
    power: (base: number, exp: number): number => Math.pow(base, exp),
    sqrt: (n: number): number => Math.sqrt(n),
    abs: (n: number): number => Math.abs(n),
    floor: (n: number): number => Math.floor(n),
    ceil: (n: number): number => Math.ceil(n),
    round: (n: number): number => Math.round(n),
    min: (...nums: number[]): number => Math.min(...nums),
    max: (...nums: number[]): number => Math.max(...nums),
    clamp: (n: number, min: number, max: number): number =>
      Math.min(Math.max(n, min), max),
    range: (start: number, end: number, step: number = 1): number[] => {
      const result: number[] = [];
      for (let i = start; i < end; i += step) {
        result.push(i);
      }
      return result;
    },
    isInteger: (n: number): boolean => Number.isInteger(n),
    isFinite: (n: number): boolean => Number.isFinite(n),
    isNaN: (n: number): boolean => Number.isNaN(n)
  },
  
  DateTime: {
    now: (): DateTime => new Date().toISOString() as DateTime,
    parse: (s: string): Date => new Date(s),
    format: (d: Date | DateTime, format: string): string => {
      const date = d instanceof Date ? d : new Date(d);
      // Simple formatting
      return date.toISOString();
    },
    addDays: (d: DateTime, days: number): DateTime => {
      const date = new Date(d);
      date.setDate(date.getDate() + days);
      return date.toISOString() as DateTime;
    },
    addHours: (d: DateTime, hours: number): DateTime => {
      const date = new Date(d);
      date.setHours(date.getHours() + hours);
      return date.toISOString() as DateTime;
    },
    diff: (d1: DateTime, d2: DateTime): number =>
      new Date(d1).getTime() - new Date(d2).getTime(),
    isBefore: (d1: DateTime, d2: DateTime): boolean =>
      new Date(d1) < new Date(d2),
    isAfter: (d1: DateTime, d2: DateTime): boolean =>
      new Date(d1) > new Date(d2)
  },
  
  UUID: {
    generate: (): UUID => Primitives.UUID.generate(),
    nil: '00000000-0000-0000-0000-000000000000' as UUID,
    isValid: (s: string): s is UUID => Primitives.UUID.validate(s)
  },
  
  Type: {
    typeof: (value: unknown): string => typeof value,
    isArray: (value: unknown): value is unknown[] => Array.isArray(value),
    isObject: (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null && !Array.isArray(value),
    isString: (value: unknown): value is string => typeof value === 'string',
    isNumber: (value: unknown): value is number => typeof value === 'number',
    isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
    isNull: (value: unknown): value is null => value === null,
    isUndefined: (value: unknown): value is undefined => value === undefined,
    isFunction: (value: unknown): value is Function => typeof value === 'function'
  },
  
  Debug: {
    log: (...args: unknown[]): void => console.log(...args),
    warn: (...args: unknown[]): void => console.warn(...args),
    error: (...args: unknown[]): void => console.error(...args),
    inspect: (value: unknown): string => JSON.stringify(value, null, 2),
    time: (label: string): void => console.time(label),
    timeEnd: (label: string): void => console.timeEnd(label)
  }
};
```

#### 5. Assertions

```typescript
// src/stdlib/assertions.ts

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export const Assert = {
  equal: <T>(actual: T, expected: T, message?: string): void => {
    if (actual !== expected) {
      throw new AssertionError(
        message || `Expected ${expected}, got ${actual}`
      );
    }
  },
  
  notEqual: <T>(actual: T, expected: T, message?: string): void => {
    if (actual === expected) {
      throw new AssertionError(
        message || `Expected value not equal to ${expected}`
      );
    }
  },
  
  deepEqual: <T>(actual: T, expected: T, message?: string): void => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new AssertionError(
        message || `Deep equality failed`
      );
    }
  },
  
  true: (value: boolean, message?: string): void => {
    if (!value) {
      throw new AssertionError(message || 'Expected true');
    }
  },
  
  false: (value: boolean, message?: string): void => {
    if (value) {
      throw new AssertionError(message || 'Expected false');
    }
  },
  
  truthy: (value: unknown, message?: string): void => {
    if (!value) {
      throw new AssertionError(message || 'Expected truthy value');
    }
  },
  
  falsy: (value: unknown, message?: string): void => {
    if (value) {
      throw new AssertionError(message || 'Expected falsy value');
    }
  },
  
  null: (value: unknown, message?: string): void => {
    if (value !== null) {
      throw new AssertionError(message || 'Expected null');
    }
  },
  
  notNull: (value: unknown, message?: string): void => {
    if (value === null) {
      throw new AssertionError(message || 'Expected not null');
    }
  },
  
  undefined: (value: unknown, message?: string): void => {
    if (value !== undefined) {
      throw new AssertionError(message || 'Expected undefined');
    }
  },
  
  defined: (value: unknown, message?: string): void => {
    if (value === undefined) {
      throw new AssertionError(message || 'Expected defined value');
    }
  },
  
  throws: (fn: () => void, message?: string): void => {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) {
      throw new AssertionError(message || 'Expected function to throw');
    }
  },
  
  instanceOf: <T>(value: unknown, type: new (...args: unknown[]) => T, message?: string): void => {
    if (!(value instanceof type)) {
      throw new AssertionError(
        message || `Expected instance of ${type.name}`
      );
    }
  },
  
  type: <T>(value: unknown, typeName: string, message?: string): void => {
    if (typeof value !== typeName) {
      throw new AssertionError(
        message || `Expected type ${typeName}, got ${typeof value}`
      );
    }
  },
  
  array: (value: unknown, message?: string): void => {
    if (!Array.isArray(value)) {
      throw new AssertionError(message || 'Expected array');
    }
  },
  
  object: (value: unknown, message?: string): void => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new AssertionError(message || 'Expected object');
    }
  },
  
  string: (value: unknown, message?: string): void => {
    if (typeof value !== 'string') {
      throw new AssertionError(message || 'Expected string');
    }
  },
  
  number: (value: unknown, message?: string): void => {
    if (typeof value !== 'number') {
      throw new AssertionError(message || 'Expected number');
    }
  },
  
  greaterThan: (actual: number, expected: number, message?: string): void => {
    if (actual <= expected) {
      throw new AssertionError(
        message || `Expected ${actual} > ${expected}`
      );
    }
  },
  
  lessThan: (actual: number, expected: number, message?: string): void => {
    if (actual >= expected) {
      throw new AssertionError(
        message || `Expected ${actual} < ${expected}`
      );
    }
  },
  
  inRange: (value: number, min: number, max: number, message?: string): void => {
    if (value < min || value > max) {
      throw new AssertionError(
        message || `Expected ${value} in range [${min}, ${max}]`
      );
    }
  },
  
  contains: (container: string | unknown[], item: unknown, message?: string): void => {
    if (!container.includes(item as never)) {
      throw new AssertionError(message || 'Expected container to contain item');
    }
  },
  
  matches: (value: string, pattern: RegExp, message?: string): void => {
    if (!pattern.test(value)) {
      throw new AssertionError(
        message || `Expected "${value}" to match ${pattern}`
      );
    }
  },
  
  length: (value: { length: number }, expected: number, message?: string): void => {
    if (value.length !== expected) {
      throw new AssertionError(
        message || `Expected length ${expected}, got ${value.length}`
      );
    }
  },
  
  isEmpty: (value: { length: number } | object, message?: string): void => {
    const empty = 'length' in value ? value.length === 0 : Object.keys(value).length === 0;
    if (!empty) {
      throw new AssertionError(message || 'Expected empty value');
    }
  },
  
  isNotEmpty: (value: { length: number } | object, message?: string): void => {
    const empty = 'length' in value ? value.length === 0 : Object.keys(value).length === 0;
    if (empty) {
      throw new AssertionError(message || 'Expected non-empty value');
    }
  },
  
  fail: (message: string = 'Assertion failed'): never => {
    throw new AssertionError(message);
  }
};
```

#### 6. Type Mappings

```typescript
// src/stdlib/mapping.ts

export const TypeMappings = {
  SpecLang: {
    toTypeScript: (specType: string): string => {
      const map: Record<string, string> = {
        'String': 'string',
        'Number': 'number',
        'Boolean': 'boolean',
        'UUID': 'string',
        'DateTime': 'string',
        'Email': 'string',
        'URL': 'string',
        'Path': 'string',
        'Void': 'void',
        'Null': 'null'
      };
      
      // Handle generic types
      if (specType.startsWith('List<')) {
        const inner = specType.slice(5, -1);
        return `${TypeMappings.SpecLang.toTypeScript(inner)}[]`;
      }
      
      if (specType.startsWith('Map<')) {
        const [key, value] = specType.slice(4, -1).split(', ');
        return `Record<${TypeMappings.SpecLang.toTypeScript(key)}, ${TypeMappings.SpecLang.toTypeScript(value)}>`;
      }
      
      if (specType.startsWith('Optional<')) {
        const inner = specType.slice(9, -1);
        return `${TypeMappings.SpecLang.toTypeScript(inner)} | null`;
      }
      
      if (specType.startsWith('Result<')) {
        const inner = specType.slice(7, -1);
        const [value, error] = inner.split(', ');
        return `Result<${TypeMappings.SpecLang.toTypeScript(value)}, ${TypeMappings.SpecLang.toTypeScript(error || 'Error')}>`;
      }
      
      return map[specType] || specType;
    },
    
    toGo: (specType: string): string => {
      const map: Record<string, string> = {
        'String': 'string',
        'Number': 'float64',
        'Boolean': 'bool',
        'UUID': 'string',
        'DateTime': 'time.Time',
        'Email': 'string',
        'URL': 'string',
        'Path': 'string',
        'Void': '',
        'Null': 'nil'
      };
      
      if (specType.startsWith('List<')) {
        const inner = specType.slice(5, -1);
        return `[]${TypeMappings.SpecLang.toGo(inner)}`;
      }
      
      if (specType.startsWith('Map<')) {
        const [key, value] = specType.slice(4, -1).split(', ');
        return `map[${TypeMappings.SpecLang.toGo(key)}]${TypeMappings.SpecLang.toGo(value)}`;
      }
      
      if (specType.startsWith('Optional<')) {
        const inner = specType.slice(9, -1);
        return `*${TypeMappings.SpecLang.toGo(inner)}`;
      }
      
      return map[specType] || specType;
    },
    
    toPython: (specType: string): string => {
      const map: Record<string, string> = {
        'String': 'str',
        'Number': 'float',
        'Boolean': 'bool',
        'UUID': 'str',
        'DateTime': 'datetime',
        'Email': 'str',
        'URL': 'str',
        'Path': 'str',
        'Void': 'None',
        'Null': 'None'
      };
      
      if (specType.startsWith('List<')) {
        const inner = specType.slice(5, -1);
        return `list[${TypeMappings.SpecLang.toPython(inner)}]`;
      }
      
      if (specType.startsWith('Map<')) {
        const [key, value] = specType.slice(4, -1).split(', ');
        return `dict[${TypeMappings.SpecLang.toPython(key)}, ${TypeMappings.SpecLang.toPython(value)}]`;
      }
      
      if (specType.startsWith('Optional<')) {
        const inner = specType.slice(9, -1);
        return `${TypeMappings.SpecLang.toPython(inner)} | None`;
      }
      
      return map[specType] || specType;
    },
    
    toRust: (specType: string): string => {
      const map: Record<string, string> = {
        'String': 'String',
        'Number': 'f64',
        'Boolean': 'bool',
        'UUID': 'uuid::Uuid',
        'DateTime': 'chrono::DateTime<chrono::Utc>',
        'Email': 'String',
        'URL': 'String',
        'Path': 'std::path::PathBuf',
        'Void': '()',
        'Null': '()'
      };
      
      if (specType.startsWith('List<')) {
        const inner = specType.slice(5, -1);
        return `Vec<${TypeMappings.SpecLang.toRust(inner)}>`;
      }
      
      if (specType.startsWith('Map<')) {
        const [key, value] = specType.slice(4, -1).split(', ');
        return `HashMap<${TypeMappings.SpecLang.toRust(key)}, ${TypeMappings.SpecLang.toRust(value)}>`;
      }
      
      if (specType.startsWith('Optional<')) {
        const inner = specType.slice(9, -1);
        return `Option<${TypeMappings.SpecLang.toRust(inner)}>`;
      }
      
      if (specType.startsWith('Result<')) {
        const inner = specType.slice(7, -1);
        const [value, error] = inner.split(', ');
        return `Result<${TypeMappings.SpecLang.toRust(value)}, ${TypeMappings.SpecLang.toRust(error || 'Error')}>`;
      }
      
      return map[specType] || specType;
    }
  }
};
```

### Standard Library Exports

```typescript
// src/stdlib/index.ts

export * from './types';
export * from './primitives';
export * from './composites';
export * from './results';
export * from './functions';
export * from './assertions';
export * from './mapping';

export const STDLIB = {
  ...Primitives,
  ...Composites,
  ...Results,
  ...Functions,
  ...Assert,
  ...TypeMappings
};
```

## Test Cases
1. Primitive type validation works
2. UUID generation and validation
3. DateTime operations
4. List operations (map, filter, reduce)
5. Map operations (get, set, has)
6. Optional handling
7. Result success/failure paths
8. Assertions throw correctly
9. Type mappings generate correct output
10. All functions have correct types

## Validation
```bash
# Test stdlib
bun test tests/stdlib.test.ts

# Type check
npx tsc --noEmit src/stdlib/

# Run validation
python3 scripts/validate_refs.py
```

## Output Format
After completing, output:
1. Primitive types implemented
2. Composite types implemented
3. Result types implemented
4. Built-in functions implemented
5. Assertions implemented
6. Type mappings implemented
7. Test results
