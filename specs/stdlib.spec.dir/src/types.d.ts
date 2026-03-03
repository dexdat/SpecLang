/**
 * Standard Library Types
 *
 * This file exports all type definitions from the standard library.
 * These types are available to all specs without import.
 */
export type { UUID, DateTime, Email, URL, Path, TypeValidator } from './primitives';
export type { Some, None, Option } from './results';
export type { Success, Failure, Result } from './results';
export type { TargetLanguage, TypeMapping } from './mapping';
export type Int = number;
export type Float = number;
export type Void = void;
export type Never = never;
export type List<T> = T[];
export type Array<T> = T[];
export type MapLike<K extends string | number | symbol, V> = Record<K, V>;
export type Set<T> = T[];
export type Optional<T> = T | null;
export type Maybe<T> = T | null | undefined;
export type OneOrMany<T> = T | T[];
export type OneOrNone<T> = T | null | undefined;
export type Fn<TArgs extends any[], TResult> = (...args: TArgs) => TResult;
export type Predicate<T> = (value: T) => boolean;
export type Consumer<T> = (value: T) => void;
export type Supplier<T> = () => T;
export type Mapper<T, U> = (value: T) => U;
export type Reducer<T, U> = (acc: U, value: T) => U;
export type Error = globalThis.Error;
export type Duration = {
    ms: number;
    seconds: number;
    minutes: number;
    hours: number;
    days: number;
    weeks: number;
};
export declare const Duration: {
    fromMs: (ms: number) => Duration;
    fromSeconds: (seconds: number) => Duration;
    fromMinutes: (minutes: number) => Duration;
    fromHours: (hours: number) => Duration;
    fromDays: (days: number) => Duration;
    toMs: (duration: Duration) => number;
};
export type Version = string & {
    __brand: 'Version';
};
export declare const Version: {
    parse: (version: string) => Version | null;
    compare: (a: Version, b: Version) => number;
    isCompatible: (a: Version, b: Version) => boolean;
};
//# sourceMappingURL=types.d.ts.map