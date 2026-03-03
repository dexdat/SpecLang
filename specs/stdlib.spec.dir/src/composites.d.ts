/**
 * Composite type validators and utilities
 */
import { TypeValidator } from './primitives';
/**
 * List (Array) operations
 */
export declare const ListOps: {
    of: <T>(itemValidator: TypeValidator<T>) => TypeValidator<T[]>;
    map: <T, U>(list: T[], fn: (item: T, index: number) => U) => U[];
    filter: <T>(list: T[], predicate: (item: T) => boolean) => T[];
    reduce: <T, U>(list: T[], fn: (acc: U, item: T) => U, initial: U) => U;
    find: <T>(list: T[], predicate: (item: T) => boolean) => T | undefined;
    some: <T>(list: T[], predicate: (item: T) => boolean) => boolean;
    every: <T>(list: T[], predicate: (item: T) => boolean) => boolean;
    first: <T>(list: T[]) => T | undefined;
    last: <T>(list: T[]) => T | undefined;
    length: <T>(list: T[]) => number;
    isEmpty: <T>(list: T[]) => boolean;
    includes: <T>(list: T[], item: T) => boolean;
    push: <T>(list: T[], item: T) => T[];
    pop: <T>(list: T[]) => [T | undefined, T[]];
    sort: <T>(list: T[], cmp?: (a: T, b: T) => number) => T[];
    reverse: <T>(list: T[]) => T[];
};
/**
 * Map (Record) operations
 */
export declare const Map: {
    of: <V>(valueValidator: TypeValidator<V>) => TypeValidator<Record<string, V>>;
    get: <V>(map: Record<string, V>, key: string) => V | undefined;
    set: <V>(map: Record<string, V>, key: string, value: V) => Record<string, V>;
    has: (map: Record<string, unknown>, key: string) => boolean;
    keys: <V>(map: Record<string, V>) => string[];
    values: <V>(map: Record<string, V>) => V[];
    entries: <V>(map: Record<string, V>) => [string, V][];
    size: <V>(map: Record<string, V>) => number;
    delete: <V>(map: Record<string, V>, key: string) => Record<string, V>;
};
/**
 * Set operations
 */
export declare const SetOps: {
    add: <T>(set: T[], item: T) => T[];
    has: <T>(set: T[], item: T) => boolean;
    delete: <T>(set: T[], item: T) => T[];
    union: <T>(a: T[], b: T[]) => T[];
    intersect: <T>(a: T[], b: T[]) => T[];
    diff: <T>(a: T[], b: T[]) => T[];
    size: <T>(set: T[]) => number;
};
/**
 * Optional (Maybe) type operations
 */
export declare const OptionalOps: {
    of: <T>(value: T | null | undefined) => T | null;
    isSome: <T>(value: T | null) => value is T;
    isNone: <T>(value: T | null) => value is null;
    map: <T, U>(value: T | null, fn: (v: T) => U) => U | null;
    orElse: <T>(value: T | null, defaultValue: T) => T;
    orElseGet: <T>(value: T | null, supplier: () => T) => T;
    flatten: <T>(value: T | null | null) => T | null;
};
/**
 * OneOf type validator
 */
export declare const OneOf: {
    validate: <T extends readonly unknown[]>(options: T) => (value: unknown) => value is T[number];
};
//# sourceMappingURL=composites.d.ts.map