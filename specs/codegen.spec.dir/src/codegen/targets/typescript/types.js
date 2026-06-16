"use strict";
/**
 * SPECLANG-GENERATED: TypeScript type mappings
 * Source: @speclang/codegen @block:typescript-types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPESCRIPT_TYPE_MAPPINGS = void 0;
exports.resolveTypeScriptType = resolveTypeScriptType;
exports.resolveGenericType = resolveGeneric;
exports.TYPESCRIPT_TYPE_MAPPINGS = [
    // Primitives - Basic
    { stdlib: 'String', typescript: 'string', default: '""' },
    { stdlib: 'Int', typescript: 'number', default: '0' },
    { stdlib: 'Int8', typescript: 'number', default: '0' },
    { stdlib: 'Int16', typescript: 'number', default: '0' },
    { stdlib: 'Int32', typescript: 'number', default: '0' },
    { stdlib: 'Int64', typescript: 'number', default: '0' },
    { stdlib: 'UInt', typescript: 'number', default: '0' },
    { stdlib: 'UInt8', typescript: 'number', default: '0' },
    { stdlib: 'UInt16', typescript: 'number', default: '0' },
    { stdlib: 'UInt32', typescript: 'number', default: '0' },
    { stdlib: 'Float32', typescript: 'number', default: '0' },
    { stdlib: 'Float64', typescript: 'number', default: '0' },
    { stdlib: 'Float', typescript: 'number', default: '0' },
    { stdlib: 'Bool', typescript: 'boolean', default: 'false' },
    { stdlib: 'Boolean', typescript: 'boolean', default: 'false' },
    // Primitives - String variants
    { stdlib: 'Char', typescript: 'string', default: '""' },
    { stdlib: 'Text', typescript: 'string', default: '""' },
    { stdlib: 'StringLiteral<T>', typescript: 'T', notes: 'String literal type' },
    // Primitives - Numeric variants
    { stdlib: 'NumberLiteral<T>', typescript: 'T', notes: 'Number literal type' },
    // Time types
    { stdlib: 'Date', typescript: 'Date', import: 'Date', default: 'new Date()' },
    { stdlib: 'DateTime', typescript: 'Date', import: 'Date', default: 'new Date()' },
    { stdlib: 'Time', typescript: 'string', notes: 'ISO 8601 time string', default: '""' },
    { stdlib: 'Duration', typescript: 'number', notes: 'milliseconds', default: '0' },
    { stdlib: 'Timestamp', typescript: 'number', notes: 'Unix timestamp in ms', default: '0' },
    // Identifiers
    { stdlib: 'UUID', typescript: 'string', notes: 'UUID v4 string', default: '""' },
    { stdlib: 'ID', typescript: 'string', notes: 'Entity ID', default: '""' },
    { stdlib: 'ULID', typescript: 'string', notes: 'Lexicographically sortable', default: '""' },
    { stdlib: 'NanoID', typescript: 'string', notes: 'URL-friendly ID', default: '""' },
    // Collections
    { stdlib: 'Array<T>', typescript: 'T[]', default: '[]' },
    { stdlib: 'List<T>', typescript: 'T[]', default: '[]' },
    { stdlib: 'ReadonlyArray<T>', typescript: 'readonly T[]', default: '[]' },
    { stdlib: 'Map<K,V>', typescript: 'Map<K, V>', default: 'new Map()' },
    { stdlib: 'WeakMap<K,V>', typescript: 'WeakMap<K, V>', default: 'new WeakMap()' },
    { stdlib: 'Set<T>', typescript: 'Set<T>', default: 'new Set()' },
    { stdlib: 'WeakSet<T>', typescript: 'WeakSet<T>', default: 'new WeakSet()' },
    { stdlib: 'Tuple<T...>', typescript: '[T, ...]', notes: 'Fixed-length tuple' },
    // Optional
    { stdlib: 'Optional<T>', typescript: 'T | undefined', default: 'undefined' },
    { stdlib: 'Nullable<T>', typescript: 'T | null', default: 'null' },
    { stdlib: 'Nullish<T>', typescript: 'T | null | undefined', default: 'undefined' },
    // Error handling
    { stdlib: 'Result<T>', typescript: 'T', notes: 'Use with error handling pattern' },
    { stdlib: 'Error', typescript: 'Error', import: 'Error', default: 'new Error()' },
    { stdlib: 'Never', typescript: 'never', default: 'undefined' },
    // Bytes
    { stdlib: 'Bytes', typescript: 'Uint8Array', default: 'new Uint8Array()' },
    { stdlib: 'Blob', typescript: 'Blob', import: 'Blob' },
    { stdlib: 'ArrayBuffer', typescript: 'ArrayBuffer', import: 'ArrayBuffer' },
    // Any
    { stdlib: 'Any', typescript: 'any', default: 'undefined' },
    { stdlib: 'Unknown', typescript: 'unknown', default: 'undefined' },
    { stdlib: 'Void', typescript: 'void', default: 'undefined' },
    { stdlib: 'Never', typescript: 'never', default: 'undefined' },
    // JSON
    { stdlib: 'JSON<T>', typescript: 'T', notes: 'JSON serializable object' },
    // Callable
    { stdlib: 'Function<Args,Ret>', typescript: '(Args) => Ret', default: '() => undefined' },
    { stdlib: 'AsyncFunction<Args,Ret>', typescript: '(Args) => Promise<Ret>' },
    // Promise
    { stdlib: 'Promise<T>', typescript: 'Promise<T>', import: 'Promise' },
    // Partial/Required
    { stdlib: 'Partial<T>', typescript: 'Partial<T>', import: 'Partial' },
    { stdlib: 'Required<T>', typescript: 'Required<T>', import: 'Required' },
    { stdlib: 'Readonly<T>', typescript: 'Readonly<T>', import: 'Readonly' },
    // Pick/Omit
    { stdlib: 'Pick<T,K>', typescript: 'Pick<T, K>', import: 'Pick' },
    { stdlib: 'Omit<T,K>', typescript: 'Omit<T, K>', import: 'Omit' },
    // Record
    { stdlib: 'Record<K,V>', typescript: 'Record<K, V>', import: 'Record' },
    // Union (explicit)
    { stdlib: 'Union<A,B>', typescript: 'A | B', default: 'undefined' },
    { stdlib: 'Intersection<A,B>', typescript: 'A & B', default: '{}' },
];
function resolveTypeScriptType(stdlibType) {
    const unionMatch = stdlibType.match(/^Union<(.+),\s*(.+)>$/);
    if (unionMatch) {
        const a = resolveTypeScriptType(unionMatch[1]);
        const b = resolveTypeScriptType(unionMatch[2]);
        return {
            type: `${a.type} | ${b.type}`,
            imports: new Set([...a.imports, ...b.imports]),
            isOptional: false,
            isUnion: true,
            isGeneric: false
        };
    }
    const intersectMatch = stdlibType.match(/^Intersection<(.+),\s*(.+)>$/);
    if (intersectMatch) {
        const a = resolveTypeScriptType(intersectMatch[1]);
        const b = resolveTypeScriptType(intersectMatch[2]);
        return {
            type: `${a.type} & ${b.type}`,
            imports: new Set([...a.imports, ...b.imports]),
            isOptional: false,
            isUnion: true,
            isGeneric: false
        };
    }
    const generic = resolveGeneric(stdlibType);
    if (generic)
        return generic;
    const partialMatch = stdlibType.match(/^Partial<(.+)>$/);
    if (partialMatch) {
        const inner = resolveTypeScriptType(partialMatch[1]);
        return {
            type: `Partial<${inner.type}>`,
            imports: new Set([...inner.imports, 'Partial']),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    const requiredMatch = stdlibType.match(/^Required<(.+)>$/);
    if (requiredMatch) {
        const inner = resolveTypeScriptType(requiredMatch[1]);
        return {
            type: `Required<${inner.type}>`,
            imports: new Set([...inner.imports, 'Required']),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    const readonlyMatch = stdlibType.match(/^Readonly<(.+)>$/);
    if (readonlyMatch) {
        const inner = resolveTypeScriptType(readonlyMatch[1]);
        return {
            type: `Readonly<${inner.type}>`,
            imports: new Set([...inner.imports, 'Readonly']),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    const pickMatch = stdlibType.match(/^Pick<(.+),\s*(.+)>$/);
    if (pickMatch) {
        const inner = resolveTypeScriptType(pickMatch[1]);
        return {
            type: `Pick<${inner.type}, ${pickMatch[2]}>`,
            imports: new Set([...inner.imports, 'Pick']),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    const omitMatch = stdlibType.match(/^Omit<(.+),\s*(.+)>$/);
    if (omitMatch) {
        const inner = resolveTypeScriptType(omitMatch[1]);
        return {
            type: `Omit<${inner.type}, ${omitMatch[2]}>`,
            imports: new Set([...inner.imports, 'Omit']),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    const mapping = exports.TYPESCRIPT_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
    if (mapping) {
        const imports = new Set();
        if (mapping.import)
            imports.add(mapping.import);
        if (mapping.importType)
            imports.add(mapping.importType);
        return {
            type: mapping.typescript,
            imports,
            isOptional: false,
            isUnion: false,
            isGeneric: false
        };
    }
    return {
        type: stdlibType,
        imports: new Set(),
        isOptional: false,
        isUnion: false,
        isGeneric: false
    };
}
function resolveGeneric(stdlibType) {
    // Array<T> / List<T> -> T[]
    const arrayMatch = stdlibType.match(/^(?:Array|List)<(.+)>$/);
    if (arrayMatch) {
        const inner = resolveTypeScriptType(arrayMatch[1]);
        return {
            type: `${inner.type}[]`,
            imports: inner.imports,
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // ReadonlyArray<T> -> readonly T[]
    const readonlyArrayMatch = stdlibType.match(/^ReadonlyArray<(.+)>$/);
    if (readonlyArrayMatch) {
        const inner = resolveTypeScriptType(readonlyArrayMatch[1]);
        return {
            type: `readonly ${inner.type}[]`,
            imports: inner.imports,
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // Map<K,V> -> Map<K, V>
    const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
    if (mapMatch) {
        const key = resolveTypeScriptType(mapMatch[1]);
        const value = resolveTypeScriptType(mapMatch[2]);
        return {
            type: `Map<${key.type}, ${value.type}>`,
            imports: new Set([...key.imports, ...value.imports]),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // WeakMap<K,V> -> WeakMap<K, V>
    const weakMapMatch = stdlibType.match(/^WeakMap<(.+),\s*(.+)>$/);
    if (weakMapMatch) {
        const key = resolveTypeScriptType(weakMapMatch[1]);
        const value = resolveTypeScriptType(weakMapMatch[2]);
        return {
            type: `WeakMap<${key.type}, ${value.type}>`,
            imports: new Set([...key.imports, ...value.imports]),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // Set<T> -> Set<T>
    const setMatch = stdlibType.match(/^Set<(.+)>$/);
    if (setMatch) {
        const inner = resolveTypeScriptType(setMatch[1]);
        return {
            type: `Set<${inner.type}>`,
            imports: inner.imports,
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // WeakSet<T> -> WeakSet<T>
    const weakSetMatch = stdlibType.match(/^WeakSet<(.+)>$/);
    if (weakSetMatch) {
        const inner = resolveTypeScriptType(weakSetMatch[1]);
        return {
            type: `WeakSet<${inner.type}>`,
            imports: inner.imports,
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // Tuple<T...> -> [T, ...]
    const tupleMatch = stdlibType.match(/^Tuple<(.+)>$/);
    if (tupleMatch) {
        const innerTypes = tupleMatch[1].split(',').map(t => resolveTypeScriptType(t.trim()));
        const allImports = [...innerTypes].flatMap(t => [...t.imports]);
        return {
            type: `[${innerTypes.map(t => t.type).join(', ')}]`,
            imports: new Set(allImports),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // Optional<T> -> T | undefined
    const optMatch = stdlibType.match(/^Optional<(.+)>$/);
    if (optMatch) {
        const inner = resolveTypeScriptType(optMatch[1]);
        return {
            type: `${inner.type} | undefined`,
            imports: inner.imports,
            isOptional: true,
            isUnion: true,
            isGeneric: false
        };
    }
    // Nullable<T> -> T | null
    const nullMatch = stdlibType.match(/^Nullable<(.+)>$/);
    if (nullMatch) {
        const inner = resolveTypeScriptType(nullMatch[1]);
        return {
            type: `${inner.type} | null`,
            imports: inner.imports,
            isOptional: true,
            isUnion: true,
            isGeneric: false
        };
    }
    // Nullish<T> -> T | null | undefined
    const nullishMatch = stdlibType.match(/^Nullish<(.+)>$/);
    if (nullishMatch) {
        const inner = resolveTypeScriptType(nullishMatch[1]);
        return {
            type: `${inner.type} | null | undefined`,
            imports: inner.imports,
            isOptional: true,
            isUnion: true,
            isGeneric: false
        };
    }
    // Promise<T> -> Promise<T>
    const promiseMatch = stdlibType.match(/^Promise<(.+)>$/);
    if (promiseMatch) {
        const inner = resolveTypeScriptType(promiseMatch[1]);
        return {
            type: `Promise<${inner.type}>`,
            imports: new Set([...inner.imports, 'Promise']),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // Record<K,V> -> Record<K, V>
    const recordMatch = stdlibType.match(/^Record<(.+),\s*(.+)>$/);
    if (recordMatch) {
        const key = resolveTypeScriptType(recordMatch[1]);
        const value = resolveTypeScriptType(recordMatch[2]);
        return {
            type: `Record<${key.type}, ${value.type}>`,
            imports: new Set([...key.imports, ...value.imports, 'Record']),
            isOptional: false,
            isUnion: false,
            isGeneric: true
        };
    }
    // Function<Args, Ret> -> (Args) => Ret
    const funcMatch = stdlibType.match(/^Function<(.+),\s*(.+)>$/);
    if (funcMatch) {
        const args = resolveTypeScriptType(funcMatch[1]);
        const ret = resolveTypeScriptType(funcMatch[2]);
        return {
            type: `(${args.type}) => ${ret.type}`,
            imports: new Set([...args.imports, ...ret.imports]),
            isOptional: false,
            isUnion: false,
            isGeneric: false
        };
    }
    // AsyncFunction<Args, Ret> -> (Args) => Promise<Ret>
    const asyncFuncMatch = stdlibType.match(/^AsyncFunction<(.+),\s*(.+)>$/);
    if (asyncFuncMatch) {
        const args = resolveTypeScriptType(asyncFuncMatch[1]);
        const ret = resolveTypeScriptType(asyncFuncMatch[2]);
        return {
            type: `(${args.type}) => Promise<${ret.type}>`,
            imports: new Set([...args.imports, ...ret.imports, 'Promise']),
            isOptional: false,
            isUnion: false,
            isGeneric: false
        };
    }
    return null;
}
//# sourceMappingURL=types.js.map