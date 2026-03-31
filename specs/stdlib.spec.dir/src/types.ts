// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY

/**
 * Standard Library Types
 * 
 * This file exports all type definitions from the standard library.
 * These types are available to all specs without import.
 */

// Re-export primitives types
export type {
  UUID,
  DateTime,
  Email,
  URL,
  Path,
  TypeValidator
} from './primitives';

// Re-export composite types
export type {
  Some,
  None,
  Option
} from './results';

export type {
  Success,
  Failure,
  Result
} from './results';

// Re-export mapping types
export type {
  TargetLanguage,
  TypeMapping
} from './mapping';

// Common type aliases
export type Int = number;
export type Float = number;
export type Void = void;
export type Never = never;

// Type constructors
export type List<T> = T[];
export type Array<T> = T[];
export type MapLike<K extends string | number | symbol, V> = Record<K, V>;
export type Set<T> = T[];
export type Optional<T> = T | null;
export type Maybe<T> = T | null | undefined;
export type OneOrMany<T> = T | T[];
export type OneOrNone<T> = T | null | undefined;

// Function types
export type Fn<TArgs extends any[], TResult> = (...args: TArgs) => TResult;
export type Predicate<T> = (value: T) => boolean;
export type Consumer<T> = (value: T) => void;
export type Supplier<T> = () => T;
export type Mapper<T, U> = (value: T) => U;
export type Reducer<T, U> = (acc: U, value: T) => U;

// Error types
export type Error = globalThis.Error;

// Duration type
export type Duration = {
  ms: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
};

// Time operations
export const Duration = {
  fromMs: (ms: number): Duration => ({
    ms,
    seconds: Math.floor(ms / 1000),
    minutes: Math.floor(ms / 60000),
    hours: Math.floor(ms / 3600000),
    days: Math.floor(ms / 86400000),
    weeks: Math.floor(ms / 604800000)
  }),
  
  fromSeconds: (seconds: number): Duration =>
    Duration.fromMs(seconds * 1000),
  
  fromMinutes: (minutes: number): Duration =>
    Duration.fromMs(minutes * 60000),
  
  fromHours: (hours: number): Duration =>
    Duration.fromMs(hours * 3600000),
  
  fromDays: (days: number): Duration =>
    Duration.fromMs(days * 86400000),
  
  toMs: (duration: Duration): number => duration.ms
};

// Version type
export type Version = string & { __brand: 'Version' };

// Spec reference type
export type SpecRef = string & { __brand: 'SpecRef' };

// Layer type (0-10)
export type Layer = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Project maturity level
export type MaturityLevel = 
  | 'POC'
  | 'MVP'
  | 'Alpha'
  | 'Beta'
  | 'Production'
  | 'Startup'
  | 'SMB'
  | 'MSB'
  | 'Enterprise';

// Agent role enumeration
export type AgentRole = 
  | 'NorthStar'
  | 'SpecWriter'
  | 'CodeGen'
  | 'TestWriter'
  | 'Orchestrator'
  | 'BackSync';

// Semantic version operations
export const Version = {
  parse: (version: string): Version | null => {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
    if (semverRegex.test(version)) {
      return version as Version;
    }
    return null;
  },
  
  compare: (a: Version, b: Version): number => {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  },
  
  isCompatible: (a: Version, b: Version): boolean => {
    const [aMajor] = a.split('.').map(Number);
    const [bMajor] = b.split('.').map(Number);
    return aMajor === bMajor;
  }
};
