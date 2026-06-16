/**
 * SPECLANG-GENERATED: Validation Tools
 * Source: @speclang/tools
 *
 * Validation helpers for specs
 */
import { Tool, ValidateHeaderInput, ValidateHeaderOutput, ValidateRefsInput, ValidateRefsOutput } from './types.js';
/**
 * Validate header tool - validate spec header
 */
export declare const validateHeaderTool: Tool<ValidateHeaderInput, ValidateHeaderOutput>;
/**
 * Validate refs tool - check all refs in a spec exist
 */
export declare const validateRefsTool: Tool<ValidateRefsInput, ValidateRefsOutput>;
/**
 * Validate spec tool - full spec validation
 */
export declare const validateSpecTool: Tool<{
    path: string;
}, {
    valid: boolean;
    errors: string[];
    warnings: string[];
}>;
//# sourceMappingURL=validation-tools.d.ts.map