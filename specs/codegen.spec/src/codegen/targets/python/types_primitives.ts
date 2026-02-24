/**
 * SPECLANG-GENERATED: Python primitive type handling
 * Source: @speclang/codegen @block:python-types-primitives
 */

export interface PrimitiveMapping {
  stdlib: string;
  python: string;
  default: string;
  python310?: string;
}

export const PRIMITIVE_MAPPINGS: PrimitiveMapping[] = [
  // String types
  { stdlib: 'String', python: 'str', default: '""' },
  { stdlib: 'Char', python: 'str', default: '""' },
  { stdlib: 'Text', python: 'str', default: '""' },

  // Integer types
  { stdlib: 'Int', python: 'int', default: '0' },
  { stdlib: 'Int8', python: 'int', default: '0' },
  { stdlib: 'Int16', python: 'int', default: '0' },
  { stdlib: 'Int32', python: 'int', default: '0' },
  { stdlib: 'Int64', python: 'int', default: '0' },
  { stdlib: 'UInt', python: 'int', default: '0' },
  { stdlib: 'UInt8', python: 'int', default: '0' },
  { stdlib: 'UInt16', python: 'int', default: '0' },
  { stdlib: 'UInt32', python: 'int', default: '0' },
  { stdlib: 'UInt64', python: 'int', default: '0' },

  // Float types
  { stdlib: 'Float', python: 'float', default: '0.0' },
  { stdlib: 'Float32', python: 'float', default: '0.0' },
  { stdlib: 'Float64', python: 'float', default: '0.0' },
  { stdlib: 'Double', python: 'float', default: '0.0' },

  // Boolean
  { stdlib: 'Bool', python: 'bool', default: 'False' },
  { stdlib: 'Boolean', python: 'bool', default: 'False' },

  // Bytes
  { stdlib: 'Bytes', python: 'bytes', default: 'b""' },
  { stdlib: 'ByteArray', python: 'bytearray', default: 'bytearray()' },
  { stdlib: 'Blob', python: 'bytes', default: 'b""' },
  { stdlib: 'Binary', python: 'bytes', default: 'b""' },
];

export function getPrimitivePythonType(stdlibType: string): string | undefined {
  const mapping = PRIMITIVE_MAPPINGS.find(m => m.stdlib === stdlibType);
  return mapping?.python;
}

export function getPrimitiveDefault(stdlibType: string): string | undefined {
  const mapping = PRIMITIVE_MAPPINGS.find(m => m.stdlib === stdlibType);
  return mapping?.default;
}

export function isPrimitiveType(stdlibType: string): boolean {
  return PRIMITIVE_MAPPINGS.some(m => m.stdlib === stdlibType);
}
