/**
 * SPECLANG-GENERATED: Autonomous mode validation rule
 * Source: @speclang/validation/rules#@validation/autonomous
 */

import type { ParsedSpec, ValidationRule, ValidationResult, ValidationContext } from '../types';
import { createError, createWarning } from '../types';

/** Required fields for agent_autonomous specs */
const REQUIRED_AUTONOMOUS_FIELDS = ['layer', 'project_level', 'tags', 'short'];

/** Patterns that indicate ambiguous language */
const AMBIGUOUS_PATTERNS = [
  { pattern: /\bTBD\b/gi, message: 'Contains "TBD" - should be specified' },
  { pattern: /\bTODO\b/gi, message: 'Contains "TODO" - should be completed' },
  { pattern: /\bmaybe\b/gi, message: 'Contains "maybe" - should be definite' },
  { pattern: /\bperhaps\b/gi, message: 'Contains "perhaps" - should be definite' },
  { pattern: /\bshould\s+be\b/gi, message: 'Contains "should be" - be more specific' },
  { pattern: /\bmight\s+happen\b/gi, message: 'Contains "might happen" - specify what will happen' },
  { pattern: /\bwe'll\s+see\b/gi, message: 'Contains "we\'ll see" - be more certain' },
];

/**
 * Autonomous Mode Validation Rule
 * 
 * Additional validation for specs with agent_support: agent_autonomous:
 * - Step-by-step descriptions for all operations
 * - All references must resolve
 * - No ambiguous natural language
 * - Required metadata fields present
 */
export const autonomousRule: ValidationRule = {
  id: '@validation/autonomous',
  name: 'Autonomous Mode Validation',
  level: 'error',

  check(spec: ParsedSpec, _context?: ValidationContext): ValidationResult[] {
    // Only applies to agent_autonomous specs
    if (spec.metadata.agent_support !== 'agent_autonomous') {
      return [];
    }

    const results: ValidationResult[] = [];

    // Check required fields for autonomous specs
    for (const field of REQUIRED_AUTONOMOUS_FIELDS) {
      if (!spec.metadata[field]) {
        results.push(createError(
          '@validation/autonomous',
          { file: spec.filepath, line: 'header' },
          `Autonomous spec missing required field: ${field}`,
          `Add "${field}: <value>" to the header`
        ));
      }
    }

    // Step-by-step descriptions for operations
    const operationBlocks = (spec.blocks || []).filter(b => b.kind === 'operation');
    for (const block of operationBlocks) {
      if (!hasStepByStepDescription(block)) {
        results.push(createWarning(
          '@validation/autonomous',
          { file: spec.filepath, line: block.line },
          `Operation block ${block.id} lacks step-by-step description`,
          'Add numbered steps or clear procedural description'
        ));
      }
    }

    // No ambiguous language
    const ambiguousResults = detectAmbiguity(spec.content);
    for (const match of ambiguousResults) {
      results.push(createWarning(
        '@validation/autonomous',
        { file: spec.filepath, line: match.line },
        `Potentially ambiguous language: "${match.text}"`,
        match.suggestion
      ));
    }

    // Tags should not be empty for autonomous specs
    if (!spec.metadata.tags || spec.metadata.tags.length === 0) {
      results.push(createWarning(
        '@validation/autonomous',
        { file: spec.filepath, line: 'header' },
        'Autonomous spec should have tags for discoverability',
        'Add tags: [tag1, tag2, ...]'
      ));
    }

    // Layer should be specified (0-10)
    if (spec.metadata.layer === undefined) {
      results.push(createError(
        '@validation/autonomous',
        { file: spec.filepath, line: 'header' },
        'Autonomous spec must specify layer',
        'Add "layer: <0-10>" to indicate abstraction level'
      ));
    }

    // Verify that all references in blocks exist in the spec
    const allRefStrings = new Set<string>();
    for (const block of spec.blocks || []) {
      const refs = extractRefsFromContent(block.content);
      for (const ref of refs) {
        allRefStrings.add(ref);
      }
    }

    // Check for @ref: in content that don't match any known reference
    const contentRefRegex = /@ref:([a-zA-Z0-9_\-\/.#]+)/g;
    let match;
    while ((match = contentRefRegex.exec(spec.content)) !== null) {
      const refStr = match[0];
      const knownRefs = new Set((spec.references || []).map(r => r.ref || r.toString()));
      
      if (!knownRefs.has(refStr) && !knownRefs.has(`@ref:${match[1]}`)) {
        results.push(createWarning(
          '@validation/autonomous',
          { file: spec.filepath, line: 'content' },
          `Reference "${refStr}" in content but not declared in header`,
          `Add to depends_on or refs in header`
        ));
      }
    }

    return results;
  },
};

/**
 * Check if a block has step-by-step description
 */
function hasStepByStepDescription(block: { content: string }): boolean {
  const content = block.content;
  
  // Check for numbered steps
  if (/\d+\.\s/.test(content)) {
    return true;
  }
  
  // Check for "step 1", "step 2", etc.
  if (/step\s+\d+/i.test(content)) {
    return true;
  }
  
  // Check for bullet points (multiple)
  const bulletMatches = content.match(/^[\-\*]\s+/m);
  if (bulletMatches && bulletMatches.length >= 2) {
    return true;
  }
  
  // Check for "first", "then", "next", "finally" sequence
  const sequenceWords = content.match(/\b(first|then|next|finally|after|before)\b/gi);
  if (sequenceWords && sequenceWords.length >= 2) {
    return true;
  }
  
  return false;
}

/**
 * Detect ambiguous language in content
 */
function detectAmbiguity(content: string): Array<{ line: number; text: string; suggestion: string }> {
  const results: Array<{ line: number; text: string; suggestion: string }> = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const { pattern, message } of AMBIGUOUS_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        results.push({
          line: i + 1,
          text: match[0],
          suggestion: message,
        });
      }
    }
  }

  return results;
}

/**
 * Extract @ref: references from content
 */
function extractRefsFromContent(content: string): string[] {
  const refs: string[] = [];
  const regex = /@ref:([a-zA-Z0-9_\-\/.#]+)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    refs.push(`@ref:${match[1]}`);
  }
  
  return refs;
}

export default autonomousRule;
