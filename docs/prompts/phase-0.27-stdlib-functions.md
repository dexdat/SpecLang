# Bootstrap Phase 0.27: Standard Library Functions

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.27 of the bootstrap process.

**Prerequisites**: 
- Phase 0.26 (Standard Library Types) complete
- All primitive and composite types defined

## Your Task
Implement the SpecLang standard library functions, utilities, and assertions. These are available to all specs without import.

## Read These Specs First
1. `specs/stdlib.spec.dir/mapping.spec.md` - Functions and assertions
2. `specs/stdlib.spec.md` - Standard library overview
3. `specs/stdlib.spec.dir/types.spec.md` - Type references

## What to Build

### Files to Create
```
src/stdlib/
├── functions/
│   ├── index.ts           # Function exports
│   ├── core.ts            # identity, compose, pipe, curry
│   ├── string.ts          # String utilities
│   ├── math.ts            # Math utilities
│   ├── collection.ts      # Collection utilities
│   └── debug.ts           # Debug utilities

├── assertions/
│   ├── index.ts           # Assertion exports
│   ├── core.ts            # assert, assertEquals
│   ├── type.ts            # Type assertions
│   └── comparison.ts      # Comparison assertions

tests/stdlib/
└── functions.test.ts
```

### Requirements

#### 1. Core Functions

```typescript
// src/stdlib/functions/core.ts

export const identity = <T>(x: T): T => x;

export const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => 
  (a: A): C => f(g(a));

export const pipe = <T>(value: T, ...fns: Array<(v: T) => T>): T =>
  fns.reduce((v, f) => f(v), value);

export const curry = <T extends (...args: any[]) => any>(fn: T) => {
  const curried = (...args: any[]): any => {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...more: any[]) => curried(...args, ...more);
  };
  return curried;
};

export const partial = <T extends (...args: any[]) => any>(
  fn: T,
  ...presetArgs: Partial<Parameters<T>>
) => (...laterArgs: any[]): ReturnType<T> => fn(...presetArgs, ...laterArgs);

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
};

export const once = <T extends (...args: any[]) => any>(fn: T): T => {
  let called = false;
  let result: ReturnType<T>;
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as T;
};
```

#### 2. String Functions

```typescript
// src/stdlib/functions/string.ts

export const StringUtils = {
  capitalize: (s: string): string => 
    s.charAt(0).toUpperCase() + s.slice(1),
  
  camelCase: (s: string): string =>
    s.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : ''),
  
  snakeCase: (s: string): string =>
    s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
     .replace(/[-\s]+/g, '_')
     .replace(/^_/, ''),
  
  kebabCase: (s: string): string =>
    s.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
     .replace(/[_\s]+/g, '-')
     .replace(/^-/, ''),
  
  truncate: (s: string, length: number, suffix = '...'): string =>
    s.length <= length ? s : s.slice(0, length - suffix.length) + suffix,
  
  words: (s: string): string[] =>
    s.match(/\b\w+\b/g) || [],
  
  template: (s: string, values: Record<string, unknown>): string =>
    s.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? '')),
  
  isBlank: (s: string): boolean =>
    s.trim().length === 0,
  
  isNotBlank: (s: string): boolean =>
    s.trim().length > 0,
  
  reverse: (s: string): string =>
    [...s].reverse().join(''),
  
  count: (s: string, substring: string): number => {
    let count = 0;
    let pos = s.indexOf(substring);
    while (pos !== -1) {
      count++;
      pos = s.indexOf(substring, pos + 1);
    }
    return count;
  },
  
  escapeHtml: (s: string): string =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'),
  
  unescapeHtml: (s: string): string =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
};
```

#### 3. Math Functions

```typescript
// src/stdlib/functions/math.ts

export const MathUtils = {
  sum: (numbers: number[]): number =>
    numbers.reduce((a, b) => a + b, 0),
  
  product: (numbers: number[]): number =>
    numbers.reduce((a, b) => a * b, 1),
  
  mean: (numbers: number[]): number =>
    numbers.length === 0 ? 0 : MathUtils.sum(numbers) / numbers.length,
  
  median: (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  
  mode: (numbers: number[]): number[] => {
    const counts = new Map<number, number>();
    numbers.forEach(n => counts.set(n, (counts.get(n) || 0) + 1));
    const maxCount = Math.max(...counts.values());
    return [...counts.entries()]
      .filter(([_, count]) => count === maxCount)
      .map(([n]) => n);
  },
  
  variance: (numbers: number[]): number => {
    const avg = MathUtils.mean(numbers);
    return numbers.reduce((sum, n) => sum + (n - avg) ** 2, 0) / numbers.length;
  },
  
  stdDev: (numbers: number[]): number =>
    Math.sqrt(MathUtils.variance(numbers)),
  
  clamp: (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max),
  
  lerp: (a: number, b: number, t: number): number =>
    a + (b - a) * t,
  
  mapRange: (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number =>
    ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin,
  
  isPrime: (n: number): boolean => {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  },
  
  gcd: (a: number, b: number): number =>
    b === 0 ? a : MathUtils.gcd(b, a % b),
  
  lcm: (a: number, b: number): number =>
    Math.abs(a * b) / MathUtils.gcd(a, b),
  
  fibonacci: (n: number): number => {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  },
  
  factorial: (n: number): number => {
    if (n < 0) return NaN;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  },
};
```

#### 4. Collection Functions

```typescript
// src/stdlib/functions/collection.ts

export const CollectionUtils = {
  first: <T>(arr: T[]): T | undefined => arr[0],
  
  last: <T>(arr: T[]): T | undefined => arr[arr.length - 1],
  
  nth: <T>(arr: T[], n: number): T | undefined =>
    n >= 0 ? arr[n] : arr[arr.length + n],
  
  take: <T>(arr: T[], n: number): T[] => arr.slice(0, n),
  
  takeWhile: <T>(arr: T[], predicate: (x: T) => boolean): T[] => {
    const result: T[] = [];
    for (const item of arr) {
      if (!predicate(item)) break;
      result.push(item);
    }
    return result;
  },
  
  drop: <T>(arr: T[], n: number): T[] => arr.slice(n),
  
  dropWhile: <T>(arr: T[], predicate: (x: T) => boolean): T[] => {
    let i = 0;
    while (i < arr.length && predicate(arr[i])) i++;
    return arr.slice(i);
  },
  
  chunk: <T>(arr: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  },
  
  flatten: <T>(arr: (T | T[])[]): T[] =>
    arr.reduce<T[]>((acc, val) => 
      acc.concat(Array.isArray(val) ? val : [val]), []),
  
  flattenDeep: <T>(arr: any[]): T[] =>
    arr.reduce<T[]>((acc, val) =>
      Array.isArray(val) ? acc.concat(CollectionUtils.flattenDeep(val)) : acc.concat(val), []),
  
  unique: <T>(arr: T[]): T[] => [...new Set(arr)],
  
  uniqueBy: <T, K>(arr: T[], keyFn: (x: T) => K): T[] => {
    const seen = new Set<K>();
    return arr.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  
  groupBy: <T, K extends string | number>(arr: T[], keyFn: (x: T) => K): Record<K, T[]> =>
    arr.reduce((acc, item) => {
      const key = keyFn(item);
      (acc[key] = acc[key] || []).push(item);
      return acc;
    }, {} as Record<K, T[]>),
  
  countBy: <T, K extends string | number>(arr: T[], keyFn: (x: T) => K): Record<K, number> =>
    arr.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<K, number>),
  
  partition: <T>(arr: T[], predicate: (x: T) => boolean): [T[], T[]] =>
    arr.reduce<[T[], T[]]>(([pass, fail], item) =>
      predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]], [[], []]),
  
  zip: <T, U>(a: T[], b: U[]): [T, U][] =>
    a.slice(0, Math.min(a.length, b.length)).map((x, i) => [x, b[i]]),
  
  unzip: <T, U>(pairs: [T, U][]): [T[], U[]] =>
    pairs.reduce<[T[], U[]]>(([as, bs], [a, b]) => [[...as, a], [...bs, b]], [[], []]),
  
  intersection: <T>(...arrays: T[][]): T[] =>
    arrays.length === 0 ? [] : arrays.reduce((a, b) => a.filter(x => b.includes(x))),
  
  difference: <T>(a: T[], b: T[]): T[] =>
    a.filter(x => !b.includes(x)),
  
  symmetricDifference: <T>(a: T[], b: T[]): T[] =>
    [...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))],
  
  sortBy: <T>(arr: T[], keyFn: (x: T) => number | string): T[] =>
    [...arr].sort((a, b) => {
      const ka = keyFn(a);
      const kb = keyFn(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    }),
  
  shuffle: <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
  
  sample: <T>(arr: T[], n: number): T[] =>
    CollectionUtils.shuffle(arr).slice(0, n),
};
```

#### 5. Debug Functions

```typescript
// src/stdlib/functions/debug.ts

export const Debug = {
  log: (...args: unknown[]): void => console.log(...args),
  
  warn: (...args: unknown[]): void => console.warn(...args),
  
  error: (...args: unknown[]): void => console.error(...args),
  
  inspect: (value: unknown, depth = 2): string =>
    JSON.stringify(value, null, 2),
  
  time: (label: string): void => console.time(label),
  
  timeEnd: (label: string): void => console.timeEnd(label),
  
  trace: (message?: string): void => console.trace(message),
  
  table: (data: unknown): void => console.table(data),
  
  group: (label: string): void => console.group(label),
  
  groupEnd: (): void => console.groupEnd(),
  
  measure: async <T>(label: string, fn: () => T | Promise<T>): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${label}: ${end - start}ms`);
    return result;
  },
  
  withSpy = <T extends (...args: any[]) => any>(
    fn: T,
    onCall: (args: Parameters<T>) => void
  ): T => ((...args: Parameters<T>) => {
    onCall(args);
    return fn(...args);
  }) as T,
};
```

#### 6. Assertions

```typescript
// src/stdlib/assertions/core.ts

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export const assert = (condition: boolean, message?: string): void => {
  if (!condition) {
    throw new AssertionError(message || 'Assertion failed');
  }
};

export const assertEquals = <T>(actual: T, expected: T, message?: string): void => {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
};

export const assertNotEquals = <T>(actual: T, unexpected: T, message?: string): void => {
  if (actual === unexpected) {
    throw new AssertionError(
      message || `Expected value not equal to ${JSON.stringify(unexpected)}`
    );
  }
};

export const assertDeepEquals = <T>(actual: T, expected: T, message?: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new AssertionError(message || 'Deep equality failed');
  }
};

export const assertTrue = (value: boolean, message?: string): void => {
  if (!value) throw new AssertionError(message || 'Expected true');
};

export const assertFalse = (value: boolean, message?: string): void => {
  if (value) throw new AssertionError(message || 'Expected false');
};

export const assertTruthy = (value: unknown, message?: string): void => {
  if (!value) throw new AssertionError(message || 'Expected truthy value');
};

export const assertFalsy = (value: unknown, message?: string): void => {
  if (value) throw new AssertionError(message || 'Expected falsy value');
};

export const assertNull = (value: unknown, message?: string): void => {
  if (value !== null) throw new AssertionError(message || 'Expected null');
};

export const assertNotNull = (value: unknown, message?: string): void => {
  if (value === null) throw new AssertionError(message || 'Expected not null');
};

export const assertUndefined = (value: unknown, message?: string): void => {
  if (value !== undefined) throw new AssertionError(message || 'Expected undefined');
};

export const assertDefined = (value: unknown, message?: string): void => {
  if (value === undefined) throw new AssertionError(message || 'Expected defined value');
};

export const assertThrows = (fn: () => void, message?: string): void => {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new AssertionError(message || 'Expected function to throw');
};

export const assertInstanceOf = <T>(
  value: unknown,
  type: new (...args: unknown[]) => T,
  message?: string
): void => {
  if (!(value instanceof type)) {
    throw new AssertionError(message || `Expected instance of ${type.name}`);
  }
};

export const assertType = (value: unknown, typeName: string, message?: string): void => {
  if (typeof value !== typeName) {
    throw new AssertionError(message || `Expected type ${typeName}, got ${typeof value}`);
  }
};

export const assertArray = (value: unknown, message?: string): void => {
  if (!Array.isArray(value)) throw new AssertionError(message || 'Expected array');
};

export const assertObject = (value: unknown, message?: string): void => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AssertionError(message || 'Expected object');
  }
};

export const assertString = (value: unknown, message?: string): void => {
  if (typeof value !== 'string') throw new AssertionError(message || 'Expected string');
};

export const assertNumber = (value: unknown, message?: string): void => {
  if (typeof value !== 'number') throw new AssertionError(message || 'Expected number');
};

export const assertGreaterThan = (actual: number, expected: number, message?: string): void => {
  if (actual <= expected) {
    throw new AssertionError(message || `Expected ${actual} > ${expected}`);
  }
};

export const assertLessThan = (actual: number, expected: number, message?: string): void => {
  if (actual >= expected) {
    throw new AssertionError(message || `Expected ${actual} < ${expected}`);
  }
};

export const assertInRange = (value: number, min: number, max: number, message?: string): void => {
  if (value < min || value > max) {
    throw new AssertionError(message || `Expected ${value} in range [${min}, ${max}]`);
  }
};

export const assertContains = (container: string | unknown[], item: unknown, message?: string): void => {
  if (!container.includes(item as never)) {
    throw new AssertionError(message || 'Expected container to contain item');
  }
};

export const assertMatches = (value: string, pattern: RegExp, message?: string): void => {
  if (!pattern.test(value)) {
    throw new AssertionError(message || `Expected "${value}" to match ${pattern}`);
  }
};

export const assertLength = (value: { length: number }, expected: number, message?: string): void => {
  if (value.length !== expected) {
    throw new AssertionError(message || `Expected length ${expected}, got ${value.length}`);
  }
};

export const assertIsEmpty = (value: { length: number } | object, message?: string): void => {
  const empty = 'length' in value ? value.length === 0 : Object.keys(value).length === 0;
  if (!empty) throw new AssertionError(message || 'Expected empty value');
};

export const assertIsNotEmpty = (value: { length: number } | object, message?: string): void => {
  const empty = 'length' in value ? value.length === 0 : Object.keys(value).length === 0;
  if (empty) throw new AssertionError(message || 'Expected non-empty value');
};

export const fail = (message = 'Assertion failed'): never => {
  throw new AssertionError(message);
};
```

### Function Exports

```typescript
// src/stdlib/functions/index.ts

export * from './core';
export * from './string';
export * from './math';
export * from './collection';
export * from './debug';

// src/stdlib/assertions/index.ts
export * from './core';
export * from './type';
export * from './comparison';
```

## Test Cases
1. identity returns input unchanged
2. compose chains functions correctly
3. pipe applies functions left to right
4. curry enables partial application
5. String transformations work
6. Math utilities calculate correctly
7. Collection operations are immutable
8. Assertions throw on failure
9. All functions available without import

## Validation
```bash
bun test tests/stdlib/functions.test.ts
npx tsc --noEmit src/stdlib/
```

## Output Format
After completing, output:
1. Core functions implemented
2. String functions implemented
3. Math functions implemented
4. Collection functions implemented
5. Debug functions implemented
6. Assertions implemented
7. Test results
