"use strict";
/**
 * SPECLANG-GENERATED: Validation message definitions
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFO_CODES = exports.WARNING_CODES = exports.ERROR_CODES = void 0;
exports.missingField = missingField;
exports.invalidFieldFormat = invalidFieldFormat;
exports.invalidEnumValue = invalidEnumValue;
exports.missingRecommendedField = missingRecommendedField;
exports.unresolvedReference = unresolvedReference;
exports.suggestFix = suggestFix;
exports.createError = createError;
exports.createWarning = createWarning;
exports.createInfo = createInfo;
exports.formatMessages = formatMessages;
exports.getMessageSummary = getMessageSummary;
// ============================================================================
// ERROR CODES AND MESSAGES
// ============================================================================
/** Error codes for header validation errors */
exports.ERROR_CODES = {
    // Format errors
    E001: 'Invalid header format',
    E002: 'Missing required field: id',
    E003: 'Missing required field: version',
    E004: 'Invalid id format (expected @domain/path)',
    E005: 'Invalid version (expected semver x.y.z)',
    E006: 'Invalid layer (must be 0-10)',
    E007: 'Invalid project_level value',
    E008: 'Invalid agent_support value',
    E009: 'Invalid status value',
    E010: 'Invalid tags (expected string array)',
    E011: 'Invalid depends_on (expected @ref: array)',
    E012: 'Invalid part format (expected N/M)',
    E013: 'Invalid session_id (expected UUID)',
    E014: 'Invalid owned_by (expected string)',
    E015: 'Invalid target (expected string)',
    E016: 'Invalid lines (expected positive integer)',
    E017: 'Invalid children (expected @ref: array)',
    E018: 'Invalid parent (expected @ref: string)',
    E019: 'Invalid refs (expected @ref: array)',
    E024: 'Invalid caused_by (expected @commit:HASH)',
    E025: 'Invalid change_id (expected @commit:HASH)',
    E026: 'Invalid part_of (expected @cascade:DATE-ID)',
    // Parse errors
    E020: 'Header YAML parse error',
    E021: 'Missing header declaration',
    E022: 'Missing header terminator (---)',
    E023: 'Header line count mismatch',
    // Reference errors
    E030: 'Circular dependency detected',
    E031: 'Duplicate dependency',
    // Custom fields
    E040: 'Unknown field in header',
};
/** Warning codes for header validation warnings */
exports.WARNING_CODES = {
    // Missing recommended fields
    W001: 'Recommended field missing: layer',
    W002: 'Recommended field missing: project_level',
    W003: 'Recommended field missing: agent_support',
    W004: 'Recommended field missing: short',
    // Efficiency warnings
    W010: 'lines:N missing on large file (>50 lines)',
    W011: 'lines:N value may be incorrect',
    // Reference warnings
    W020: 'depends_on reference does not exist in index',
    W021: 'refs reference does not exist in index',
    W022: 'children reference does not exist in index',
    W023: 'parent reference does not exist in index',
    W024: 'Unresolved reference in content',
    // Ownership warnings
    W030: 'owned_by agent not registered',
    W031: 'session_id is outdated (>7 days)',
    // Deprecated fields
    W040: 'Field is deprecated',
    W041: 'Using deprecated field value',
    // Best practice
    W050: 'Missing tags (recommended for searchability)',
    W051: 'status should be specified for production specs',
    W052: 'target language not specified',
};
/** Info codes for informational messages */
exports.INFO_CODES = {
    I001: 'Header validation passed',
    I002: 'All references resolved',
    I003: 'Optional fields use defaults',
};
// ============================================================================
// ERROR MESSAGE GENERATORS
// ============================================================================
/** Generate error message for missing field */
function missingField(field) {
    return `Missing required field: ${field}`;
}
/** Generate error message for invalid field format */
function invalidFieldFormat(field, expected, actual) {
    if (actual) {
        return `Invalid ${field}: "${actual}". Expected ${expected}`;
    }
    return `Invalid ${field}. Expected ${expected}`;
}
/** Generate error message for invalid enum value */
function invalidEnumValue(field, validValues) {
    return `Invalid ${field}. Valid values: ${validValues.join(', ')}`;
}
/** Generate warning message for missing recommended field */
function missingRecommendedField(field) {
    return `Recommended field missing: ${field}`;
}
/** Generate warning message for unresolved reference */
function unresolvedReference(ref) {
    return `Reference does not exist: ${ref}`;
}
/** Generate suggestion message */
function suggestFix(field, suggestion) {
    return `${field}: ${suggestion}`;
}
/** Create an error message */
function createError(code, message, options) {
    return {
        code,
        message,
        severity: 'error',
        ...options,
    };
}
/** Create a warning message */
function createWarning(code, message, options) {
    return {
        code,
        message,
        severity: 'warning',
        ...options,
    };
}
/** Create an info message */
function createInfo(code, message) {
    return {
        code,
        message,
        severity: 'info',
    };
}
// ============================================================================
// MESSAGE BUNDLING
// ============================================================================
/** Format validation messages for display */
function formatMessages(messages) {
    const errors = [];
    const warnings = [];
    const info = [];
    for (const msg of messages) {
        const formatted = `[${msg.code}] ${msg.message}`;
        if (msg.suggestion) {
            const suggestionText = ` (Suggestion: ${msg.suggestion})`;
            switch (msg.severity) {
                case 'error':
                    errors.push(formatted + suggestionText);
                    break;
                case 'warning':
                    warnings.push(formatted + suggestionText);
                    break;
                case 'info':
                    info.push(formatted + suggestionText);
                    break;
            }
        }
        else {
            switch (msg.severity) {
                case 'error':
                    errors.push(formatted);
                    break;
                case 'warning':
                    warnings.push(formatted);
                    break;
                case 'info':
                    info.push(formatted);
                    break;
            }
        }
    }
    return { errors, warnings, info };
}
/** Get summary of validation messages */
function getMessageSummary(messages) {
    return {
        errorCount: messages.filter(m => m.severity === 'error').length,
        warningCount: messages.filter(m => m.severity === 'warning').length,
        infoCount: messages.filter(m => m.severity === 'info').length,
    };
}
//# sourceMappingURL=validation-messages.js.map