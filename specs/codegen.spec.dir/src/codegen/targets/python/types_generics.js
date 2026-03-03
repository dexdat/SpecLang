"use strict";
/**
 * SPECLANG-GENERATED: Python generic type handling
 * Source: @speclang/codegen @block:python-types-generics
 * Note: Implementation moved to types.ts to avoid circular dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGeneric = void 0;
exports.resolveGenericType = resolveGenericType;
exports.isGenericType = isGenericType;
const types_1 = require("./types");
var types_2 = require("./types");
Object.defineProperty(exports, "resolveGeneric", { enumerable: true, get: function () { return types_2.resolveGeneric; } });
function resolveGenericType(stdlibType) {
    return (0, types_1.resolvePythonType)(stdlibType);
}
function isGenericType(stdlibType) {
    return stdlibType.includes('<') && stdlibType.includes('>');
}
//# sourceMappingURL=types_generics.js.map