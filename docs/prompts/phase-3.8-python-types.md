# Bootstrap Phase 3.8: Python Type Mappings

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 3.8 of the bootstrap process.

**Prerequisites**: 
- Phase 3.1 (Codegen Framework) complete
- Phase 3.6 (Python Generator) complete

## Your Task
Create comprehensive Python type mappings for the SpecLang stdlib. These mappings define how SpecLang types translate to idiomatic Python types with type hints.

## Read These Specs First
1. `specs/stdlib.spec.md` - Built-in types
2. `specs/compiler.spec.md` - Codegen pipeline
3. `docs/prompts/phase-3.6-python-generator.md` - Python generator (type mapping reference)

## What to Build

### Files to Create
```
src/codegen/targets/python/
├── types.ts              # Core type mappings
├── types_primitives.ts   # Primitive type handling
├── types_collections.ts  # Collection type handling  
├── types_generics.ts     # Generic type handling
├── types_optional.ts     # Optional/nullable handling
└── types_special.ts      # Special types (datetime, uuid, etc.)
```

### Requirements

#### 1. Core Type Mappings (types.ts)
```typescript
interface PythonTypeMapping {
  stdlib: string;
  python: string;
  import?: string;
  fromImport?: string;
  default: string;
  notes?: string;
}

export const PYTHON_TYPE_MAPPINGS: PythonTypeMapping[] = [
  // Primitives - Basic
  { stdlib: 'String', python: 'str', default: '""' },
  { stdlib: 'Int', python: 'int', default: '0' },
  { stdlib: 'Int8', python: 'int', default: '0' },
  { stdlib: 'Int16', python: 'int', default: '0' },
  { stdlib: 'Int32', python: 'int', default: '0' },
  { stdlib: 'Int64', python: 'int', default: '0' },
  { stdlib: 'UInt', python: 'int', default: '0' },
  { stdlib: 'Float32', python: 'float', default: '0.0' },
  { stdlib: 'Float64', python: 'float', default: '0.0' },
  { stdlib: 'Float', python: 'float', default: '0.0' },
  { stdlib: 'Bool', python: 'bool', default: 'False' },
  { stdlib: 'Boolean', python: 'bool', default: 'False' },
  
  // Primitives - String variants
  { stdlib: 'Char', python: 'str', default: '""' },
  { stdlib: 'Text', python: 'str', default: '""' },
  
  // Time types
  { stdlib: 'Date', python: 'date', fromImport: 'datetime', default: 'date.today()' },
  { stdlib: 'DateTime', python: 'datetime', fromImport: 'datetime', default: 'datetime.now()' },
  { stdlib: 'Time', python: 'time', fromImport: 'datetime', default: 'time()' },
  { stdlib: 'Duration', python: 'timedelta', fromImport: 'datetime', default: 'timedelta()' },
  { stdlib: 'Timestamp', python: 'datetime', fromImport: 'datetime', default: 'datetime.now()' },
  
  // Identifiers
  { stdlib: 'UUID', python: 'UUID', fromImport: 'uuid', default: 'uuid4()' },
  { stdlib: 'ID', python: 'int', default: '0', notes: 'Auto-increment ID' },
  
  // Collections
  { stdlib: 'Array<T>', python: 'list[T]', import: 'typing', default: '[]' },
  { stdlib: 'List<T>', python: 'list[T]', import: 'typing', default: '[]' },
  { stdlib: 'Sequence<T>', python: 'Sequence[T]', import: 'typing', default: '[]' },
  { stdlib: 'Map<K,V>', python: 'dict[K, V]', import: 'typing', default: '{}' },
  { stdlib: 'Dict<K,V>', python: 'dict[K, V]', import: 'typing', default: '{}' },
  { stdlib: 'Set<T>', python: 'set[T]', import: 'typing', default: 'set()' },
  { stdlib: 'FrozenSet<T>', python: 'frozenset[T]', import: 'typing', default: 'frozenset()' },
  { stdlib: 'Tuple<T...>', python: 'tuple[T, ...]', import: 'typing', default: '()' },
  
  // Optional
  { stdlib: 'Optional<T>', python: 'T | None', default: 'None' },
  { stdlib: 'Nullable<T>', python: 'T | None', default: 'None' },
  
  // Error handling
  { stdlib: 'Result<T>', python: 'T', default: 'None', notes: 'Use with exception handling' },
  { stdlib: 'Error', python: 'Exception', default: 'None' },
  
  // Bytes
  { stdlib: 'Bytes', python: 'bytes', default: 'b""' },
  { stdlib: 'ByteArray', python: 'bytearray', default: 'bytearray()' },
  { stdlib: 'Blob', python: 'bytes', default: 'b""' },
  
  // Any
  { stdlib: 'Any', python: 'Any', import: 'typing' },
  { stdlib: 'Unknown', python: 'Any', import: 'typing' },
  { stdlib: 'Object', python: 'object', default: 'None' },
  
  // JSON
  { stdlib: 'JSON<T>', python: 'dict[str, Any]', import: 'typing', default: '{}' },
  
  // Callable
  { stdlib: 'Callable<Args,Ret>', python: 'Callable[Args, Ret]', import: 'typing' },
  
  // Iterator
  { stdlib: 'Iterator<T>', python: 'Iterator[T]', import: 'typing' },
  { stdlib: 'Generator<T>', python: 'Generator[T, None, None]', import: 'typing' },
  
  // Literal
  { stdlib: 'Literal<T>', python: 'Literal[T]', import: 'typing' },
  
  // Union (explicit)
  { stdlib: 'Union<A,B>', python: 'A | B', default: 'None' },
];
```

#### 2. Type Resolution Function
```typescript
export interface TypeResolution {
  type: string;
  imports: Set<string>;
  isOptional: boolean;
  isCollection: boolean;
}

export function resolvePythonType(stdlibType: string): TypeResolution {
  // Handle Python 3.10+ union syntax
  const unionMatch = stdlibType.match(/^Union<(.+),\s*(.+)>$/);
  if (unionMatch) {
    const a = resolvePythonType(unionMatch[1]);
    const b = resolvePythonType(unionMatch[2]);
    return {
      type: `${a.type} | ${b.type}`,
      imports: new Set([...a.imports, ...b.imports]),
      isOptional: true,
      isCollection: false
    };
  }
  
  // Handle generics first
  const generic = resolveGeneric(stdlibType);
  if (generic) return generic;
  
  // Lookup base type
  const mapping = PYTHON_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
  if (mapping) {
    const imports = new Set<string>();
    if (mapping.import) imports.add(mapping.import);
    if (mapping.fromImport) imports.add(mapping.fromImport);
    
    return {
      type: mapping.python,
      imports,
      isOptional: false,
      isCollection: false
    };
  }
  
  // Unknown type - pass through
  return {
    type: stdlibType,
    imports: new Set<string>(),
    isOptional: false,
    isCollection: false
  };
}
```

#### 3. Generic Type Handling (types_generics.ts)
```typescript
function resolveGeneric(stdlibType: string): TypeResolution | null {
  // Array<T> / List<T> -> list[T]
  const listMatch = stdlibType.match(/^(?:Array|List)<(.+)>$/);
  if (listMatch) {
    const inner = resolvePythonType(listMatch[1]);
    return {
      type: `list[${inner.type}]`,
      imports: new Set([...inner.imports, 'typing']),
      isOptional: false,
      isCollection: true
    };
  }
  
  // Map<K,V> / Dict<K,V> -> dict[K, V]
  const dictMatch = stdlibType.match(/^(?:Map|Dict)<(.+),\s*(.+)>$/);
  if (dictMatch) {
    const key = resolvePythonType(dictMatch[1]);
    const value = resolvePythonType(dictMatch[2]);
    return {
      type: `dict[${key.type}, ${value.type}]`,
      imports: new Set([...key.imports, ...value.imports, 'typing']),
      isOptional: false,
      isCollection: true
    };
  }
  
  // Set<T> -> set[T]
  const setMatch = stdlibType.match(/^Set<(.+)>$/);
  if (setMatch) {
    const inner = resolvePythonType(setMatch[1]);
    return {
      type: `set[${inner.type}]`,
      imports: new Set([...inner.imports, 'typing']),
      isOptional: false,
      isCollection: true
    };
  }
  
  // FrozenSet<T> -> frozenset[T]
  const frozenSetMatch = stdlibType.match(/^FrozenSet<(.+)>$/);
  if (frozenSetMatch) {
    const inner = resolvePythonType(frozenSetMatch[1]);
    return {
      type: `frozenset[${inner.type}]`,
      imports: new Set([...inner.imports, 'typing']),
      isOptional: false,
      isCollection: true
    };
  }
  
  // Tuple<T...> -> tuple[T, ...]
  const tupleMatch = stdlibType.match(/^Tuple<(.+)>$/);
  if (tupleMatch) {
    const innerTypes = tupleMatch[1].split(',').map(t => resolvePythonType(t.trim()));
    const allImports = innerTypes.flatMap(t => [...t.imports]);
    return {
      type: `tuple[${innerTypes.map(t => t.type).join(', ')}]`,
      imports: new Set([...allImports, 'typing']),
      isOptional: false,
      isCollection: true
    };
  }
  
  // Optional<T> -> T | None
  const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
  if (optMatch) {
    const inner = resolvePythonType(optMatch[1]);
    return {
      type: `${inner.type} | None`,
      imports: inner.imports,
      isOptional: true,
      isCollection: false
    };
  }
  
  // Callable<Args,Ret> -> Callable[Args, Ret]
  const callableMatch = stdlibType.match(/^Callable<(.+),\s*(.+)>$/);
  if (callableMatch) {
    const args = resolvePythonType(callableMatch[1]);
    const ret = resolvePythonType(callableMatch[2]);
    return {
      type: `Callable[${args.type}, ${ret.type}]`,
      imports: new Set([...args.imports, ...ret.imports, 'typing']),
      isOptional: false,
      isCollection: false
    };
  }
  
  // Iterator<T> -> Iterator[T]
  const iterMatch = stdlibType.match(/^Iterator<(.+)>$/);
  if (iterMatch) {
    const inner = resolvePythonType(iterMatch[1]);
    return {
      type: `Iterator[${inner.type}]`,
      imports: new Set([...inner.imports, 'typing']),
      isOptional: false,
      isCollection: false
    };
  }
  
  // Generator<T> -> Generator[T, None, None]
  const genMatch = stdlibType.match(/^Generator<(.+)>$/);
  if (genMatch) {
    const inner = resolvePythonType(genMatch[1]);
    return {
      type: `Generator[${inner.type}, None, None]`,
      imports: new Set([...inner.imports, 'typing']),
      isOptional: false,
      isCollection: false
    };
  }
  
  return null;
}
```

#### 4. Optional Type Handling (types_optional.ts)
```typescript
// Handle Optional<T> with Python 3.10+ union syntax
export function formatOptionalType(innerType: string, pythonVersion: number = 310): string {
  if (pythonVersion >= 310) {
    return `${innerType} | None`;
  }
  // Python 3.9 and below: Optional[T]
  return `Optional[${innerType}]`;
}

// Check if type should have default None
export function hasOptionalDefault(stdlibType: string): boolean {
  return stdlibType.startsWith('Optional<') || 
         stdlibType.startsWith('Nullable<') ||
         stdlibType === 'Error' ||
         stdlibType === 'Any';
}

// Get default value for optional types
export function getOptionalDefault(stdlibType: string): string {
  if (stdlibType.startsWith('Optional<')) {
    const inner = stdlibType.match(/^Optional<(.+)>$/)?.[1];
    if (inner === 'String') return '""';
    if (inner === 'Int' || inner?.startsWith('Float')) return '0';
    if (inner === 'Bool') return 'False';
  }
  return 'None';
}

// Nullable field annotation
export interface NullableAnnotation {
  type: string;
  nullable: boolean;
  default?: string;
}

export function parseNullableField(typeStr: string): NullableAnnotation {
  const optional = typeStr.match(/^(.+?)\?$/);
  if (optional) {
    const inner = resolvePythonType(optional[1]);
    return {
      type: inner.type,
      nullable: true,
      default: 'None'
    };
  }
  
  const resolved = resolvePythonType(typeStr);
  return {
    type: resolved.type,
    nullable: resolved.isOptional
  };
}
```

#### 5. Special Types (types_special.ts)
```typescript
// Time types
export const TIME_TYPE_MAPPINGS = {
  Date: { 
    python: 'date', 
    fromImport: 'datetime', 
    default: 'date.today()',
    methods: ['year', 'month', 'day', 'isoformat']
  },
  DateTime: { 
    python: 'datetime', 
    fromImport: 'datetime', 
    default: 'datetime.now()',
    methods: ['year', 'month', 'day', 'hour', 'minute', 'second', 'isoformat']
  },
  Time: { 
    python: 'time', 
    fromImport: 'datetime', 
    default: 'time()',
    methods: ['hour', 'minute', 'second', 'isoformat']
  },
  Duration: { 
    python: 'timedelta', 
    fromImport: 'datetime', 
    default: 'timedelta()',
    methods: ['total_seconds', 'days', 'seconds', 'microseconds']
  },
};

// UUID handling
export const UUID_MAPPING = {
  stdlib: 'UUID',
  python: 'UUID',
  fromImport: 'uuid',
  default: 'uuid4()',
  methods: ['urn', 'hex', 'int', 'str'],
  notes: 'Use uuid4() for random UUIDs, uuid1() for time-based'
};

// Custom ID types
export const ID_TYPE_MAPPINGS = {
  ID: { python: 'int', notes: 'Auto-increment database ID' },
  UUID: { python: 'UUID', fromImport: 'uuid' },
  ULID: { python: 'str', notes: 'Lexicographically sortable' },
  NanoID: { python: 'str', notes: 'URL-friendly unique ID' },
  Slug: { python: 'str', notes: 'URL-safe identifier' },
};

// Pydantic-specific mappings
export const PYDANTIC_TYPE_MAPPINGS = {
  String: 'str',
  Int: 'int',
  Float: 'float',
  Bool: 'bool',
  UUID: 'UUID',
  DateTime: 'datetime',
  Date: 'date',
  Json: 'Json',
};

export function toPydanticType(stdlibType: string): string {
  const mapping = PYDANTIC_TYPE_MAPPINGS[stdlibType];
  if (mapping) return mapping;
  
  // Handle generics for Pydantic
  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    return `List[${toPydanticType(arrayMatch[1])}]`;
  }
  
  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) {
    return `Dict[${toPydanticType(mapMatch[1])}, ${toPydanticType(mapMatch[2])}]`;
  }
  
  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) {
    return `Optional[${toPydanticType(optMatch[1])}]`;
  }
  
  return stdlibType;
}
```

### Type Mapping Matrix

| SpecLang Type | Python Type | Import | Default |
|---------------|-------------|--------|---------|
| String | str | - | "" |
| Int | int | - | 0 |
| Float64 | float | - | 0.0 |
| Bool | bool | - | False |
| Date | date | datetime | date.today() |
| DateTime | datetime | datetime | datetime.now() |
| UUID | UUID | uuid | uuid4() |
| Array<T> | list[T] | typing | [] |
| Map<K,V> | dict[K, V] | typing | {} |
| Set<T> | set[T] | typing | set() |
| Optional<T> | T \| None | - | None |
| Bytes | bytes | - | b"" |
| Any | Any | typing | - |
| Error | Exception | - | None |
| JSON<T> | dict[str, Any] | typing | {} |

### Test Cases
1. Primitive types map correctly
2. Time types include fromImport
3. UUID type maps correctly
4. Generic Array<T> resolves to list[T]
5. Generic Map<K,V> resolves to dict[K, V]
6. Generic Optional<T> resolves to T | None
7. Nested generics handle correctly
8. Import sets are deduplicated
9. Pydantic type conversion works
10. Tuple types convert correctly

## Validation
```bash
# Test type mappings
bun test tests/codegen/targets/python/types.test.ts

# Verify with mypy
mypy generated/
```

## Output Format
After completing, output:
1. Type mappings implemented
2. Generic handling working
3. Optional type handling verified
4. Test results
