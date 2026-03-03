/**
 * SPECLANG-GENERATED: Validation message definitions
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
 */
/** Error codes for header validation errors */
export declare const ERROR_CODES: {
    readonly E001: "Invalid header format";
    readonly E002: "Missing required field: id";
    readonly E003: "Missing required field: version";
    readonly E004: "Invalid id format (expected @domain/path)";
    readonly E005: "Invalid version (expected semver x.y.z)";
    readonly E006: "Invalid layer (must be 0-10)";
    readonly E007: "Invalid project_level value";
    readonly E008: "Invalid agent_support value";
    readonly E009: "Invalid status value";
    readonly E010: "Invalid tags (expected string array)";
    readonly E011: "Invalid depends_on (expected @ref: array)";
    readonly E012: "Invalid part format (expected N/M)";
    readonly E013: "Invalid session_id (expected UUID)";
    readonly E014: "Invalid owned_by (expected string)";
    readonly E015: "Invalid target (expected string)";
    readonly E016: "Invalid lines (expected positive integer)";
    readonly E017: "Invalid children (expected @ref: array)";
    readonly E018: "Invalid parent (expected @ref: string)";
    readonly E019: "Invalid refs (expected @ref: array)";
    readonly E024: "Invalid caused_by (expected @commit:HASH)";
    readonly E025: "Invalid change_id (expected @commit:HASH)";
    readonly E026: "Invalid part_of (expected @cascade:DATE-ID)";
    readonly E020: "Header YAML parse error";
    readonly E021: "Missing header declaration";
    readonly E022: "Missing header terminator (---)";
    readonly E023: "Header line count mismatch";
    readonly E030: "Circular dependency detected";
    readonly E031: "Duplicate dependency";
    readonly E040: "Unknown field in header";
};
/** Warning codes for header validation warnings */
export declare const WARNING_CODES: {
    readonly W001: "Recommended field missing: layer";
    readonly W002: "Recommended field missing: project_level";
    readonly W003: "Recommended field missing: agent_support";
    readonly W004: "Recommended field missing: short";
    readonly W010: "lines:N missing on large file (>50 lines)";
    readonly W011: "lines:N value may be incorrect";
    readonly W020: "depends_on reference does not exist in index";
    readonly W021: "refs reference does not exist in index";
    readonly W022: "children reference does not exist in index";
    readonly W023: "parent reference does not exist in index";
    readonly W024: "Unresolved reference in content";
    readonly W030: "owned_by agent not registered";
    readonly W031: "session_id is outdated (>7 days)";
    readonly W040: "Field is deprecated";
    readonly W041: "Using deprecated field value";
    readonly W050: "Missing tags (recommended for searchability)";
    readonly W051: "status should be specified for production specs";
    readonly W052: "target language not specified";
};
/** Info codes for informational messages */
export declare const INFO_CODES: {
    readonly I001: "Header validation passed";
    readonly I002: "All references resolved";
    readonly I003: "Optional fields use defaults";
};
/** Generate error message for missing field */
export declare function missingField(field: string): string;
/** Generate error message for invalid field format */
export declare function invalidFieldFormat(field: string, expected: string, actual?: string): string;
/** Generate error message for invalid enum value */
export declare function invalidEnumValue(field: string, validValues: readonly string[]): string;
/** Generate warning message for missing recommended field */
export declare function missingRecommendedField(field: string): string;
/** Generate warning message for unresolved reference */
export declare function unresolvedReference(ref: string): string;
/** Generate suggestion message */
export declare function suggestFix(field: string, suggestion: string): string;
/** A validation message with code and details */
export interface ValidationMessage {
    code: string;
    message: string;
    field?: string;
    line?: number;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
    value?: unknown;
}
/** Create an error message */
export declare function createError(code: keyof typeof ERROR_CODES, message: string, options?: {
    field?: string;
    line?: number;
    suggestion?: string;
    value?: unknown;
}): ValidationMessage;
/** Create a warning message */
export declare function createWarning(code: keyof typeof WARNING_CODES, message: string, options?: {
    field?: string;
    line?: number;
    suggestion?: string;
    value?: unknown;
}): ValidationMessage;
/** Create an info message */
export declare function createInfo(code: keyof typeof INFO_CODES, message: string): ValidationMessage;
/** Format validation messages for display */
export declare function formatMessages(messages: ValidationMessage[]): {
    errors: string[];
    warnings: string[];
    info: string[];
};
/** Get summary of validation messages */
export declare function getMessageSummary(messages: ValidationMessage[]): {
    errorCount: number;
    warningCount: number;
    infoCount: number;
};
//# sourceMappingURL=validation-messages.d.ts.map