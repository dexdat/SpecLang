/**
 * SPECLANG-GENERATED: Compiler Error Handling
 * Source: @speclang/compiler.spec.dir/phases @compiler/errors @compiler/error-codes
 */
import { CompileError, type Location } from './types';
export declare const ERROR_CODES: {
    readonly E001: "Invalid header";
    readonly E002: "Missing header";
    readonly E003: "Duplicate block ID";
    readonly E004: "Unresolved ref";
    readonly E005: "Invalid block syntax";
    readonly E006: "Circular dependency";
    readonly E007: "Type mismatch";
    readonly E008: "Unknown kind";
    readonly E009: "Invalid target";
    readonly E010: "Codegen failed";
};
export declare const WARNING_CODES: {
    readonly W001: "Missing layer";
    readonly W002: "Unused import";
    readonly W003: "Deprecated syntax";
    readonly W004: "Missing documentation";
};
export declare class ValidationError extends CompileError {
    constructor(code: keyof typeof ERROR_CODES, message: string, location?: Location, block?: string, suggestions?: string[]);
}
export declare class ResolveError extends CompileError {
    constructor(code: keyof typeof ERROR_CODES, message: string, location?: Location, block?: string, suggestions?: string[]);
}
export declare class TransformError extends CompileError {
    constructor(code: keyof typeof ERROR_CODES, message: string, location?: Location, block?: string, suggestions?: string[]);
}
export declare class CodegenError extends CompileError {
    constructor(code: keyof typeof ERROR_CODES, message: string, location?: Location, block?: string, suggestions?: string[]);
}
export declare function createError(code: keyof typeof ERROR_CODES, message: string, location?: Location, block?: string, suggestions?: string[]): CompileError;
export declare function formatErrors(errors: CompileError[]): string;
//# sourceMappingURL=errors.d.ts.map