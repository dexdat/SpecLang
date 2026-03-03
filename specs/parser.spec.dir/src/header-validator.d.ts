/**
 * SPECLANG-GENERATED: Full header validation implementation
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
 */
import type { SpecMetadata } from './types';
import { type ValidationMessage } from './validation-messages';
import { type FixSuggestion, type RecoveryActions, DEFAULT_RECOVERY_ACTIONS } from './validation-recovery';
/** Validation checks performed on edit */
export interface HeaderValidationConfig {
    checks: readonly ValidationCheck[];
    onFailure: readonly RecoveryAction[];
    recovery: readonly RecoveryStrategy[];
}
/** Available validation checks */
export type ValidationCheck = 'required_fields_present' | 'id_format_valid' | 'version_semver' | 'depends_on_refs_exist' | 'owned_by_valid_agent' | 'lines_matches_actual' | 'unknown_fields' | 'enum_values_valid';
/** Recovery actions */
export type RecoveryAction = 'log_error' | 'block_cascade' | 'notify_orchestrator' | 'mark_invalid';
/** Recovery strategies */
export type RecoveryStrategy = 'suggest_fixes' | 'auto_format_if_possible' | 'suggest_adding_lines' | 'add_default_values' | 'remove_unknown_fields';
/** Default validation configuration */
export declare const DEFAULT_VALIDATION_CONFIG: HeaderValidationConfig;
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
/**
 * Validate required fields are present
 */
export declare function validateRequiredFields(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate ID format
 */
export declare function validateIdField(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate version format (semver)
 */
export declare function validateVersionField(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate layer field (0-10)
 */
export declare function validateLayerField(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate enum fields
 */
export declare function validateEnumFields(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate tags field
 */
export declare function validateTagsField(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate reference fields (depends_on, refs, children, parent)
 */
export declare function validateRefFields(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate part field format
 */
export declare function validatePartField(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate ownership fields (caused_by, change_id, part_of)
 */
export declare function validateOwnershipFields(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate lines field
 */
export declare function validateLinesField(metadata: Partial<SpecMetadata>, content: string): ValidationMessage[];
/**
 * Check for unknown fields
 */
export declare function validateUnknownFields(metadata: Partial<SpecMetadata>): ValidationMessage[];
/**
 * Validate a spec header
 */
export declare function validateHeader(content: string, filepath?: string, config?: HeaderValidationConfig): HeaderValidationResult;
/**
 * Validate a spec file
 */
export declare function validateHeaderFile(filepath: string, config?: HeaderValidationConfig): HeaderValidationResult;
/**
 * Validate multiple spec files
 */
export declare function validateHeaders(filepaths: string[], config?: HeaderValidationConfig): {
    total: number;
    valid: number;
    invalid: number;
    results: HeaderValidationResult[];
};
/**
 * Validate header with automatic recovery attempts
 */
export declare function validateAndAttemptRecovery(content: string, filepath?: string, config?: HeaderValidationConfig, recoveryActions?: RecoveryActions): {
    result: HeaderValidationResult;
    recovered?: {
        metadata: SpecMetadata;
        applied: string[];
    };
};
export { DEFAULT_RECOVERY_ACTIONS };
//# sourceMappingURL=header-validator.d.ts.map