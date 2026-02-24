/**
 * SPECLANG-GENERATED: Go type mappings
 * Source: @speclang/compiler.spec.dir/go
 */

export interface GoTypeMapping {
  stdlib: string;
  go: string;
  import?: string;
  zeroValue: string;
  notes?: string;
}

export interface TypeResolution {
  type: string;
  imports: string[];
  isPointer: boolean;
  isSlice: boolean;
  isMap: boolean;
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
  { stdlib: 'Char', go: 'rune', zeroValue: '0' },

  // Time types
  { stdlib: 'Date', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'DateTime', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'Time', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'Duration', go: 'time.Duration', import: 'time', zeroValue: '0' },

  // Identifiers
  { stdlib: 'UUID', go: 'uuid.UUID', import: 'github.com/google/uuid', zeroValue: 'uuid.Nil' },
  { stdlib: 'ID', go: 'uint64', zeroValue: '0', notes: 'Auto-increment ID' },

  // Collections - aliases
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

  // Legacy mappings
  { stdlib: 'Float', go: 'float64', zeroValue: '0.0' },
  { stdlib: 'Binary', go: '[]byte', zeroValue: 'nil' },
  { stdlib: 'Void', go: '', zeroValue: '' },
  { stdlib: 'Timestamp', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'JSON', go: 'json.RawMessage', import: 'encoding/json', zeroValue: 'nil' },
];

export function mapGoType(stdlibType: string): { type: string; imports: string[] } {
  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    const inner = mapGoType(arrayMatch[1]);
    return { type: `[]${inner.type}`, imports: inner.imports };
  }

  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) {
    const key = mapGoType(mapMatch[1]);
    const value = mapGoType(mapMatch[2]);
    return {
      type: `map[${key.type}]${value.type}`,
      imports: [...key.imports, ...value.imports],
    };
  }

  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) {
    const inner = mapGoType(optMatch[1]);
    return { type: `*${inner.type}`, imports: inner.imports };
  }

  const resultMatch = stdlibType.match(/^Result<(.+),\s*(.+)>$/);
  if (resultMatch) {
    const ok = mapGoType(resultMatch[1]);
    const err = mapGoType(resultMatch[2]);
    return {
      type: `(${ok.type}, ${err.type})`,
      imports: [...ok.imports, ...err.imports],
    };
  }

  const mapping = GO_TYPE_MAPPINGS.find((m) => m.stdlib === stdlibType);
  if (mapping) {
    return {
      type: mapping.go,
      imports: mapping.import ? [mapping.import] : [],
    };
  }

  return { type: stdlibType, imports: [] };
}

export function getGoZeroValue(stdlibType: string): string {
  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) return 'nil';

  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) return 'nil';

  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) return 'nil';

  const mapping = GO_TYPE_MAPPINGS.find((m) => m.stdlib === stdlibType);
  if (mapping) return mapping.zeroValue;

  return 'nil';
}

export function resolveGoType(stdlibType: string): TypeResolution {
  const generic = resolveGeneric(stdlibType);
  if (generic) return generic;

  const mapping = GO_TYPE_MAPPINGS.find((m) => m.stdlib === stdlibType);
  if (mapping) {
    return {
      type: mapping.go,
      imports: mapping.import ? [mapping.import] : [],
      isPointer: false,
      isSlice: false,
      isMap: false,
    };
  }

  return {
    type: stdlibType,
    imports: [],
    isPointer: false,
    isSlice: false,
    isMap: false,
  };
}

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
      isMap: false,
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
      isMap: false,
    };
  }

  // Slice<T> -> []T
  const sliceMatch = stdlibType.match(/^Slice<(.+)>$/);
  if (sliceMatch) {
    const inner = resolveGoType(sliceMatch[1]);
    return {
      type: `[]${inner.type}`,
      imports: inner.imports,
      isPointer: false,
      isSlice: true,
      isMap: false,
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
      isMap: true,
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
      isMap: true,
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
      isMap: false,
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
      isMap: false,
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
      isMap: false,
    };
  }

  return null;
}

export function isJSONType(stdlibType: string): boolean {
  return stdlibType.startsWith('JSON<');
}

export function extractJSONType(stdlibType: string): string | null {
  const match = stdlibType.match(/^JSON<(.+)>$/);
  return match ? match[1] : null;
}
