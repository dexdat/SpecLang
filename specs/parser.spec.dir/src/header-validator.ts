/**
 * SPECLANG-GENERATED: Full header validation implementation
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  SpecMetadata,
  Reference,
  ProjectLevel,
  AgentSupport,
  SpecStatus,
  Layer,
} from './types';
import {
  ID_PATTERN,
  SEMVER_PATTERN,
  REF_PATTERN,
  PART_PATTERN,
  COMMIT_PATTERN,
  CASCADE_PATTERN,
  PROJECT_LEVELS,
  AGENT_SUPPORTS,
  SPEC_STATUSES,
  getRequiredFieldNames,
  isKnownField,
  getFieldDefinition,
} from './fields';
import {
  ERROR_CODES,
  WARNING_CODES,
  INFO_CODES,
  createError,
  createWarning,
  createInfo,
  type ValidationMessage,
  formatMessages,
  getMessageSummary,
} from './validation-messages';
import {
  type FixSuggestion,
  suggestMissingField,
  suggestInvalidId,
  suggestInvalidVersion,
  suggestInvalidLayer,
  suggestInvalidEnum,
  suggestMissingRecommended,
  suggestUnresolvedRef,
  suggestMissingLines,
  collectFixSuggestions,
  attemptAutoFix,
  type RecoveryActions,
  DEFAULT_RECOVERY_ACTIONS,
  executeRecovery,
} from './validation-recovery';
import { parseHeader } from './header';

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

/** Validation checks performed on edit */
export interface HeaderValidationConfig {
  checks: readonly ValidationCheck[];
  onFailure: readonly RecoveryAction[];
  recovery: readonly RecoveryStrategy[];
}

/** Available validation checks */
export type ValidationCheck =
  | 'required_fields_present'
  | 'id_format_valid'
  | 'version_semver'
  | 'depends_on_refs_exist'
  | 'owned_by_valid_agent'
  | 'lines_matches_actual'
  | 'unknown_fields'
  | 'enum_values_valid';

/** Recovery actions */
export type RecoveryAction =
  | 'log_error'
  | 'block_cascade'
  | 'notify_orchestrator'
  | 'mark_invalid';

/** Recovery strategies */
export type RecoveryStrategy =
  | 'suggest_fixes'
  | 'auto_format_if_possible'
  | 'suggest_adding_lines'
  | 'add_default_values'
  | 'remove_unknown_fields';

/** Default validation configuration */
export const DEFAULT_VALIDATION_CONFIG: HeaderValidationConfig = {
  checks: [
    'required_fields_present',
    'id_format_valid',
    'version_semver',
    'depends_on_refs_exist',
    'unknown_fields',
    'enum_values_valid',
  ],
  onFailure: ['log_error'],
  recovery: ['suggest_fixes'],
};

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/** Extended validation result with fix suggestions */
export interface HeaderValidationResult {
  /** Whether header is valid */
  valid: boolean;
  /** File path */
  filepath?: string;
  /** Parsed metadata */
  metadata?: SpecMetadata;
  /** Errors found */
  errors: ValidationMessage[];
  /** Warnings found */
  warnings: ValidationMessage[];
  /** Info messages */
  info: ValidationMessage[];
  /** Fix suggestions */
  suggestions: FixSuggestion[];
  /** Line count info */
  lineCount?: {
    declared: number | undefined;
    actual: number;
    matches: boolean;
  };
}

/** Reference validation result */
export interface ReferenceValidationResult {
  reference: string;
  exists: boolean;
  targetFile?: string;
  suggestion?: FixSuggestion;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate required fields are present
 */
export function validateRequiredFields(
  metadata: Partial<SpecMetadata>
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const required = getRequiredFieldNames();
  
  for (const field of required) {
    const value = metadata[field];
    if (value === undefined || value === null || value === '') {
      messages.push(
        createError('E002' as keyof typeof ERROR_CODES, ERROR_CODES.E002, {
          field,
          suggestion: suggestMissingField(field).suggestion,
        })
      );
    }
  }
  
  return messages;
}

/**
 * Validate ID format
 */
export function validateIdField(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  if (!metadata.id) return messages;
  
  if (!ID_PATTERN.test(metadata.id)) {
    const suggestion = suggestInvalidId(metadata.id);
    messages.push(
      createError('E004' as keyof typeof ERROR_CODES, ERROR_CODES.E004, {
        field: 'id',
        value: metadata.id,
        suggestion: suggestion.suggestion,
      })
    );
  }
  
  return messages;
}

/**
 * Validate version format (semver)
 */
export function validateVersionField(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  if (!metadata.version) return messages;
  
  if (!SEMVER_PATTERN.test(metadata.version)) {
    const suggestion = suggestInvalidVersion(metadata.version);
    messages.push(
      createError('E005' as keyof typeof ERROR_CODES, ERROR_CODES.E005, {
        field: 'version',
        value: metadata.version,
        suggestion: suggestion.suggestion,
      })
    );
  }
  
  return messages;
}

/**
 * Validate layer field (0-10)
 */
export function validateLayerField(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  if (metadata.layer === undefined) {
    messages.push(
      createWarning('W001' as keyof typeof WARNING_CODES, WARNING_CODES.W001, {
        field: 'layer',
        suggestion: suggestMissingRecommended('layer', 5).suggestion,
      })
    );
    return messages;
  }
  
  if (!Number.isInteger(metadata.layer) || metadata.layer < 0 || metadata.layer > 10) {
    const suggestion = suggestInvalidLayer(metadata.layer);
    messages.push(
      createError('E006' as keyof typeof ERROR_CODES, ERROR_CODES.E006, {
        field: 'layer',
        value: metadata.layer,
        suggestion: suggestion.suggestion,
      })
    );
  }
  
  return messages;
}

/**
 * Validate enum fields
 */
export function validateEnumFields(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // project_level
  if (metadata.project_level && !PROJECT_LEVELS.includes(metadata.project_level)) {
    const suggestion = suggestInvalidEnum(
      'project_level',
      metadata.project_level,
      PROJECT_LEVELS
    );
    messages.push(
      createError('E007' as keyof typeof ERROR_CODES, ERROR_CODES.E007, {
        field: 'project_level',
        value: metadata.project_level,
        suggestion: suggestion.suggestion,
      })
    );
  } else if (!metadata.project_level) {
    messages.push(
      createWarning('W002' as keyof typeof WARNING_CODES, WARNING_CODES.W002, {
        field: 'project_level',
        suggestion: suggestMissingRecommended('project_level', 'Alpha').suggestion,
      })
    );
  }
  
  // agent_support
  if (metadata.agent_support && !AGENT_SUPPORTS.includes(metadata.agent_support)) {
    const suggestion = suggestInvalidEnum(
      'agent_support',
      metadata.agent_support,
      AGENT_SUPPORTS
    );
    messages.push(
      createError('E008' as keyof typeof ERROR_CODES, ERROR_CODES.E008, {
        field: 'agent_support',
        value: metadata.agent_support,
        suggestion: suggestion.suggestion,
      })
    );
  } else if (!metadata.agent_support) {
    messages.push(
      createWarning('W003' as keyof typeof WARNING_CODES, WARNING_CODES.W003, {
        field: 'agent_support',
        suggestion: suggestMissingRecommended('agent_support', 'agent_assisted').suggestion,
      })
    );
  }
  
  // status
  if (metadata.status && !SPEC_STATUSES.includes(metadata.status)) {
    const suggestion = suggestInvalidEnum('status', metadata.status, SPEC_STATUSES);
    messages.push(
      createError('E009' as keyof typeof ERROR_CODES, ERROR_CODES.E009, {
        field: 'status',
        value: metadata.status,
        suggestion: suggestion.suggestion,
      })
    );
  }
  
  return messages;
}

/**
 * Validate tags field
 */
export function validateTagsField(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  if (metadata.tags !== undefined) {
    if (!Array.isArray(metadata.tags)) {
      messages.push(
        createError('E010' as keyof typeof ERROR_CODES, ERROR_CODES.E010, {
          field: 'tags',
          suggestion: 'Tags should be an array of strings',
        })
      );
    } else if (metadata.tags.length === 0) {
      messages.push(
        createWarning('W050' as keyof typeof WARNING_CODES, WARNING_CODES.W050, {
          field: 'tags',
          suggestion: 'Add tags for better searchability',
        })
      );
    }
  }
  
  return messages;
}

/**
 * Validate reference fields (depends_on, refs, children, parent)
 */
export function validateRefFields(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const refFields = ['depends_on', 'refs', 'children', 'parent'] as const;
  
  for (const field of refFields) {
    const value = metadata[field];
    if (value === undefined) continue;
    
    if (Array.isArray(value)) {
      for (const item of value) {
        const refStr = typeof item === 'string' ? item : (item as Reference).ref || '';
        if (refStr && !REF_PATTERN.test(refStr.replace('@ref:', '@ref:'))) {
          messages.push(
            createError('E011' as keyof typeof ERROR_CODES, ERROR_CODES.E011, {
              field,
              suggestion: `Invalid reference format: ${refStr}`,
            })
          );
        }
      }
    } else if (typeof value === 'string') {
      if (!REF_PATTERN.test(value.replace('@ref:', '@ref:'))) {
        messages.push(
          createError('E018' as keyof typeof ERROR_CODES, ERROR_CODES.E018, {
            field,
            suggestion: `Invalid reference format: ${value}`,
          })
        );
      }
    }
  }
  
  return messages;
}

/**
 * Validate part field format
 */
export function validatePartField(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  if (metadata.part && !PART_PATTERN.test(metadata.part)) {
    messages.push(
      createError('E012' as keyof typeof ERROR_CODES, ERROR_CODES.E012, {
        field: 'part',
        suggestion: 'Part should be in format N/M (e.g., 2/5)',
      })
    );
  }
  
  return messages;
}

/**
 * Validate ownership fields (caused_by, change_id, part_of)
 */
export function validateOwnershipFields(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // caused_by - should match @commit:HASH format
  if (metadata.caused_by && !COMMIT_PATTERN.test(metadata.caused_by)) {
    messages.push(
      createError('E024' as keyof typeof ERROR_CODES, ERROR_CODES.E024, {
        field: 'caused_by',
        value: metadata.caused_by,
        suggestion: 'caused_by should be in format @commit:HASH (e.g., @commit:abc123def)',
      })
    );
  }
  
  // change_id - should match @commit:HASH format
  if (metadata.change_id && !COMMIT_PATTERN.test(metadata.change_id)) {
    messages.push(
      createError('E025' as keyof typeof ERROR_CODES, ERROR_CODES.E025, {
        field: 'change_id',
        value: metadata.change_id,
        suggestion: 'change_id should be in format @commit:HASH (e.g., @commit:def456ghi)',
      })
    );
  }
  
  // part_of - should match @cascade:DATE-ID format
  if (metadata.part_of && !CASCADE_PATTERN.test(metadata.part_of)) {
    messages.push(
      createError('E026' as keyof typeof ERROR_CODES, ERROR_CODES.E026, {
        field: 'part_of',
        value: metadata.part_of,
        suggestion: 'part_of should be in format @cascade:DATE-ID (e.g., @cascade:20250222-001)',
      })
    );
  }
  
  return messages;
}

/**
 * Validate lines field
 */
export function validateLinesField(
  metadata: Partial<SpecMetadata>,
  content: string
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Calculate actual header lines
  const lines = content.split('\n');
  let actualLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---' && i > 0) {
      actualLines = i + 1;
      break;
    }
  }
  
  if (metadata.lines === undefined && actualLines > 10) {
    messages.push(
      createWarning('W010' as keyof typeof WARNING_CODES, WARNING_CODES.W010, {
        field: 'lines',
        suggestion: suggestMissingLines(actualLines).suggestion,
      })
    );
  } else if (metadata.lines !== undefined) {
    if (typeof metadata.lines !== 'number' || metadata.lines < 1) {
      messages.push(
        createError('E016' as keyof typeof ERROR_CODES, ERROR_CODES.E016, {
          field: 'lines',
          suggestion: 'Lines should be a positive integer',
        })
      );
    } else if (metadata.lines !== actualLines && actualLines > 0) {
      messages.push(
        createWarning('W011' as keyof typeof WARNING_CODES, WARNING_CODES.W011, {
          field: 'lines',
          suggestion: `Declared ${metadata.lines} but found ${actualLines}`,
        })
      );
    }
  }
  
  return messages;
}

/**
 * Check for unknown fields
 */
export function validateUnknownFields(metadata: Partial<SpecMetadata>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const knownFields = new Set([
    'id', 'version', 'layer', 'project_level', 'agent_support',
    'tags', 'short', 'target', 'status', 'depends_on', 'refs',
    'children', 'parent', 'part', 'owned_by', 'session_id', 'lines',
    'siblings', 'generated', 'caused_by', 'change_id', 'part_of',
  ]);
  
  for (const key of Object.keys(metadata)) {
    if (!knownFields.has(key)) {
      const fieldDef = getFieldDefinition(key);
      if (!fieldDef) {
        messages.push(
          createError('E040' as keyof typeof ERROR_CODES, ERROR_CODES.E040, {
            field: key,
            suggestion: `Remove unknown field or add to field definitions`,
          })
        );
      }
    }
  }
  
  return messages;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate a spec header
 */
export function validateHeader(
  content: string,
  filepath: string = 'unknown',
  config: HeaderValidationConfig = DEFAULT_VALIDATION_CONFIG
): HeaderValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const info: ValidationMessage[] = [];
  const suggestions: FixSuggestion[] = [];
  
  let metadata: SpecMetadata | undefined;
  let declaredLines: number | undefined;
  let actualLines = 0;
  
  // Parse header
  try {
    const parseResult = parseHeader(content);
    metadata = parseResult.metadata;
    declaredLines = metadata.lines;
    
    // Calculate actual header lines
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---' && i > 0) {
        actualLines = i + 1;
        break;
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    errors.push(
      createError('E020' as keyof typeof ERROR_CODES, `Header parse error: ${message}`)
    );
    
    return {
      valid: false,
      filepath,
      errors,
      warnings,
      info,
      suggestions,
      lineCount: {
        declared: declaredLines,
        actual: actualLines,
        matches: false,
      },
    };
  }
  
  // Run validation checks
  if (config.checks.includes('required_fields_present')) {
    errors.push(...validateRequiredFields(metadata));
  }
  
  if (config.checks.includes('id_format_valid')) {
    errors.push(...validateIdField(metadata));
  }
  
  if (config.checks.includes('version_semver')) {
    errors.push(...validateVersionField(metadata));
  }
  
  if (config.checks.includes('enum_values_valid')) {
    const enumResults = validateEnumFields(metadata);
    errors.push(...enumResults.filter(m => m.severity === 'error'));
    warnings.push(...enumResults.filter(m => m.severity === 'warning'));
    
    const tagResults = validateTagsField(metadata);
    errors.push(...tagResults.filter(m => m.severity === 'error'));
    warnings.push(...tagResults.filter(m => m.severity === 'warning'));
    
    const refResults = validateRefFields(metadata);
    errors.push(...refResults.filter(m => m.severity === 'error'));
    warnings.push(...refResults.filter(m => m.severity === 'warning'));
    
    const partResults = validatePartField(metadata);
    errors.push(...partResults.filter(m => m.severity === 'error'));
    warnings.push(...partResults.filter(m => m.severity === 'warning'));
    
    const ownershipResults = validateOwnershipFields(metadata);
    errors.push(...ownershipResults.filter(m => m.severity === 'error'));
    warnings.push(...ownershipResults.filter(m => m.severity === 'warning'));
    
    const layerResults = validateLayerField(metadata);
    errors.push(...layerResults.filter(m => m.severity === 'error'));
    warnings.push(...layerResults.filter(m => m.severity === 'warning'));
  }
  
  if (config.checks.includes('unknown_fields')) {
    errors.push(...validateUnknownFields(metadata));
  }
  
  if (config.checks.includes('lines_matches_actual')) {
    warnings.push(...validateLinesField(metadata, content));
  }
  
  // Generate suggestions
  const errorObjs = errors.map(e => ({ code: e.code, field: e.field, value: metadata?.[e.field as keyof SpecMetadata] }));
  const warningObjs = warnings.map(w => ({ code: w.code, field: w.field, value: metadata?.[w.field as keyof SpecMetadata] }));
  suggestions.push(...collectFixSuggestions(errorObjs, warningObjs, metadata));
  
  // Add success info if valid
  if (errors.length === 0) {
    info.push(createInfo('I001' as keyof typeof INFO_CODES, INFO_CODES.I001));
  }
  
  return {
    valid: errors.length === 0,
    filepath,
    metadata,
    errors,
    warnings,
    info,
    suggestions,
    lineCount: {
      declared: declaredLines,
      actual: actualLines,
      matches: declaredLines === actualLines || (declaredLines === undefined && actualLines > 0),
    },
  };
}

/**
 * Validate a spec file
 */
export function validateHeaderFile(
  filepath: string,
  config: HeaderValidationConfig = DEFAULT_VALIDATION_CONFIG
): HeaderValidationResult {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return validateHeader(content, filepath, config);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      valid: false,
      filepath,
      errors: [createError('E020' as keyof typeof ERROR_CODES, `Failed to read file: ${message}`)],
      warnings: [],
      info: [],
      suggestions: [],
    };
  }
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

/**
 * Validate multiple spec files
 */
export function validateHeaders(
  filepaths: string[],
  config: HeaderValidationConfig = DEFAULT_VALIDATION_CONFIG
): {
  total: number;
  valid: number;
  invalid: number;
  results: HeaderValidationResult[];
} {
  const results: HeaderValidationResult[] = [];
  
  for (const filepath of filepaths) {
    results.push(validateHeaderFile(filepath, config));
  }
  
  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    results,
  };
}

// ============================================================================
// VALIDATION WITH RECOVERY
// ============================================================================

/**
 * Validate header with automatic recovery attempts
 */
export function validateAndAttemptRecovery(
  content: string,
  filepath: string = 'unknown',
  config: HeaderValidationConfig = DEFAULT_VALIDATION_CONFIG,
  recoveryActions: RecoveryActions = DEFAULT_RECOVERY_ACTIONS
): {
  result: HeaderValidationResult;
  recovered?: {
    metadata: SpecMetadata;
    applied: string[];
  };
} {
  const result = validateHeader(content, filepath, config);
  
  // If valid, no recovery needed
  if (result.valid) {
    return { result };
  }
  
  // Attempt auto-fix
  if (config.recovery.includes('auto_format_if_possible')) {
    const { fixed, applied } = attemptAutoFix(
      result.metadata!,
      result.suggestions
    );
    
    if (applied.length > 0) {
      // Re-validate with fixed metadata
      const revalidated = validateHeader(content, filepath, config);
      return {
        result: revalidated,
        recovered: {
          metadata: fixed,
          applied,
        },
      };
    }
  }
  
  // Execute recovery actions
  executeRecovery(
    { errors: result.errors, warnings: result.warnings },
    recoveryActions
  );
  
  return { result };
}

// ============================================================================
// EXPORT DEFAULT CONFIG
// ============================================================================

export { DEFAULT_RECOVERY_ACTIONS };
