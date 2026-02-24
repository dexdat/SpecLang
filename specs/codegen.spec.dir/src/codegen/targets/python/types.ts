/**
 * SPECLANG-GENERATED: Python type mappings
 * Source: @speclang/codegen @block:python-types
 */

export interface PythonTypeMapping {
  stdlib: string;
  python: string;
  import?: string;
  fromImport?: string;
  default: string;
  notes?: string;
}

export interface TypeResolution {
  type: string;
  imports: Set<string>;
  isOptional: boolean;
  isCollection: boolean;
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
  { stdlib: 'Any', python: 'Any', import: 'typing', default: 'None' },
  { stdlib: 'Unknown', python: 'Any', import: 'typing', default: 'None' },
  { stdlib: 'Object', python: 'object', default: 'None' },

  // JSON
  { stdlib: 'JSON<T>', python: 'dict[str, Any]', import: 'typing', default: '{}' },

  // Callable
  { stdlib: 'Callable<Args,Ret>', python: 'Callable[Args, Ret]', import: 'typing', default: 'None' },

  // Iterator
  { stdlib: 'Iterator<T>', python: 'Iterator[T]', import: 'typing', default: 'None' },
  { stdlib: 'Generator<T>', python: 'Generator[T, None, None]', import: 'typing', default: 'None' },

  // Literal
  { stdlib: 'Literal<T>', python: 'Literal[T]', import: 'typing', default: 'None' },

  // Union (explicit)
  { stdlib: 'Union<A,B>', python: 'A | B', default: 'None' },
];

function lookupMapping(stdlibType: string): PythonTypeMapping | undefined {
  return PYTHON_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
}

export function resolvePythonType(stdlibType: string): TypeResolution {
  const generic = resolveGenericInternal(stdlibType);
  if (generic) return generic;

  const mapping = lookupMapping(stdlibType);
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

  return {
    type: stdlibType,
    imports: new Set<string>(),
    isOptional: false,
    isCollection: false
  };
}

function resolveGenericInternal(stdlibType: string): TypeResolution | null {
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

export { resolveGenericInternal as resolveGeneric };
