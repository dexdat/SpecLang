// @spec: @speclang/stdlib/types v0.1.0
// @source: specs/stdlib.spec.dir/types.spec.ts.md:26-33
// @block:primitives — Primitive type definitions
export type String = string;
export type Number = number;
export type Boolean = boolean;
export type Date = string & { __brand: 'Date' };
export type UUID = string & { __brand: 'UUID' };
export type Path = string & { __brand: 'Path' };
