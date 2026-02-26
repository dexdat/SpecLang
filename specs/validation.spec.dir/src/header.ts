/**
 * SPECLANG-GENERATED: Header validation rule
 * Source: @speclang/validation/rules#@validation/header
 */

import type { ParsedSpec, ValidationRule, ValidationResult, ValidationContext } from '../types';
import { createError, createWarning } from '../types';

// Valid project levels
const VALID_PROJECT_LEVELS = ['POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'];

// Valid agent support levels
const VALID_AGENT_SUPPORT = ['human_only', 'agent_assisted', 'agent_autonomous'];

// Valid spec statuses
const VALID_STATUSES = ['draft', 'stable', 'deprecated', 'active', 'generated'];

/**
 * Header Validation Rule
 * 
 * Validates spec file headers according to the universal header format:
 * - Line 1: Must be comment or blank
 * - Line 2: Must contain "speclang-header" declaration
 * - Required fields: id, version
 * - Optional fields must be valid if present
 */
export const headerRule: ValidationRule = {
  id: '@validation/header',
  name: 'Header Validation',
  level: 'error',

  check(spec: ParsedSpec, _context?: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Use headerRaw for line-by-line validation, fallback to content
    const headerContent = spec.headerRaw || spec.content;
    const lines = headerContent.split('\n');

    // Line 1: Must be comment or blank, OR can contain speclang-header directly
    // (files may start directly with speclang-header declaration)
    const line1Valid = isCommentOrBlank(lines[0]) || lines[0]?.includes('speclang-header');
    if (!line1Valid) {
      results.push(createError(
        '@validation/header',
        { file: spec.filepath, line: 1 },
        'Line 1 must be a comment, blank, or contain speclang-header',
        'Start the file with "#" for a comment or add speclang-header declaration'
      ));
    }

    // Check for speclang-header declaration (could be on line 1 or line 2)
    const hasHeaderDeclaration = lines.some((line, idx) => 
      idx <= 2 && line?.includes('speclang-header')
    );
    
    if (!hasHeaderDeclaration) {
      results.push(createError(
        '@validation/header',
        { file: spec.filepath, line: 'header' },
        'Missing speclang-header declaration',
        'Add "# speclang-header lines:N" where N is the number of header lines'
      ));
    } else {
      // Check that it declares line count
      const headerLine = lines.find(l => l?.includes('speclang-header'));
      const headerMatch = headerLine?.match(/speclang-header\s+lines:\s*(\d+)/i);
      if (!headerMatch) {
        results.push(createWarning(
          '@validation/header',
          { file: spec.filepath, line: 'header' },
          'speclang-header should declare line count',
          'Use format: # speclang-header lines:N'
        ));
      }
    }

    // Required fields
    if (!spec.metadata.id) {
      results.push(createError(
        '@validation/header',
        { file: spec.filepath, line: 'header' },
        'Missing required field: id',
        'Add "id: @domain/path" to the header'
      ));
    }

    if (!spec.metadata.version) {
      results.push(createError(
        '@validation/header',
        { file: spec.filepath, line: 'header' },
        'Missing required field: version',
        'Add "version: 1.0.0" to the header'
      ));
    }

    // Validate project_level if present
    if (spec.metadata.project_level && !VALID_PROJECT_LEVELS.includes(spec.metadata.project_level)) {
      results.push(createError(
        '@validation/header',
        { file: spec.filepath, line: 'header' },
        `Invalid project_level: ${spec.metadata.project_level}`,
        `Must be one of: ${VALID_PROJECT_LEVELS.join(', ')}`
      ));
    }

    // Validate agent_support if present
    if (spec.metadata.agent_support && !VALID_AGENT_SUPPORT.includes(spec.metadata.agent_support)) {
      results.push(createError(
        '@validation/header',
        { file: spec.filepath, line: 'header' },
        `Invalid agent_support: ${spec.metadata.agent_support}`,
        `Must be one of: ${VALID_AGENT_SUPPORT.join(', ')}`
      ));
    }

    // Validate status if present
    if (spec.metadata.status && !VALID_STATUSES.includes(spec.metadata.status)) {
      results.push(createWarning(
        '@validation/header',
        { file: spec.filepath, line: 'header' },
        `Non-standard status: ${spec.metadata.status}`,
        `Consider using: ${VALID_STATUSES.join(', ')}`
      ));
    }

    // Validate layer if present
    if (spec.metadata.layer !== undefined) {
      const layer = spec.metadata.layer;
      if (typeof layer === 'number' && (layer < 0 || layer > 10)) {
        results.push(createError(
          '@validation/header',
          { file: spec.filepath, line: 'header' },
          `Invalid layer: ${layer}. Must be between 0 and 10`,
          'Layer should be 0 (north star) to 10 (implementation)'
        ));
      }
    }

    // Validate version format (semver)
    if (spec.metadata.version) {
      const semverRegex = /^\d+\.\d+\.\d+/;
      if (!semverRegex.test(spec.metadata.version)) {
        results.push(createWarning(
          '@validation/header',
          { file: spec.filepath, line: 'header' },
          `Non-standard version format: ${spec.metadata.version}`,
          'Use semver format: MAJOR.MINOR.PATCH'
        ));
      }
    }

    return results;
  },
};

/**
 * Check if a line is a comment or blank
 */
function isCommentOrBlank(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('#');
}

export default headerRule;
