---
name: sip-111-typescript-types-speclang-v0
title: "SIP 111: TypeScript Type Mappings"
version: 0.1.0
description: Comprehensive type mappings from SpecLang to TypeScript with strict mode support
category: standard
---

# SIP 111: TypeScript Type Mappings

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the canonical type mappings from SpecLang types to TypeScript types.

### Quick Start

| SpecLang | TypeScript | Notes |
|----------|------------|-------|
| String | string | |
| Int | number | No integer type |
| Float | number | |
| Bool | boolean | |
| UUID | string | Use uuid package |
| DateTime | Date | |
| List<T> | T[] | |
| Map<K,V> | Map<K, V> | |
| Optional<T> | T \| undefined | |

### When to Read This

- **TypeScript codegen:** Mapping SpecLang types to TS
- **Strict mode:** Type safety best practices
- **Zod integration:** Validation schemas

### Related SIPs

- SIP 109: Go Types
- SIP 110: Python Types
- SIP 112: Rust Types

## Abstract

This SIP specifies complete type mappings from SpecLang's type system to TypeScript's type system, including strict mode considerations, utility types, and Zod schema generation.

## Specification

### Primitive Types

**@typescript/primitives:**

```speclang
# @block:typescript/primitives @kind:entity
TypeScriptPrimitiveMapping:
  String: string
  Int: number           # No integer type in TS
  Int8: number
  Int16: number
  Int32: number
  Int64: number
  UInt: number
  UInt8: number
  UInt16: number
  UInt32: number
  UInt64: number
  Float: number
  Float32: number
  Float64: number
  Bool: boolean
  Bytes: Uint8Array
  BigInt: bigint
```

### Special Types

**@typescript/special-types:**

```speclang
# @block:typescript/special-types @kind:entity
TypeScriptSpecialMapping:
  UUID: string           # Use string or uuid package
  DateTime: Date
  Date: Date
  Time: string          # ISO time string
  Duration: number       # milliseconds
  URL: URL
  Email: string         # Validate, don't wrap
  JSON: unknown         # Parse with JSON.parse
  Any: unknown
  Void: void
  Never: never
  Null: null
  Undefined: undefined
```

### Collection Types

**@typescript/collections:**

```speclang
# @block:typescript/collections @kind:entity
TypeScriptCollectionMapping:
  List<T>: T[]
  Set<T>: Set<T>
  Map<K,V>: Map<K, V>
  Array<T>: T[]
  ReadonlyArray<T>: readonly T[]
  Record<K,V>: Record<K, V>
  Partial<T>: Partial<T>
  Required<T>: Required<T>
  Pick<T,K>: Pick<T, K>
  Omit<T,K>: Omit<T, K>
```

### Optional Types

**@typescript/optional:**

```speclang
# @block:typescript/optional @kind:entity
TypeScriptOptionalMapping:
  Optional<T>: T | undefined
  Nullable<T>: T | null
  Maybe<T>: T | undefined | null
  
Note: Distinguish between:
  - undefined: not provided
  - null: explicitly null
```

### Union Types

**@typescript/unions:**

```speclang
# @block:typescript/unions @kind:entity
TypeScriptUnionMapping:
  Union<T1,T2>: T1 | T2
  OneOf<T1,T2>: T1 | T2
  AnyOf<T1,T2,T3>: T1 | T2 | T3
  
Note: Use discriminated unions
for type narrowing.
```

### Enum Types

**@typescript/enums:**

```speclang
# @block:typescript/enums @kind:entity
TypeScriptEnumMapping:
  Enum: const enum or enum
  StringEnum: const enum as const
  
Pattern 1 - string enum:
  enum Status {
      Active = "active",
      Inactive = "inactive",
  }
  
Pattern 2 - const object:
  const Status = {
      Active: "active",
      Inactive: "inactive",
  } as const;
  
  type Status = typeof Status[keyof typeof Status];
  
Pattern 3 - string union:
  type Status = "active" | "inactive";
```

### Interface Types

**@typescript/interfaces:**

```speclang
# @block:typescript/interfaces @kind:entity
TypeScriptInterfaceMapping:
  Entity: interface
  EntityExtends: interface extends
  
Pattern:
  interface User {
      id: string;
      email: string;
      name?: string;      // Optional
      createdAt: Date;
  }
  
  interface Admin extends User {
      role: "admin";
      permissions: string[];
  }
```

### Zod Integration

**@typescript/zod:**

```speclang
# @block:typescript/zod @kind:entity
ZodMapping:
  Entity: z.object
  String: z.string()
  Int: z.number().int()
  Float: z.number()
  Bool: z.boolean()
  Optional: z.optional()
  Nullable: z.nullable()
  
Pattern:
  import { z } from 'zod';
  
  const UserSchema = z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string().optional(),
      createdAt: z.date(),
  });
  
  type User = z.infer<typeof UserSchema>;
```

### Validation Rules

**@typescript/type-validation:**

```speclang
# @block:typescript/type-validation @kind:operation
ValidationRules:
  - name: "Strict Null Checks"
    rule: "Always enable strictNullChecks in tsconfig"
    
  - name: "No Implicit Any"
    rule: "Never use any, use unknown instead"
    
  - name: "Integer Types"
    rule: "Use number().int() for integers, no native type"
    
  - name: "Readonly"
    rule: "Use readonly for immutable arrays/objects"
    
  - name: "Discriminated Unions"
    rule: "Use discriminated unions for variant types"
```

### Edge Cases

**@typescript/edge-cases:**

```speclang
# @block:typescript/edge-cases @kind:note
Edge Cases:

1. Integer vs Float
   - Both use 'number' in TypeScript
   - Use Zod .int() for validation
   - Document intent in comments
   
2. Date Serialization
   - JSON: Dates become ISO strings
   - Use Date.prototype.toJSON()
   - Consider: serialize dates as ISO strings
   
3. BigInt
   - Use bigint type for large integers
   - Not JSON serializable
   - Convert to string for transport
   
4. Tuples
   - Use [T1, T2, ...] for tuples
   - Specify exact types and lengths
```

### Type Conversion

**@typescript/conversion:**

```speclang
# @block:typescript/conversion @kind:operation
ConversionPatterns:
  StringToInt:
    spec: "String"
    ts: "parseInt(s, 10) or Number(s)"
    
  IntToString:
    spec: "Int"
    ts: "n.toString() or String(n)"
    
  JSONParse:
    spec: "JSON"
    ts: "JSON.parse(s) as T"
    
  Date:
    spec: "DateTime"
    ts: "new Date(s) or Date.parse(s)"
    
  UUID:
    spec: "UUID"
    ts: "string with uuid() or crypto.randomUUID()"
```

## Implementation

### Type Mapper

```typescript
class TypeScriptTypeMapper {
  map(speclangType: string, config?: TSConfig): string {
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
      case 'Array':
        return `${this.map(args)}[]`;
      case 'ReadonlyArray':
        return `readonly ${this.map(args)}[]`;
      case 'Set':
        return `Set<${this.map(args)}>`;
      case 'Map':
        const [k, v] = args.split(',').map(a => this.map(a.trim()));
        return `Map<${k}, ${v}>`;
      case 'Record':
        const [rk, rv] = args.split(',').map(a => this.map(a.trim()));
        return `Record<${rk}, ${rv}>`;
      case 'Pick':
        const [pickObj, pickKeys] = args.split(',').map(a => a.trim());
        return `Pick<${pickObj}, ${pickKeys}>`;
      case 'Omit':
        const [omitObj, omitKeys] = args.split(',').map(a => a.trim());
        return `Omit<${omitObj}, ${omitKeys}>`;
      case 'Optional':
        return `${this.map(args)} | undefined`;
      case 'Nullable':
        return `${this.map(args)} | null`;
      case 'Union':
        const unionArgs = args.split(',').map(a => this.map(a.trim()));
        return unionArgs.join(' | ');
      default:
        return `${mappedBase}<${this.map(args)}>`;
    }
  }
  
  private primitives: Record<string, string> = {
    'String': 'string',
    'Int': 'number',
    'Int8': 'number',
    'Int16': 'number',
    'Int32': 'number',
    'Int64': 'number',
    'UInt': 'number',
    'UInt8': 'number',
    'UInt16': 'number',
    'UInt32': 'number',
    'UInt64': 'number',
    'Float': 'number',
    'Float32': 'number',
    'Float64': 'number',
    'Bool': 'boolean',
    'Bytes': 'Uint8Array',
    'BigInt': 'bigint',
  };
  
  private special: Record<string, string> = {
    'UUID': 'string',
    'DateTime': 'Date',
    'Date': 'Date',
    'Time': 'string',
    'Duration': 'number',
    'URL': 'URL',
    'Email': 'string',
    'JSON': 'unknown',
    'Any': 'unknown',
    'Void': 'void',
    'Never': 'never',
    'Null': 'null',
    'Undefined': 'undefined',
  };
}
```

### Zod Schema Generator

```typescript
class ZodSchemaGenerator {
  generateSchema(speclangType: string): string {
    if (this.schemas[speclangType]) {
      return this.schemas[speclangType];
    }
    
    if (speclangType.includes('<')) {
      return this.generateGenericSchema(speclangType);
    }
    
    return `z.${this.toZodPrimitive(speclangType)}()`;
  }
  
  private generateGenericSchema(typeStr: string): string {
    const match = typeStr.match(/^(\w+)<(.+)>$/);
    if (!match) return 'z.any()';
    
    const [, base, args] = match;
    
    switch (base) {
      case 'List':
        return `z.array(${this.generateSchema(args)})`;
      case 'Optional':
        return `z.optional(${this.generateSchema(args)})`;
      case 'Nullable':
        return `z.nullable(${this.generateSchema(args)})`;
      case 'Map':
        const [k, v] = args.split(',').map(a => a.trim());
        return `z.map(${this.generateSchema(k)}, ${this.generateSchema(v)})`;
      case 'Union':
        const unionArgs = args.split(',').map(a => this.generateSchema(a.trim()));
        return `z.union([${unionArgs.join(', ')}])`;
      default:
        return 'z.any()';
    }
  }
  
  private toZodPrimitive(type: string): string {
    const mapping: Record<string, string> = {
      'String': 'string',
      'Int': 'number',
      'Float': 'number',
      'Bool': 'boolean',
      'DateTime': 'date',
      'UUID': 'string',
    };
    return mapping[type] || 'any';
  }
  
  private schemas: Record<string, string> = {
    'UUID': 'z.string().uuid()',
    'Email': 'z.string().email()',
    'URL': 'z.string().url()',
  };
}
```

## References

- @ref:specs/typescript.types
- @ref:specs/typescript/generator
- SIP 109: Go Types
- SIP 110: Python Types
- SIP 112: Rust Types

## Copyright

This document is in the public domain.
