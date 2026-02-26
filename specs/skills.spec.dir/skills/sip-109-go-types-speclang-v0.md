---
name: sip-109-go-types-speclang-v0
title: "SIP 109: Go Type Mappings"
version: 0.1.0
description: Comprehensive type mappings from SpecLang to Go with validation and edge cases
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 109: Go Type Mappings

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the canonical type mappings from SpecLang types to Go types.

### Quick Start

| SpecLang | Go | Notes |
|----------|-----|-------|
| String | string | |
| Int | int | Platform-dependent |
| Int8-64 | int8-64 | Explicit sizes |
| Float32 | float32 | |
| Float64 | float64 | |
| Bool | bool | |
| UUID | uuid.UUID | External package |
| DateTime | time.Time | stdlib |

### When to Read This

- **Go codegen:** Mapping SpecLang types to Go
- **Type validation:** Ensuring type compatibility
- **Custom types:** Extending type mappings

### Related SIPs

- SIP 66: Go Generator
- SIP 110: Python Types
- SIP 111: TypeScript Types
- SIP 112: Rust Types

## Abstract

This SIP specifies complete type mappings from SpecLang's type system to Go's type system, including primitives, collections, special types, and custom mappings.

## Specification

### Primitive Types

**@go/primitives:**

```speclang
# @block:go/primitives @kind:entity
GoPrimitiveMapping:
  String: string
  Int: int
  Int8: int8
  Int16: int16
  Int32: int32
  Int64: int64
  UInt: uint
  UInt8: uint8
  UInt16: uint16
  UInt32: uint32
  UInt64: uint64
  Float32: float32
  Float64: float64
  Bool: bool
  Byte: byte
  Rune: rune
  Bytes: []byte
```

### Special Types

**@go/special-types:**

```speclang
# @block:go/special-types @kind:entity
GoSpecialMapping:
  UUID: uuid.UUID        # github.com/google/uuid
  DateTime: time.Time
  Date: time.Time        # Use time.Time for dates
  Time: time.Time        # Use time.Time for times
  Duration: time.Duration
  URL: *url.URL
  Email: string         # Validate, don't wrap
  JSON: json.RawMessage
  Any: interface{}
```

### Collection Types

**@go/collections:**

```speclang
# @block:go/collections @kind:entity
GoCollectionMapping:
  List<T>: []T
  Set<T>: map[T]struct{}
  Map<K,V>: map[K]V
  Queue<T>: chan T      # For async patterns
  Array<T,N>: [N]T      # Fixed size
```

### Optional Types

**@go/optional:**

```speclang
# @block:go/optional @kind:entity
GoOptionalMapping:
  Optional<T>: *T
  Nullable<T>: *T
  Maybe<T>: *T
  
Note: Go uses pointers for optional. Consider:
  - Zero value ambiguity
  - Nil vs zero comparisons
  - JSON omitempty behavior
```

### Union Types

**@go/unions:**

```speclang
# @block:go/unions @kind:entity
GoUnionMapping:
  Union<T1,T2>: interface{}
  OneOf<T1,T2>: interface{}
  AnyOf<T1,T2>: interface{}
  
Note: Consider using specific structs with tags
for better type safety when possible.
```

### Enum Types

**@go/enums:**

```speclang
# @block:go/enums @kind:entity
GoEnumMapping:
  Enum: int              # iota pattern
  StringEnum: string     # String constants
  
Pattern - iota:
  type Status int
  const (
      StatusUnknown Status = iota
      StatusActive
      StatusInactive
  )
  
Pattern - string:
  type Status string
  const (
      StatusActive   Status = "active"
      StatusInactive Status = "inactive"
  )
```

### Validation Rules

**@go/type-validation:**

```speclang
# @block:go/type-validation @kind:operation
ValidationRules:
  - name: "Pointer Safety"
    rule: "Optional<T> becomes *T, never nil pointer without reason"
    
  - name: "Zero Value"
    rule: "Prefer value types unless nil semantics needed"
    
  - name: "Interface Segregation"
    rule: "Use interfaces for dependencies, concrete types internally"
    
  - name: "JSON Tags"
    rule: "Always provide json tags, use omitempty for optional"
    
  - name: "Validation"
    rule: "Use struct tags for basic, validate package for complex"
```

### Edge Cases

**@go/edge-cases:**

```speclang
# @block:go/edge-cases @kind:note
Edge Cases:

1. Empty List vs Nil
   - List<T> []T - can be nil or empty
   - Consider: always initialize to empty slice
   
2. Empty Map vs Nil
   - Map<K,V> map[K]V - can be nil or empty
   - Consider: always initialize to make(map[K]V)
   
3. Time Zones
   - DateTime uses time.Time (always UTC internally)
   - Store timezone separately if needed
   
4. Custom Types
   - Map complex types to interfaces or generics
   - Consider: strongly typed wrappers for domain types
```

### Type Conversion

**@go/conversion:**

```speclang
# @block:go/conversion @kind:operation
ConversionPatterns:
  StringToInt:
    spec: "String"
    go: "strconv.Atoi or strconv.ParseInt"
    
  IntToString:
    spec: "Int"
    go: "strconv.Itoa or fmt.Sprintf"
    
  TimeParsing:
    spec: "DateTime"
    go: "time.Parse or time.ParseInLocation"
    
  UUID:
    spec: "UUID"
    go: "uuid.Parse or uuid.Must"
```

## Implementation

### Type Mapper

```typescript
class GoTypeMapper {
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
        return `[]${this.map(args)}`;
      case 'Set':
        return `map[${this.map(args)}]struct{}`;
      case 'Map':
        const [k, v] = args.split(',').map(a => this.map(a.trim()));
        return `map[${k}]${v}`;
      case 'Optional':
      case 'Nullable':
        return `*${this.map(args)}`;
      default:
        return `${mappedBase}[${this.map(args)}]`;
    }
  }
  
  private primitives: Record<string, string> = {
    'String': 'string',
    'Int': 'int',
    'Int8': 'int8',
    'Int16': 'int16',
    'Int32': 'int32',
    'Int64': 'int64',
    'UInt': 'uint',
    'UInt8': 'uint8',
    'UInt16': 'uint16',
    'UInt32': 'uint32',
    'UInt64': 'uint64',
    'Float32': 'float32',
    'Float64': 'float64',
    'Bool': 'bool',
    'Byte': 'byte',
    'Rune': 'rune',
    'Bytes': '[]byte',
  };
  
  private special: Record<string, string> = {
    'UUID': 'uuid.UUID',
    'DateTime': 'time.Time',
    'Date': 'time.Time',
    'Time': 'time.Time',
    'Duration': 'time.Duration',
    'URL': '*url.URL',
    'JSON': 'json.RawMessage',
    'Any': 'interface{}',
  };
}
```

### Import Resolver

```typescript
class GoImportResolver {
  resolve(types: string[]): string[] {
    const imports = new Set<string>([
      'fmt',
      'errors',
    ]);
    
    for (const type of types) {
      if (type.includes('uuid.UUID')) {
        imports.add('github.com/google/uuid');
      }
      if (type.includes('time.')) {
        imports.add('time');
      }
      if (type.includes('json.')) {
        imports.add('encoding/json');
      }
      if (type.includes('url.')) {
        imports.add('net/url');
      }
    }
    
    return Array.from(imports).sort();
  }
}
```

## References

- @ref:specs/go.types
- @ref:specs/go/generator
- SIP 66: Go Generator
- SIP 110: Python Types
- SIP 111: TypeScript Types

## Copyright

This document is in the public domain.
