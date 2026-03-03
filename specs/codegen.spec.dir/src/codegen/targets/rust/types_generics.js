"use strict";
/**
 * SPECLANG-GENERATED: Rust generic type mappings
 * Source: @speclang/codegen @block:rust-types-generics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGeneric = resolveGeneric;
exports.isGenericType = isGenericType;
exports.extractGenericArgs = extractGenericArgs;
const types_1 = require("./types");
function resolveGeneric(stdlibType) {
    const vecMatch = stdlibType.match(/^(?:Array|List|Vec)<(.+)>$/);
    if (vecMatch) {
        const inner = (0, types_1.resolveRustType)(vecMatch[1]);
        return {
            type: `Vec<${inner.type}>`,
            imports: new Set([...inner.imports, 'alloc']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const sliceMatch = stdlibType.match(/^Slice<(.+)>$/);
    if (sliceMatch) {
        const inner = (0, types_1.resolveRustType)(sliceMatch[1]);
        return {
            type: `&[${inner.type}]`,
            imports: inner.imports,
            crates: inner.crates,
            isOption: false,
            isReference: true,
            isSmartPointer: false
        };
    }
    const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
    if (mapMatch) {
        const key = (0, types_1.resolveRustType)(mapMatch[1]);
        const value = (0, types_1.resolveRustType)(mapMatch[2]);
        return {
            type: `HashMap<${key.type}, ${value.type}>`,
            imports: new Set([...key.imports, ...value.imports, 'std::collections']),
            crates: new Set([...key.crates, ...value.crates]),
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const btreeMapMatch = stdlibType.match(/^BTreeMap<(.+),\s*(.+)>$/);
    if (btreeMapMatch) {
        const key = (0, types_1.resolveRustType)(btreeMapMatch[1]);
        const value = (0, types_1.resolveRustType)(btreeMapMatch[2]);
        return {
            type: `BTreeMap<${key.type}, ${value.type}>`,
            imports: new Set([...key.imports, ...value.imports, 'std::collections']),
            crates: new Set([...key.crates, ...value.crates]),
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const setMatch = stdlibType.match(/^Set<(.+)>$/);
    if (setMatch) {
        const inner = (0, types_1.resolveRustType)(setMatch[1]);
        return {
            type: `HashSet<${inner.type}>`,
            imports: new Set([...inner.imports, 'std::collections']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const btreeSetMatch = stdlibType.match(/^BTreeSet<(.+)>$/);
    if (btreeSetMatch) {
        const inner = (0, types_1.resolveRustType)(btreeSetMatch[1]);
        return {
            type: `BTreeSet<${inner.type}>`,
            imports: new Set([...inner.imports, 'std::collections']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
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
    const cellMatch = stdlibType.match(/^Cell<(.+)>$/);
    if (cellMatch) {
        const inner = (0, types_1.resolveRustType)(cellMatch[1]);
        return {
            type: `Cell<${inner.type}>`,
            imports: new Set([...inner.imports, 'std::cell']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const mutexMatch = stdlibType.match(/^Mutex<(.+)>$/);
    if (mutexMatch) {
        const inner = (0, types_1.resolveRustType)(mutexMatch[1]);
        return {
            type: `Mutex<${inner.type}>`,
            imports: new Set([...inner.imports, 'std::sync']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const rwLockMatch = stdlibType.match(/^RwLock<(.+)>$/);
    if (rwLockMatch) {
        const inner = (0, types_1.resolveRustType)(rwLockMatch[1]);
        return {
            type: `RwLock<${inner.type}>`,
            imports: new Set([...inner.imports, 'std::sync']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const iterMatch = stdlibType.match(/^Iterator<(.+)>$/);
    if (iterMatch) {
        const inner = (0, types_1.resolveRustType)(iterMatch[1]);
        return {
            type: `impl Iterator<Item = ${inner.type}>`,
            imports: new Set([...inner.imports, 'std::iter']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const streamMatch = stdlibType.match(/^Stream<(.+)>$/);
    if (streamMatch) {
        const inner = (0, types_1.resolveRustType)(streamMatch[1]);
        return {
            type: `impl Stream<Item = ${inner.type}>`,
            imports: new Set([...inner.imports, 'futures']),
            crates: new Set([...inner.crates, 'futures']),
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    const futureMatch = stdlibType.match(/^(?:Future|Async)<(.+)>$/);
    if (futureMatch) {
        const inner = (0, types_1.resolveRustType)(futureMatch[1]);
        return {
            type: `impl Future<Output = ${inner.type}>`,
            imports: new Set([...inner.imports, 'std::future']),
            crates: inner.crates,
            isOption: false,
            isReference: false,
            isSmartPointer: false
        };
    }
    return null;
}
function isGenericType(stdlibType) {
    return /^.+\<.+>$/.test(stdlibType);
}
function extractGenericArgs(stdlibType) {
    const match = stdlibType.match(/^[^<]+<(.+)>$/);
    if (!match)
        return [];
    const content = match[1];
    const args = [];
    let depth = 0;
    let current = '';
    for (const char of content) {
        if (char === '<')
            depth++;
        else if (char === '>')
            depth--;
        else if (char === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) {
        args.push(current.trim());
    }
    return args;
}
//# sourceMappingURL=types_generics.js.map