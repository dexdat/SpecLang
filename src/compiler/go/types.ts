/**
 * SPECLANG-GENERATED: Go type mappings
 * Source: @speclang/compiler.spec.dir/go
 */

export interface GoTypeMapping {
  stdlib: string;
  go: string;
  import?: string;
  zeroValue: string;
}

export const GO_TYPE_MAPPINGS: GoTypeMapping[] = [
  { stdlib: 'String', go: 'string', zeroValue: '""' },
  { stdlib: 'Int', go: 'int', zeroValue: '0' },
  { stdlib: 'Int32', go: 'int32', zeroValue: '0' },
  { stdlib: 'Int64', go: 'int64', zeroValue: '0' },
  { stdlib: 'UInt', go: 'uint', zeroValue: '0' },
  { stdlib: 'UInt32', go: 'uint32', zeroValue: '0' },
  { stdlib: 'UInt64', go: 'uint64', zeroValue: '0' },
  { stdlib: 'Float', go: 'float64', zeroValue: '0.0' },
  { stdlib: 'Float32', go: 'float32', zeroValue: '0.0' },
  { stdlib: 'Bool', go: 'bool', zeroValue: 'false' },
  { stdlib: 'Bytes', go: '[]byte', zeroValue: 'nil' },
  { stdlib: 'Binary', go: '[]byte', zeroValue: 'nil' },
  { stdlib: 'Any', go: 'interface{}', zeroValue: 'nil' },
  { stdlib: 'Void', go: '', zeroValue: '' },
  { stdlib: 'Date', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'DateTime', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'Timestamp', go: 'time.Time', import: 'time', zeroValue: 'time.Time{}' },
  { stdlib: 'UUID', go: 'uuid.UUID', import: 'github.com/google/uuid', zeroValue: 'uuid.Nil' },
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
