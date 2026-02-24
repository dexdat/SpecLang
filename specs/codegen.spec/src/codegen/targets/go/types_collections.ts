/**
 * SPECLANG-GENERATED: Go collection type handling
 * Source: @speclang/codegen @block:go-types-collections
 */

export interface CollectionMapping {
  stdlib: string;
  go: string;
  zeroValue: string;
}

export const COLLECTION_MAPPINGS: CollectionMapping[] = [
  { stdlib: 'Array<T>', go: '[]T', zeroValue: 'nil' },
  { stdlib: 'List<T>', go: '[]T', zeroValue: 'nil' },
  { stdlib: 'Slice<T>', go: '[]T', zeroValue: 'nil' },
  { stdlib: 'Map<K,V>', go: 'map[K]V', zeroValue: 'nil' },
  { stdlib: 'Set<T>', go: 'map[T]struct{}', zeroValue: 'nil' },
];

export function isCollection(stdlibType: string): boolean {
  return COLLECTION_MAPPINGS.some(m => {
    const pattern = m.stdlib.replace(/<[^>]+>/g, '.*');
    return new RegExp(`^${pattern}$`).test(stdlibType);
  });
}

export function isSlice(stdlibType: string): boolean {
  return ['Array<T>', 'List<T>', 'Slice<T>'].some(t => {
    const pattern = t.replace(/<[^>]+>/g, '.*');
    return new RegExp(`^${pattern}$`).test(stdlibType);
  });
}

export function isMap(stdlibType: string): boolean {
  return ['Map<K,V>', 'Set<T>'].some(t => {
    const pattern = t.replace(/<[^>]+>/g, '.*');
    return new RegExp(`^${pattern}$`).test(stdlibType);
  });
}
