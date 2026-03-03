"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/types.spec.md
 * Generated: 2026-03-03T03:54:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POC_CONSTANTS = exports.POCError = exports.VALID_BLOCK_KINDS = void 0;
exports.isValidBlockKind = isValidBlockKind;
/**
 * Valid block kinds for validation
 */
exports.VALID_BLOCK_KINDS = [
    'function', 'class', 'interface', 'type', 'enum', 'constant'
];
/**
 * Validate block kind
 * @param kind - The kind to validate
 * @returns True if valid BlockKind
 */
function isValidBlockKind(kind) {
    return exports.VALID_BLOCK_KINDS.includes(kind);
}
/**
 * POC error class
 * Used across all POC components for error handling
 */
class POCError extends Error {
    /** Error code */
    code;
    /** File path (if applicable) */
    filePath;
    /** Timestamp */
    timestamp;
    /** Original error (if wrapped) */
    cause;
    constructor(code, message, filePath, cause) {
        super(message);
        this.code = code;
        this.filePath = filePath;
        this.timestamp = Date.now();
        this.cause = cause;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, POCError);
        }
    }
    /**
     * Convert to user-friendly message
     */
    toUserMessage() {
        const messages = {
            'WATCH_ERROR': 'Failed to watch directory',
            'PARSE_ERROR': 'Failed to parse spec file',
            'GENERATION_ERROR': 'Failed to generate code',
            'WRITE_ERROR': 'Failed to write file',
            'SYMLINK_ERROR': 'Failed to create symlink',
            'CONVERGENCE_ERROR': 'Convergence detection failed',
            'TIMEOUT_ERROR': 'Operation timed out',
            'HEADER_ERROR': 'Invalid spec header',
            'TEMPLATE_ERROR': 'Template not found'
        };
        let msg = `[${this.code}] ${messages[this.code] || 'Unknown error'}`;
        if (this.filePath) {
            msg += `\n  File: ${this.filePath}`;
        }
        if (this.message) {
            msg += `\n  Details: ${this.message}`;
        }
        return msg;
    }
}
exports.POCError = POCError;
// ============================================
// Constants
// ============================================
/**
 * POC Configuration Constants
 */
exports.POC_CONSTANTS = {
    /** Debounce time for file changes (ms) */
    DEBOUNCE_MS: 300,
    /** Convergence quiet period (ms) */
    CONVERGENCE_MS: 5000,
    /** Max cascade depth */
    MAX_DEPTH: 10,
    /** Max task duration (ms) */
    MAX_TASK_DURATION_MS: 30000,
    /** Watch directory */
    WATCH_DIR: './specs',
    /** Output directory */
    OUTPUT_DIR: './src',
    /** Ignore patterns */
    IGNORE_PATTERNS: [
        '*.tmp',
        '*~',
        '.git/**',
        'node_modules/**',
        '.speclang/**'
    ],
    /** Header marker in generated files */
    GENERATED_HEADER: '// SPECLANG-GENERATED',
    /** Block pattern regex */
    BLOCK_PATTERN: /^###\s+@block:(\w+)\s+@kind:(\w+)/m,
    /** Parameter pattern regex */
    PARAM_PATTERN: /^-\s+(\w+):\s+(\w+)\s+-\s+(.+)$/m
};
