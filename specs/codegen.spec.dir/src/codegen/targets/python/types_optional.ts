/**
 * SPECLANG-GENERATED: Python optional/nullable handling
 * Source: @speclang/codegen @block:python-types-optional
 */

import { resolvePythonType, type TypeResolution } from './types';

export function formatOptionalType(innerType: string, pythonVersion: number = 310): string {
  if (pythonVersion >= 310) {
    return `${innerType} | None`;
  }
  return `Optional[${innerType}]`;
}

export function hasOptionalDefault(stdlibType: string): boolean {
  return stdlibType.startsWith('Optional<') || 
         stdlibType.startsWith('Nullable<') ||
         stdlibType === 'Error' ||
         stdlibType === 'Any';
}

export function getOptionalDefault(stdlibType: string): string {
  if (stdlibType.startsWith('Optional<')) {
    const inner = stdlibType.match(/^Optional<(.+)>$/)?.[1];
    if (inner === 'String') return '""';
    if (inner === 'Int' || inner?.startsWith('Float')) return '0';
    if (inner === 'Bool') return 'False';
  }
  return 'None';
}

export interface NullableAnnotation {
  type: string;
  nullable: boolean;
  default?: string;
}

export function parseNullableField(typeStr: string): NullableAnnotation {
  const optional = typeStr.match(/^(.+?)\?$/);
  if (optional) {
    const inner = resolvePythonType(optional[1]);
    return {
      type: inner.type,
      nullable: true,
      default: 'None'
    };
  }

  const resolved = resolvePythonType(typeStr);
  return {
    type: resolved.type,
    nullable: resolved.isOptional
  };
}

export function isOptionalType(stdlibType: string): boolean {
  return stdlibType.startsWith('Optional<') || 
         stdlibType.startsWith('Nullable<');
}

export function resolveOptionalType(stdlibType: string): TypeResolution | null {
  const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
  if (!optMatch) return null;

  const inner = resolvePythonType(optMatch[1]);
  return {
    type: `${inner.type} | None`,
    imports: inner.imports,
    isOptional: true,
    isCollection: false
  };
}
