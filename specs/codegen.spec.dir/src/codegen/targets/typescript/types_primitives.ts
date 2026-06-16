/**
 * SPECLANG-GENERATED: TypeScript primitive type handling
 * Source: @speclang/codegen @block:typescript-primitives
 */

import { TYPESCRIPT_TYPE_MAPPINGS, resolveTypeScriptType } from './types';

export const PRIMITIVE_TYPE_MAPPINGS = TYPESCRIPT_TYPE_MAPPINGS.filter(m => {
  const primitives = ['String', 'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt', 'UInt8', 'UInt16', 'UInt32',
    'Float32', 'Float64', 'Float', 'Bool', 'Boolean', 'Char', 'Text', 'Date', 'DateTime', 'Time', 'Duration',
    'Timestamp', 'UUID', 'ID', 'ULID', 'NanoID', 'Bytes', 'Blob', 'ArrayBuffer', 'Any', 'Unknown', 'Void', 'Never'];
  return primitives.includes(m.stdlib);
});

export function isPrimitiveType(stdlibType: string): boolean {
  const primitives = ['String', 'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt', 'UInt8', 'UInt16', 'UInt32',
    'Float32', 'Float64', 'Float', 'Bool', 'Boolean', 'Char', 'Text', 'Any', 'Unknown', 'Void', 'Never'];
  return primitives.includes(stdlibType);
}

export function getPrimitiveMapping(stdlibType: string) {
  return TYPESCRIPT_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
}

export function getPrimitiveDefault(stdlibType: string): string {
  const mapping = getPrimitiveMapping(stdlibType);
  return mapping?.default ?? 'undefined';
}

export function needsImport(stdlibType: string): boolean {
  const resolution = resolveTypeScriptType(stdlibType);
  return resolution.imports.size > 0;
}
