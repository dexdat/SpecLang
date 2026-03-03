/**
 * SPECLANG-GENERATED: Reference validation rule
 * Source: @speclang/validation/rules#@validation/refs
 */
import type { ParsedSpec, ValidationRule } from '../types';
/**
 * Reference Validation Rule
 *
 * Validates references in specs:
 * - Target file must exist
 * - Target block must exist (if specified)
 * - No circular references
 */
export declare const refsRule: ValidationRule;
/**
 * Build dependency graph from specs
 */
export declare function buildDependencyGraph(specs: ParsedSpec[]): Map<string, string[]>;
export default refsRule;
//# sourceMappingURL=refs.d.ts.map