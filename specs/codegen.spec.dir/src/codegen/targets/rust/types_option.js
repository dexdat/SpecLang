"use strict";
/**
 * SPECLANG-GENERATED: Rust Option type mappings
 * Source: @speclang/codegen @block:rust-types-option
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTION_PATTERNS = void 0;
exports.formatOptionType = formatOptionType;
exports.isOptionType = isOptionType;
exports.getOptionDefault = getOptionDefault;
exports.resolveOptionType = resolveOptionType;
exports.generateOptionMatch = generateOptionMatch;
exports.generateOptionMatchFull = generateOptionMatchFull;
exports.isOptionRustType = isOptionRustType;
exports.extractOptionInner = extractOptionInner;
const types_1 = require("./types");
function formatOptionType(innerType) {
    return `Option<${innerType}>`;
}
function isOptionType(stdlibType) {
    return stdlibType.startsWith('Optional<') || stdlibType.startsWith('Nullable<');
}
function getOptionDefault(_stdlibType) {
    return 'None';
}
function resolveOptionType(stdlibType) {
    const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
    if (optMatch) {
        const inner = (0, types_1.resolveRustType)(optMatch[1]);
        return {
            type: `Option<${inner.type}>`,
            imports: inner.imports,
            crates: inner.crates,
            isOption: true,
            isReference: false,
            isSmartPointer: false
        };
    }
    return null;
}
exports.OPTION_PATTERNS = {
    some: 'Some(value)',
    none: 'None',
    isSome: '.is_some()',
    isNone: '.is_none()',
    unwrap: '.unwrap()',
    unwrapOr: '.unwrap_or(default)',
    unwrapOrElse: '.unwrap_or_else(|| default)',
    map: '.map(|value| result)',
    andThen: '.and_then(|value| result)',
    orElse: '.or_else(|| alternative)',
};
function generateOptionMatch(fieldName) {
    return `match ${fieldName} {
    Some(value) => value,
    None => ${fieldName}.unwrap_or_default(),
}`;
}
function generateOptionMatchFull(fieldName, someExpr, noneExpr) {
    return `match ${fieldName} {
    Some(value) => ${someExpr},
    None => ${noneExpr},
}`;
}
function isOptionRustType(rustType) {
    return rustType.startsWith('Option<');
}
function extractOptionInner(rustType) {
    const match = rustType.match(/^Option<(.+)>$/);
    return match ? match[1] : null;
}
//# sourceMappingURL=types_option.js.map