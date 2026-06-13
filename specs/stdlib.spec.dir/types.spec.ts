// @spec: @speclang/stdlib/types v0.1.0
// @source: specs/stdlib.spec.dir/types.spec.ts.md:26-51
// @block:primitives — Primitive type definitions
export type String = string;
export type Number = number;
export type Boolean = boolean;
export type Date = string & { __brand: 'Date' };
export type UUID = string & { __brand: 'UUID' };
export type Path = string & { __brand: 'Path' };

// @block:composite — Composite types
export type SpecRef = string & { __brand: 'SpecRef' };
export type Layer = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type MaturityLevel =
  | 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Production'
  | 'Startup' | 'SMB' | 'MSB' | 'Enterprise';
export type AgentRole =
  | 'NorthStar' | 'SpecWriter' | 'CodeGen' | 'TestWriter'
  | 'Orchestrator' | 'BackSync';

// @block:utility — Utility types
export type Optional<T> = T | undefined;
export type List<T> = T[];
export type Map<K extends string | number | symbol, V> = Record<K, V>;
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
