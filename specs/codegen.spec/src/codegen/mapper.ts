/**
 * SPECLANG-GENERATED: Type mapper for codegen
 * Source: @speclang/codegen @block:mapper
 */

import type { TypeMapping, TargetLanguage, StdlibType } from './types';

// ============================================================================
// TYPE MAPPINGS
// ============================================================================

/** Type mappings from stdlib to target languages */
export const TYPE_MAPPINGS: TypeMapping[] = [
  // Primitives
  { stdlib: 'String', typescript: 'string', go: 'string', python: 'str', rust: 'String' },
  { stdlib: 'Int', typescript: 'number', go: 'int', python: 'int', rust: 'i32' },
  { stdlib: 'Float', typescript: 'number', go: 'float64', python: 'float', rust: 'f64' },
  { stdlib: 'Bool', typescript: 'boolean', go: 'bool', python: 'bool', rust: 'bool' },
  { stdlib: 'Binary', typescript: 'Uint8Array', go: '[]byte', python: 'bytes', rust: 'Vec<u8>' },
  { stdlib: 'Bytes', typescript: 'Uint8Array', go: '[]byte', python: 'bytes', rust: 'Vec<u8>' },

  // Date/Time
  { stdlib: 'Date', typescript: 'Date', go: 'time.Time', python: 'datetime.date', rust: 'chrono::NaiveDate' },
  { stdlib: 'DateTime', typescript: 'Date', go: 'time.Time', python: 'datetime.datetime', rust: 'chrono::DateTime' },
  { stdlib: 'Timestamp', typescript: 'number', go: 'int64', python: 'int', rust: 'i64' },

  // Special
  { stdlib: 'UUID', typescript: 'string', go: 'string', python: 'str', rust: 'uuid::Uuid' },
  { stdlib: 'JSON', typescript: 'any', go: 'interface{}', python: 'Any', rust: 'serde_json::Value' },
  { stdlib: 'Any', typescript: 'any', go: 'interface{}', python: 'Any', rust: 'serde_json::Value' },
  { stdlib: 'Void', typescript: 'void', go: '', python: 'None', rust: '()' },

  // Collections
  { stdlib: 'Array<T>', typescript: 'T[]', go: '[]T', python: 'List[T]', rust: 'Vec<T>' },
  { stdlib: 'Map<K,V>', typescript: 'Record<K, V>', go: 'map[K]V', python: 'Dict[K, V]', rust: 'HashMap<K, V>' },
  { stdlib: 'Optional<T>', typescript: 'T | null', go: '*T', python: 'Optional[T]', rust: 'Option<T>' },
  { stdlib: 'Result<T,E>', typescript: 'T', go: '(T, error)', python: 'Result[T, E]', rust: 'Result<T, E>' },
];

/** Map stdlib type to target language type */
export function mapType(stdlibType: string, target: TargetLanguage): string {
  // Handle generic types
  if (stdlibType.includes('<')) {
    return mapGenericType(stdlibType, target);
  }

  // Find exact match
  const mapping = TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
  if (mapping) {
    return mapping[target];
  }

  // Return as-is if not found (passthrough for custom types)
  return stdlibType;
}

/** Map generic types like Array<T>, Map<K,V> */
function mapGenericType(stdlibType: string, target: TargetLanguage): string {
  const match = stdlibType.match(/^(\w+)<(.+)>$/);
  if (!match) return stdlibType;

  const [, baseType, params] = match;

  // Handle specific generic types
  switch (baseType) {
    case 'Array': {
      const innerType = mapType(params.trim(), target);
      switch (target) {
        case 'typescript': return `${innerType}[]`;
        case 'go': return `[]${capitalize(innerType)}`;
        case 'python': return `List[${innerType}]`;
        case 'rust': return `Vec<${toRustType(innerType)}>`;
        default: return stdlibType;
      }
    }
    case 'Map': {
      const [k, v] = params.split(',').map(s => s.trim());
      const keyType = mapType(k, target);
      const valType = mapType(v, target);
      switch (target) {
        case 'typescript': return `Record<${keyType}, ${valType}>`;
        case 'go': return `map[${capitalize(keyType)}]${capitalize(valType)}`;
        case 'python': return `Dict[${keyType}, ${valType}]`;
        case 'rust': return `HashMap<${toRustType(keyType)}, ${toRustType(valType)}>`;
        default: return stdlibType;
      }
    }
    case 'Optional': {
      const innerType = mapType(params.trim(), target);
      switch (target) {
        case 'typescript': return `${innerType} | null`;
        case 'go': return `*${capitalize(innerType)}`;
        case 'python': return `Optional[${innerType}]`;
        case 'rust': return `Option<${toRustType(innerType)}>`;
        default: return stdlibType;
      }
    }
    case 'Result': {
      const [t, e] = params.split(',').map(s => s.trim());
      const okType = mapType(t, target);
      const errType = mapType(e, target);
      switch (target) {
        case 'typescript': return `${okType}`;
        case 'go': return `(${okType}, error)`;
        case 'python': return `Result[${okType}, ${errType}]`;
        case 'rust': return `Result<${toRustType(okType)}, ${toRustType(errType)}>`;
        default: return stdlibType;
      }
    }
    default:
      return stdlibType;
  }
}

/** Capitalize first letter */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert to Rust type naming convention */
function toRustType(str: string): string {
  // Handle primitives
  const rustPrimitives: Record<string, string> = {
    string: 'String',
    number: 'i32',
    boolean: 'bool',
    any: 'serde_json::Value',
  };
  return rustPrimitives[str] || capitalize(str);
}

/** Get all supported stdlib types */
export function getStdlibTypes(): StdlibType[] {
  return TYPE_MAPPINGS.map(m => m.stdlib as StdlibType);
}

/** Check if a type is a valid stdlib type */
export function isStdlibType(type: string): boolean {
  return TYPE_MAPPINGS.some(m => m.stdlib === type);
}

/** Get mapping for a specific type */
export function getTypeMapping(stdlibType: string): TypeMapping | undefined {
  return TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
}
