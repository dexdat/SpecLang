/**
 * SPECLANG-GENERATED: TypeScript special types (date, uuid, etc.)
 * Source: @speclang/codegen @block:typescript-special
 */

export const DATE_TYPE_MAPPINGS = {
  Date: { typescript: 'Date', import: 'Date', default: 'new Date()' },
  DateTime: { typescript: 'Date', import: 'Date', default: 'new Date()' },
  Time: { typescript: 'string', notes: 'ISO 8601 time', default: '""' },
  Duration: { typescript: 'number', notes: 'milliseconds', default: '0' },
  Timestamp: { typescript: 'number', notes: 'Unix ms', default: '0' },
};

export const UUID_MAPPING = {
  stdlib: 'UUID',
  typescript: 'string',
  notes: 'UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
  default: '""'
};

export const BYTES_TYPE_MAPPINGS = {
  Bytes: { typescript: 'Uint8Array', default: 'new Uint8Array()' },
  Blob: { typescript: 'Blob', import: 'Blob' },
  ArrayBuffer: { typescript: 'ArrayBuffer', import: 'ArrayBuffer' },
  SharedArrayBuffer: { typescript: 'SharedArrayBuffer', import: 'SharedArrayBuffer' },
};

export const NODE_TYPE_MAPPINGS = {
  Readable: { typescript: 'Readable', import: 'stream' },
  Writable: { typescript: 'Writable', import: 'stream' },
  Buffer: { typescript: 'Buffer', import: 'Buffer' },
  Process: { typescript: 'NodeJS.Process', import: 'node:process' },
};

export const ZOD_TYPE_MAPPINGS: Record<string, string> = {
  String: "z.string()",
  Int: "z.number().int()",
  Float: "z.number()",
  Bool: "z.boolean()",
  UUID: "z.uuid()",
  Date: "z.date()",
  Email: "z.string().email()",
  Url: "z.string().url()",
};

export function toZodSchema(stdlibType: string): string {
  const mapping = ZOD_TYPE_MAPPINGS[stdlibType];
  if (mapping) return mapping;

  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    const inner = toZodSchema(arrayMatch[1]);
    return "z.array(" + inner + ")";
  }

  const optionalMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optionalMatch) {
    const inner = toZodSchema(optionalMatch[1]);
    return inner + ".optional()";
  }

  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) {
    const key = toZodSchema(mapMatch[1]);
    const val = toZodSchema(mapMatch[2]);
    return "z.record(" + key + ", " + val + ")";
  }

  return "z.any()";
}

export function isDateType(stdlibType: string): boolean {
  return ['Date', 'DateTime', 'Time', 'Duration', 'Timestamp'].includes(stdlibType);
}

export function isUUIDType(stdlibType: string): boolean {
  return ['UUID', 'ULID', 'NanoID'].includes(stdlibType);
}

export function isBytesType(stdlibType: string): boolean {
  return ['Bytes', 'Blob', 'ArrayBuffer', 'SharedArrayBuffer'].includes(stdlibType);
}
