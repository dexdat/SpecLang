/**
 * SPECLANG-GENERATED: Header validation rule
 * Source: @speclang/validation/rules#@validation/header
 */
import type { ValidationRule } from '../types';
/**
 * Header Validation Rule
 *
 * Validates spec file headers according to the universal header format:
 * - Line 1: Must be comment or blank
 * - Line 2: Must contain "speclang-header" declaration
 * - Required fields: id, version
 * - Optional fields must be valid if present
 */
export declare const headerRule: ValidationRule;
export default headerRule;
//# sourceMappingURL=header.d.ts.map