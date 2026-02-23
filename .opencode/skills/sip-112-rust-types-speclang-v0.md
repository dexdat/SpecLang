---
name: sip-112-rust-types-speclang-v0
title: "SIP 112: Rust Type Mappings"
version: 0.1.0
description: Comprehensive type mappings from SpecLang to Rust with ownership and lifetime considerations
category: standard
---

# SIP 112: Rust Type Mappings

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the canonical type mappings from SpecLang types to Rust types.

### Quick Start

| SpecLang | Rust | Notes |
|----------|------|-------|
| String | String | Owned |
| &String | &str | Borrowed |
| Int | i32 | Default integer |
| Float | f64 | Default float |
| Bool | bool | |
| UUID | Uuid | uuid crate |
| DateTime | DateTime<T> | chrono crate |
| List<T> | Vec<T> | |
| Map<K,V> | HashMap<K,V> | |
| Optional<T> | Option<T> | |

### When to Read This

- **Rust codegen:** Mapping SpecLang types to Rust
- **Ownership:** Understanding move semantics
- **Lifetimes:** Reference lifetime considerations

### Related SIPs

- SIP 66: Go Generator
- SIP 109: Go Types
- SIP 110: Python Types
- SIP 111: TypeScript Types

## Abstract

This SIP specifies complete type mappings from SpecLang's type system to Rust's type system, including ownership semantics, lifetimes, and idiomatic Rust patterns.

## Specification

### Primitive Types

**@rust/primitives:**

```speclang
# @block:rust/primitives @kind:entity
RustPrimitiveMapping:
  String: String          # Owned
  &String: &str           # Borrowed
  Int: i32                # Default
  Int8: i8
  Int16: i16
  Int32: i32
  Int64: i64
  Int128: i128
  UInt: u32               # Default
  UInt8: u8
  UInt16: u16
  UInt32: u32
  UInt64: u64
  UInt128: u128
  Float: f64              # Default
  Float32: f32
  Float64: f64
  Bool: bool
  Char: char
  Bytes: Vec<u8>          # Owned bytes
  &Bytes: &[u8]          # Borrowed bytes
```

### Special Types

**@rust/special-types:**

```speclang
# @block:rust/special-types @kind:entity
RustSpecialMapping:
  UUID: Uuid             # uuid::Uuid
  DateTime<T>: DateTime<T>  # chrono::DateTime
  Date: NaiveDate        # chrono::NaiveDate
  Time: NaiveTime        # chrono::NaiveTime
  Duration: Duration     # std::time::Duration
  URL: Url               # url::Url
  Email: String          # Validate as String
  JSON: Value            # serde_json::Value
  Any: Box<dyn StdError> # Trait objects
```

### Collection Types

**@rust/collections:**

```speclang
# @block:rust/collections @kind:entity
RustCollectionMapping:
  List<T>: Vec<T>
  Set<T>: HashSet<T>
  BTreeSet<T>: BTreeSet<T>
  Map<K,V>: HashMap<K, V>
  BTreeMap<K,V>: BTreeMap<K, V>
  Option<T>: Option<T>
  Result<T,E>: Result<T, E>
  Slice<T>: &[T]         # Borrowed
  &Slice<T>: &[T]
```

### Optional Types

**@rust/optional:**

```speclang
# @block:rust/optional @kind:entity
RustOptionalMapping:
  Optional<T>: Option<T>
  Nullable<T>: Option<T>
  
Pattern:
  // Some value
  let name: Option<String> = Some("Alice".to_string());
  
  // No value
  let name: Option<String> = None;
  
  // With default
  let name = opt.unwrap_or_default();
```

### Enum Types

**@rust/enums:**

```speclang
# @block:rust/enums @kind:entity
RustEnumMapping:
  Enum: enum
  ErrorEnum: enum with std::error::Error
  
Pattern 1 - basic:
  enum Status {
      Active,
      Inactive,
  }
  
Pattern 2 - with data:
  enum Status {
      Active { since: DateTime<Utc> },
      Inactive { reason: String },
  }
  
Pattern 3 - C-like:
  enum Status {
      Active = 1,
      Inactive = 2,
  }
```

### Struct Types

**@rust/structs:**

```speclang
# @block:rust/structs @kind:entity
RustStructMapping:
  Entity: struct
  TupleStruct: tuple struct
  
Pattern 1 - regular:
  struct User {
      id: Uuid,
      email: String,
      name: Option<String>,
      created_at: DateTime<Utc>,
  }
  
Pattern 2 - tuple:
  struct Point(f32, f32);
  
Pattern 3 - unit:
  struct Marker;
```

### Trait Types

**@rust/traits:**

```speclang
# @block:rust/traits @kind:entity
RustTraitMapping:
  Interface: trait
  
Pattern:
  trait UserRepository {
      fn get(&self, id: Uuid) -> Result<User, Error>;
      fn create(&self, user: &User) -> Result<(), Error>;
      fn update(&self, user: &User) -> Result<(), Error>;
      fn delete(&self, id: Uuid) -> Result<(), Error>;
  }
  
  // With lifetimes
  trait Parser {
      fn parse<'a>(&'a self, input: &'a str) -> Result<&'a str, Error>;
  }
```

### Serialization

**@rust/serialization:**

```speclang
# @block:rust/serialization @kind:entity
RustSerializationMapping:
  Serialize: #[derive(Serialize)]
  Deserialize: #[derive(Deserialize)]
  
Pattern:
  use serde::{Serialize, Deserialize};
  
  #[derive(Serialize, Deserialize)]
  struct User {
      #[serde(rename = "id")]
      id: Uuid,
      
      #[serde(skip_serializing_if = "Option::is_none")]
      name: Option<String>,
      
      #[serde(with = "chrono::serde::ts_seconds")]
      created_at: DateTime<Utc>,
  }
```

### Validation Rules

**@rust/type-validation:**

```speclang
# @block:rust/type-validation @kind:operation
ValidationRules:
  - name: "Ownership"
    rule: "Use String for owned, &str for borrowed"
    
  - name: "Copy vs Clone"
    rule: "Derive Copy for cheap types, Clone for expensive"
    
  - name: "Lifetimes"
    rule: "Always annotate lifetimes for references"
    
  - name: "Error Handling"
    rule: "Use Result<T, E> for fallible operations"
    
  - name: "Traits"
    rule: "Define traits for abstractions, impl for concrete"
```

### Edge Cases

**@rust/edge-cases:**

```speclang
# @block:rust/edge-cases @kind:note
Edge Cases:

1. String vs &str
   - String: owned, heap-allocated
   - &str: borrowed, slice
   - Use String for storage, &str for references
   
2. Vec vs Slice
   - Vec: owned, dynamic array
   - &[T]: borrowed, view into memory
   - Functions accept &[T], return Vec<T>
   
3. Option vs Null
   - Option<T>: type-safe presence check
   - Never use null pointers
   - Use .unwrap_or() or ? operator
   
4. Result vs Panic
   - Result: recoverable errors
   - panic!: unrecoverable errors
   - Use Result for expected failures
```

### Type Conversion

**@rust/conversion:**

```speclang
# @block:rust/conversion @kind:operation
ConversionPatterns:
  StringToInt:
    spec: "String"
    rust: "s.parse::<i32>()?"
    
  IntToString:
    spec: "Int"
    rust: "n.to_string()"
    
  JSONParse:
    spec: "JSON"
    rust: "serde_json::from_str::<T>(&s)?"
    
  JSONSerialize:
    spec: "Any"
    rust: "serde_json::to_string(&obj)?"
    
  UUID:
    spec: "UUID"
    rust: "Uuid::parse_str(&s)?"
    
  DateTime:
    spec: "DateTime"
    rust: "DateTime::parse_from_rfc3339(&s)?"
```

## Implementation

### Type Mapper

```typescript
class RustTypeMapper {
  map(speclangType: string, context?: TypeContext): string {
    // Handle generic types first
    if (speclangType.includes('<')) {
      return this.mapGeneric(speclangType);
    }
    
    // Primitive types
    if (this.primitives[speclangType]) {
      return this.primitives[speclangType];
    }
    
    // Special types
    if (this.special[speclangType]) {
      return this.special[speclangType];
    }
    
    // Return as-is (custom type)
    return speclangType;
  }
  
  private mapGeneric(typeStr: string): string {
    const match = typeStr.match(/^(\w+)<(.+)>$/);
    if (!match) return typeStr;
    
    const [, base, args] = match;
    const mappedBase = this.primitives[base] || base;
    
    switch (base) {
      case 'List':
        return `Vec<${this.map(args)}>`;
      case 'Set':
        return `HashSet<${this.map(args)}>`;
      case 'BTreeSet':
        return `BTreeSet<${this.map(args)}>`;
      case 'Map':
        const [k, v] = args.split(',').map(a => this.map(a.trim()));
        return `HashMap<${k}, ${v}>`;
      case 'BTreeMap':
        const [bk, bv] = args.split(',').map(a => this.map(a.trim()));
        return `BTreeMap<${bk}, ${bv}>`;
      case 'Option':
      case 'Optional':
        return `Option<${this.map(args)}>`;
      case 'Result':
        const [ok, err] = args.split(',').map(a => this.map(a.trim()));
        return `Result<${ok}, ${err}>`;
      case 'Slice':
        return `&[${this.map(args)}]`;
      default:
        return `${mappedBase}<${this.map(args)}>`;
    }
  }
  
  private primitives: Record<string, string> = {
    'String': 'String',
    'Int': 'i32',
    'Int8': 'i8',
    'Int16': 'i16',
    'Int32': 'i32',
    'Int64': 'i64',
    'Int128': 'i128',
    'UInt': 'u32',
    'UInt8': 'u8',
    'UInt16': 'u16',
    'UInt32': 'u32',
    'UInt64': 'u64',
    'UInt128': 'u128',
    'Float': 'f64',
    'Float32': 'f32',
    'Float64': 'f64',
    'Bool': 'bool',
    'Char': 'char',
    'Bytes': 'Vec<u8>',
  };
  
  private special: Record<string, string> = {
    'UUID': 'Uuid',
    'DateTime': 'DateTime<Utc>',
    'Date': 'NaiveDate',
    'Time': 'NaiveTime',
    'Duration': 'Duration',
    'URL': 'Url',
    'JSON': 'Value',
  };
}
```

### Import Resolver

```typescript
class RustImportResolver {
  resolve(types: string[]): string[] {
    const imports = new Set<string>([
      'std::error::Error',
    ]);
    
    for (const type of types) {
      if (type.includes('Uuid')) {
        imports.add('uuid::Uuid');
      }
      if (type.includes('DateTime') || type.includes('NaiveDate') || type.includes('Duration')) {
        imports.add('chrono::{DateTime, Utc, NaiveDate, NaiveTime, Duration}');
      }
      if (type.includes('Url')) {
        imports.add('url::Url');
      }
      if (type.includes('HashMap') || type.includes('HashSet')) {
        imports.add('std::collections::{HashMap, HashSet}');
      }
      if (type.includes('BTreeMap') || type.includes('BTreeSet')) {
        imports.add('std::collections::{BTreeMap, BTreeSet}');
      }
      if (type.includes('Vec')) {
        imports.add('std::vec::Vec');
      }
      if (type.includes('Result')) {
        imports.add('std::result::Result');
      }
      if (type.includes('Value')) {
        imports.add('serde_json::Value');
      }
    }
    
    return Array.from(imports).sort();
  }
}
```

### Serde Attribute Generator

```typescript
class SerdeAttributeGenerator {
  generateAttributes(field: Field): string[] {
    const attrs = [];
    
    if (field.name !== this.toSnake(field.name)) {
      attrs.push(`rename = "${field.name}"`);
    }
    
    if (field.optional) {
      attrs.push('skip_serializing_if = "Option::is_none"');
    }
    
    if (field.default) {
      attrs.push(`default`);
    }
    
    if (field.type === 'DateTime') {
      attrs.push('with = "chrono::serde::ts_seconds"');
    }
    
    return attrs;
  }
  
  private toSnake(name: string): string {
    return name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/__+/g, '_');
  }
}
```

## References

- @ref:specs/rust.types
- @ref:specs/rust/generator
- SIP 66: Go Generator
- SIP 109: Go Types
- SIP 110: Python Types
- SIP 111: TypeScript Types

## Copyright

This document is in the public domain.
