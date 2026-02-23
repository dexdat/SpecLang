/**
 * SPECLANG-GENERATED: TypeScript collection type handling
 * Source: @speclang/codegen @block:typescript-collections
 */

import { resolveTypeScriptType } from './types';

export interface CollectionMapping {
  stdlib: string;
  typescript: string;
  default: string;
}

export const COLLECTION_TYPE_MAPPINGS: CollectionMapping[] = [
  { stdlib: 'Array<T>', typescript: 'T[]', default: '[]' },
  { stdlib: 'List<T>', typescript: 'T[]', default: '[]' },
  { stdlib: 'ReadonlyArray<T>', typescript: 'readonly T[]', default: '[]' },
  { stdlib: 'Map<K,V>', typescript: 'Map<K, V>', default: 'new Map()' },
  { stdlib: 'WeakMap<K,V>', typescript: 'WeakMap<K, V>', default: 'new WeakMap()' },
  { stdlib: 'Set<T>', typescript: 'Set<T>', default: 'new Set()' },
  { stdlib: 'WeakSet<T>', typescript: 'WeakSet<T>', default: 'new WeakSet()' },
  { stdlib: 'Tuple<T...>', typescript: '[T, ...]', default: '[]' },
];

export function isCollectionType(stdlibType: string): boolean {
  const collectionPrefixes = ['Array', 'List', 'ReadonlyArray', 'Map', 'WeakMap', 'Set', 'WeakSet', 'Tuple'];
  return collectionPrefixes.some(prefix => stdlibType.startsWith(prefix));
}

export function resolveCollectionType(stdlibType: string) {
  return resolveTypeScriptType(stdlibType);
}

export function getCollectionDefault(stdlibType: string): string {
  const mapping = COLLECTION_TYPE_MAPPINGS.find(m => stdlibType.startsWith(m.stdlib.replace(/<.*>/, '')));
  return mapping?.default ?? '[]';
}
