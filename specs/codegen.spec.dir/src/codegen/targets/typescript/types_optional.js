"use strict";
/**
 * SPECLANG-GENERATED: TypeScript optional/null handling
 * Source: @speclang/codegen @block:typescript-optional
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatOptional = formatOptional;
exports.hasNullModifier = hasNullModifier;
exports.getTypeScriptDefault = getTypeScriptDefault;
exports.parseFieldType = parseFieldType;
exports.detectNullModifier = detectNullModifier;
const types_1 = require("./types");
function formatOptional(innerType, modifier) {
    switch (modifier) {
        case 'optional':
            return `${innerType} | undefined`;
        case 'nullable':
            return `${innerType} | null`;
        case 'nullish':
            return `${innerType} | null | undefined`;
    }
}
function hasNullModifier(stdlibType) {
    return stdlibType.startsWith('Optional<') ||
        stdlibType.startsWith('Nullable<') ||
        stdlibType.startsWith('Nullish<');
}
function getTypeScriptDefault(stdlibType) {
    const mapping = types_1.TYPESCRIPT_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
    if (mapping?.default)
        return mapping.default;
    if (stdlibType.startsWith('Optional<'))
        return 'undefined';
    if (stdlibType.startsWith('Nullable<'))
        return 'null';
    if (stdlibType.startsWith('Nullish<'))
        return 'undefined';
    if (stdlibType.startsWith('Array<'))
        return '[]';
    if (stdlibType.startsWith('Map<'))
        return 'new Map()';
    if (stdlibType.startsWith('Set<'))
        return 'new Set()';
    return 'undefined';
}
function parseFieldType(typeStr) {
    let optional = false;
    let nullable = false;
    let readonly = false;
    if (typeStr.endsWith('?')) {
        optional = true;
        typeStr = typeStr.slice(0, -1);
    }
    if (typeStr.endsWith('!')) {
        nullable = true;
        typeStr = typeStr.slice(0, -1);
    }
    if (typeStr.startsWith('readonly ')) {
        readonly = true;
        typeStr = typeStr.slice(9);
    }
    const resolved = (0, types_1.resolveTypeScriptType)(typeStr);
    let finalType = resolved.type;
    if (optional)
        finalType += ' | undefined';
    if (nullable)
        finalType += ' | null';
    if (readonly)
        finalType = `readonly ${finalType}`;
    return {
        type: finalType,
        optional: optional || resolved.isOptional,
        nullable,
        readonly
    };
}
function detectNullModifier(stdlibType) {
    if (stdlibType.startsWith('Optional<'))
        return 'optional';
    if (stdlibType.startsWith('Nullable<'))
        return 'nullable';
    if (stdlibType.startsWith('Nullish<'))
        return 'nullish';
    return null;
}
//# sourceMappingURL=types_optional.js.map