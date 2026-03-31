// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY

/**
 * Composite type validators and utilities
 */

import { TypeValidator } from './primitives';

/**
 * List (Array) operations
 */
export const ListOps = {
  of: <T>(itemValidator: TypeValidator<T>): TypeValidator<T[]> => ({
    validate: (value: unknown): value is T[] => {
      if (!Array.isArray(value)) return false;
      return value.every(item => itemValidator.validate(item));
    },
    default: [],
    examples: [[]]
  }),
  
  map: <T, U>(list: T[], fn: (item: T, index: number) => U): U[] => 
    list.map(fn),
  
  filter: <T>(list: T[], predicate: (item: T) => boolean): T[] =>
    list.filter(predicate),
  
  reduce: <T, U>(list: T[], fn: (acc: U, item: T) => U, initial: U): U =>
    list.reduce(fn, initial),
  
  find: <T>(list: T[], predicate: (item: T) => boolean): T | undefined =>
    list.find(predicate),
  
  some: <T>(list: T[], predicate: (item: T) => boolean): boolean =>
    list.some(predicate),
  
  every: <T>(list: T[], predicate: (item: T) => boolean): boolean =>
    list.every(predicate),
  
  first: <T>(list: T[]): T | undefined => list[0],
  last: <T>(list: T[]): T | undefined => list[list.length - 1],
  length: <T>(list: T[]): number => list.length,
  isEmpty: <T>(list: T[]): boolean => list.length === 0,
  
  includes: <T>(list: T[], item: T): boolean =>
    list.includes(item),
  
  push: <T>(list: T[], item: T): T[] =>
    [...list, item],
  
  pop: <T>(list: T[]): [T | undefined, T[]] => {
    if (list.length === 0) return [undefined, []];
    const newList = [...list];
    const item = newList.pop();
    return [item, newList];
  },
  
  sort: <T>(list: T[], cmp?: (a: T, b: T) => number): T[] =>
    [...list].sort(cmp),
  
  reverse: <T>(list: T[]): T[] =>
    [...list].reverse()
};

/**
 * Map (Record) operations
 */
export const Map = {
  of: <V>(valueValidator: TypeValidator<V>): TypeValidator<Record<string, V>> => ({
    validate: (value: unknown): value is Record<string, V> => {
      if (typeof value !== 'object' || value === null) return false;
      return Object.values(value as Record<string, V>).every(v => valueValidator.validate(v));
    },
    default: {},
    examples: [{}]
  }),
  
  get: <V>(map: Record<string, V>, key: string): V | undefined =>
    map[key],
  
  set: <V>(map: Record<string, V>, key: string, value: V): Record<string, V> =>
    ({ ...map, [key]: value }),
  
  has: (map: Record<string, unknown>, key: string): boolean =>
    key in map,
  
  keys: <V>(map: Record<string, V>): string[] =>
    Object.keys(map),
  
  values: <V>(map: Record<string, V>): V[] =>
    Object.values(map),
  
  entries: <V>(map: Record<string, V>): [string, V][] =>
    Object.entries(map),
  
  size: <V>(map: Record<string, V>): number =>
    Object.keys(map).length,
  
  delete: <V>(map: Record<string, V>, key: string): Record<string, V> => {
    const newMap = { ...map };
    delete newMap[key];
    return newMap;
  }
};

/**
 * Set operations
 */
export const SetOps = {
  add: <T>(set: T[], item: T): T[] => {
    if (set.includes(item)) return set;
    return [...set, item];
  },
  
  has: <T>(set: T[], item: T): boolean =>
    set.includes(item),
  
  delete: <T>(set: T[], item: T): T[] =>
    set.filter(x => x !== item),
  
  union: <T>(a: T[], b: T[]): T[] => {
    const result = [...a];
    b.forEach(item => {
      if (!result.includes(item)) result.push(item);
    });
    return result;
  },
  
  intersect: <T>(a: T[], b: T[]): T[] =>
    a.filter(item => b.includes(item)),
  
  diff: <T>(a: T[], b: T[]): T[] =>
    a.filter(item => !b.includes(item)),
  
  size: <T>(set: T[]): number => set.length
};

/**
 * Optional (Maybe) type operations
 */
export const OptionalOps = {
  of: <T>(value: T | null | undefined): T | null =>
    value ?? null,
  
  isSome: <T>(value: T | null): value is T =>
    value !== null,
  
  isNone: <T>(value: T | null): value is null =>
    value === null,
  
  map: <T, U>(value: T | null, fn: (v: T) => U): U | null =>
    value === null ? null : fn(value),
  
  orElse: <T>(value: T | null, defaultValue: T): T =>
    value ?? defaultValue,
  
  orElseGet: <T>(value: T | null, supplier: () => T): T =>
    value ?? supplier(),
  
  flatten: <T>(value: T | null | null): T | null =>
    value === null ? null : value
};

/**
 * OneOf type validator
 */
export const OneOf = {
  validate: <T extends readonly unknown[]>(options: T) => 
    (value: unknown): value is T[number] =>
      (options as readonly unknown[]).includes(value)
};

/**
 * Tuple operations
 */
export const TupleOps = {
  of: <T extends any[]>(...validators: { [K in keyof T]: TypeValidator<T[K]> }): TypeValidator<T> => ({
    validate: (value: unknown): value is T => {
      if (!Array.isArray(value)) return false;
      if (value.length !== validators.length) return false;
      return value.every((item, index) => validators[index].validate(item));
    },
    default: [] as unknown as T, // @ts-ignore
    examples: [[]]
  }),
  
  get: <T extends any[], K extends number>(tuple: T, index: K): T[K] =>
    tuple[index],
  
  set: <T extends any[], K extends number, V>(tuple: T, index: K, value: V): [...T] => {
    const newTuple = [...tuple] as [...T];
    newTuple[index] = value as T[K];
    return newTuple;
  },
  
  length: <T extends any[]>(tuple: T): number => tuple.length
};

/**
 * Record operations
 */
export const RecordOps = {
  of: <V>(valueValidator: TypeValidator<V>): TypeValidator<Record<string, V>> => ({
    validate: (value: unknown): value is Record<string, V> => {
      if (typeof value !== 'object' || value === null) return false;
      return Object.values(value as Record<string, V>).every(v => valueValidator.validate(v));
    },
    default: {},
    examples: [{}]
  }),
  
  get: <V>(record: Record<string, V>, key: string): V | undefined =>
    record[key],
  
  set: <V>(record: Record<string, V>, key: string, value: V): Record<string, V> =>
    ({ ...record, [key]: value }),
  
  has: (record: Record<string, unknown>, key: string): boolean =>
    key in record,
  
  keys: <V>(record: Record<string, V>): string[] =>
    Object.keys(record),
  
  values: <V>(record: Record<string, V>): V[] =>
    Object.values(record),
  
  entries: <V>(record: Record<string, V>): [string, V][] =>
    Object.entries(record),
  
  size: <V>(record: Record<string, V>): number =>
    Object.keys(record).length,
  
  delete: <V>(record: Record<string, V>, key: string): Record<string, V> => {
    const newRecord = { ...record };
    delete newRecord[key];
    return newRecord;
  }
};
