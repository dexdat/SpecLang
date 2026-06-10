---
id: @speclang/stdlib/USAGE
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_assisted
tags: [stdlib, documentation, usage]
short: Standard Library Usage Guide
---

# Standard Library Usage Guide

This document provides examples for using the SpecLang Standard Library functions.

## Importing Stdlib

All stdlib functions are available automatically in specs - no import needed:

```speclang
# @block:example @kind:note
# These functions are available by default in any spec
```

## String Functions

### @stdlib/strings/basic

```typescript
import { split, join, trim, capitalize } from '../../specs/stdlib.spec.dir/src/strings';

// Split and join
const parts = split('a,b,c', ',');  // ['a', 'b', 'c']
const combined = join(parts, '-'); // 'a-b-c'

// Trim whitespace
trim('  hello  '); // 'hello'

// Capitalize
capitalize('hello'); // 'Hello'
```

### @stdlib/strings/formatting

```typescript
import { format, interpolate, replaceAll } from '../../specs/stdlib.spec.dir/src/strings';

// Positional format
format('{0} {1}', 'hello', 'world'); // 'hello world'

// Object interpolation
interpolate('{name} is {age}', { name: 'John', age: 30 }); // 'John is 30'

// Replace all
replaceAll('hello world', 'o', 'x'); // 'hellx wxrld'
```

## Collection Functions

### @stdlib/collections/transform

```typescript
import { map, filter, reduce, find } from '../../specs/stdlib.spec.dir/src/collections';

// Map - transform each element
map([1, 2, 3], x => x * 2); // [2, 4, 6]

// Filter - keep matching elements
filter([1, 2, 3, 4], x => x % 2 === 0); // [2, 4]

// Reduce - accumulate to single value
reduce([1, 2, 3], (acc, x) => acc + x, 0); // 6

// Find - get first match
find([1, 2, 3], x => x > 1); // 2
```

### @stdlib/collections/sorting

```typescript
import { sort, shuffle, reverse, unique } from '../../specs/stdlib.spec.dir/src/collections';

// Sort with comparator
sort([3, 1, 2]); // [1, 2, 3]

// Shuffle randomly
shuffle([1, 2, 3, 4, 5]); // random order

// Get unique elements
unique([1, 2, 2, 3]); // [1, 2, 3]
```

### @stdlib/collections/grouping

```typescript
import { groupBy, chunk, partition, zip } from '../../specs/stdlib.spec.dir/src/collections';

// Group by key
groupBy(['a', 'bb', 'ccc'], x => x.length); 
// { 1: ['a'], 2: ['bb'], 3: ['ccc'] }

// Chunk into arrays
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Partition by predicate
partition([1, 2, 3, 4], x => x % 2 === 0); // [[2, 4], [1, 3]]

// Zip two arrays
zip([1, 2], ['a', 'b']); // [[1, 'a'], [2, 'b']]
```

## Math Functions

### @stdlib/math/basic

```typescript
import { add, subtract, multiply, divide, pow, sqrt } from '../../specs/stdlib.spec.dir/src/math';

add(1, 2);        // 3
subtract(5, 3);   // 2
multiply(3, 4);   // 12
divide(10, 2);    // 5
pow(2, 3);        // 8
sqrt(16);         // 4
```

### @stdlib/math/statistics

```typescript
import { mean, median, mode, stdDev, min, max, sum } from '../../specs/stdlib.spec.dir/src/math';

mean(1, 2, 3);      // 2
median(1, 2, 3);    // 2
mode(1, 2, 2, 3);   // [2]
stdDev(2, 4, 4, 4); // 1
min(1, 2, 3);       // 1
max(1, 2, 3);       // 3
sum(1, 2, 3);       // 6
```

### @stdlib/math/random

```typescript
import { random, randomInt, sample, sampleSize, clamp } from '../../specs/stdlib.spec.dir/src/math';

random();           // 0.0 to 1.0
randomInt(1, 10);   // 1 to 10
sample([1, 2, 3]);  // random element
sampleSize([1, 2, 3, 4], 2); // 2 random elements
clamp(15, 0, 10);   // 10 (clamped to max)
```

## Object Functions

### @stdlib/objects/properties

```typescript
import { keys, values, entries, pick, omit } from '../../specs/stdlib.spec.dir/src/objects';

const obj = { a: 1, b: 2, c: 3 };

keys(obj);    // ['a', 'b', 'c']
values(obj);  // [1, 2, 3]
entries(obj); // [['a', 1], ['b', 2], ['c', 3]]

pick(obj, ['a', 'b']);    // { a: 1, b: 2 }
omit(obj, ['c']);         // { a: 1, b: 2 }
```

### @stdlib/objects/nested

```typescript
import { get, set, has } from '../../specs/stdlib.spec.dir/src/objects';

const obj = { a: { b: { c: 1 } } };

get(obj, 'a.b.c');     // 1
has(obj, 'a.b');       // true

set(obj, 'x.y', 10);  // obj.x.y = 10
```

### @stdlib/objects/cloning

```typescript
import { deepClone, deepMerge, deepEqual, deepFreeze } from '../../specs/stdlib.spec.dir/src/objects';

const original = { a: { b: 1 } };
const cloned = deepClone(original); // deep copy

deepEqual({ a: 1 }, { a: 1 }); // true
deepMerge({ a: { b: 1 } }, { a: { c: 2 } }); // { a: { b: 1, c: 2 } }

const frozen = deepFreeze({ a: 1 });
Object.isFrozen(frozen); // true
```

## Assertion Functions

### @stdlib/assertions/basic

```typescript
import { 
  assert, assertEquals, assertTrue, assertFalse,
  assertNull, assertNotNull, assertUndefined, assertDefined
} from '../../specs/stdlib.spec.dir/src/assertions';

assert(true);                    // throws if false
assertEquals(1, 1);              // throws if not equal
assertTrue(value);               // throws if falsy
assertFalse(value);              // throws if truthy
assertNull(null);                // throws if not null
assertNotNull(value);            // throws if null
assertUndefined(undefined);      // throws if defined
assertDefined(value);            // throws if undefined
```

### @stdlib/assertions/types

```typescript
import { 
  assertType, assertIsArray, assertIsObject, assertLength, assertContains, assertHasProperty 
} from '../../specs/stdlib.spec.dir/src/assertions';

assertType('hello', 'string');           // throws if wrong type
assertIsArray([1, 2]);                   // throws if not array
assertIsObject({ a: 1 });                 // throws if not plain object
assertLength([1, 2, 3], 3);               // throws if wrong length
assertContains([1, 2, 3], 2);             // throws if not found
assertHasProperty({ a: 1 }, 'a');        // throws if missing
```

### @stdlib/assertions/exceptions

```typescript
import { assertThrows, assertNotThrows } from '../../specs/stdlib.spec.dir/src/assertions';

assertThrows(() => { throw new Error(); });      // throws if function doesn't throw
assertNotThrows(() => { /* no throw */ });       // throws if function throws
```

## Function Composition

### @stdlib/compose/chaining

```typescript
import { pipe, compose, curry, partial, memoize } from '../../specs/stdlib.spec.dir/src/compose';

// Pipe - chain functions left to right
pipe(1, x => x + 1, x => x * 2); // (1 + 1) * 2 = 4

// Compose - chain functions right to left
compose(x => x * 2, x => x + 1)(1); // (1 + 1) * 2 = 4
```

### @stdlib/compose/currying

```typescript
import { curry, partial } from '../../specs/stdlib.spec.dir/src/compose';

// Curry - transform to single-arg functions
const curried = curry((a, b, c) => a + b + c);
curried(1)(2)(3);     // 6

// Partial - pre-fill arguments
const add = (a, b) => a + b;
const add5 = partial(add, 5);
add5(10);            // 15
```

### @stdlib/compose/memoization

```typescript
import { memoize } from '../../specs/stdlib.spec.dir/src/compose';

let callCount = 0;
const fn = memoize((x: number) => {
  callCount++;
  return x * 2;
});

fn(5);  // 10, callCount = 1
fn(5);  // 10, callCount = 1 (cached)
fn(6);  // 12, callCount = 2
```

---

*This guide covers the main stdlib functions. See individual module files for complete API documentation.*
