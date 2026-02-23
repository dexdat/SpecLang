---
name: sip-071-stdlib-types-speclang-v0
title: "SIP 71: Standard Library Types"
version: 0.1.0
description: Detailed type definitions in the SpecLang standard library
category: standard
---

# SIP 71: Standard Library Types

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Standard Library Types—primitive, composite, result, and common types built into SpecLang.

### Quick Start

Type categories:
1. **Primitive**: String, Int, Float, Bool
2. **Composite**: List, Map, Set
3. **Result**: Option, Result
4. **Common**: UUID, DateTime, Duration

### When to Read This

- **Using types:** Reference for type operations
- **Code generation:** Type mappings to target languages
- **Validation:** Type checking rules

### Related SIPs

- SIP 26: Standard Library (overview)
- SIP 72: Standard Library Functions
- SIP 12: Code Generation

## Abstract

This SIP details the type definitions in the SpecLang Standard Library. These types are available without import and provide the foundation for spec definitions. Each type includes its operations, type parameters, and language mappings.

## Motivation

Detailed type definitions are needed because:
- Code generators need precise type information
- Validation requires operation signatures
- Documentation needs complete references
- Language mappings need explicit rules

## Rationale

**Zero-Import Foundation:**

1. **Always available**: No imports needed
2. **Consistent semantics**: Same meaning everywhere
3. **Rich operations**: Methods on each type
4. **Type parameters**: Generic support

This follows patterns from Rust's std, Python's builtins.

## Specification

### Primitive Types

```yaml
PrimitiveTypes:
  String:
    description: "Text value"
    operations:
      concat: (String, String) -> String
      split: (String, delimiter) -> String[]
      length: (String) -> Int
      contains: (String, substring) -> Bool
      trim: (String) -> String
      upper: (String) -> String
      lower: (String) -> String
      startsWith: (String, prefix) -> Bool
      endsWith: (String, suffix) -> Bool
      replace: (String, find, replace) -> String
      slice: (String, start, end?) -> String
      
  Int:
    description: "Integer number"
    operations:
      add: (Int, Int) -> Int
      subtract: (Int, Int) -> Int
      multiply: (Int, Int) -> Int
      divide: (Int, Int) -> Int | Error
      modulo: (Int, Int) -> Int
      range: (Int, Int) -> Int[]
      abs: (Int) -> Int
      toString: (Int) -> String
      min: (Int, Int) -> Int
      max: (Int, Int) -> Int
      
  Float:
    description: "Floating point number"
    operations:
      add: (Float, Float) -> Float
      subtract: (Float, Float) -> Float
      multiply: (Float, Float) -> Float
      divide: (Float, Float) -> Float
      round: (Float, precision?) -> Float
      floor: (Float) -> Int
      ceil: (Float) -> Int
      toString: (Float) -> String
      
  Bool:
    description: "True or false"
    operations:
      and: (Bool, Bool) -> Bool
      or: (Bool, Bool) -> Bool
      not: (Bool) -> Bool
      xor: (Bool, Bool) -> Bool
      toString: (Bool) -> String
```

### Composite Types

```yaml
CompositeTypes:
  List<T>:
    description: "Ordered collection"
    operations:
      map: (List<T>, (T) -> U) -> List<U>
      filter: (List<T>, (T) -> Bool) -> List<T>
      reduce: (List<T>, (U, T) -> U, U) -> U
      find: (List<T>, (T) -> Bool) -> T?
      includes: (List<T>, T) -> Bool
      length: (List<T>) -> Int
      push: (List<T>, T) -> List<T>
      pop: (List<T>) -> (T?, List<T>)
      first: (List<T>) -> T?
      last: (List<T>) -> T?
      sort: (List<T>, cmp?) -> List<T>
      reverse: (List<T>) -> List<T>
      slice: (List<T>, start, end?) -> List<T>
      concat: (List<T>, List<T>) -> List<T>
      flatMap: (List<T>, (T) -> List<U>) -> List<U>
      
  Map<K, V>:
    description: "Key-value collection"
    operations:
      get: (Map<K,V>, K) -> V?
      set: (Map<K,V>, K, V) -> Map<K,V>
      has: (Map<K,V>, K) -> Bool
      delete: (Map<K,V>, K) -> Map<K,V>
      keys: (Map<K,V>) -> List<K>
      values: (Map<K,V>) -> List<V>
      entries: (Map<K,V>) -> List<(K,V)>
      size: (Map<K,V>) -> Int
      merge: (Map<K,V>, Map<K,V>) -> Map<K,V>
      
  Set<T>:
    description: "Unique collection"
    operations:
      add: (Set<T>, T) -> Set<T>
      has: (Set<T>, T) -> Bool
      delete: (Set<T>, T) -> Set<T>
      union: (Set<T>, Set<T>) -> Set<T>
      intersect: (Set<T>, Set<T>) -> Set<T>
      diff: (Set<T>, Set<T>) -> Set<T>
      size: (Set<T>) -> Int
      toList: (Set<T>) -> List<T>
```

### Result Types

```yaml
ResultTypes:
  Option<T>:
    description: "Maybe has a value"
    variants:
      Some(T): value present
      None: value absent
    operations:
      map: (Option<T>, (T) -> U) -> Option<U>
      flatMap: (Option<T>, (T) -> Option<U>) -> Option<U>
      unwrap: (Option<T>) -> T | panic
      unwrapOr: (Option<T>, T) -> T
      isSome: (Option<T>) -> Bool
      isNone: (Option<T>) -> Bool
      filter: (Option<T>, (T) -> Bool) -> Option<T>
      
  Result<T, E>:
    description: "Success or error"
    variants:
      Ok(T): success with value
      Err(E): failure with error
    operations:
      map: (Result<T,E>, (T) -> U) -> Result<U,E>
      mapErr: (Result<T,E>, (E) -> F) -> Result<T,F>
      unwrap: (Result<T,E>) -> T | panic
      unwrapOr: (Result<T,E>, T) -> T
      isOk: (Result<T,E>) -> Bool
      isErr: (Result<T,E>) -> Bool
      andThen: (Result<T,E>, (T) -> Result<U,E>) -> Result<U,E>
      orElse: (Result<T,E>, (E) -> Result<T,F>) -> Result<T,F>
```

### Common Types

```yaml
CommonTypes:
  UUID:
    description: "Unique identifier"
    format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    operations:
      generate: () -> UUID
      parse: (String) -> UUID | Error
      validate: (String) -> Bool
      toString: (UUID) -> String
      
  DateTime:
    description: "Point in time"
    format: ISO 8601
    operations:
      now: () -> DateTime
      parse: (String) -> DateTime | Error
      format: (DateTime, pattern) -> String
      add: (DateTime, Duration) -> DateTime
      subtract: (DateTime, Duration) -> DateTime
      diff: (DateTime, DateTime) -> Duration
      isBefore: (DateTime, DateTime) -> Bool
      isAfter: (DateTime, DateTime) -> Bool
      isEqual: (DateTime, DateTime) -> Bool
      
  Duration:
    description: "Time span"
    units: [ms, s, m, h, d, w]
    operations:
      fromMs: (Int) -> Duration
      fromSeconds: (Int) -> Duration
      fromMinutes: (Int) -> Duration
      fromHours: (Int) -> Duration
      toMs: (Duration) -> Int
      toSeconds: (Duration) -> Int
      add: (Duration, Duration) -> Duration
      multiply: (Duration, Int) -> Duration
```

### Type Predicates

```yaml
TypePredicates:
  isString: (Any) -> Bool
  isInt: (Any) -> Bool
  isFloat: (Any) -> Bool
  isBool: (Any) -> Bool
  isList: (Any) -> Bool
  isMap: (Any) -> Bool
  isSet: (Any) -> Bool
  isNull: (Any) -> Bool
  isUndefined: (Any) -> Bool
  isFunction: (Any) -> Bool
  isUUID: (Any) -> Bool
  isDateTime: (Any) -> Bool
  isDuration: (Any) -> Bool
```

## Examples

### Example 1: Using List Operations

```yaml
spec_block:
  kind: "@kind:operation"
  content: |
    # Filter and transform
    activeUsers = users
      .filter(u => u.active)
      .map(u => u.email)
    
    # Find first match
    admin = users.find(u => u.role == "admin")
    
    # Aggregate
    total = orders.reduce((sum, o) => sum + o.amount, 0)
```

### Example 2: Using Result Types

```yaml
spec_block:
  kind: "@kind:operation"
  content: |
    # Parse with error handling
    result = parse<Int>(input)
      .map(n => n * 2)
      .unwrapOr(0)
    
    # Chain operations
    fetchUser(id)
      .andThen(u => validateEmail(u.email))
      .map(email => sendWelcome(email))
```

### Example 3: DateTime Operations

```yaml
spec_block:
  kind: "@kind:operation"
  content: |
    now = DateTime.now()
    expiry = now.add(Duration.fromHours(24))
    
    if now.isBefore(expiry):
      process()
```

## Implementation

```python
class StdLibTypes:
    PRIMITIVES = {
        "String": StringType(),
        "Int": IntType(),
        "Float": FloatType(),
        "Bool": BoolType(),
    }
    
    COMPOSITES = {
        "List": ListType(),
        "Map": MapType(),
        "Set": SetType(),
    }
    
    RESULTS = {
        "Option": OptionType(),
        "Result": ResultType(),
    }
    
    COMMON = {
        "UUID": UUIDType(),
        "DateTime": DateTimeType(),
        "Duration": DurationType(),
    }
    
    @classmethod
    def all_types(cls):
        return {
            **cls.PRIMITIVES,
            **cls.COMPOSITES,
            **cls.RESULTS,
            **cls.COMMON,
        }
        
    @classmethod
    def get_operation(cls, type_name: str, op_name: str):
        type_obj = cls.all_types().get(type_name)
        if type_obj:
            return type_obj.get_operation(op_name)
        return None
```

## References

- @ref:speclang/stdlib
- @ref:speclang/stdlib.spec.dir/types
- SIP 26: Standard Library
- SIP 72: Standard Library Functions

## Copyright

This document is in the public domain.
