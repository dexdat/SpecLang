---
name: sip-110-python-types-speclang-v0
title: "SIP 110: Python Type Mappings"
version: 0.1.0
description: Comprehensive type mappings from SpecLang to Python with typing module support
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 110: Python Type Mappings

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## 0.1 README

This SIP defines the canonical type mappings from SpecLang types to Python types.

### Quick Start

| SpecLang | Python | Notes |
|----------|--------|-------|
| String | str | |
| Int | int | Unlimited precision |
| Float | float | IEEE 754 |
| Bool | bool | |
| UUID | UUID | uuid.UUID |
| DateTime | datetime | datetime.datetime |
| List<T> | list[T] | Python 3.9+ |
| Map<K,V> | dict[K, V] | Python 3.9+ |
| Optional<T> | T \| None | Union syntax |

### When to Read This

- **Python codegen:** Mapping SpecLang types to Python
- **Type hints:** Using typing module correctly
- **Pydantic integration:** Validation models

### Related SIPs

- SIP 67: Python Generator
- SIP 109: Go Types
- SIP 111: TypeScript Types
- SIP 112: Rust Types

## Abstract

This SIP specifies complete type mappings from SpecLang's type system to Python's type system, including modern type hints (3.9+), typing module usage, and Pydantic integration.

## Specification

### Primitive Types

**@python/primitives:**

```speclang
# @block:python/primitives @kind:entity
PythonPrimitiveMapping:
  String: str
  Int: int
  Int8: int      # Python int is unbounded
  Int16: int
  Int32: int
  Int64: int
  Float: float
  Float32: float
  Float64: float
  Bool: bool
  Bytes: bytes
  ByteArray: bytearray
```

### Special Types

**@python/special-types:**

```speclang
# @block:python/special-types @kind:entity
PythonSpecialMapping:
  UUID: UUID              # uuid.UUID
  DateTime: datetime      # datetime.datetime
  Date: date              # datetime.date
  Time: time              # datetime.time
  Duration: timedelta     # datetime.timedelta
  Decimal: Decimal        # decimal.Decimal
  JSON: Any               # json.loads to dict
  Any: Any                # typing.Any
```

### Collection Types

**@python/collections:**

```speclang
# @block:python/collections @kind:entity
PythonCollectionMapping:
  List<T>: list[T]
  Set<T>: set[T]
  Map<K,V>: dict[K, V]
  Tuple<T1,T2>: tuple[T1, T2]
  Tuple<T...>: tuple[T, ...]
  FrozenSet<T>: frozenset[T]
  Sequence<T>: Sequence[T]
  Mapping<K,V>: Mapping[K, V]
```

### Optional Types

**@python/optional:**

```speclang
# @block:python/optional @kind:entity
PythonOptionalMapping:
  Optional<T>: T | None
  Nullable<T>: T | None
  Maybe<T>: T | None
  
Note: Python 3.10+ union syntax preferred.
For 3.9, use Optional[T] from typing.
```

### Union Types

**@python/unions:**

```speclang
# @block:python/unions @kind:entity
PythonUnionMapping:
  Union<T1,T2>: T1 | T2
  OneOf<T1,T2>: T1 | T2
  AnyOf<T1,T2,T3>: T1 | T2 | T3
  
Note: Use Literal for enum-like unions
of string constants.
```

### Enum Types

**@python/enums:**

```speclang
# @block:python/enums @kind:entity
PythonEnumMapping:
  Enum: Enum class
  StringEnum: str, Enum
  
Pattern 1 - standard:
  from enum import Enum
  
  class Status(Enum):
      ACTIVE = "active"
      INACTIVE = "inactive"
      
Pattern 2 - string enum:
  class Status(str, Enum):
      ACTIVE = "active"
      INACTIVE = "inactive"
      
Pattern 3 - auto:
  from enum import auto
  
  class Status(Enum):
      UNKNOWN = auto()
      ACTIVE = auto()
      INACTIVE = auto()
```

### Pydantic Integration

**@python/pydantic:**

```speclang
# @block:python/pydantic @kind:entity
PydanticMapping:
  Entity: BaseModel
  OptionalField: Optional[T] = None
  RequiredField: T = Field(...)
  DefaultField: T = Field(default=value)
  Validation: field_validator
  
Pattern:
  from pydantic import BaseModel, Field
  
  class User(BaseModel):
      id: UUID
      email: str = Field(...)
      name: str | None = None
      created_at: datetime = Field(default_factory=datetime.utcnow)
      
      @field_validator('email')
      @classmethod
      def validate_email(cls, v: str) -> str:
          if '@' not in v:
              raise ValueError('Invalid email')
          return v
```

### Validation Rules

**@python/type-validation:**

```speclang
# @block:python/type-validation @kind:operation
ValidationRules:
  - name: "Union Syntax"
    rule: "Use T | None (3.10+) or Optional[T] (3.9)"
    
  - name: "Generic Collections"
    rule: "Use list[T], dict[K,V] (3.9+) or List[T], Dict[K,V]"
    
  - name: "Pydantic Models"
    rule: "Use BaseModel for validated entities"
    
  - name: "Dataclasses"
    rule: "Use @dataclass for simple DTOs"
    
  - name: "Forward References"
    rule: "Use 'from __future__ import annotations'"
```

### Edge Cases

**@python/edge-cases:**

```speclang
# @block:python/edge-cases @kind:note
Edge Cases:

1. Empty Collections
   - list[T] - can be [] or None
   - dict[K,V] - can be {} or None
   - Consider: Optional[list[T]]
   
2. JSON Serialization
   - datetime serializes to ISO string
   - UUID serializes to string
   - Use model_dump(mode='json') for JSON
   
3. Decimal Precision
   - float is IEEE 754, loses precision
   - Use Decimal for money/precision
   
4. Type Checking vs Runtime
   - Some types only exist at type check time
   - Use TYPE_CHECKING for imports
```

### Type Conversion

**@python/conversion:**

```speclang
# @block:python/conversion @kind:operation
ConversionPatterns:
  StringToInt:
    spec: "String"
    python: "int(s) or ast.literal_eval"
    
  IntToString:
    spec: "Int"
    python: "str(n)"
    
  JSONParse:
    spec: "JSON"
    python: "json.loads(s) -> dict"
    
  JSONSerialize:
    spec: "Any"
    python: "json.dumps(obj)"
    
  UUID:
    spec: "UUID"
    python: "UUID(str) or uuid.UUID(str)"
```

## Implementation

### Type Mapper

```typescript
class PythonTypeMapper {
  map(speclangType: string, pythonVersion: number = 310): string {
    // Handle generic types first
    if (speclangType.includes('<')) {
      return this.mapGeneric(speclangType, pythonVersion);
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
  
  private mapGeneric(typeStr: string, version: number): string {
    const match = typeStr.match(/^(\w+)<(.+)>$/);
    if (!match) return typeStr;
    
    const [, base, args] = match;
    const mappedBase = this.primitives[base] || base;
    
    // Use modern syntax for 3.10+
    const useModern = version >= 310;
    
    switch (base) {
      case 'List':
        return `list[${this.map(args, version)}]`;
      case 'Set':
        return `set[${this.map(args, version)}]`;
      case 'FrozenSet':
        return `frozenset[${this.map(args, version)}]`;
      case 'Map':
        const [k, v] = args.split(',').map(a => this.map(a.trim(), version));
        return `dict[${k}, ${v}]`;
      case 'Tuple':
        const tupleArgs = args.split(',').map(a => this.map(a.trim(), version));
        return `tuple[${tupleArgs.join(', ')}]`;
      case 'Optional':
      case 'Nullable':
        const inner = this.map(args, version);
        return useModern ? `${inner} | None` : `Optional[${inner}]`;
      case 'Union':
        const unionArgs = args.split(',').map(a => this.map(a.trim(), version));
        return useModern ? unionArgs.join(' | ') : `Union[${unionArgs.join(', ')}]`;
      default:
        return `${mappedBase}[${this.map(args, version)}]`;
    }
  }
  
  private primitives: Record<string, string> = {
    'String': 'str',
    'Int': 'int',
    'Int8': 'int',
    'Int16': 'int',
    'Int32': 'int',
    'Int64': 'int',
    'Float': 'float',
    'Float32': 'float',
    'Float64': 'float',
    'Bool': 'bool',
    'Bytes': 'bytes',
    'ByteArray': 'bytearray',
  };
  
  private special: Record<string, string> = {
    'UUID': 'UUID',
    'DateTime': 'datetime',
    'Date': 'date',
    'Time': 'time',
    'Duration': 'timedelta',
    'Decimal': 'Decimal',
    'JSON': 'Any',
    'Any': 'Any',
  };
}
```

### Import Resolver

```typescript
class PythonImportResolver {
  resolve(types: string[]): Map<string, string[]> {
    const imports = new Map<string, Set<string>>();
    
    const addImport = (module: string, name: string) => {
      if (!imports.has(module)) {
        imports.set(module, new Set());
      }
      imports.get(module)!.add(name);
    };
    
    for (const type of types) {
      if (type.includes('UUID')) {
        addImport('uuid', 'UUID');
      }
      if (type.includes('datetime')) {
        addImport('datetime', 'datetime');
      }
      if (type.includes('date')) {
        addImport('datetime', 'date');
      }
      if (type.includes('time')) {
        addImport('datetime', 'time');
      }
      if (type.includes('timedelta')) {
        addImport('datetime', 'timedelta');
      }
      if (type.includes('Decimal')) {
        addImport('decimal', 'Decimal');
      }
      if (type.includes('Any')) {
        addImport('typing', 'Any');
      }
    }
    
    // Convert to sorted array format
    const result: [string, string[]][] = [];
    for (const [module, names] of imports) {
      result.push([module, Array.from(names).sort()]);
    }
    
    return new Map(result.sort((a, b) => a[0].localeCompare(b[0])));
  }
}
```

## References

- "@ref:specs/python.types
- @ref:specs/python/generator
- SIP 67: Python Generator
- SIP 109: Go Types
- SIP 111: TypeScript Types

## Copyright

This document is in the public domain.
