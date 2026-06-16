# Bootstrap Phase 3.7: Go Type Mappings

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 3.7 of the bootstrap process.

**Prerequisites**: 
- Phase 3.1 (Codegen Framework) complete
- Phase 3.5 (Go Generator) complete

## Your Task
Create comprehensive Go type mappings for the SpecLang stdlib. These mappings define how SpecLang types translate to idiomatic Go types.

## Read These Specs First
1. `specs/stdlib.spec.md` - Built-in types
2. `specs/compiler.spec.md` - Codegen pipeline
3. `docs/prompts/phase-3.5-go-generator.md` - Go generator (type mapping reference)

## What to Build

### Files to Create
```
src/codegen/targets/go/
├── types.ts              # Core type mappings
├── types_primitives.ts   # Primitive type handling
├── types_collections.ts  # Collection type handling  
├── types_generics.ts     # Generic type handling
└── types_special.ts      # Special types (time, uuid, etc.)
```

### Requirements

#### 1. Core Type Mappings (types.ts)
```typescript
interface GoTypeMapping {
  stdlib: string;
  go: string;
  import?: string;
  zeroValue: string;
  notes?: string;
}

export const GO_TYPE_MAPPINGS: GoTypeMapping[] = [
  // Primitives - Basic
  { stdlib: 'String', go: 'string', zeroValue: '""' },
  { stdlib: 'Int', go: 'int', zeroValue: '0' },
  { stdlib: 'Int8', go: 'int8', zeroValue: '0' },
  { stdlib: 'Int16', go: 'int16', zeroValue: '0' },
  { stdlib: 'Int32', go: 'int32', zeroValue: '0' },
  { stdlib: 'Int64', go: 'int64', zeroValue: '0' },
  { stdlib: 'UInt', go: 'uint', zeroValue: '0' },
  { stdlib: 'UInt8', go: 'uint8', zeroValue: '0' },
  { stdlib: 'UInt16', go: 'uint16', zeroValue: '0' },
  { stdlib: 'UInt32', go: 'uint32', zeroValue: '0' },
  { stdlib: 'UInt64', go: 'uint64', zeroValue: '0' },
  { stdlib: 'Float32', go: 'float32', zeroValue: '0.0' },
  { stdlib: 'Float64', go: 'float64', zeroValue: '0.0' },
  { stdlib: 'Bool', go: 'bool', zeroValue: 'false' },
  { stdlib: 'Byte', go: 'byte', zeroValue: '0' },
  { stdlib: 'Rune', go: 'rune', zeroValue: '0' },
  
  // Primitives - String variants
  { stdlib: 'Rune', go: 'rune', zeroValue: '0' },
  { stdlib: 'Char', go: 'rune', zeroValue: '0' },
  
  // Time types
  { stdlib: 'Date', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'DateTime', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'Time', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'Duration', go: 'time.Duration', import: 'time', zeroValue: '0' },
  
  // Identifiers
  { stdlib: 'UUID', go: 'uuid.UUID', import: 'github.com/google/uuid', zeroValue: 'uuid.Nil' },
  { stdlib: 'ID', go: 'uint64', zeroValue: '0', notes: 'Auto-increment ID' },
  
  // Collections
  { stdlib: 'Array<T>', go: '[]T', zeroValue: 'nil' },
  { stdlib: 'List<T>', go: '[]T', zeroValue: 'nil' },
  { stdlib: 'Slice<T>', go: '[]T', zeroValue: 'nil' },
  { stdlib: 'Map<K,V>', go: 'map[K]V', zeroValue: 'nil' },
  { stdlib: 'Set<T>', go: 'map[T]struct{}', zeroValue: 'nil' },
  
  // Optional
  { stdlib: 'Optional<T>', go: '*T', zeroValue: 'nil' },
  { stdlib: 'Nullable<T>', go: '*T', zeroValue: 'nil' },
  
  // Error handling
  { stdlib: 'Result<T>', go: 'T', zeroValue: 'T{}', notes: 'Use with error return' },
  { stdlib: 'Error', go: 'error', zeroValue: 'nil' },
  
  // Bytes
  { stdlib: 'Bytes', go: '[]byte', zeroValue: 'nil' },
  { stdlib: 'Blob', go: '[]byte', zeroValue: 'nil' },
  
  // Any
  { stdlib: 'Any', go: 'interface{}', zeroValue: 'nil' },
  { stdlib: 'Unknown', go: 'interface{}', zeroValue: 'nil' },
  
  // JSON
  { stdlib: 'JSON<T>', go: 'json.RawMessage', import: 'encoding/json', zeroValue: 'nil' },
  
  // Pointer (explicit)
  { stdlib: 'Ptr<T>', go: '*T', zeroValue: 'nil' },
];
```

#### 2. Type Resolution Function
```typescript
export interface TypeResolution {
  type: string;
  imports: string[];
  isPointer: boolean;
  isSlice: boolean;
  isMap: boolean;
}

export function resolveGoType(stdlibType: string): TypeResolution {
  // Handle generics first
  const generic = resolveGeneric(stdlibType);
  if (generic) return generic;
  
  // Lookup base type
  const mapping = GO_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
  if (mapping) {
    return {
      type: mapping.go,
      imports: mapping.import ? [mapping.import] : [],
      isPointer: false,
      isSlice: false,
      isMap: false
    };
  }
  
  // Unknown type - pass through (for custom types)
  return {
    type: stdlibType,
    imports: [],
    isPointer: false,
    isSlice: false,
    isMap: false
  };
}
```

#### 3. Generic Type Handling (types_generics.ts)
```typescript
function resolveGeneric(stdlibType: string): TypeResolution | null {
  // Array<T> -> []T
  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    const inner = resolveGoType(arrayMatch[1]);
    return {
      type: `[]${inner.type}`,
      imports: inner.imports,
      isPointer: false,
      isSlice: true,
      isMap: false
    };
  }
  
  // List<T> -> []T
  const listMatch = stdlibType.match(/^List<(.+)>$/);
  if (listMatch) {
    const inner = resolveGoType(listMatch[1]);
    return {
      type: `[]${inner.type}`,
      imports: inner.imports,
      isPointer: false,
      isSlice: true,
      isMap: false
    };
  }
  
  // Map<K,V> -> map[K]V
  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) {
    const key = resolveGoType(mapMatch[1]);
    const value = resolveGoType(mapMatch[2]);
    return {
      type: `map[${key.type}]${value.type}`,
      imports: [...key.imports, ...value.imports],
      isPointer: false,
      isSlice: false,
      isMap: true
    };
  }
  
  // Set<T> -> map[T]struct{}
  const setMatch = stdlibType.match(/^Set<(.+)>$/);
  if (setMatch) {
    const inner = resolveGoType(setMatch[1]);
    return {
      type: `map[${inner.type}]struct{}`,
      imports: inner.imports,
      isPointer: false,
      isSlice: false,
      isMap: true
    };
  }
  
  // Optional<T> -> *T
  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) {
    const inner = resolveGoType(optMatch[1]);
    return {
      type: `*${inner.type}`,
      imports: inner.imports,
      isPointer: true,
      isSlice: false,
      isMap: false
    };
  }
  
  // Nullable<T> -> *T
  const nullMatch = stdlibType.match(/^Nullable<(.+)>$/);
  if (nullMatch) {
    const inner = resolveGoType(nullMatch[1]);
    return {
      type: `*${inner.type}`,
      imports: inner.imports,
      isPointer: true,
      isSlice: false,
      isMap: false
    };
  }
  
  // Ptr<T> -> *T
  const ptrMatch = stdlibType.match(/^Ptr<(.+)>$/);
  if (ptrMatch) {
    const inner = resolveGoType(ptrMatch[1]);
    return {
      type: `*${inner.type}`,
      imports: inner.imports,
      isPointer: true,
      isSlice: false,
      isMap: false
    };
  }
  
  return null;
}
```

#### 4. Special Types (types_special.ts)
```typescript
// Time types with duration calculations
export const TIME_TYPE_MAPPINGS = {
  Date: { go: 'time.Time', import: 'time', methods: ['Year', 'Month', 'Day'] },
  DateTime: { go: 'time.Time', import: 'time', methods: ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'] },
  Time: { go: 'time.Time', import: 'time', methods: ['Hour', 'Minute', 'Second', 'Nanosecond'] },
  Duration: { go: 'time.Duration', import: 'time', methods: ['Hours', 'Minutes', 'Seconds', 'Milliseconds'] },
};

// UUID handling
export const UUID_MAPPING = {
  stdlib: 'UUID',
  go: 'uuid.UUID',
  import: 'github.com/google/uuid',
  zeroValue: 'uuid.Nil',
  methods: ['String', 'Bytes', 'Parse'],
  notes: 'Requires github.com/google/uuid package'
};

// Custom ID types
export const ID_TYPE_MAPPINGS = {
  ID: { go: 'uint64', notes: 'Auto-increment database ID' },
  UUID: { go: 'uuid.UUID', import: 'github.com/google/uuid' },
  ULID: { go: 'string', notes: 'Lexicographically sortable UUID' },
  NanoID: { go: 'string', notes: 'URL-friendly unique ID' },
};

// JSON handling
export function isJSONType(stdlibType: string): boolean {
  return stdlibType.startsWith('JSON<');
}

export function extractJSONType(stdlibType: string): string | null {
  const match = stdlibType.match(/^JSON<(.+)>$/);
  return match ? match[1] : null;
}
```

#### 5. Type Inference (types_inference.ts)
```typescript
// Infer Go type from context
export function inferGoType(
  fieldName: string,
  stdlibType: string,
  options: InferenceOptions = {}
): string {
  const resolved = resolveGoType(stdlibType);
  
  // Apply naming conventions for field names
  if (options.fieldName) {
    // Check for common ID patterns
    if (options.fieldName.toLowerCase().includes('id')) {
      return 'uint64';
    }
    
    // Check for timestamps
    if (options.fieldName.toLowerCase().includes('at')) {
      return 'time.Time';
    }
  }
  
  return resolved.type;
}

// Zero value generation
export function getGoZeroValue(stdlibType: string): string {
  const mapping = GO_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
  if (mapping) {
    return mapping.zeroValue;
  }
  
  // Handle generics
  if (stdlibType.startsWith('Array<') || stdlibType.startsWith('List<')) {
    return 'nil';
  }
  if (stdlibType.startsWith('Map<')) {
    return 'nil';
  }
  if (stdlibType.startsWith('Optional<') || stdlibType.startsWith('Nullable<')) {
    return 'nil';
  }
  
  return 'nil';
}
```

### Type Mapping Matrix

| SpecLang Type | Go Type | Import | Zero Value |
|---------------|---------|--------|------------|
| String | string | - | "" |
| Int | int | - | 0 |
| Int64 | int64 | - | 0 |
| Float64 | float64 | - | 0.0 |
| Bool | bool | - | false |
| DateTime | time.Time | time | time.Time{} |
| UUID | uuid.UUID | github.com/google/uuid | uuid.Nil |
| Array<T> | []T | - | nil |
| Map<K,V> | map[K]V | - | nil |
| Optional<T> | *T | - | nil |
| Bytes | []byte | - | nil |
| Error | error | - | nil |
| Any | interface{} | - | nil |

### Test Cases
1. Primitive types map correctly
2. Time types include imports
3. UUID type maps and includes third-party import
4. Generic Array<T> resolves to []T
5. Generic Map<K,V> resolves to map[K]V
6. Generic Optional<T> resolves to *T
7. Custom types pass through unchanged
8. Zero values are correct for each type
9. Import sets are deduplicated
10. Nested generics handle correctly

## Validation
```bash
# Test type mappings
bun test tests/codegen/targets/go/types.test.ts

# Verify imports are correct
goimports -l generated/
```

## Output Format
After completing, output:
1. Type mappings implemented
2. Generic handling working
3. Import resolution verified
4. Test results
