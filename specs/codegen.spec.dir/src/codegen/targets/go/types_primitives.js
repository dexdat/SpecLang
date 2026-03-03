"use strict";
/**
 * SPECLANG-GENERATED: Go primitive type handling
 * Source: @speclang/codegen @block:go-types-primitives
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIMITIVE_MAPPINGS = void 0;
exports.resolvePrimitive = resolvePrimitive;
exports.isPrimitive = isPrimitive;
exports.getZeroValue = getZeroValue;
exports.PRIMITIVE_MAPPINGS = [
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
function resolvePrimitive(stdlibType) {
    return exports.PRIMITIVE_MAPPINGS.find(m => m.stdlib === stdlibType);
}
function isPrimitive(stdlibType) {
    return exports.PRIMITIVE_MAPPINGS.some(m => m.stdlib === stdlibType);
}
function getZeroValue(stdlibType) {
    const mapping = resolvePrimitive(stdlibType);
    return mapping?.zeroValue ?? 'nil';
}
//# sourceMappingURL=types_primitives.js.map