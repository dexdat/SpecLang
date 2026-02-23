/**
 * SPECLANG-GENERATED: Validation recovery and auto-fix suggestions
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
 */

import type { SpecMetadata } from './types';
import { ERROR_CODES, WARNING_CODES } from './validation-messages';

// ============================================================================
// RECOVERY ACTION TYPES
// ============================================================================

/** Recovery actions available on validation failure */
export interface RecoveryActions {
  on_failure: readonly RecoveryAction[];
  recovery: readonly RecoveryStrategy[];
}

/** Types of recovery actions */
export type RecoveryAction =
  | 'log_error'
  | 'block_cascade'
  | 'notify_orchestrator'
  | 'mark_invalid';

/** Recovery strategies for fixing issues */
export type RecoveryStrategy =
  | 'suggest_fixes'
  | 'auto_format_if_possible'
  | 'suggest_adding_lines'
  | 'add_default_values'
  | 'remove_unknown_fields';

/** Default recovery configuration */
export const DEFAULT_RECOVERY_ACTIONS: RecoveryActions = {
  on_failure: ['log_error'],
  recovery: ['suggest_fixes'],
};

// ============================================================================
// FIX SUGGESTION TYPES
// ============================================================================

/** A suggested fix for a validation issue */
export interface FixSuggestion {
  /** Issue code */
  code: string;
  /** Field to fix */
  field?: string;
  /** Description of the fix */
  suggestion: string;
  /** Example of the fixed value */
  example?: string;
  /** Whether this can be auto-fixed */
  autoFixable: boolean;
  /** The fixed value (for auto-fix) */
  fixedValue?: unknown;
}

// ============================================================================
// FIX SUGGESTION GENERATORS
// ============================================================================

/** Generate fix suggestions for missing required fields */
export function suggestMissingField(field: string): FixSuggestion {
  const examples: Record<string, string> = {
    id: '@specs/example',
    version: '1.0.0',
  };
  
  return {
    code: ERROR_CODES.E002,
    field,
    suggestion: `Add the required field "${field}" to the header`,
    example: examples[field] || 'value',
    autoFixable: false,
  };
}

/** Generate fix suggestion for invalid ID format */
export function suggestInvalidId(actual: string): FixSuggestion {
  // Try to fix common issues
  let fixed = actual.trim();
  if (!fixed.startsWith('@')) {
    fixed = '@' + fixed;
  }
  fixed = fixed.replace(/[^a-zA-Z0-9@/_-]/g, '-').replace(/-+/g, '-');
  
  return {
    code: ERROR_CODES.E004,
    field: 'id',
    suggestion: 'ID should be in @domain/path format',
    example: fixed,
    autoFixable: false,
  };
}

/** Generate fix suggestion for invalid version */
export function suggestInvalidVersion(actual: string): FixSuggestion {
  // Try to fix common issues
  let fixed = actual.trim();
  
  // Add 'v' prefix if missing version-like pattern
  if (!/^\d/.test(fixed)) {
    fixed = '1.0.0';
  }
  
  // Try to parse and fix partial semver
  const parts = fixed.replace(/^v/, '').split('.');
  if (parts.length < 3) {
    while (parts.length < 3) {
      parts.push('0');
    }
    fixed = parts.join('.');
  }
  
  return {
    code: ERROR_CODES.E005,
    field: 'version',
    suggestion: 'Version should be in semver format (x.y.z)',
    example: fixed,
    autoFixable: true,
    fixedValue: fixed,
  };
}

/** Generate fix suggestion for invalid layer */
export function suggestInvalidLayer(actual: number): FixSuggestion {
  const validLayer = Math.max(0, Math.min(10, Math.round(actual)));
  
  return {
    code: ERROR_CODES.E006,
    field: 'layer',
    suggestion: 'Layer must be between 0 and 10',
    example: String(validLayer),
    autoFixable: true,
    fixedValue: validLayer,
  };
}

/** Generate fix suggestion for invalid enum value */
export function suggestInvalidEnum(
  field: string,
  actual: string,
  validValues: readonly string[]
): FixSuggestion {
  // Find closest match
  const lowerActual = actual.toLowerCase();
  const closest = validValues.find(
    v => v.toLowerCase() === lowerActual
  );
  
  return {
    code: ERROR_CODES.E007,
    field,
    suggestion: `Valid values: ${validValues.join(', ')}`,
    example: closest || validValues[0],
    autoFixable: closest !== undefined,
    fixedValue: closest || validValues[0],
  };
}

/** Generate fix suggestion for missing recommended field */
export function suggestMissingRecommended(
  field: string,
  defaultValue?: unknown
): FixSuggestion {
  return {
    code: WARNING_CODES.W001,
    field,
    suggestion: `Add recommended field "${field}" for better spec organization`,
    example: defaultValue !== undefined ? String(defaultValue) : undefined,
    autoFixable: defaultValue !== undefined,
    fixedValue: defaultValue,
  };
}

/** Generate fix suggestion for unresolved reference */
export function suggestUnresolvedRef(ref: string): FixSuggestion {
  return {
    code: WARNING_CODES.W020,
    suggestion: `Verify that "${ref}" exists or add it to the index`,
    autoFixable: false,
  };
}

/** Generate fix suggestion for missing lines declaration */
export function suggestMissingLines(actualLines: number): FixSuggestion {
  return {
    code: WARNING_CODES.W010,
    field: 'lines',
    suggestion: `Add "lines:${actualLines}" to header declaration for faster parsing`,
    example: `lines:${actualLines}`,
    autoFixable: true,
    fixedValue: actualLines,
  };
}

// ============================================================================
// FIX SUGGESTION AGGREGATOR
// ============================================================================

/** Collect all fix suggestions for a validation result */
export function collectFixSuggestions(
  errors: Array<{ code: string; field?: string; value?: unknown }>,
  warnings: Array<{ code: string; field?: string; value?: unknown }>,
  metadata?: SpecMetadata
): FixSuggestion[] {
  const suggestions: FixSuggestion[] = [];
  
  // Process errors
  for (const err of errors) {
    switch (err.code) {
      case 'MISSING_ID':
        suggestions.push(suggestMissingField('id'));
        break;
      case 'MISSING_VERSION':
        suggestions.push(suggestMissingField('version'));
        break;
      case 'INVALID_ID_FORMAT':
        suggestions.push(suggestInvalidId(String(err.value || '')));
        break;
      case 'INVALID_VERSION':
        suggestions.push(suggestInvalidVersion(String(err.value || '')));
        break;
      case 'INVALID_LAYER':
        suggestions.push(suggestInvalidLayer(Number(err.value) || 0));
        break;
      case 'INVALID_PROJECT_LEVEL':
        suggestions.push(
          suggestInvalidEnum('project_level', String(err.value || ''), [
            'POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise',
          ])
        );
        break;
      case 'INVALID_AGENT_SUPPORT':
        suggestions.push(
          suggestInvalidEnum('agent_support', String(err.value || ''), [
            'human_only', 'agent_assisted', 'agent_autonomous',
          ])
        );
        break;
    }
  }
  
  // Process warnings
  for (const warn of warnings) {
    switch (warn.code) {
      case 'MISSING_LAYER':
        suggestions.push(suggestMissingRecommended('layer', 5));
        break;
      case 'MISSING_LINE_DECLARATION':
        // We'd need actual line count - this is handled separately
        break;
      case 'UNRESOLVED_REFERENCE':
        suggestions.push(suggestUnresolvedRef(String(warn.field || '')));
        break;
    }
  }
  
  // Add suggestions based on metadata
  if (metadata) {
    if (metadata.layer === undefined) {
      suggestions.push(suggestMissingRecommended('layer', 5));
    }
  }
  
  return suggestions;
}

// ============================================================================
// AUTO-FIX EXECUTOR
// ============================================================================

/** Attempt to auto-fix metadata */
export function attemptAutoFix(
  metadata: SpecMetadata,
  suggestions: FixSuggestion[]
): { fixed: SpecMetadata; applied: string[] } {
  const fixed = { ...metadata };
  const applied: string[] = [];
  
  for (const suggestion of suggestions) {
    if (suggestion.autoFixable && suggestion.fixedValue !== undefined && suggestion.field) {
      (fixed as Record<string, unknown>)[suggestion.field] = suggestion.fixedValue;
      applied.push(suggestion.code);
    }
  }
  
  return { fixed, applied };
}

// ============================================================================
// RECOVERY EXECUTOR
// ============================================================================

/** Execute recovery actions on validation failure */
export function executeRecovery(
  result: { errors: unknown[]; warnings: unknown[] },
  actions: RecoveryActions = DEFAULT_RECOVERY_ACTIONS,
  onNotify?: (message: string) => void
): void {
  // Log errors
  if (actions.on_failure.includes('log_error')) {
    console.error('Header validation failed:');
    for (const err of result.errors) {
      console.error(`  - ${JSON.stringify(err)}`);
    }
  }
  
  // Notify orchestrator
  if (actions.on_failure.includes('notify_orchestrator') && onNotify) {
    onNotify(`Validation failed with ${result.errors.length} errors`);
  }
}
