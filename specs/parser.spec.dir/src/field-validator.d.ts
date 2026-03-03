/**
 * SPECLANG-GENERATED: Field-level validation for header fields
 * Source: @speclang/headers Phase 0.17 - Header Field Definitions
 * DO NOT EDIT MANUALLY
 */
import type { FieldValidationResult, FieldLevelHeaderValidationResult } from './field-types';
/**
 * Validate a single header field value against its definition.
 * Returns a FieldValidationResult with valid=true on success.
 */
export declare function validateField(name: string, value: unknown): FieldValidationResult;
/**
 * Validate all fields of a header object.
 * Checks required fields, known field types, and warns on unknown fields.
 */
export declare function validateHeaderFields(header: Record<string, unknown>): FieldLevelHeaderValidationResult;
//# sourceMappingURL=field-validator.d.ts.map