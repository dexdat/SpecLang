/**
 * SPECLANG-GENERATED: Rust Option type mappings
 * Source: @speclang/codegen @block:rust-types-option
 */

import { resolveRustType, TypeResolution } from './types';

export function formatOptionType(innerType: string): string {
  return `Option<${innerType}>`;
}

export function isOptionType(stdlibType: string): boolean {
  return stdlibType.startsWith('Optional<') || stdlibType.startsWith('Nullable<');
}

export function getOptionDefault(_stdlibType: string): string {
  return 'None';
}

export function resolveOptionType(stdlibType: string): TypeResolution | null {
  const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
  if (optMatch) {
    const inner = resolveRustType(optMatch[1]);
    return {
      type: `Option<${inner.type}>`,
      imports: inner.imports,
      crates: inner.crates,
      isOption: true,
      isReference: false,
      isSmartPointer: false
    };
  }
  return null;
}

export const OPTION_PATTERNS = {
  some: 'Some(value)',
  none: 'None',
  isSome: '.is_some()',
  isNone: '.is_none()',
  unwrap: '.unwrap()',
  unwrapOr: '.unwrap_or(default)',
  unwrapOrElse: '.unwrap_or_else(|| default)',
  map: '.map(|value| result)',
  andThen: '.and_then(|value| result)',
  orElse: '.or_else(|| alternative)',
};

export function generateOptionMatch(fieldName: string): string {
  return `match ${fieldName} {
    Some(value) => value,
    None => ${fieldName}.unwrap_or_default(),
}`;
}

export function generateOptionMatchFull(fieldName: string, someExpr: string, noneExpr: string): string {
  return `match ${fieldName} {
    Some(value) => ${someExpr},
    None => ${noneExpr},
}`;
}

export function isOptionRustType(rustType: string): boolean {
  return rustType.startsWith('Option<');
}

export function extractOptionInner(rustType: string): string | null {
  const match = rustType.match(/^Option<(.+)>$/);
  return match ? match[1] : null;
}
