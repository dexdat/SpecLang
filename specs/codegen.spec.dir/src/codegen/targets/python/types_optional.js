"use strict";
/**
 * SPECLANG-GENERATED: Python optional/nullable handling
 * Source: @speclang/codegen @block:python-types-optional
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatOptionalType = formatOptionalType;
exports.hasOptionalDefault = hasOptionalDefault;
exports.getOptionalDefault = getOptionalDefault;
exports.parseNullableField = parseNullableField;
exports.isOptionalType = isOptionalType;
exports.resolveOptionalType = resolveOptionalType;
const types_1 = require("./types");
function formatOptionalType(innerType, pythonVersion = 310) {
    if (pythonVersion >= 310) {
        return `${innerType} | None`;
    }
    return `Optional[${innerType}]`;
}
function hasOptionalDefault(stdlibType) {
    return stdlibType.startsWith('Optional<') ||
        stdlibType.startsWith('Nullable<') ||
        stdlibType === 'Error' ||
        stdlibType === 'Any';
}
function getOptionalDefault(stdlibType) {
    if (stdlibType.startsWith('Optional<')) {
        const inner = stdlibType.match(/^Optional<(.+)>$/)?.[1];
        if (inner === 'String')
            return '""';
        if (inner === 'Int' || inner?.startsWith('Float'))
            return '0';
        if (inner === 'Bool')
            return 'False';
    }
    return 'None';
}
function parseNullableField(typeStr) {
    const optional = typeStr.match(/^(.+?)\?$/);
    if (optional) {
        const inner = (0, types_1.resolvePythonType)(optional[1]);
        return {
            type: inner.type,
            nullable: true,
            default: 'None'
        };
    }
    const resolved = (0, types_1.resolvePythonType)(typeStr);
    return {
        type: resolved.type,
        nullable: resolved.isOptional
    };
}
function isOptionalType(stdlibType) {
    return stdlibType.startsWith('Optional<') ||
        stdlibType.startsWith('Nullable<');
}
function resolveOptionalType(stdlibType) {
    const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
    if (!optMatch)
        return null;
    const inner = (0, types_1.resolvePythonType)(optMatch[1]);
    return {
        type: `${inner.type} | None`,
        imports: inner.imports,
        isOptional: true,
        isCollection: false
    };
}
//# sourceMappingURL=types_optional.js.map