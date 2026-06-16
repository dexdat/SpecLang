"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/types, @block:layout/structure
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUIRED_FILES = exports.SPECLANG_SUBDIRS = exports.GENERATED_SUBDIRS = exports.SUPPORTED_LANGUAGES = exports.RefType = exports.ValidationSeverity = exports.DEFAULT_PROJECT_STRUCTURE = void 0;
/**
 * Default project structure (relative paths)
 */
exports.DEFAULT_PROJECT_STRUCTURE = {
    root: '.',
    specs: 'specs',
    tests: 'tests',
    generated: 'generated',
    speclang: '.speclang',
    northStar: 'project.scl',
    config: '.speclangrc',
    gitignore: '.gitignore'
};
// ============================================================================
// Validation Types
// ============================================================================
/**
 * Validation severity levels
 */
var ValidationSeverity;
(function (ValidationSeverity) {
    ValidationSeverity["Error"] = "error";
    ValidationSeverity["Warning"] = "warning";
    ValidationSeverity["Info"] = "info";
})(ValidationSeverity || (exports.ValidationSeverity = ValidationSeverity = {}));
// ============================================================================
// Reference Path Types
// ============================================================================
/**
 * Reference path types supported by speclang
 */
var RefType;
(function (RefType) {
    RefType["Spec"] = "spec";
    RefType["Test"] = "test";
    RefType["NorthStar"] = "northstar";
    RefType["Generated"] = "generated";
})(RefType || (exports.RefType = RefType = {}));
// ============================================================================
// Constants
// ============================================================================
/**
 * Supported language targets
 */
exports.SUPPORTED_LANGUAGES = ['typescript', 'python', 'go', 'rust', 'java', 'javascript'];
/**
 * Standard subdirectories for generated code
 */
exports.GENERATED_SUBDIRS = ['ts', 'go', 'py', 'rs', 'java', 'js'];
/**
 * .speclang internal directories
 */
exports.SPECLANG_SUBDIRS = ['locks', 'cache', 'daemon.pid'];
/**
 * Required files for valid project
 */
exports.REQUIRED_FILES = [
    'project.scl',
    'specs',
    'tests',
    'generated',
    '.speclang',
    '.speclangrc',
    '.gitignore'
];
//# sourceMappingURL=types.js.map