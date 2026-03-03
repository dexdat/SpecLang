"use strict";
/**
 * SPECLANG-GENERATED: Compiler Phases Types
 * Source: @speclang/compiler.spec.dir/phases
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompileError = void 0;
class CompileError extends Error {
    code;
    location;
    block;
    suggestions;
    constructor(code, message, location, block, suggestions = []) {
        super(message);
        this.code = code;
        this.location = location;
        this.block = block;
        this.suggestions = suggestions;
        this.name = 'CompileError';
    }
}
exports.CompileError = CompileError;
//# sourceMappingURL=types.js.map