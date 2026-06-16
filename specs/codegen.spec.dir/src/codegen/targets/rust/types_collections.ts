/**
 * SPECLANG-GENERATED: Rust collection type mappings
 * Source: @speclang/codegen @block:rust-types-collections
 */

import { resolveRustType, TypeResolution } from './types';

export const RUST_COLLECTION_MAPPINGS = {
  Array: { rust: 'Vec', import: 'alloc', default: 'Vec::new()' },
  List: { rust: 'Vec', import: 'alloc', default: 'Vec::new()' },
  Vec: { rust: 'Vec', import: 'alloc', default: 'Vec::new()' },
  Slice: { rust: '&[T]', import: null, default: '&[]' },
  Map: { rust: 'HashMap', import: 'std::collections', default: 'HashMap::new()' },
  BTreeMap: { rust: 'BTreeMap', import: 'std::collections', default: 'BTreeMap::new()' },
  Set: { rust: 'HashSet', import: 'std::collections', default: 'HashSet::new()' },
  BTreeSet: { rust: 'BTreeSet', import: 'std::collections', default: 'BTreeSet::new()' },
};

export function resolveCollectionType(stdlibType: string): TypeResolution | null {
  const vecMatch = stdlibType.match(/^(?:Array|List|Vec)<(.+)>$/);
  if (vecMatch) {
    const inner = resolveRustType(vecMatch[1]);
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
    const inner = resolveRustType(sliceMatch[1]);
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
    const key = resolveRustType(mapMatch[1]);
    const value = resolveRustType(mapMatch[2]);
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
    const key = resolveRustType(btreeMapMatch[1]);
    const value = resolveRustType(btreeMapMatch[2]);
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
    const inner = resolveRustType(setMatch[1]);
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
    const inner = resolveRustType(btreeSetMatch[1]);
    return {
      type: `BTreeSet<${inner.type}>`,
      imports: new Set([...inner.imports, 'std::collections']),
      crates: inner.crates,
      isOption: false,
      isReference: false,
      isSmartPointer: false
    };
  }

  return null;
}

export function isCollectionType(stdlibType: string): boolean {
  return /^(?:Array|List|Vec|Slice|Map|BTreeMap|Set|BTreeSet)<.+>$/.test(stdlibType);
}

export function getCollectionDefault(stdlibType: string): string {
  if (/^(?:Array|List|Vec)<.+>$/.test(stdlibType)) return 'Vec::new()';
  if (/^Slice<.+>$/.test(stdlibType)) return '&[]';
  if (/^Map<.+,.+>$/.test(stdlibType)) return 'HashMap::new()';
  if (/^BTreeMap<.+,.+>$/.test(stdlibType)) return 'BTreeMap::new()';
  if (/^Set<.+>$/.test(stdlibType)) return 'HashSet::new()';
  if (/^BTreeSet<.+>$/.test(stdlibType)) return 'BTreeSet::new()';
  return 'Todo::new()';
}
