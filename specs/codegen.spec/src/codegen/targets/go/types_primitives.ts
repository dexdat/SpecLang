/**
 * SPECLANG-GENERATED: Go primitive type handling
 * Source: @speclang/codegen @block:go-types-primitives
 */

export interface PrimitiveMapping {
  stdlib: string;
  go: string;
  zeroValue: string;
}

export const PRIMITIVE_MAPPINGS: PrimitiveMapping[] = [
  // String types
  { stdlib: 'String', go: 'string', zeroValue: '""' },

  // Signed integers
  { stdlib: 'Int', go: 'int', zeroValue: '0' },
  { stdlib: 'Int8', go: 'int8', zeroValue: '0' },
  { stdlib: 'Int16', go: 'int16', zeroValue: '0' },
  { stdlib: 'Int32', go: 'int32', zeroValue: '0' },
  { stdlib: 'Int64', go: 'int64', zeroValue: '0' },

  // Unsigned integers
  { stdlib: 'UInt', go: 'uint', zeroValue: '0' },
  { stdlib: 'UInt8', go: 'uint8', zeroValue: '0' },
  { stdlib: 'UInt16', go: 'uint16', zeroValue: '0' },
  { stdlib: 'UInt32', go: 'uint32', zeroValue: '0' },
  { stdlib: 'UInt64', go: 'uint64', zeroValue: '0' },

  // Floating point
  { stdlib: 'Float32', go: 'float32', zeroValue: '0.0' },
  { stdlib: 'Float64', go: 'float64', zeroValue: '0.0' },

  // Boolean
  { stdlib: 'Bool', go: 'bool', zeroValue: 'false' },

  // Byte/Rune
  { stdlib: 'Byte', go: 'byte', zeroValue: '0' },
  { stdlib: 'Rune', go: 'rune', zeroValue: '0' },
  { stdlib: 'Char', go: 'rune', zeroValue: '0' },
];

export function resolvePrimitive(stdlibType: string): PrimitiveMapping | undefined {
  return PRIMITIVE_MAPPINGS.find(m => m.stdlib === stdlibType);
}

export function isPrimitive(stdlibType: string): boolean {
  return PRIMITIVE_MAPPINGS.some(m => m.stdlib === stdlibType);
}

export function getZeroValue(stdlibType: string): string {
  const mapping = resolvePrimitive(stdlibType);
  return mapping?.zeroValue ?? 'nil';
}
