/**
 * SPECLANG-GENERATED: TypeScript optional/null handling
 * Source: @speclang/codegen @block:typescript-optional
 */

import { TYPESCRIPT_TYPE_MAPPINGS, resolveTypeScriptType } from './types';

export type NullModifier = 'optional' | 'nullable' | 'nullish';

export function formatOptional(innerType: string, modifier: NullModifier): string {
  switch (modifier) {
    case 'optional':
      return `${innerType} | undefined`;
    case 'nullable':
      return `${innerType} | null`;
    case 'nullish':
      return `${innerType} | null | undefined`;
  }
}

export function hasNullModifier(stdlibType: string): boolean {
  return stdlibType.startsWith('Optional<') ||
         stdlibType.startsWith('Nullable<') ||
         stdlibType.startsWith('Nullish<');
}

export function getTypeScriptDefault(stdlibType: string): string {
  const mapping = TYPESCRIPT_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
  if (mapping?.default) return mapping.default;

  if (stdlibType.startsWith('Optional<')) return 'undefined';
  if (stdlibType.startsWith('Nullable<')) return 'null';
  if (stdlibType.startsWith('Nullish<')) return 'undefined';
  if (stdlibType.startsWith('Array<')) return '[]';
  if (stdlibType.startsWith('Map<')) return 'new Map()';
  if (stdlibType.startsWith('Set<')) return 'new Set()';

  return 'undefined';
}

export interface FieldTypeResult {
  type: string;
  optional: boolean;
  nullable: boolean;
  readonly: boolean;
}

export function parseFieldType(typeStr: string): FieldTypeResult {
  let optional = false;
  let nullable = false;
  let readonly = false;

  if (typeStr.endsWith('?')) {
    optional = true;
    typeStr = typeStr.slice(0, -1);
  }

  if (typeStr.endsWith('!')) {
    nullable = true;
    typeStr = typeStr.slice(0, -1);
  }

  if (typeStr.startsWith('readonly ')) {
    readonly = true;
    typeStr = typeStr.slice(9);
  }

  const resolved = resolveTypeScriptType(typeStr);
  let finalType = resolved.type;

  if (optional) finalType += ' | undefined';
  if (nullable) finalType += ' | null';
  if (readonly) finalType = `readonly ${finalType}`;

  return {
    type: finalType,
    optional: optional || resolved.isOptional,
    nullable,
    readonly
  };
}

export function detectNullModifier(stdlibType: string): NullModifier | null {
  if (stdlibType.startsWith('Optional<')) return 'optional';
  if (stdlibType.startsWith('Nullable<')) return 'nullable';
  if (stdlibType.startsWith('Nullish<')) return 'nullish';
  return null;
}
