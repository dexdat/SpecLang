/**
 * SPECLANG-GENERATED: ID format validation rule
 * Source: @speclang/validation/rules#@validation/id
 */
import type { ValidationRule, ValidationResult } from '../types';
/**
 * ID Format Validation Rule
 *
 * Validates spec IDs according to the format:
 * - Must start with @
 * - Domain must be lowercase
 * - Path uses forward slashes
 * - No special characters except - and _
 */
export declare const idRule: ValidationRule;
/**
 * Validate a single ID string (utility function)
 */
export declare function validateId(id: string): ValidationResult[];
export default idRule;
//# sourceMappingURL=id.d.ts.map