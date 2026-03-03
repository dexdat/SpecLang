"use strict";
/**
 * SPECLANG-GENERATED: TypeScript primitive type handling
 * Source: @speclang/codegen @block:typescript-primitives
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIMITIVE_TYPE_MAPPINGS = void 0;
exports.isPrimitiveType = isPrimitiveType;
exports.getPrimitiveMapping = getPrimitiveMapping;
exports.getPrimitiveDefault = getPrimitiveDefault;
exports.needsImport = needsImport;
const types_1 = require("./types");
exports.PRIMITIVE_TYPE_MAPPINGS = types_1.TYPESCRIPT_TYPE_MAPPINGS.filter(m => {
    const primitives = ['String', 'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt', 'UInt8', 'UInt16', 'UInt32',
        'Float32', 'Float64', 'Float', 'Bool', 'Boolean', 'Char', 'Text', 'Date', 'DateTime', 'Time', 'Duration',
        'Timestamp', 'UUID', 'ID', 'ULID', 'NanoID', 'Bytes', 'Blob', 'ArrayBuffer', 'Any', 'Unknown', 'Void', 'Never'];
    return primitives.includes(m.stdlib);
});
function isPrimitiveType(stdlibType) {
    const primitives = ['String', 'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt', 'UInt8', 'UInt16', 'UInt32',
        'Float32', 'Float64', 'Float', 'Bool', 'Boolean', 'Char', 'Text', 'Any', 'Unknown', 'Void', 'Never'];
    return primitives.includes(stdlibType);
}
function getPrimitiveMapping(stdlibType) {
    return types_1.TYPESCRIPT_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
}
function getPrimitiveDefault(stdlibType) {
    const mapping = getPrimitiveMapping(stdlibType);
    return mapping?.default ?? 'undefined';
}
function needsImport(stdlibType) {
    const resolution = (0, types_1.resolveTypeScriptType)(stdlibType);
    return resolution.imports.size > 0;
}
//# sourceMappingURL=types_primitives.js.map