"use strict";
/**
 * SPECLANG-GENERATED: Python primitive type handling
 * Source: @speclang/codegen @block:python-types-primitives
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIMITIVE_MAPPINGS = void 0;
exports.getPrimitivePythonType = getPrimitivePythonType;
exports.getPrimitiveDefault = getPrimitiveDefault;
exports.isPrimitiveType = isPrimitiveType;
exports.PRIMITIVE_MAPPINGS = [
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
function getPrimitivePythonType(stdlibType) {
    const mapping = exports.PRIMITIVE_MAPPINGS.find(m => m.stdlib === stdlibType);
    return mapping?.python;
}
function getPrimitiveDefault(stdlibType) {
    const mapping = exports.PRIMITIVE_MAPPINGS.find(m => m.stdlib === stdlibType);
    return mapping?.default;
}
function isPrimitiveType(stdlibType) {
    return exports.PRIMITIVE_MAPPINGS.some(m => m.stdlib === stdlibType);
}
//# sourceMappingURL=types_primitives.js.map