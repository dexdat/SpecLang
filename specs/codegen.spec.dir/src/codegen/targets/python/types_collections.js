"use strict";
/**
 * SPECLANG-GENERATED: Python collection type handling
 * Source: @speclang/codegen @block:python-types-collections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTION_MAPPINGS = void 0;
exports.isCollectionType = isCollectionType;
exports.resolveCollectionType = resolveCollectionType;
exports.getCollectionDefault = getCollectionDefault;
const types_1 = require("./types");
exports.COLLECTION_MAPPINGS = [
    { stdlib: 'Array<T>', python: 'list[T]', import: 'typing', default: '[]' },
    { stdlib: 'List<T>', python: 'list[T]', import: 'typing', default: '[]' },
    { stdlib: 'Sequence<T>', python: 'Sequence[T]', import: 'typing', default: '[]' },
    { stdlib: 'Map<K,V>', python: 'dict[K, V]', import: 'typing', default: '{}' },
    { stdlib: 'Dict<K,V>', python: 'dict[K, V]', import: 'typing', default: '{}' },
    { stdlib: 'Set<T>', python: 'set[T]', import: 'typing', default: 'set()' },
    { stdlib: 'FrozenSet<T>', python: 'frozenset[T]', import: 'typing', default: 'frozenset()' },
    { stdlib: 'Tuple<T...>', python: 'tuple[T, ...]', import: 'typing', default: '()' },
];
function isCollectionType(stdlibType) {
    return stdlibType.includes('Array<') ||
        stdlibType.includes('List<') ||
        stdlibType.includes('Sequence<') ||
        stdlibType.includes('Map<') ||
        stdlibType.includes('Dict<') ||
        stdlibType.includes('Set<') ||
        stdlibType.includes('FrozenSet<') ||
        stdlibType.includes('Tuple<');
}
function resolveCollectionType(stdlibType) {
    // Array<T> / List<T>
    const listMatch = stdlibType.match(/^(?:Array|List)<(.+)>$/);
    if (listMatch) {
        const inner = (0, types_1.resolvePythonType)(listMatch[1]);
        return {
            type: `list[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: true
        };
    }
    // Map<K,V> / Dict<K,V>
    const dictMatch = stdlibType.match(/^(?:Map|Dict)<(.+),\s*(.+)>$/);
    if (dictMatch) {
        const key = (0, types_1.resolvePythonType)(dictMatch[1]);
        const value = (0, types_1.resolvePythonType)(dictMatch[2]);
        return {
            type: `dict[${key.type}, ${value.type}]`,
            imports: new Set([...key.imports, ...value.imports, 'typing']),
            isOptional: false,
            isCollection: true
        };
    }
    // Set<T>
    const setMatch = stdlibType.match(/^Set<(.+)>$/);
    if (setMatch) {
        const inner = (0, types_1.resolvePythonType)(setMatch[1]);
        return {
            type: `set[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: true
        };
    }
    // FrozenSet<T>
    const frozenMatch = stdlibType.match(/^FrozenSet<(.+)>$/);
    if (frozenMatch) {
        const inner = (0, types_1.resolvePythonType)(frozenMatch[1]);
        return {
            type: `frozenset[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: true
        };
    }
    // Tuple<T...>
    const tupleMatch = stdlibType.match(/^Tuple<(.+)>$/);
    if (tupleMatch) {
        const innerTypes = tupleMatch[1].split(',').map(t => (0, types_1.resolvePythonType)(t.trim()));
        const allImports = innerTypes.flatMap(t => [...t.imports]);
        return {
            type: `tuple[${innerTypes.map(t => t.type).join(', ')}]`,
            imports: new Set([...allImports, 'typing']),
            isOptional: false,
            isCollection: true
        };
    }
    return null;
}
function getCollectionDefault(stdlibType) {
    if (stdlibType.includes('Array<') || stdlibType.includes('List<'))
        return '[]';
    if (stdlibType.includes('Map<') || stdlibType.includes('Dict<'))
        return '{}';
    if (stdlibType.includes('Set<'))
        return 'set()';
    if (stdlibType.includes('FrozenSet<'))
        return 'frozenset()';
    if (stdlibType.includes('Tuple<'))
        return '()';
    return '[]';
}
//# sourceMappingURL=types_collections.js.map