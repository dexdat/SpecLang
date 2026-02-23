/**
 * SPECLANG-GENERATED: Python special types (datetime, uuid, etc.)
 * Source: @speclang/codegen @block:python-types-special
 */

import { resolvePythonType } from './types';

export const TIME_TYPE_MAPPINGS = {
  Date: { 
    python: 'date', 
    fromImport: 'datetime', 
    default: 'date.today()',
    methods: ['year', 'month', 'day', 'isoformat']
  },
  DateTime: { 
    python: 'datetime', 
    fromImport: 'datetime', 
    default: 'datetime.now()',
    methods: ['year', 'month', 'day', 'hour', 'minute', 'second', 'isoformat']
  },
  Time: { 
    python: 'time', 
    fromImport: 'datetime', 
    default: 'time()',
    methods: ['hour', 'minute', 'second', 'isoformat']
  },
  Duration: { 
    python: 'timedelta', 
    fromImport: 'datetime', 
    default: 'timedelta()',
    methods: ['total_seconds', 'days', 'seconds', 'microseconds']
  },
};

export const UUID_MAPPING = {
  stdlib: 'UUID',
  python: 'UUID',
  fromImport: 'uuid',
  default: 'uuid4()',
  methods: ['urn', 'hex', 'int', 'str'],
  notes: 'Use uuid4() for random UUIDs, uuid1() for time-based'
};

export const ID_TYPE_MAPPINGS = {
  ID: { python: 'int', notes: 'Auto-increment database ID' },
  UUID: { python: 'UUID', fromImport: 'uuid' },
  ULID: { python: 'str', notes: 'Lexicographically sortable' },
  NanoID: { python: 'str', notes: 'URL-friendly unique ID' },
  Slug: { python: 'str', notes: 'URL-safe identifier' },
};

export const PYDANTIC_TYPE_MAPPINGS = {
  String: 'str',
  Int: 'int',
  Float: 'float',
  Bool: 'bool',
  UUID: 'UUID',
  DateTime: 'datetime',
  Date: 'date',
  Json: 'Json',
};

export function toPydanticType(stdlibType: string): string {
  const mapping = PYDANTIC_TYPE_MAPPINGS[stdlibType];
  if (mapping) return mapping;

  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    return `List[${toPydanticType(arrayMatch[1])}]`;
  }

  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) {
    return `Dict[${toPydanticType(mapMatch[1])}, ${toPydanticType(mapMatch[2])}]`;
  }

  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) {
    return `Optional[${toPydanticType(optMatch[1])}]`;
  }

  return stdlibType;
}

export function isTimeType(stdlibType: string): boolean {
  return stdlibType in TIME_TYPE_MAPPINGS;
}

export function getTimeMapping(stdlibType: string) {
  return TIME_TYPE_MAPPINGS[stdlibType as keyof typeof TIME_TYPE_MAPPINGS];
}

export function isUUIDType(stdlibType: string): boolean {
  return stdlibType === 'UUID';
}

export function getUUIDMapping() {
  return UUID_MAPPING;
}

export function isIDType(stdlibType: string): boolean {
  return stdlibType in ID_TYPE_MAPPINGS;
}

export function getIDMapping(stdlibType: string) {
  return ID_TYPE_MAPPINGS[stdlibType as keyof typeof ID_TYPE_MAPPINGS];
}
