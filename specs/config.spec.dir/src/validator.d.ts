/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/config.dir/schema.spec.md
 * Blocks: @block:config/structure
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
import type { ProjectConfig } from './schema.js';
export interface ValidationError {
    path: string;
    message: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
/**
 * Validate configuration against schema
 */
export declare function validateConfig(config: ProjectConfig): ValidationResult;
//# sourceMappingURL=validator.d.ts.map