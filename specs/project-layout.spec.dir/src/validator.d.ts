/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/validator
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
import type { ValidationResult } from './types.js';
/**
 * Validate project structure
 */
export declare function validateProject(projectRoot?: string): ValidationResult;
/**
 * Quick check if project is valid (for programmatic use)
 */
export declare function isProjectValid(projectRoot?: string): boolean;
/**
 * Get validation summary
 */
export declare function getValidationSummary(result: ValidationResult): string;
//# sourceMappingURL=validator.d.ts.map