"use strict";
/**
 * SPECLANG-GENERATED: Compiler Error Handling
 * Source: @speclang/compiler.spec.dir/phases @compiler/errors @compiler/error-codes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodegenError = exports.TransformError = exports.ResolveError = exports.ValidationError = exports.WARNING_CODES = exports.ERROR_CODES = void 0;
exports.createError = createError;
exports.formatErrors = formatErrors;
const types_1 = require("./types");
exports.ERROR_CODES = {
    E001: 'Invalid header',
    E002: 'Missing header',
    E003: 'Duplicate block ID',
    E004: 'Unresolved ref',
    E005: 'Invalid block syntax',
    E006: 'Circular dependency',
    E007: 'Type mismatch',
    E008: 'Unknown kind',
    E009: 'Invalid target',
    E010: 'Codegen failed',
};
exports.WARNING_CODES = {
    W001: 'Missing layer',
    W002: 'Unused import',
    W003: 'Deprecated syntax',
    W004: 'Missing documentation',
};
class ValidationError extends types_1.CompileError {
    constructor(code, message, location, block, suggestions) {
        super(code, message, location, block, suggestions);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ResolveError extends types_1.CompileError {
    constructor(code, message, location, block, suggestions) {
        super(code, message, location, block, suggestions);
        this.name = 'ResolveError';
    }
}
exports.ResolveError = ResolveError;
class TransformError extends types_1.CompileError {
    constructor(code, message, location, block, suggestions) {
        super(code, message, location, block, suggestions);
        this.name = 'TransformError';
    }
}
exports.TransformError = TransformError;
class CodegenError extends types_1.CompileError {
    constructor(code, message, location, block, suggestions) {
        super(code, message, location, block, suggestions);
        this.name = 'CodegenError';
    }
}
exports.CodegenError = CodegenError;
function createError(code, message, location, block, suggestions) {
    return new types_1.CompileError(code, message, location, block, suggestions);
}
function formatErrors(errors) {
    return errors.map((e) => e.toString()).join('\n');
}
//# sourceMappingURL=errors.js.map