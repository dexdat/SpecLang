// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY

/**
 * Type utilities
 */

import { TypeValidator } from './primitives';

/**
 * Check if value matches a type validator
 */
export function isType<T>(value: unknown, validator: TypeValidator<T>): value is T {
  return validator.validate(value);
}

/**
 * Assert value matches a type validator, throw otherwise
 */
export function assertTypeMatch<T>(value: unknown, validator: TypeValidator<T>): asserts value is T {
  if (!validator.validate(value)) {
    throw new TypeError(`Value does not match expected type`);
  }
}

/**
 * Get runtime type name of a value
 */
export function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Utility type to extract type name (compile-time)
 */
export type TypeName<T> = 
  T extends string ? 'string' :
  T extends number ? 'number' :
  T extends boolean ? 'boolean' :
  T extends null ? 'null' :
  T extends undefined ? 'undefined' :
  T extends Array<any> ? 'array' :
  T extends Function ? 'function' :
  T extends object ? 'object' :
  'unknown';