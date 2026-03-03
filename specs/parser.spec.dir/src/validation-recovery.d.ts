/**
 * SPECLANG-GENERATED: Validation recovery and auto-fix suggestions
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
 */
import type { SpecMetadata } from './types';
/** Recovery actions available on validation failure */
export interface RecoveryActions {
    on_failure: readonly RecoveryAction[];
    recovery: readonly RecoveryStrategy[];
}
/** Types of recovery actions */
export type RecoveryAction = 'log_error' | 'block_cascade' | 'notify_orchestrator' | 'mark_invalid';
/** Recovery strategies for fixing issues */
export type RecoveryStrategy = 'suggest_fixes' | 'auto_format_if_possible' | 'suggest_adding_lines' | 'add_default_values' | 'remove_unknown_fields';
/** Default recovery configuration */
export declare const DEFAULT_RECOVERY_ACTIONS: RecoveryActions;
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
/** Generate fix suggestions for missing required fields */
export declare function suggestMissingField(field: string): FixSuggestion;
/** Generate fix suggestion for invalid ID format */
export declare function suggestInvalidId(actual: string): FixSuggestion;
/** Generate fix suggestion for invalid version */
export declare function suggestInvalidVersion(actual: string): FixSuggestion;
/** Generate fix suggestion for invalid layer */
export declare function suggestInvalidLayer(actual: number): FixSuggestion;
/** Generate fix suggestion for invalid enum value */
export declare function suggestInvalidEnum(field: string, actual: string, validValues: readonly string[]): FixSuggestion;
/** Generate fix suggestion for missing recommended field */
export declare function suggestMissingRecommended(field: string, defaultValue?: unknown): FixSuggestion;
/** Generate fix suggestion for unresolved reference */
export declare function suggestUnresolvedRef(ref: string): FixSuggestion;
/** Generate fix suggestion for missing lines declaration */
export declare function suggestMissingLines(actualLines: number): FixSuggestion;
/** Collect all fix suggestions for a validation result */
export declare function collectFixSuggestions(errors: Array<{
    code: string;
    field?: string;
    value?: unknown;
}>, warnings: Array<{
    code: string;
    field?: string;
    value?: unknown;
}>, metadata?: SpecMetadata): FixSuggestion[];
/** Attempt to auto-fix metadata */
export declare function attemptAutoFix(metadata: SpecMetadata, suggestions: FixSuggestion[]): {
    fixed: SpecMetadata;
    applied: string[];
};
/** Execute recovery actions on validation failure */
export declare function executeRecovery(result: {
    errors: unknown[];
    warnings: unknown[];
}, actions?: RecoveryActions, onNotify?: (message: string) => void): void;
//# sourceMappingURL=validation-recovery.d.ts.map