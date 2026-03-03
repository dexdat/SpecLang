"use strict";
/**
 * SPECLANG-GENERATED: TypeScript special types (date, uuid, etc.)
 * Source: @speclang/codegen @block:typescript-special
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZOD_TYPE_MAPPINGS = exports.NODE_TYPE_MAPPINGS = exports.BYTES_TYPE_MAPPINGS = exports.UUID_MAPPING = exports.DATE_TYPE_MAPPINGS = void 0;
exports.toZodSchema = toZodSchema;
exports.isDateType = isDateType;
exports.isUUIDType = isUUIDType;
exports.isBytesType = isBytesType;
exports.DATE_TYPE_MAPPINGS = {
    Date: { typescript: 'Date', import: 'Date', default: 'new Date()' },
    DateTime: { typescript: 'Date', import: 'Date', default: 'new Date()' },
    Time: { typescript: 'string', notes: 'ISO 8601 time', default: '""' },
    Duration: { typescript: 'number', notes: 'milliseconds', default: '0' },
    Timestamp: { typescript: 'number', notes: 'Unix ms', default: '0' },
};
exports.UUID_MAPPING = {
    stdlib: 'UUID',
    typescript: 'string',
    notes: 'UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
    default: '""'
};
exports.BYTES_TYPE_MAPPINGS = {
    Bytes: { typescript: 'Uint8Array', default: 'new Uint8Array()' },
    Blob: { typescript: 'Blob', import: 'Blob' },
    ArrayBuffer: { typescript: 'ArrayBuffer', import: 'ArrayBuffer' },
    SharedArrayBuffer: { typescript: 'SharedArrayBuffer', import: 'SharedArrayBuffer' },
};
exports.NODE_TYPE_MAPPINGS = {
    Readable: { typescript: 'Readable', import: 'stream' },
    Writable: { typescript: 'Writable', import: 'stream' },
    Buffer: { typescript: 'Buffer', import: 'Buffer' },
    Process: { typescript: 'NodeJS.Process', import: 'node:process' },
};
exports.ZOD_TYPE_MAPPINGS = {
    String: "z.string()",
    Int: "z.number().int()",
    Float: "z.number()",
    Bool: "z.boolean()",
    UUID: "z.uuid()",
    Date: "z.date()",
    Email: "z.string().email()",
    Url: "z.string().url()",
};
function toZodSchema(stdlibType) {
    const mapping = exports.ZOD_TYPE_MAPPINGS[stdlibType];
    if (mapping)
        return mapping;
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
function isDateType(stdlibType) {
    return ['Date', 'DateTime', 'Time', 'Duration', 'Timestamp'].includes(stdlibType);
}
function isUUIDType(stdlibType) {
    return ['UUID', 'ULID', 'NanoID'].includes(stdlibType);
}
function isBytesType(stdlibType) {
    return ['Bytes', 'Blob', 'ArrayBuffer', 'SharedArrayBuffer'].includes(stdlibType);
}
//# sourceMappingURL=types_special.js.map