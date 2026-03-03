/**
 * SPECLANG-GENERATED: Block validation rule
 * Source: @speclang/validation/rules#@validation/blocks
 */
import type { ValidationRule, ValidationResult } from '../types';
/**
 * Block Validation Rule
 *
 * Validates content blocks in specs:
 * - Block IDs must be unique
 * - Block IDs must follow format @block:name
 * - Block kinds must be valid
 */
export declare const blocksRule: ValidationRule;
/**
 * Validate a single block (utility function)
 */
export declare function validateBlock(block: {
    id: string;
    kind: string;
    content: string;
    line: number;
}, filepath: string): ValidationResult[];
/**
 * Check if a block kind is valid
 */
export declare function isValidBlockKind(kind: string): boolean;
export default blocksRule;
//# sourceMappingURL=blocks.d.ts.map