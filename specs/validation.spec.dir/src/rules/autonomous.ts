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
  // Modal verbs
  { pattern: /\bshould\b/gi, message: 'Contains "should" - use definitive language' },
  { pattern: /\bcould\b/gi, message: 'Contains "could" - use definitive language' },
  { pattern: /\bmight\b/gi, message: 'Contains "might" - use definitive language' },
  { pattern: /\bmay\b/gi, message: 'Contains "may" - use definitive language' },
  { pattern: /\bwould\b/gi, message: 'Contains "would" - use definitive language' },
  // Uncertainty
  { pattern: /\bmaybe\b/gi, message: 'Contains "maybe" - should be definite' },
  { pattern: /\bperhaps\b/gi, message: 'Contains "perhaps" - should be definite' },
  { pattern: /\bpossibly\b/gi, message: 'Contains "possibly" - should be definite' },
  { pattern: /\bprobably\b/gi, message: 'Contains "probably" - should be definite' },
  // Vague quantifiers
  { pattern: /\bsome\b/gi, message: 'Contains "some" - specify quantity' },
  { pattern: /\bfew\b/gi, message: 'Contains "few" - specify quantity' },
  { pattern: /\bmany\b/gi, message: 'Contains "many" - specify quantity' },
  { pattern: /\bseveral\b/gi, message: 'Contains "several" - specify quantity' },
  { pattern: /\bvarious\b/gi, message: 'Contains "various" - specify list' },
  // Imprecise terms
  { pattern: /\betc\./gi, message: 'Contains "etc." - list all items' },
  { pattern: /\band so on\b/gi, message: 'Contains "and so on" - list all items' },
  { pattern: /\band more\b/gi, message: 'Contains "and more" - list all items' },
  { pattern: /\bamong others\b/gi, message: 'Contains "among others" - list all items' },
  // Subjective language
  { pattern: /\bbetter\b/gi, message: 'Contains "better" - specify metric' },
  { pattern: /\bworse\b/gi, message: 'Contains "worse" - specify metric' },
  { pattern: /\bfast\b/gi, message: 'Contains "fast" - specify speed or time' },
  { pattern: /\bslow\b/gi, message: 'Contains "slow" - specify speed or time' },
  { pattern: /\beasy\b/gi, message: 'Contains "easy" - specify difficulty level' },
  { pattern: /\bhard\b/gi, message: 'Contains "hard" - specify difficulty level' },
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
      const value = spec.metadata[field];
      if (value === undefined || value === null) {
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
