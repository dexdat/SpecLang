/**
 * SPECLANG-GENERATED: Block validation rule
 * Source: @speclang/validation/rules#@validation/blocks
 */

import type { ParsedSpec, ValidationRule, ValidationResult, ValidationContext } from '../types';
import { createError, createWarning } from '../types';

/** Valid block kinds according to spec */
const VALID_BLOCK_KINDS = [
  'entity',
  'operation',
  'policy',
  'test',
  'mock',
  'diagram',
  'code',
  'note',
  'question',
  'decision',
];

/**
 * Block Validation Rule
 * 
 * Validates content blocks in specs:
 * - Block IDs must be unique
 * - Block IDs must follow format @block:name
 * - Block kinds must be valid
 */
export const blocksRule: ValidationRule = {
  id: '@validation/blocks',
  name: 'Block Validation',
  level: 'error',

  check(spec: ParsedSpec, _context?: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const seenIds = new Set<string>();

    for (const block of spec.blocks || []) {
      // ID must be unique
      if (seenIds.has(block.id)) {
        results.push(createError(
          '@validation/blocks',
          { file: spec.filepath, line: block.line },
          `Duplicate block ID: ${block.id}`,
          'Rename one of the blocks to have a unique ID'
        ));
      }
      seenIds.add(block.id);

      // ID must follow format @block:name
      if (!block.id.startsWith('@block:')) {
        results.push(createError(
          '@validation/blocks',
          { file: spec.filepath, line: block.line },
          `Block ID must start with @block:: ${block.id}`,
          'Format: @block:domain/name'
        ));
      }

      // Kind must be valid
      if (!VALID_BLOCK_KINDS.includes(block.kind)) {
        results.push(createError(
          '@validation/blocks',
          { file: spec.filepath, line: block.line },
          `Invalid block kind: ${block.kind}`,
          `Must be one of: ${VALID_BLOCK_KINDS.join(', ')}`
        ));
      }

      // Content should not be empty for most block types
      const contentRequiredKinds = ['entity', 'operation', 'code', 'test'];
      if (contentRequiredKinds.includes(block.kind) && !block.content?.trim()) {
        results.push(createWarning(
          '@validation/blocks',
          { file: spec.filepath, line: block.line },
          `Block ${block.id} has no content`,
          'Add content to the block'
        ));
      }

      // Check block ID format (after @block:)
      const blockIdPart = block.id.replace(/^@block:/, '');
      if (!blockIdPart || blockIdPart.includes(' ')) {
        results.push(createError(
          '@validation/blocks',
          { file: spec.filepath, line: block.line },
          `Invalid block ID format: ${block.id}`,
          'Use lowercase letters, numbers, and hyphens only'
        ));
      }
    }

    return results;
  },
};

/**
 * Validate a single block (utility function)
 */
export function validateBlock(block: { id: string; kind: string; content: string; line: number }, filepath: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check ID format
  if (!block.id.startsWith('@block:')) {
    results.push(createError(
      '@validation/blocks',
      { file: filepath, line: block.line },
      `Block ID must start with @block:: ${block.id}`,
    ));
  }

  // Check kind
  if (!VALID_BLOCK_KINDS.includes(block.kind)) {
    results.push(createError(
      '@validation/blocks',
      { file: filepath, line: block.line },
      `Invalid block kind: ${block.kind}`,
    ));
  }

  return results;
}

/**
 * Check if a block kind is valid
 */
export function isValidBlockKind(kind: string): boolean {
  return VALID_BLOCK_KINDS.includes(kind);
}

export default blocksRule;
