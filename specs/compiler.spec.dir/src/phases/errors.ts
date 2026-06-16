/**
 * SPECLANG-GENERATED: Compiler Error Handling
 * Source: @speclang/compiler.spec.dir/phases @compiler/errors @compiler/error-codes
 */

import { CompileError, type Location } from './types';

export const ERROR_CODES = {
  E001: 'Invalid header',
  E002: 'Missing header',
  E003: 'Duplicate block ID',
  E004: 'Unresolved ref',
  E005: 'Invalid block syntax',
  E006: 'Circular dependency',
  E007: 'Type mismatch',
  E008: 'Unknown kind',
  E009: 'Invalid target',
  E010: 'Codegen failed',
} as const;

export const WARNING_CODES = {
  W001: 'Missing layer',
  W002: 'Unused import',
  W003: 'Deprecated syntax',
  W004: 'Missing documentation',
} as const;

export class ValidationError extends CompileError {
  constructor(
    code: keyof typeof ERROR_CODES,
    message: string,
    location?: Location,
    block?: string,
    suggestions?: string[]
  ) {
    super(code, message, location, block, suggestions);
    this.name = 'ValidationError';
  }
}

export class ResolveError extends CompileError {
  constructor(
    code: keyof typeof ERROR_CODES,
    message: string,
    location?: Location,
    block?: string,
    suggestions?: string[]
  ) {
    super(code, message, location, block, suggestions);
    this.name = 'ResolveError';
  }
}

export class TransformError extends CompileError {
  constructor(
    code: keyof typeof ERROR_CODES,
    message: string,
    location?: Location,
    block?: string,
    suggestions?: string[]
  ) {
    super(code, message, location, block, suggestions);
    this.name = 'TransformError';
  }
}

export class CodegenError extends CompileError {
  constructor(
    code: keyof typeof ERROR_CODES,
    message: string,
    location?: Location,
    block?: string,
    suggestions?: string[]
  ) {
    super(code, message, location, block, suggestions);
    this.name = 'CodegenError';
  }
}

export function createError(
  code: keyof typeof ERROR_CODES,
  message: string,
  location?: Location,
  block?: string,
  suggestions?: string[]
): CompileError {
  return new CompileError(code, message, location, block, suggestions);
}

export function formatErrors(errors: CompileError[]): string {
  return errors.map((e) => e.toString()).join('\n');
}
