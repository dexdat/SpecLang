"use strict";
/**
 * SPECLANG-GENERATED: Go collection type handling
 * Source: @speclang/codegen @block:go-types-collections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTION_MAPPINGS = void 0;
exports.isCollection = isCollection;
exports.isSlice = isSlice;
exports.isMap = isMap;
exports.COLLECTION_MAPPINGS = [
    { stdlib: 'Array<T>', go: '[]T', zeroValue: 'nil' },
    { stdlib: 'List<T>', go: '[]T', zeroValue: 'nil' },
    { stdlib: 'Slice<T>', go: '[]T', zeroValue: 'nil' },
    { stdlib: 'Map<K,V>', go: 'map[K]V', zeroValue: 'nil' },
    { stdlib: 'Set<T>', go: 'map[T]struct{}', zeroValue: 'nil' },
];
function isCollection(stdlibType) {
    return exports.COLLECTION_MAPPINGS.some(m => {
        const pattern = m.stdlib.replace(/<[^>]+>/g, '.*');
        return new RegExp(`^${pattern}$`).test(stdlibType);
    });
}
function isSlice(stdlibType) {
    return ['Array<T>', 'List<T>', 'Slice<T>'].some(t => {
        const pattern = t.replace(/<[^>]+>/g, '.*');
        return new RegExp(`^${pattern}$`).test(stdlibType);
    });
}
function isMap(stdlibType) {
    return ['Map<K,V>', 'Set<T>'].some(t => {
        const pattern = t.replace(/<[^>]+>/g, '.*');
        return new RegExp(`^${pattern}$`).test(stdlibType);
    });
}
//# sourceMappingURL=types_collections.js.map