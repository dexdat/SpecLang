---
name: sip-026-stdlib-speclang-v0
title: "SIP 26: Standard Library"
version: 0.1.0
description: Built-in types, functions, and platform types available to all specs
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 26: Standard Library

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the SpecLang Standard Library—built-in types and functions available to all specs without import.

### Quick Start

Standard library provides:
1. **Primitive types**: String, Int, Float, Bool, Date
2. **Composite types**: List, Map, Set, Tuple
3. **Result types**: Result, Option, Either
4. **Type functions**: Validation, transformation
5. **Platform types**: HTTP, Database, File

### When to Read This

- **Using built-in types:** Reference for type definitions
- **Type validation:** Understanding type checking
- **Adding types:** Extending the type system

### Related SIPs

- SIP 3: Block System
- SIP 12: Code Generation
- SIP 22: Validation System

## Abstract

This SIP defines the SpecLang Standard Library—a collection of built-in types, type functions, and platform-specific types available to all specs without explicit import. The stdlib provides the foundational vocabulary for writing specs and enables consistent code generation across target languages.

## Motivation

Every spec needs common types:
- Without stdlib, every spec defines String, Int
- Code generators need standard type mappings
- Validation requires known type semantics

A standard library provides consistency and reduces boilerplate.

## Rationale

**Zero-Import Foundation:**

1. **Always available**: No imports needed
2. **Consistent semantics**: Same meaning everywhere
3. **Code generation ready**: Maps to all target languages
4. **Extensible**: Projects add domain types

This follows patterns from Rust's std, Python's builtins.

## Specification

### Primitive Types

```yaml
PrimitiveTypes:
  String:
    description: "Text data"
    examples: ["hello", "user@example.com"]
    methods:
      - length: Int
      - contains(substring: String): Bool
      - startsWith(prefix: String): Bool
      - endsWith(suffix: String): Bool
      - split(delimiter: String): List<String>
      - join(parts: List<String>): String
      
  Int:
    description: "Integer number"
    examples: [42, -1, 0]
    methods:
      - toString(): String
      - abs(): Int
      - min(other: Int): Int
      - max(other: Int): Int
      
  Float:
    description: "Floating-point number"
    examples: [3.14, -0.5, 1.0]
    methods:
      - toString(): String
      - round(): Int
      - floor(): Int
      - ceil(): Int
      
  Bool:
    description: "Boolean value"
    values: [true, false]
    methods:
      - toString(): String
      - not(): Bool
      
  Date:
    description: "Date without time"
    format: "YYYY-MM-DD"
    examples: ["2024-01-15"]
    
  DateTime:
    description: "Date and time with timezone"
    format: "ISO 8601"
    examples: ["2024-01-15T10:30:00Z"]
    
  UUID:
    description: "Universally unique identifier"
    format: "UUID v4"
    examples: ["550e8400-e29b-41d4-a716-446655440000"]
```

### Composite Types

```yaml
CompositeTypes:
  List<T>:
    description: "Ordered collection of elements"
    examples: ["[1, 2, 3]", "[\"a\", \"b\"]"]
    methods:
      - length(): Int
      - get(index: Int): T
      - first(): T
      - last(): T
      - push(item: T): List<T>
      - filter(predicate: T -> Bool): List<T>
      - map(transform: T -> U): List<U>
      - reduce(initial: U, accumulator: (U, T) -> U): U
      
  Map<K, V>:
    description: "Key-value mapping"
    examples: ["{\"name\": \"Alice\", \"age\": 30}"]
    methods:
      - get(key: K): Option<V>
      - set(key: K, value: V): Map<K, V>
      - has(key: K): Bool
      - keys(): List<K>
      - values(): List<V>
      - entries(): List<Tuple<K, V>>
      
  Set<T>:
    description: "Unique unordered collection"
    examples: ["{1, 2, 3}", "{\"a\", \"b\"}"]
    methods:
      - has(item: T): Bool
      - add(item: T): Set<T>
      - remove(item: T): Set<T>
      - union(other: Set<T>): Set<T>
      - intersection(other: Set<T>): Set<T>
      
  Tuple<T1, T2, ...>:
    description: "Fixed-length ordered collection"
    examples: ["(1, \"hello\")", "(true, 42, 3.14)"]
    methods:
      - first(): T1
      - second(): T2
      - nth(index: Int): T
```

### Result Types

```yaml
ResultTypes:
  Result<T, E>:
    description: "Success or error result"
    variants:
      Ok: { value: T }
      Err: { error: E }
    methods:
      - isOk(): Bool
      - isErr(): Bool
      - unwrap(): T  # Panics on Err
      - unwrapOr(default: T): T
      - map(transform: T -> U): Result<U, E>
      - mapErr(transform: E -> F): Result<T, F>
      
  Option<T>:
    description: "Value or absence"
    variants:
      Some: { value: T }
      None: {}
    methods:
      - isSome(): Bool
      - isNone(): Bool
      - unwrap(): T  # Panics on None
      - unwrapOr(default: T): T
      - map(transform: T -> U): Option<U>
      - filter(predicate: T -> Bool): Option<T>
      
  Either<L, R>:
    description: "Left or right value"
    variants:
      Left: { value: L }
      Right: { value: R }
    methods:
      - isLeft(): Bool
      - isRight(): Bool
      - left(): Option<L>
      - right(): Option<R>
```

### Common Types

```yaml
CommonTypes:
  Email:
    base: String
    validation: "RFC 5322 email format"
    example: "user@example.com"
    
  URL:
    base: String
    validation: "URI format"
    example: "https://example.com/path?query=1"
    
  Phone:
    base: String
    validation: "E.164 format"
    example: "+1234567890"
    
  Currency:
    base: String
    validation: "ISO 4217 code"
    examples: ["USD", "EUR", "JPY"]
    
  Money:
    fields:
      amount: Decimal
      currency: Currency
    example: { amount: 99.99, currency: "USD" }
    
  Percentage:
    base: Float
    range: "0.0 to 100.0"
    
  ID<T>:
    description: "Typed identifier"
    base: String
    example: "ID<User> = \"usr_123\""
    
  Timestamp:
    base: Int
    description: "Unix timestamp in milliseconds"
```

### Type Functions

```yaml
TypeFunctions:
  Validation:
    assert:
      signature: "assert(condition: Bool, message: String): Result<T, Error>"
      description: "Assert condition, return error if false"
      
    validate:
      signature: "validate<T>(value: Any, schema: Schema): Result<T, ValidationError>"
      description: "Validate value against schema"
      
  Transformation:
    parse:
      signature: "parse<T>(string: String): Result<T, ParseError>"
      description: "Parse string to type T"
      
    stringify:
      signature: "stringify(value: T): String"
      description: "Convert value to string"
      
    cast:
      signature: "cast<T, U>(value: T): Result<U, CastError>"
      description: "Safely cast between types"
      
  Collection:
    head:
      signature: "head<T>(list: List<T>): Option<T>"
      description: "First element or None"
      
    tail:
      signature: "tail<T>(list: List<T>): List<T>"
      description: "All elements except first"
      
    take:
      signature: "take<T>(list: List<T>, n: Int): List<T>"
      description: "First n elements"
      
    drop:
      signature: "drop<T>(list: List<T>, n: Int): List<T>"
      description: "Elements after first n"
```

### Platform Types

```yaml
PlatformTypes:
  HTTP:
    Request:
      fields:
        method: String  # GET, POST, PUT, DELETE
        path: String
        headers: Map<String, String>
        query: Map<String, String>
        body: Option<Any>
        
    Response:
      fields:
        status: Int
        headers: Map<String, String>
        body: Option<Any>
        
  Database:
    Connection:
      fields:
        host: String
        port: Int
        database: String
        credentials: Credentials
        
    Query:
      fields:
        sql: String
        params: List<Any>
        
    ResultSet:
      fields:
        rows: List<Map<String, Any>>
        affected: Int
        
  File:
    FileInfo:
      fields:
        path: String
        name: String
        extension: String
        size: Int
        modified: DateTime
        
    FileMode:
      values: [Read, Write, Append, ReadWrite]
```

### Type Assertions

```yaml
TypeAssertions:
  is:
    signature: "is<T>(value: Any): Bool"
    description: "Check if value is type T"
    example: "is<String>(x)"
    
  as:
    signature: "as<T>(value: Any): Option<T>"
    description: "Attempt cast to T, return None on failure"
    example: "as<Int>(\"42\")  # Some(42)"
    
  require:
    signature: "require<T>(value: Any): T"
    description: "Cast to T, panic on failure"
    example: "require<User>(context.user)"
```

### Language Mappings

```yaml
LanguageMappings:
  TypeScript:
    String: string
    Int: number
    Float: number
    Bool: boolean
    Date: Date
    List<T>: T[]
    Map<K, V>: Record<K, V>
    Option<T>: T | null
    Result<T, E>: { ok: true; value: T } | { ok: false; error: E }
    
  Go:
    String: string
    Int: int
    Float: float64
    Bool: bool
    Date: time.Time
    List<T>: []T
    Map<K, V>: map[K]V
    Option<T>: *T
    Result<T, E>: (T, error)
    
  Python:
    String: str
    Int: int
    Float: float
    Bool: bool
    Date: datetime.date
    List<T>: list[T]
    Map<K, V>: dict[K, V]
    Option<T>: T | None
    Result<T, E>: T | Exception
    
  Rust:
    String: String
    Int: i64
    Float: f64
    Bool: bool
    Date: chrono::NaiveDate
    List<T>: Vec<T>
    Map<K, V>: HashMap<K, V>
    Option<T>: Option<T>
    Result<T, E>: Result<T, E>
```

## Examples

### Example 1: Using Primitive Types

```yaml
spec_block:
  kind: "@kind:entity"
  content: |
    User:
      id: ID<User>
      email: Email
      name: String
      age: Int
      active: Bool
      createdAt: DateTime
```

### Example 2: Using Composite Types

```yaml
spec_block:
  kind: "@kind:entity"
  content: |
    Order:
      id: ID<Order>
      items: List<OrderItem>
      metadata: Map<String, String>
      tags: Set<String>
      coordinates: Tuple<Float, Float>  # lat, lng
```

### Example 3: Using Result Types

```yaml
spec_block:
  kind: "@kind:operation"
  content: |
    LoginResult: Result<Session, LoginError>
    
    LoginError:
      - InvalidCredentials
      - AccountLocked
      - TooManyAttempts
      
    login(email: Email, password: String): LoginResult
```

### Example 4: Type Functions

```yaml
spec_block:
  kind: "@kind:code"
  content: |
    # Validation
    assert(email.contains("@"), "Invalid email format")
    
    # Transformation
    age = parse<Int>(ageString).unwrapOr(0)
    
    # Collection operations
    activeUsers = users.filter(u => u.active)
    userEmails = users.map(u => u.email)
```

## Implementation

```python
class StdLib:
    TYPES = {
        "String": StringType(),
        "Int": IntType(),
        "Float": FloatType(),
        "Bool": BoolType(),
        "Date": DateType(),
        "DateTime": DateTimeType(),
        "List": ListType(),
        "Map": MapType(),
        "Set": SetType(),
        "Option": OptionType(),
        "Result": ResultType(),
    }
    
    FUNCTIONS = {
        "assert": AssertFunction(),
        "validate": ValidateFunction(),
        "parse": ParseFunction(),
        "stringify": StringifyFunction(),
    }
    
    @classmethod
    def get_type(cls, name: str, type_params: list = None):
        base_type = cls.TYPES.get(name)
        if base_type and type_params:
            return base_type.with_params(type_params)
        return base_type
        
    @classmethod
    def map_to_language(cls, type_name: str, target: str) -> str:
        mappings = cls.LANGUAGE_MAPPINGS.get(target, {})
        return mappings.get(type_name, type_name)
```

## References

- "@ref:speclang/stdlib
- @ref:speclang/stdlib.spec.dir/types
- @ref:speclang/stdlib.spec.dir/mapping
- SIP 3: Block System
- SIP 12: Code Generation

## Copyright

This document is in the public domain.
