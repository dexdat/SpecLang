"use strict";
/**
 * SPECLANG-GENERATED: TypeScript collection type handling
 * Source: @speclang/codegen @block:typescript-collections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTION_TYPE_MAPPINGS = void 0;
exports.isCollectionType = isCollectionType;
exports.resolveCollectionType = resolveCollectionType;
exports.getCollectionDefault = getCollectionDefault;
const types_1 = require("./types");
exports.COLLECTION_TYPE_MAPPINGS = [
    { stdlib: 'Array<T>', typescript: 'T[]', default: '[]' },
    { stdlib: 'List<T>', typescript: 'T[]', default: '[]' },
    { stdlib: 'ReadonlyArray<T>', typescript: 'readonly T[]', default: '[]' },
    { stdlib: 'Map<K,V>', typescript: 'Map<K, V>', default: 'new Map()' },
    { stdlib: 'WeakMap<K,V>', typescript: 'WeakMap<K, V>', default: 'new WeakMap()' },
    { stdlib: 'Set<T>', typescript: 'Set<T>', default: 'new Set()' },
    { stdlib: 'WeakSet<T>', typescript: 'WeakSet<T>', default: 'new WeakSet()' },
    { stdlib: 'Tuple<T...>', typescript: '[T, ...]', default: '[]' },
];
function isCollectionType(stdlibType) {
    const collectionPrefixes = ['Array', 'List', 'ReadonlyArray', 'Map', 'WeakMap', 'Set', 'WeakSet', 'Tuple'];
    return collectionPrefixes.some(prefix => stdlibType.startsWith(prefix));
}
function resolveCollectionType(stdlibType) {
    return (0, types_1.resolveTypeScriptType)(stdlibType);
}
function getCollectionDefault(stdlibType) {
    const mapping = exports.COLLECTION_TYPE_MAPPINGS.find(m => stdlibType.startsWith(m.stdlib.replace(/<.*>/, '')));
    return mapping?.default ?? '[]';
}
//# sourceMappingURL=types_collections.js.map