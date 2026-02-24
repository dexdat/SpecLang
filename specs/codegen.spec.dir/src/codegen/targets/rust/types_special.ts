/**
 * SPECLANG-GENERATED: Rust special type mappings (time, uuid, etc.)
 * Source: @speclang/codegen @block:rust-types-special
 */

import { resolveRustType, TypeResolution } from './types';

export const TIME_TYPE_MAPPINGS: Record<string, { rust: string; import?: string; crate?: string; default?: string; methods?: string[]; notes?: string }> = {
  Date: {
    rust: 'NaiveDate',
    import: 'chrono',
    crate: 'chrono',
    default: 'NaiveDate::MIN',
    methods: ['year', 'month', 'day', 'from_ymd_opt']
  },
  DateTime: {
    rust: 'DateTime<Utc>',
    import: 'chrono',
    crate: 'chrono',
    default: 'DateTime::MIN_UTC',
    methods: ['year', 'month', 'day', 'timestamp', 'now', 'from_timestamp']
  },
  Time: {
    rust: 'NaiveTime',
    import: 'chrono',
    crate: 'chrono',
    default: 'NaiveTime::MIN',
    methods: ['hour', 'minute', 'second', 'from_hms_opt']
  },
  Duration: {
    rust: 'Duration',
    import: 'std::time',
    default: 'Duration::ZERO',
    methods: ['as_secs', 'as_millis', 'from_secs', 'from_millis']
  },
  Timestamp: {
    rust: 'i64',
    notes: 'Unix timestamp in seconds'
  },
};

export const UUID_MAPPING = {
  stdlib: 'UUID',
  rust: 'Uuid',
  import: 'uuid',
  crate: 'uuid',
  default: 'Uuid::nil()',
  methods: ['new_v4', 'nil', 'parse_str', 'to_string'],
  variants: ['Uuid::new_v4()', 'Uuid::nil()', 'Uuid::parse_str(s)']
};

export const SERDE_TYPE_MAPPINGS: Record<string, string> = {
  String: 'String',
  Int: 'i32',
  Int64: 'i64',
  Float: 'f64',
  Bool: 'bool',
  UUID: 'Uuid',
  JSON: 'Value',
  Email: 'String',
};

export const TOKIO_TYPE_MAPPINGS = {
  Future: 'impl Future<Output = T> + Send',
  Stream: 'impl Stream<Item = T>',
  Mutex: 'tokio::sync::Mutex<T>',
  RwLock: 'tokio::sync::RwLock<T>',
  Channel: 'tokio::sync::mpsc::Sender<T>',
};

export function toSerdeAttribute(stdlibType: string): string {
  const mapping = SERDE_TYPE_MAPPINGS[stdlibType];
  if (mapping) return `#[serde(rename = "${mapping.toLowerCase()}")]`;
  return '';
}

export function generateUseStatements(resolution: TypeResolution): string[] {
  const statements: string[] = [];

  for (const imp of resolution.imports) {
    statements.push(`use ${imp};`);
  }

  return statements;
}

export function resolveTimeType(stdlibType: string): TypeResolution | null {
  const mapping = TIME_TYPE_MAPPINGS[stdlibType as keyof typeof TIME_TYPE_MAPPINGS];
  if (!mapping) return null;

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

export function resolveUUIDType(stdlibType: string): TypeResolution | null {
  if (stdlibType !== 'UUID') return null;

  const imports = new Set<string>();
  const crates = new Set<string>();

  if (UUID_MAPPING.import) imports.add(UUID_MAPPING.import);
  if (UUID_MAPPING.crate) crates.add(UUID_MAPPING.crate);

  return {
    type: UUID_MAPPING.rust,
    imports,
    crates,
    isOption: false,
    isReference: false,
    isSmartPointer: false
  };
}

export function isTimeType(stdlibType: string): boolean {
  return stdlibType in TIME_TYPE_MAPPINGS;
}

export function isUUIDType(stdlibType: string): boolean {
  return stdlibType === 'UUID';
}

export function getCrateDependencies(resolution: TypeResolution): string[] {
  return Array.from(resolution.crates);
}
