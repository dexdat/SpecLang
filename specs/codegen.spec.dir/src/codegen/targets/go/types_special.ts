/**
 * SPECLANG-GENERATED: Go special type handling (time, uuid, etc.)
 * Source: @speclang/codegen @block:go-types-special
 */

export const TIME_TYPE_MAPPINGS = {
  Date: { go: 'time.Time', import: 'time', methods: ['Year', 'Month', 'Day'] },
  DateTime: { go: 'time.Time', import: 'time', methods: ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'] },
  Time: { go: 'time.Time', import: 'time', methods: ['Hour', 'Minute', 'Second', 'Nanosecond'] },
  Duration: { go: 'time.Duration', import: 'time', methods: ['Hours', 'Minutes', 'Seconds', 'Milliseconds'] },
};

export const UUID_MAPPING = {
  stdlib: 'UUID',
  go: 'uuid.UUID',
  import: 'github.com/google/uuid',
  zeroValue: 'uuid.Nil',
  methods: ['String', 'Bytes', 'Parse'],
  notes: 'Requires github.com/google/uuid package'
};

export const ID_TYPE_MAPPINGS = {
  ID: { go: 'uint64', notes: 'Auto-increment database ID' },
  UUID: { go: 'uuid.UUID', import: 'github.com/google/uuid' },
  ULID: { go: 'string', notes: 'Lexicographically sortable UUID' },
  NanoID: { go: 'string', notes: 'URL-friendly unique ID' },
};

export function isJSONType(stdlibType: string): boolean {
  return stdlibType.startsWith('JSON<');
}

export function extractJSONType(stdlibType: string): string | null {
  const match = stdlibType.match(/^JSON<(.+)>$/);
  return match ? match[1] : null;
}

export function getSpecialTypeImport(stdlibType: string): string | null {
  if (['Date', 'DateTime', 'Time', 'Duration'].includes(stdlibType)) {
    return 'time';
  }
  if (stdlibType === 'UUID') {
    return 'github.com/google/uuid';
  }
  if (isJSONType(stdlibType)) {
    return 'encoding/json';
  }
  return null;
}
