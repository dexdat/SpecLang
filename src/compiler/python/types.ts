/**
 * SPECLANG-GENERATED: Python type mappings
 * Source: @speclang/compiler.spec.dir/python
 */

export interface PythonTypeMapping {
  stdlib: string;
  python: string;
  import?: string;
  fromImport?: string;
  default: string;
}

export const PYTHON_TYPE_MAPPINGS: PythonTypeMapping[] = [
  { stdlib: 'String', python: 'str', default: '""' },
  { stdlib: 'Int', python: 'int', default: '0' },
  { stdlib: 'Int32', python: 'int', default: '0' },
  { stdlib: 'Int64', python: 'int', default: '0' },
  { stdlib: 'UInt', python: 'int', default: '0' },
  { stdlib: 'UInt32', python: 'int', default: '0' },
  { stdlib: 'UInt64', python: 'int', default: '0' },
  { stdlib: 'Float', python: 'float', default: '0.0' },
  { stdlib: 'Float32', python: 'float', default: '0.0' },
  { stdlib: 'Float64', python: 'float', default: '0.0' },
  { stdlib: 'Bool', python: 'bool', default: 'False' },
  { stdlib: 'Bytes', python: 'bytes', default: 'b""' },
  { stdlib: 'Binary', python: 'bytes', default: 'b""' },
  { stdlib: 'Any', python: 'Any', import: 'typing', default: 'None' },
  { stdlib: 'Void', python: 'None', default: 'None' },
  { stdlib: 'Date', python: 'date', fromImport: 'datetime', default: 'date.today()' },
  { stdlib: 'DateTime', python: 'datetime', fromImport: 'datetime', default: 'datetime.now()' },
  { stdlib: 'Timestamp', python: 'datetime', fromImport: 'datetime', default: 'datetime.now()' },
  { stdlib: 'UUID', python: 'UUID', fromImport: 'uuid', default: 'uuid4()' },
  { stdlib: 'JSON', python: 'dict', import: 'typing', default: '{}' },
];

export function mapPythonType(stdlibType: string): { type: string; imports: string[] } {
  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    const inner = mapPythonType(arrayMatch[1]);
    return { type: `list[${inner.type}]`, imports: [...inner.imports, 'typing'] };
  }

  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) {
    const key = mapPythonType(mapMatch[1]);
    const value = mapPythonType(mapMatch[2]);
    return {
      type: `dict[${key.type}, ${value.type}]`,
      imports: [...key.imports, ...value.imports, 'typing'],
    };
  }

  const setMatch = stdlibType.match(/^Set<(.+)>$/);
  if (setMatch) {
    const inner = mapPythonType(setMatch[1]);
    return { type: `set[${inner.type}]`, imports: [...inner.imports, 'typing'] };
  }

  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) {
    const inner = mapPythonType(optMatch[1]);
    return { type: `${inner.type} | None`, imports: inner.imports };
  }

  const resultMatch = stdlibType.match(/^Result<(.+),\s*(.+)>$/);
  if (resultMatch) {
    const ok = mapPythonType(resultMatch[1]);
    const err = mapPythonType(resultMatch[2]);
    return {
      type: `tuple[${ok.type}, ${err.type}]`,
      imports: [...ok.imports, ...err.imports, 'typing'],
    };
  }

  const mapping = PYTHON_TYPE_MAPPINGS.find((m) => m.stdlib === stdlibType);
  if (mapping) {
    return {
      type: mapping.python,
      imports: mapping.import ? [mapping.import] : mapping.fromImport ? [mapping.fromImport] : [],
    };
  }

  return { type: stdlibType, imports: [] };
}

export function getPythonZeroValue(stdlibType: string): string {
  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) return '[]';

  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) return '{}';

  const setMatch = stdlibType.match(/^Set<(.+)>$/);
  if (setMatch) return 'set()';

  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) return 'None';

  const mapping = PYTHON_TYPE_MAPPINGS.find((m) => m.stdlib === stdlibType);
  if (mapping) return mapping.default;

  return 'None';
}
