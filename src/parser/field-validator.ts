/**
 * SPECLANG-GENERATED: Field-level validation for header fields
 * Source: @speclang/headers Phase 0.17 - Header Field Definitions
 * DO NOT EDIT MANUALLY
 */

import type {
  FieldValidationResult,
  FieldLevelHeaderValidationResult,
  HeaderFields,
  FieldDefinition,
} from './field-types';
import {
  FIELD_DEFINITIONS,
  getRequiredFieldNames,
  isKnownField,
  SEMVER_PATTERN,
  ID_PATTERN,
  REF_PATTERN,
  PART_PATTERN,
} from './fields';

// ============================================================================
// SINGLE FIELD VALIDATION
// ============================================================================

/**
 * Validate a single header field value against its definition.
 * Returns a FieldValidationResult with valid=true on success.
 */
export function validateField(
  name: string,
  value: unknown,
): FieldValidationResult {
  const def = FIELD_DEFINITIONS[name];

  // Unknown field → warning (not error)
  if (!def) {
    return {
      field: name,
      valid: true, // unknown fields are allowed
      severity: 'warning',
      code: 'UNKNOWN_FIELD',
      message: `Unknown header field: "${name}"`,
      value,
    };
  }

  // Required field with missing/empty value
  if (def.required && (value === undefined || value === null || value === '')) {
    return {
      field: name,
      valid: false,
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD',
      message: `Missing required field: ${name}`,
      value,
    };
  }

  // If value is undefined/null and field is optional, it's fine
  if (value === undefined || value === null) {
    return { field: name, valid: true };
  }

  // Dispatch to type-specific validator
  return validateByType(def, value);
}

/**
 * Type-specific validation dispatcher.
 */
function validateByType(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  switch (def.type) {
    case 'id':
      return validateId(def, value);
    case 'semver':
      return validateSemver(def, value);
    case 'number':
      return validateNumber(def, value);
    case 'enum':
      return validateEnum(def, value);
    case 'string':
      return validateString(def, value);
    case 'string[]':
      return validateStringArray(def, value);
    case 'ref':
      return validateRef(def, value);
    case 'ref[]':
      return validateRefArray(def, value);
    case 'part':
      return validatePart(def, value);
    default:
      return { field: def.name, valid: true };
  }
}

// ============================================================================
// TYPE VALIDATORS
// ============================================================================

function validateId(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (typeof value !== 'string') {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be a string`, value);
  }
  if (def.pattern && !def.pattern.test(value)) {
    return makeError(
      def,
      'INVALID_ID_FORMAT',
      `Invalid id format: "${value}". Expected @domain/path (e.g. ${def.example})`,
      value,
    );
  }
  return makeOk(def);
}

function validateSemver(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be a string`, value);
  }
  const strVal = String(value);
  if (!SEMVER_PATTERN.test(strVal)) {
    return makeError(
      def,
      'INVALID_SEMVER',
      `Invalid semver: "${strVal}". Expected format like ${def.example}`,
      value,
    );
  }
  return makeOk(def);
}

function validateNumber(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be a number`, value);
  }
  if (def.range) {
    if (!Number.isInteger(value)) {
      return makeError(
        def,
        'INVALID_NUMBER',
        `${def.name} must be an integer`,
        value,
      );
    }
    if (value < def.range.min || value > def.range.max) {
      return makeError(
        def,
        'OUT_OF_RANGE',
        `${def.name} must be between ${def.range.min} and ${def.range.max}, got ${value}`,
        value,
      );
    }
  }
  return makeOk(def);
}

function validateEnum(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (typeof value !== 'string') {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be a string`, value);
  }
  if (def.enumValues && !def.enumValues.includes(value)) {
    return makeError(
      def,
      'INVALID_ENUM',
      `Invalid ${def.name}: "${value}". Valid values: ${def.enumValues.join(', ')}`,
      value,
    );
  }
  return makeOk(def);
}

function validateString(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (typeof value !== 'string') {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be a string`, value);
  }
  if (def.pattern && !def.pattern.test(value)) {
    return makeError(
      def,
      'INVALID_FORMAT',
      `${def.name} does not match expected format`,
      value,
    );
  }
  return makeOk(def);
}

function validateStringArray(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (!Array.isArray(value)) {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be an array`, value);
  }
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string') {
      return makeError(
        def,
        'INVALID_ARRAY_ITEM',
        `${def.name}[${i}] must be a string, got ${typeof value[i]}`,
        value,
      );
    }
  }
  return makeOk(def);
}

function validateRef(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (typeof value !== 'string') {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be a string`, value);
  }
  // Refs may or may not have the @ref: prefix in YAML
  const normalized = value.startsWith('@ref:') ? value : `@ref:${value}`;
  if (def.pattern && !def.pattern.test(normalized)) {
    return makeError(
      def,
      'INVALID_REF_FORMAT',
      `Invalid reference format: "${value}". Expected @ref:path (e.g. ${def.example})`,
      value,
    );
  }
  return makeOk(def);
}

function validateRefArray(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (!Array.isArray(value)) {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be an array`, value);
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    const itemStr = typeof item === 'string' ? item : (item && typeof item === 'object' && 'ref' in item) ? (item as { ref: string }).ref : null;
    if (typeof itemStr !== 'string') {
      return makeError(
        def,
        'INVALID_ARRAY_ITEM',
        `${def.name}[${i}] must be a string or {ref: string}`,
        value,
      );
    }
    // Normalize and validate
    const normalized = itemStr.startsWith('@ref:') ? itemStr : `@ref:${itemStr}`;
    if (def.pattern && !def.pattern.test(normalized)) {
      return makeError(
        def,
        'INVALID_REF_FORMAT',
        `Invalid reference in ${def.name}[${i}]: "${itemStr}"`,
        value,
      );
    }
  }
  return makeOk(def);
}

function validatePart(
  def: FieldDefinition,
  value: unknown,
): FieldValidationResult {
  if (typeof value !== 'string') {
    return makeError(def, 'INVALID_TYPE', `${def.name} must be a string`, value);
  }
  if (!PART_PATTERN.test(value)) {
    return makeError(
      def,
      'INVALID_PART_FORMAT',
      `Invalid part format: "${value}". Expected N/M (e.g. ${def.example})`,
      value,
    );
  }
  // Validate part <= total
  const [partNum, total] = value.split('/').map(Number);
  if (partNum < 1 || partNum > total) {
    return makeError(
      def,
      'INVALID_PART_RANGE',
      `Part ${partNum} is out of range (1-${total})`,
      value,
    );
  }
  return makeOk(def);
}

// ============================================================================
// FULL HEADER VALIDATION
// ============================================================================

/**
 * Validate all fields of a header object.
 * Checks required fields, known field types, and warns on unknown fields.
 */
export function validateHeaderFields(
  header: Record<string, unknown>,
): FieldLevelHeaderValidationResult {
  const results: FieldValidationResult[] = [];

  // 1. Check all required fields are present
  const requiredNames = getRequiredFieldNames();
  for (const name of requiredNames) {
    if (!(name in header) || header[name] === undefined || header[name] === null || header[name] === '') {
      results.push({
        field: name,
        valid: false,
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD',
        message: `Missing required field: ${name}`,
        value: header[name],
      });
    }
  }

  // 2. Validate each field that has a value
  for (const [name, value] of Object.entries(header)) {
    // Skip already-reported missing required fields
    if (results.some((r) => r.field === name && r.code === 'MISSING_REQUIRED_FIELD')) {
      continue;
    }
    results.push(validateField(name, value));
  }

  const errors = results.filter(
    (r) => !r.valid && r.severity === 'error',
  );
  const warnings = results.filter(
    (r) => r.severity === 'warning',
  );

  return {
    valid: errors.length === 0,
    fields: results,
    errors,
    warnings,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function makeOk(def: FieldDefinition): FieldValidationResult {
  return { field: def.name, valid: true };
}

function makeError(
  def: FieldDefinition,
  code: string,
  message: string,
  value: unknown,
): FieldValidationResult {
  return {
    field: def.name,
    valid: false,
    severity: 'error',
    code,
    message,
    value,
  };
}
