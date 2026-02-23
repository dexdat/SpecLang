/**
 * SPECLANG-GENERATED: Validation message definitions
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
 */

// ============================================================================
// ERROR CODES AND MESSAGES
// ============================================================================

/** Error codes for header validation errors */
export const ERROR_CODES = {
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
} as const;

/** Warning codes for header validation warnings */
export const WARNING_CODES = {
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
} as const;

/** Info codes for informational messages */
export const INFO_CODES = {
  I001: 'Header validation passed',
  I002: 'All references resolved',
  I003: 'Optional fields use defaults',
} as const;

// ============================================================================
// ERROR MESSAGE GENERATORS
// ============================================================================

/** Generate error message for missing field */
export function missingField(field: string): string {
  return `Missing required field: ${field}`;
}

/** Generate error message for invalid field format */
export function invalidFieldFormat(
  field: string,
  expected: string,
  actual?: string
): string {
  if (actual) {
    return `Invalid ${field}: "${actual}". Expected ${expected}`;
  }
  return `Invalid ${field}. Expected ${expected}`;
}

/** Generate error message for invalid enum value */
export function invalidEnumValue(
  field: string,
  validValues: readonly string[]
): string {
  return `Invalid ${field}. Valid values: ${validValues.join(', ')}`;
}

/** Generate warning message for missing recommended field */
export function missingRecommendedField(field: string): string {
  return `Recommended field missing: ${field}`;
}

/** Generate warning message for unresolved reference */
export function unresolvedReference(ref: string): string {
  return `Reference does not exist: ${ref}`;
}

/** Generate suggestion message */
export function suggestFix(field: string, suggestion: string): string {
  return `${field}: ${suggestion}`;
}

// ============================================================================
// VALIDATION MESSAGE TYPE
// ============================================================================

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
export function createError(
  code: keyof typeof ERROR_CODES,
  message: string,
  options?: { field?: string; line?: number; suggestion?: string; value?: unknown }
): ValidationMessage {
  return {
    code,
    message,
    severity: 'error',
    ...options,
  };
}

/** Create a warning message */
export function createWarning(
  code: keyof typeof WARNING_CODES,
  message: string,
  options?: { field?: string; line?: number; suggestion?: string; value?: unknown }
): ValidationMessage {
  return {
    code,
    message,
    severity: 'warning',
    ...options,
  };
}

/** Create an info message */
export function createInfo(
  code: keyof typeof INFO_CODES,
  message: string
): ValidationMessage {
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
export function formatMessages(
  messages: ValidationMessage[]
): { errors: string[]; warnings: string[]; info: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

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
    } else {
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
export function getMessageSummary(
  messages: ValidationMessage[]
): { errorCount: number; warningCount: number; infoCount: number } {
  return {
    errorCount: messages.filter(m => m.severity === 'error').length,
    warningCount: messages.filter(m => m.severity === 'warning').length,
    infoCount: messages.filter(m => m.severity === 'info').length,
  };
}
