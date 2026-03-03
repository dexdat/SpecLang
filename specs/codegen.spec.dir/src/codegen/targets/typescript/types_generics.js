"use strict";
/**
 * SPECLANG-GENERATED: TypeScript generic type handling
 * Source: @speclang/codegen @block:typescript-generics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGenericType = resolveGenericType;
exports.isGenericType = isGenericType;
exports.extractTypeParams = extractTypeParams;
exports.formatGenericType = formatGenericType;
const types_1 = require("./types");
function resolveGenericType(stdlibType) {
    return (0, types_1.resolveTypeScriptType)(stdlibType);
}
function isGenericType(stdlibType) {
    return stdlibType.includes('<') && stdlibType.includes('>');
}
function extractTypeParams(stdlibType) {
    const match = stdlibType.match(/^(\w+)<(.+)>$/);
    if (!match)
        return [];
    const paramsStr = match[2];
    const params = [];
    let depth = 0;
    let current = '';
    for (const char of paramsStr) {
        if (char === '<')
            depth++;
        else if (char === '>')
            depth--;
        else if (char === ',' && depth === 0) {
            params.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim())
        params.push(current.trim());
    return params;
}
function formatGenericType(baseType, typeParams) {
    const resolved = typeParams.map(p => (0, types_1.resolveTypeScriptType)(p).type);
    return `${baseType}<${resolved.join(', ')}>`;
}
//# sourceMappingURL=types_generics.js.map