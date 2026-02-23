---
name: sip-072-stdlib-functions-speclang-v0
title: "SIP 72: Standard Library Functions"
version: 0.1.0
description: Built-in functions available in the SpecLang standard library
category: standard
---

# SIP 72: Standard Library Functions

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Standard Library Functions—built-in functions for validation, transformation, collection operations, and I/O.

### Quick Start

Function categories:
1. **Validation**: assert, validate, check
2. **Transformation**: parse, stringify, cast
3. **Collection**: head, tail, take, drop, zip
4. **I/O**: read, write, log

### When to Read This

- **Writing specs:** Using built-in functions
- **Code generation:** Function mappings
- **Validation:** Understanding assertions

### Related SIPs

- SIP 26: Standard Library (overview)
- SIP 71: Standard Library Types
- SIP 12: Code Generation

## Abstract

This SIP defines the built-in functions in the SpecLang Standard Library. These functions provide common operations without import and enable concise spec definitions. Functions are pure where possible, with clear side-effect annotations.

## Motivation

Built-in functions are needed because:
- Specs need common operations
- Avoid repetition across specs
- Code generators need function mappings
- Validation needs assertion primitives

## Rationale

**Zero-Import Functions:**

1. **Always available**: No imports needed
2. **Pure where possible**: Predictable behavior
3. **Type-safe**: Full type signatures
4. **Well-documented**: Clear semantics

This follows patterns from Haskell's Prelude, Rust's std.

## Specification

### Validation Functions

```yaml
ValidationFunctions:
  assert:
    signature: "assert(condition: Bool, message?: String) -> Void"
    description: "Assert condition is true, panic if false"
    example: 'assert(age >= 0, "age must be non-negative")'
    side_effects: may panic
    
  validate:
    signature: "validate<T>(value: Any, schema: Schema) -> Result<T, ValidationError>"
    description: "Validate value against schema"
    example: 'validate<User>(input, UserSchema)'
    
  check:
    signature: "check<T>(value: T, predicate: (T) -> Bool) -> Bool"
    description: "Check if value satisfies predicate"
    example: 'check(email, isEmailFormat)'
    
  require:
    signature: "require<T>(value: T?) -> T"
    description: "Require non-null value, panic if null"
    example: 'require(user.name)'
    side_effects: may panic
```

### Transformation Functions

```yaml
TransformationFunctions:
  parse:
    signature: "parse<T>(string: String) -> Result<T, ParseError>"
    description: "Parse string to type T"
    examples:
      - 'parse<Int>("42")'  # Ok(42)
      - 'parse<DateTime>("2024-01-15")'
      
  stringify:
    signature: "stringify(value: Any, format?: String) -> String"
    description: "Convert value to string representation"
    examples:
      - 'stringify(42)'  # "42"
      - 'stringify(user, "json")'
      
  cast:
    signature: "cast<T, U>(value: T) -> Result<U, CastError>"
    description: "Safely cast between types"
    example: 'cast<Int, Float>(x)'
    
  coerce:
    signature: "coerce<T>(value: Any) -> T"
    description: "Force coercion to type T"
    example: 'coerce<String>(123)'  # "123"
```

### Collection Functions

```yaml
CollectionFunctions:
  head:
    signature: "head<T>(list: List<T>) -> Option<T>"
    description: "First element or None"
    example: 'head([1,2,3])'  # Some(1)
    
  tail:
    signature: "tail<T>(list: List<T>) -> List<T>"
    description: "All elements except first"
    example: 'tail([1,2,3])'  # [2,3]
    
  take:
    signature: "take<T>(list: List<T>, n: Int) -> List<T>"
    description: "First n elements"
    example: 'take([1,2,3,4], 2)'  # [1,2]
    
  drop:
    signature: "drop<T>(list: List<T>, n: Int) -> List<T>"
    description: "Elements after first n"
    example: 'drop([1,2,3,4], 2)'  # [3,4]
    
  zip:
    signature: "zip<T, U>(list1: List<T>, list2: List<U>) -> List<(T, U)>"
    description: "Pair elements from two lists"
    example: 'zip([1,2], ["a","b"])'  # [(1,"a"), (2,"b")]
    
  unzip:
    signature: "unzip<T, U>(list: List<(T, U)>) -> (List<T>, List<U>)"
    description: "Split list of pairs into two lists"
    
  flatten:
    signature: "flatten<T>(list: List<List<T>>) -> List<T>"
    description: "Flatten nested lists"
    example: 'flatten([[1,2], [3,4]])'  # [1,2,3,4]
    
  partition:
    signature: "partition<T>(list: List<T>, pred: (T) -> Bool) -> (List<T>, List<T>)"
    description: "Split by predicate into (matching, non-matching)"
    
  groupBy:
    signature: "groupBy<T, K>(list: List<T>, keyFn: (T) -> K) -> Map<K, List<T>>"
    description: "Group elements by key function"
    
  sortBy:
    signature: "sortBy<T>(list: List<T>, keyFn: (T) -> Comparable) -> List<T>"
    description: "Sort by derived key"
    
  unique:
    signature: "unique<T>(list: List<T>) -> List<T>"
    description: "Remove duplicates, preserve order"
    
  interleave:
    signature: "interleave<T>(list1: List<T>, list2: List<T>) -> List<T>"
    description: "Alternate elements from two lists"
```

### Math Functions

```yaml
MathFunctions:
  min:
    signature: "min<T: Comparable>(a: T, b: T) -> T"
    description: "Smaller of two values"
    
  max:
    signature: "max<T: Comparable>(a: T, b: T) -> T"
    description: "Larger of two values"
    
  clamp:
    signature: "clamp<T: Comparable>(value: T, min: T, max: T) -> T"
    description: "Constrain value to range"
    
  abs:
    signature: "abs<T: Numeric>(value: T) -> T"
    description: "Absolute value"
    
  pow:
    signature: "pow(base: Float, exp: Float) -> Float"
    description: "Exponentiation"
    
  sqrt:
    signature: "sqrt(value: Float) -> Float"
    description: "Square root"
    
  floor:
    signature: "floor(value: Float) -> Int"
    description: "Round down"
    
  ceil:
    signature: "ceil(value: Float) -> Int"
    description: "Round up"
    
  round:
    signature: "round(value: Float, precision?: Int) -> Float"
    description: "Round to precision"
    
  sum:
    signature: "sum<T: Numeric>(list: List<T>) -> T"
    description: "Sum of list elements"
    
  product:
    signature: "product<T: Numeric>(list: List<T>) -> T"
    description: "Product of list elements"
    
  avg:
    signature: "avg<T: Numeric>(list: List<T>) -> Float"
    description: "Average of list elements"
```

### String Functions

```yaml
StringFunctions:
  join:
    signature: "join(strings: List<String>, separator: String) -> String"
    description: "Join strings with separator"
    example: 'join(["a","b"], ",")'  # "a,b"
    
  split:
    signature: "split(string: String, delimiter: String) -> List<String>"
    description: "Split string by delimiter"
    
  trim:
    signature: "trim(string: String) -> String"
    description: "Remove leading/trailing whitespace"
    
  trimLeft:
    signature: "trimLeft(string: String) -> String"
    description: "Remove leading whitespace"
    
  trimRight:
    signature: "trimRight(string: String) -> String"
    description: "Remove trailing whitespace"
    
  padLeft:
    signature: "padLeft(string: String, length: Int, char?: String) -> String"
    description: "Pad left to length"
    example: 'padLeft("5", 3, "0")'  # "005"
    
  padRight:
    signature: "padRight(string: String, length: Int, char?: String) -> String"
    description: "Pad right to length"
    
  repeat:
    signature: "repeat(string: String, times: Int) -> String"
    description: "Repeat string n times"
    example: 'repeat("ab", 3)'  # "ababab"
    
  reverse:
    signature: "reverse(string: String) -> String"
    description: "Reverse string"
    
  capitalize:
    signature: "capitalize(string: String) -> String"
    description: "Capitalize first letter"
    
  words:
    signature: "words(string: String) -> List<String>"
    description: "Split into words"
    
  lines:
    signature: "lines(string: String) -> List<String>"
    description: "Split into lines"
    
  unlines:
    signature: "unlines(lines: List<String>) -> String"
    description: "Join lines with newlines"
```

### Debug Functions

```yaml
DebugFunctions:
  log:
    signature: "log(message: String, level?: LogLevel) -> Void"
    description: "Log message"
    side_effects: I/O
    levels: [debug, info, warn, error]
    
  trace:
    signature: "trace<T>(value: T, label?: String) -> T"
    description: "Log and return value (for debugging)"
    example: 'result = trace(compute(), "result")'
    
  inspect:
    signature: "inspect(value: Any) -> String"
    description: "Detailed string representation"
    
  time:
    signature: "time<T>(label: String, computation: () -> T) -> T"
    description: "Measure execution time"
    example: 'time("sort", () => sort(bigList))'
```

## Examples

### Example 1: Validation Chain

```yaml
spec_block:
  kind: "@kind:operation"
  content: |
    # Validate user input
    result = validate<Input>(raw)
      .map(data => parse<User>(data.userJson))
      .map(user => {
        assert(user.age >= 18, "must be adult");
        return user;
      })
```

### Example 2: Collection Pipeline

```yaml
spec_block:
  kind: "@kind:operation"
  content: |
    # Process orders
    report = orders
      .filter(o => o.status == "completed")
      .groupBy(o => o.customerId)
      .map((id, orders) => {
        total: sum(orders.map(o => o.amount)),
        count: orders.length
      })
```

### Example 3: String Processing

```yaml
spec_block:
  kind: "@kind:operation"
  content: |
    # Format name
    displayName = name
      .trim()
      .split(" ")
      .map(capitalize)
      .join(" ")
```

## Implementation

```python
class StdLibFunctions:
    VALIDATION = ["assert", "validate", "check", "require"]
    TRANSFORMATION = ["parse", "stringify", "cast", "coerce"]
    COLLECTION = ["head", "tail", "take", "drop", "zip", "unzip", 
                  "flatten", "partition", "groupBy", "sortBy", "unique"]
    MATH = ["min", "max", "clamp", "abs", "pow", "sqrt", "floor", 
            "ceil", "round", "sum", "product", "avg"]
    STRING = ["join", "split", "trim", "padLeft", "padRight", 
              "repeat", "reverse", "capitalize", "words", "lines"]
    DEBUG = ["log", "trace", "inspect", "time"]
    
    @classmethod
    def all_functions(cls):
        return (
            cls.VALIDATION + 
            cls.TRANSFORMATION + 
            cls.COLLECTION + 
            cls.MATH + 
            cls.STRING + 
            cls.DEBUG
        )
    
    @classmethod
    def get_signature(cls, name: str) -> str:
        return cls.SIGNATURES.get(name)
```

## References

- @ref:speclang/stdlib
- SIP 26: Standard Library
- SIP 71: Standard Library Types

## Copyright

This document is in the public domain.
