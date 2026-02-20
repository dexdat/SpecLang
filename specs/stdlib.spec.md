# speclang-header
id: "@speclang/stdlib"
version: 0.1.0
layer: 0
tags: [stdlib, builtins, types]
imports: ["@speclang/core"]

---

# Standard Library

Built-in blocks available to all specs without import.

## Primitive Types

### @stdlib/String

```speclang
# @block:stdlib/String @kind:entity
String:
  description: "Text value"
  operations:
    - concat: (String, String) -> String
    - split: (String, delimiter) -> String[]
    - length: (String) -> Int
    - contains: (String, substring) -> Bool
    - trim: (String) -> String
    - upper: (String) -> String
    - lower: (String) -> String
```

### @stdlib/Int

```speclang
# @block:stdlib/Int @kind:entity
Int:
  description: "Integer number"
  operations:
    - add: (Int, Int) -> Int
    - subtract: (Int, Int) -> Int
    - multiply: (Int, Int) -> Int
    - divide: (Int, Int) -> Int | Error
    - modulo: (Int, Int) -> Int
    - range: (Int, Int) -> Int[]
```

### @stdlib/Float

```speclang
# @block:stdlib/Float @kind:entity
Float:
  description: "Floating point number"
  operations:
    - add: (Float, Float) -> Float
    - subtract: (Float, Float) -> Float
    - multiply: (Float, Float) -> Float
    - divide: (Float, Float) -> Float
    - round: (Float, precision) -> Float
    - floor: (Float) -> Int
    - ceil: (Float) -> Int
```

### @stdlib/Bool

```speclang
# @block:stdlib/Bool @kind:entity
Bool:
  description: "True or false"
  operations:
    - and: (Bool, Bool) -> Bool
    - or: (Bool, Bool) -> Bool
    - not: (Bool) -> Bool
    - xor: (Bool, Bool) -> Bool
```

---

## Composite Types

### @stdlib/List

```speclang
# @block:stdlib/List @kind:entity @tparams:[T]
List<T>:
  description: "Ordered collection"
  operations:
    - map: (List<T>, (T) -> U) -> List<U>
    - filter: (List<T>, (T) -> Bool) -> List<T>
    - reduce: (List<T>, (U, T) -> U, U) -> U
    - find: (List<T>, (T) -> Bool) -> T?
    - includes: (List<T>, T) -> Bool
    - length: (List<T>) -> Int
    - push: (List<T>, T) -> List<T>
    - pop: (List<T>) -> (T?, List<T>)
    - first: (List<T>) -> T?
    - last: (List<T>) -> T?
    - sort: (List<T>, cmp?) -> List<T>
    - reverse: (List<T>) -> List<T>
```

### @stdlib/Map

```speclang
# @block:stdlib/Map @kind:entity @tparams:[K, V]
Map<K, V>:
  description: "Key-value collection"
  operations:
    - get: (Map<K,V>, K) -> V?
    - set: (Map<K,V>, K, V) -> Map<K,V>
    - has: (Map<K,V>, K) -> Bool
    - delete: (Map<K,V>, K) -> Map<K,V>
    - keys: (Map<K,V>) -> List<K>
    - values: (Map<K,V>) -> List<V>
    - entries: (Map<K,V>) -> List<(K,V)>
    - size: (Map<K,V>) -> Int
```

### @stdlib/Set

```speclang
# @block:stdlib/Set @kind:entity @tparams:[T]
Set<T>:
  description: "Unique collection"
  operations:
    - add: (Set<T>, T) -> Set<T>
    - has: (Set<T>, T) -> Bool
    - delete: (Set<T>, T) -> Set<T>
    - union: (Set<T>, Set<T>) -> Set<T>
    - intersect: (Set<T>, Set<T>) -> Set<T>
    - diff: (Set<T>, Set<T>) -> Set<T>
```

---

## Result Types

### @stdlib/Option

```speclang
# @block:stdlib/Option @kind:entity @tparams:[T]
Option<T>:
  description: "Maybe has a value"
  variants:
    Some(T): value present
    None: value absent
  operations:
    - map: (Option<T>, (T) -> U) -> Option<U>
    - flatMap: (Option<T>, (T) -> Option<U>) -> Option<U>
    - unwrap: (Option<T>) -> T | panic
    - unwrapOr: (Option<T>, T) -> T
    - isSome: (Option<T>) -> Bool
    - isNone: (Option<T>) -> Bool
```

### @stdlib/Result

```speclang
# @block:stdlib/Result @kind:entity @tparams:[T, E]
Result<T, E>:
  description: "Success or error"
  variants:
    Ok(T): success with value
    Err(E): failure with error
  operations:
    - map: (Result<T,E>, (T) -> U) -> Result<U,E>
    - mapErr: (Result<T,E>, (E) -> F) -> Result<T,F>
    - unwrap: (Result<T,E>) -> T | panic
    - unwrapOr: (Result<T,E>, T) -> T
    - isOk: (Result<T,E>) -> Bool
    - isErr: (Result<T,E>) -> Bool
```

---

## Common Types

### @stdlib/UUID

```speclang
# @block:stdlib/UUID @kind:entity
UUID:
  description: "Unique identifier"
  format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  operations:
    - generate: () -> UUID
    - parse: (String) -> UUID | Error
    - validate: (String) -> Bool
```

### @stdlib/DateTime

```speclang
# @block:stdlib/DateTime @kind:entity
DateTime:
  description: "Point in time"
  format: ISO 8601
  operations:
    - now: () -> DateTime
    - parse: (String) -> DateTime | Error
    - format: (DateTime, pattern) -> String
    - add: (DateTime, Duration) -> DateTime
    - diff: (DateTime, DateTime) -> Duration
    - isBefore: (DateTime, DateTime) -> Bool
    - isAfter: (DateTime, DateTime) -> Bool
```

### @stdlib/Duration

```speclang
# @block:stdlib/Duration @kind:entity
Duration:
  description: "Time span"
  units: [ms, s, m, h, d, w]
  operations:
    - fromMs: (Int) -> Duration
    - fromSeconds: (Int) -> Duration
    - toMs: (Duration) -> Int
    - add: (Duration, Duration) -> Duration
```

---

## Functions

### @stdlib/identity

```speclang
# @block:stdlib/identity @kind:operation @tparams:[T]
identity(x: T) -> T:
  description: "Returns input unchanged"
  body: return x
```

### @stdlib/compose

```speclang
# @block:stdlib/compose @kind:operation @tparams:[A, B, C]
compose(f: (B) -> C, g: (A) -> B) -> (A) -> C:
  description: "Function composition"
  body: return (a) => f(g(a))
```

### @stdlib/pipe

```speclang
# @block:stdlib/pipe @kind:operation @tparams:[T]
pipe(value: T, ...fns: ((T) -> T)[]) -> T:
  description: "Chain operations left to right"
  body: return fns.reduce((v, f) => f(v), value)
```

### @stdlib/curry

```speclang
# @block:stdlib/curry @kind:operation
curry(fn: Function) -> Function:
  description: "Partial application"
  body: |
    return function curried(...args) {
      if (args.length >= fn.length) return fn(...args)
      return curried.bind(null, ...args)
    }
```

---

## Assertions

### @stdlib/assert

```speclang
# @block:stdlib/assert @kind:operation
assert(condition: Bool, message?: String) -> Void:
  description: "Panic if false"
  body: |
    if (!condition) throw Error(message || "assertion failed")
```

### @stdlib/assertEquals

```speclang
# @block:stdlib/assertEquals @kind:operation @tparams:[T]
assertEquals(actual: T, expected: T, message?: String) -> Void:
  description: "Panic if not equal"
  refs: [@stdlib/assert]
```

---

## Type Predicates

```speclang
# @block:stdlib/type-predicates @kind:note
Built-in type checks:
- isString(x)
- isInt(x)
- isFloat(x)
- isBool(x)
- isList(x)
- isMap(x)
- isNull(x)
- isUndefined(x)
- isFunction(x)
```

---

## Usage

No import needed. All @stdlib blocks are available by default.

```speclang
# @block:stdlib/example @kind:note
You can reference @stdlib/List, @stdlib/Option, etc. directly.
No "import std" required.
```
