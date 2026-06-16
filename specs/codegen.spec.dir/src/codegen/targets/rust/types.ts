/**
 * SPECLANG-GENERATED: Rust type mappings
 * Source: @speclang/codegen @block:rust-types
 */

export interface RustTypeMapping {
  stdlib: string;
  rust: string;
  import?: string;
  crate?: string;
  default: string;
  notes?: string;
}

export interface TypeResolution {
  type: string;
  imports: Set<string>;
  crates: Set<string>;
  isOption: boolean;
  isReference: boolean;
  isSmartPointer: boolean;
}

export const RUST_TYPE_MAPPINGS: RustTypeMapping[] = [
  // Primitives - Basic
  { stdlib: 'String', rust: 'String', default: 'String::new()' },
  { stdlib: 'Int', rust: 'i32', default: '0' },
  { stdlib: 'Int8', rust: 'i8', default: '0' },
  { stdlib: 'Int16', rust: 'i16', default: '0' },
  { stdlib: 'Int32', rust: 'i32', default: '0' },
  { stdlib: 'Int64', rust: 'i64', default: '0' },
  { stdlib: 'Int128', rust: 'i128', default: '0' },
  { stdlib: 'UInt', rust: 'u32', default: '0' },
  { stdlib: 'UInt8', rust: 'u8', default: '0' },
  { stdlib: 'UInt16', rust: 'u16', default: '0' },
  { stdlib: 'UInt32', rust: 'u32', default: '0' },
  { stdlib: 'UInt64', rust: 'u64', default: '0' },
  { stdlib: 'UInt128', rust: 'u128', default: '0' },
  { stdlib: 'Float32', rust: 'f32', default: '0.0' },
  { stdlib: 'Float64', rust: 'f64', default: '0.0' },
  { stdlib: 'Float', rust: 'f64', default: '0.0' },
  { stdlib: 'Bool', rust: 'bool', default: 'false' },
  { stdlib: 'Boolean', rust: 'bool', default: 'false' },
  { stdlib: 'Char', rust: 'char', default: "'\\0'" },
  { stdlib: 'Unit', rust: '()', default: '()' },

  // Primitives - String variants
  { stdlib: 'Text', rust: 'String', default: 'String::new()' },
  { stdlib: 'Str', rust: '&str', default: '""' },

  // Time types
  { stdlib: 'Date', rust: 'NaiveDate', import: 'chrono', crate: 'chrono', default: 'NaiveDate::MIN' },
  { stdlib: 'DateTime', rust: 'DateTime<Utc>', import: 'chrono', crate: 'chrono', default: 'DateTime::MIN_UTC' },
  { stdlib: 'Time', rust: 'NaiveTime', import: 'chrono', crate: 'chrono', default: 'NaiveTime::MIN' },
  { stdlib: 'Duration', rust: 'Duration', import: 'std::time', default: 'Duration::ZERO' },
  { stdlib: 'Timestamp', rust: 'i64', default: '0', notes: 'Unix timestamp' },

  // Identifiers
  { stdlib: 'UUID', rust: 'Uuid', import: 'uuid', crate: 'uuid', default: 'Uuid::nil()' },
  { stdlib: 'ID', rust: 'u64', default: '0', notes: 'Auto-increment ID' },
  { stdlib: 'ULID', rust: 'String', default: 'String::new()', notes: 'Use ulid crate for actual ULID' },
  { stdlib: 'NanoID', rust: 'String', default: 'String::new()', notes: 'Use nanoid crate' },

  // Collections
  { stdlib: 'Array<T>', rust: 'Vec<T>', default: 'Vec::new()' },
  { stdlib: 'List<T>', rust: 'Vec<T>', default: 'Vec::new()' },
  { stdlib: 'Vec<T>', rust: 'Vec<T>', default: 'Vec::new()' },
  { stdlib: 'Slice<T>', rust: '&[T]', default: '&[]' },
  { stdlib: 'Map<K,V>', rust: 'HashMap<K, V>', import: 'std::collections', default: 'HashMap::new()' },
  { stdlib: 'BTreeMap<K,V>', rust: 'BTreeMap<K, V>', import: 'std::collections', default: 'BTreeMap::new()' },
  { stdlib: 'Set<T>', rust: 'HashSet<T>', import: 'std::collections', default: 'HashSet::new()' },
  { stdlib: 'BTreeSet<T>', rust: 'BTreeSet<T>', import: 'std::collections', default: 'BTreeSet::new()' },

  // Optional
  { stdlib: 'Optional<T>', rust: 'Option<T>', default: 'None' },
  { stdlib: 'Nullable<T>', rust: 'Option<T>', default: 'None' },

  // Error handling
  { stdlib: 'Result<T,E>', rust: 'Result<T, E>', default: 'Ok(T::default())' },
  { stdlib: 'Error', rust: 'Box<dyn std::error::Error>', default: 'Box::new(...)' },

  // Bytes
  { stdlib: 'Bytes', rust: 'Vec<u8>', default: 'Vec::new()' },
  { stdlib: 'Blob', rust: 'Vec<u8>', default: 'Vec::new()' },
  { stdlib: 'ByteArray', rust: '[u8; N]', default: '[0; N]', notes: 'Fixed-size byte array' },

  // Any
  { stdlib: 'Any', rust: 'Box<dyn Any>', import: 'std::any', default: 'Box::new(...)' },
  { stdlib: 'Unknown', rust: 'serde_json::Value', import: 'serde_json', crate: 'serde_json', default: 'serde_json::Value::Null' },
  { stdlib: 'Void', rust: '!', notes: 'Unreachable type', default: 'panic!()' },

  // References
  { stdlib: 'Ref<T>', rust: '&T', default: '&value' },
  { stdlib: 'RefMut<T>', rust: '&mut T', default: '&mut value' },
  { stdlib: 'Box<T>', rust: 'Box<T>', default: 'Box::new(T::default())' },
  { stdlib: 'Rc<T>', rust: 'Rc<T>', import: 'std::rc', default: 'Rc::new(T::default())' },
  { stdlib: 'Arc<T>', rust: 'Arc<T>', import: 'std::sync', default: 'Arc::new(T::default())' },

  // Cell types
  { stdlib: 'Cell<T>', rust: 'Cell<T>', import: 'std::cell', default: 'Cell::new(T::default())' },
  { stdlib: 'Mutex<T>', rust: 'Mutex<T>', import: 'std::sync', default: 'Mutex::new(T::default())' },
  { stdlib: 'RwLock<T>', rust: 'RwLock<T>', import: 'std::sync', default: 'RwLock::new(T::default())' },

  // Iterator
  { stdlib: 'Iterator<T>', rust: 'impl Iterator<Item = T>', default: 'std::iter::empty()' },
  { stdlib: 'Stream<T>', rust: 'impl Stream<Item = T>', import: 'futures', crate: 'futures', default: 'stream::empty()' },

  // Async
  { stdlib: 'Future<T>', rust: 'impl Future<Output = T>', import: 'std::future', default: 'async { T::default() }' },
  { stdlib: 'Async<T>', rust: 'impl Future<Output = T>', import: 'std::future', default: 'async { T::default() }' },

  // Path types
  { stdlib: 'Path', rust: 'PathBuf', import: 'std::path', default: 'PathBuf::new()' },
  { stdlib: 'Uri', rust: 'Uri', import: 'http', crate: 'http', default: 'Uri::default()' },

  // URL and Email
  { stdlib: 'URL', rust: 'Url', import: 'url', crate: 'url', default: 'Url::parse("http://example.com").unwrap()' },
  { stdlib: 'Email', rust: 'String', default: 'String::new()', notes: 'Validate as String' },
  { stdlib: 'JSON', rust: 'Value', import: 'serde_json', crate: 'serde_json', default: 'Value::Null' },
];

function lookupMapping(stdlibType: string): RustTypeMapping | undefined {
  return RUST_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
}

export function resolveRustType(stdlibType: string): TypeResolution {
  const resultMatch = stdlibType.match(/^Result<(.+),\s*(.+)>$/);
  if (resultMatch) {
    const t = resolveRustType(resultMatch[1]);
    const e = resolveRustType(resultMatch[2]);
    return {
      type: `Result<${t.type}, ${e.type}>`,
      imports: new Set([...t.imports, ...e.imports]),
      crates: new Set([...t.crates, ...e.crates]),
      isOption: false,
      isReference: false,
      isSmartPointer: false
    };
  }

  const generic = resolveGeneric(stdlibType);
  if (generic) return generic;

  const refMatch = stdlibType.match(/^Ref<(.+)>$/);
  if (refMatch) {
    const inner = resolveRustType(refMatch[1]);
    return {
      type: `&${inner.type}`,
      imports: inner.imports,
      crates: inner.crates,
      isOption: false,
      isReference: true,
      isSmartPointer: false
    };
  }

  const refMutMatch = stdlibType.match(/^RefMut<(.+)>$/);
  if (refMutMatch) {
    const inner = resolveRustType(refMutMatch[1]);
    return {
      type: `&mut ${inner.type}`,
      imports: inner.imports,
      crates: inner.crates,
      isOption: false,
      isReference: true,
      isSmartPointer: false
    };
  }

  const boxMatch = stdlibType.match(/^Box<(.+)>$/);
  if (boxMatch) {
    const inner = resolveRustType(boxMatch[1]);
    return {
      type: `Box<${inner.type}>`,
      imports: new Set([...inner.imports, 'alloc']),
      crates: inner.crates,
      isOption: false,
      isReference: false,
      isSmartPointer: true
    };
  }

  const rcMatch = stdlibType.match(/^Rc<(.+)>$/);
  if (rcMatch) {
    const inner = resolveRustType(rcMatch[1]);
    return {
      type: `Rc<${inner.type}>`,
      imports: new Set([...inner.imports, 'std::rc']),
      crates: inner.crates,
      isOption: false,
      isReference: false,
      isSmartPointer: true
    };
  }

  const arcMatch = stdlibType.match(/^Arc<(.+)>$/);
  if (arcMatch) {
    const inner = resolveRustType(arcMatch[1]);
    return {
      type: `Arc<${inner.type}>`,
      imports: new Set([...inner.imports, 'std::sync']),
      crates: inner.crates,
      isOption: false,
      isReference: false,
      isSmartPointer: true
    };
  }

  const mapping = lookupMapping(stdlibType);
  if (mapping) {
    const imports = new Set<string>();
    const crates = new Set<string>();

    if (mapping.import) imports.add(mapping.import);
    if (mapping.crate) crates.add(mapping.crate);

    return {
      type: mapping.rust,
      imports,
      crates,
      isOption: false,
      isReference: false,
      isSmartPointer: false
    };
  }

  return {
    type: stdlibType,
    imports: new Set<string>(),
    crates: new Set<string>(),
    isOption: false,
    isReference: false,
    isSmartPointer: false
  };
}

function resolveGeneric(stdlibType: string): TypeResolution | null {
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

  const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
  if (optMatch) {
    const inner = resolveRustType(optMatch[1]);
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
    const inner = resolveRustType(cellMatch[1]);
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
    const inner = resolveRustType(mutexMatch[1]);
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
    const inner = resolveRustType(rwLockMatch[1]);
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
    const inner = resolveRustType(iterMatch[1]);
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
    const inner = resolveRustType(streamMatch[1]);
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
    const inner = resolveRustType(futureMatch[1]);
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

export { resolveGeneric as resolveGenericType };
