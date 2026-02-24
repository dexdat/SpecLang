/**
 * SPECLANG-GENERATED: Rust primitive type mappings
 * Source: @speclang/codegen @block:rust-types-primitives
 */

import { resolveRustType, TypeResolution } from './types';

export const RUST_PRIMITIVE_MAPPINGS = {
  // Integer types
  Int: { rust: 'i32', default: '0', bits: 32, signed: true },
  Int8: { rust: 'i8', default: '0', bits: 8, signed: true },
  Int16: { rust: 'i16', default: '0', bits: 16, signed: true },
  Int32: { rust: 'i32', default: '0', bits: 32, signed: true },
  Int64: { rust: 'i64', default: '0', bits: 64, signed: true },
  Int128: { rust: 'i128', default: '0', bits: 128, signed: true },

  // Unsigned integer types
  UInt: { rust: 'u32', default: '0', bits: 32, signed: false },
  UInt8: { rust: 'u8', default: '0', bits: 8, signed: false },
  UInt16: { rust: 'u16', default: '0', bits: 16, signed: false },
  UInt32: { rust: 'u32', default: '0', bits: 32, signed: false },
  UInt64: { rust: 'u64', default: '0', bits: 64, signed: false },
  UInt128: { rust: 'u128', default: '0', bits: 128, signed: false },

  // Floating point types
  Float32: { rust: 'f32', default: '0.0', bits: 32 },
  Float64: { rust: 'f64', default: '0.0', bits: 64 },
  Float: { rust: 'f64', default: '0.0', bits: 64 },

  // Boolean
  Bool: { rust: 'bool', default: 'false' },
  Boolean: { rust: 'bool', default: 'false' },

  // Character
  Char: { rust: 'char', default: "'\\0'" },

  // Unit
  Unit: { rust: '()', default: '()' },

  // String types
  String: { rust: 'String', default: 'String::new()' },
  Text: { rust: 'String', default: 'String::new()' },
  Str: { rust: '&str', default: '""' },
};

export function getPrimitiveDefault(stdlibType: string): string {
  const mapping = RUST_PRIMITIVE_MAPPINGS[stdlibType as keyof typeof RUST_PRIMITIVE_MAPPINGS];
  return mapping?.default ?? 'Todo::default()';
}

export function isPrimitiveType(stdlibType: string): boolean {
  return stdlibType in RUST_PRIMITIVE_MAPPINGS;
}

export function isIntegerType(stdlibType: string): boolean {
  return ['Int', 'Int8', 'Int16', 'Int32', 'Int64', 'Int128', 'UInt', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'UInt128'].includes(stdlibType);
}

export function isFloatType(stdlibType: string): boolean {
  return ['Float32', 'Float64', 'Float'].includes(stdlibType);
}

export function isNumericType(stdlibType: string): boolean {
  return isIntegerType(stdlibType) || isFloatType(stdlibType);
}

export function getIntegerRange(stdlibType: string): { min: number; max: number } | null {
  const ranges: Record<string, { min: number; max: number }> = {
    Int8: { min: -128, max: 127 },
    Int16: { min: -32768, max: 32767 },
    Int32: { min: -2147483648, max: 2147483647 },
    Int64: { min: -9223372036854775808, max: 9223372036854775807 },
    UInt8: { min: 0, max: 255 },
    UInt16: { min: 0, max: 65535 },
    UInt32: { min: 0, max: 4294967295 },
    UInt64: { min: 0, max: 18446744073709551615 },
  };
  return ranges[stdlibType] ?? null;
}
