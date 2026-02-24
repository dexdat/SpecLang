/**
 * SPECLANG-GENERATED: TypeScript generic type handling
 * Source: @speclang/codegen @block:typescript-generics
 */

import { resolveTypeScriptType } from './types';

export function resolveGenericType(stdlibType: string) {
  return resolveTypeScriptType(stdlibType);
}

export function isGenericType(stdlibType: string): boolean {
  return stdlibType.includes('<') && stdlibType.includes('>');
}

export function extractTypeParams(stdlibType: string): string[] {
  const match = stdlibType.match(/^(\w+)<(.+)>$/);
  if (!match) return [];

  const paramsStr = match[2];
  const params: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of paramsStr) {
    if (char === '<') depth++;
    else if (char === '>') depth--;
    else if (char === ',' && depth === 0) {
      params.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) params.push(current.trim());
  return params;
}

export function formatGenericType(baseType: string, typeParams: string[]): string {
  const resolved = typeParams.map(p => resolveTypeScriptType(p).type);
  return `${baseType}<${resolved.join(', ')}>`;
}
