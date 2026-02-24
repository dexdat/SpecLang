/**
 * SPECLANG-GENERATED: Python generic type handling
 * Source: @speclang/codegen @block:python-types-generics
 * Note: Implementation moved to types.ts to avoid circular dependencies
 */

import { resolvePythonType, type TypeResolution } from './types';

export { resolveGeneric } from './types';

export function resolveGenericType(stdlibType: string): TypeResolution | null {
  return resolvePythonType(stdlibType);
}

export function isGenericType(stdlibType: string): boolean {
  return stdlibType.includes('<') && stdlibType.includes('>');
}
