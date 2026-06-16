// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY

/**
 * Primitive type validators and generators
 */

// Branded primitive types
export type UUID = string & { __brand: 'UUID' };
export type DateTime = string & { __brand: 'DateTime' };
export type Email = string & { __brand: 'Email' };
export type URL = string & { __brand: 'URL' };
export type Path = string & { __brand: 'Path' };

// Type validator interface
export interface TypeValidator<T> {
  validate: (value: unknown) => value is T;
  default: T;
  examples?: T[];
}

// Primitive validators
export const Primitives = {
  String: {
    validate: (value: unknown): value is string => typeof value === 'string',
    default: '' as string,
    examples: ['hello', 'world']
  },
  
  Number: {
    validate: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
    default: 0 as number,
    examples: [0, 1, 3.14, -42]
  },
  
  Boolean: {
    validate: (value: unknown): value is boolean => typeof value === 'boolean',
    default: false as boolean,
    examples: [true, false]
  },
  
  Null: {
    validate: (value: unknown): value is null => value === null,
    default: null as null,
    examples: [null]
  },
  
  Undefined: {
    validate: (value: unknown): value is undefined => value === undefined,
    default: undefined as undefined,
    examples: [undefined]
  },
  
  UUID: {
    validate: (value: unknown): value is UUID => {
      if (typeof value !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    },
    generate: (): UUID => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      }) as UUID;
    },
    default: '00000000-0000-0000-0000-000000000000' as UUID,
    examples: ['550e8400-e29b-41d4-a716-446655440000']
  },
  
  DateTime: {
    validate: (value: unknown): value is DateTime => {
      if (typeof value !== 'string') return false;
      return !isNaN(Date.parse(value));
    },
    now: (): DateTime => new Date().toISOString() as DateTime,
    parse: (value: string): DateTime | null => {
      const parsed = Date.parse(value);
      if (isNaN(parsed)) return null;
      return new Date(parsed).toISOString() as DateTime;
    },
    default: '1970-01-01T00:00:00.000Z' as DateTime,
    examples: ['2024-01-15T10:30:00.000Z']
  },
  
  Email: {
    validate: (value: unknown): value is Email => {
      if (typeof value !== 'string') return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    default: '' as Email,
    examples: ['user@example.com']
  },
  
  URL: {
    validate: (value: unknown): value is URL => {
      if (typeof value !== 'string') return false;
      try {
        new globalThis.URL(value);
        return true;
      } catch {
        return false;
      }
    },
    default: '' as URL,
    examples: ['https://example.com']
  },
  
  Path: {
    validate: (value: unknown): value is Path => {
      if (typeof value !== 'string') return false;
      return value.length > 0 && !value.includes('\0');
    },
    default: '' as Path,
    examples: ['/usr/local/bin', 'src/index.ts']
  }
};

// Type predicates
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isNull = (value: unknown): value is null => value === null;
export const isUndefined = (value: unknown): value is undefined => value === undefined;
export const isFunction = (value: unknown): value is Function => typeof value === 'function';
export const isObject = (value: unknown): value is Record<string, unknown> => 
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isArray = (value: unknown): value is unknown[] => Array.isArray(value);
