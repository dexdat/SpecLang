"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/types.spec.md
 * Generated: 2026-03-03T03:54:00.000Z
 *
 * Edit the spec, not this file.
 */
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null",
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.POC_CONSTANTS = exports.POCError = exports.VALID_BLOCK_KINDS = void 0;
exports.isValidBlockKind = isValidBlockKind;
/**
 * Valid block kinds for validation
 */
exports.VALID_BLOCK_KINDS = [
  "function",
  "class",
  "interface",
  "type",
  "enum",
  "constant",
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
var POCError = /** @class */ (function (_super) {
  __extends(POCError, _super);
  function POCError(code, message, filePath, cause) {
    var _this = _super.call(this, message) || this;
    _this.code = code;
    _this.filePath = filePath;
    _this.timestamp = Date.now();
    _this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(_this, POCError);
    }
    return _this;
  }
  /**
   * Convert to user-friendly message
   */
  POCError.prototype.toUserMessage = function () {
    var messages = {
      WATCH_ERROR: "Failed to watch directory",
      PARSE_ERROR: "Failed to parse spec file",
      GENERATION_ERROR: "Failed to generate code",
      WRITE_ERROR: "Failed to write file",
      SYMLINK_ERROR: "Failed to create symlink",
      CONVERGENCE_ERROR: "Convergence detection failed",
      TIMEOUT_ERROR: "Operation timed out",
      HEADER_ERROR: "Invalid spec header",
      TEMPLATE_ERROR: "Template not found",
    };
    var msg = "["
      .concat(this.code, "] ")
      .concat(messages[this.code] || "Unknown error");
    if (this.filePath) {
      msg += "\n  File: ".concat(this.filePath);
    }
    if (this.message) {
      msg += "\n  Details: ".concat(this.message);
    }
    return msg;
  };
  return POCError;
})(Error);
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
  WATCH_DIR: "./specs",
  /** Output directory */
  OUTPUT_DIR: "./src",
  /** Ignore patterns */
  IGNORE_PATTERNS: [
    "*.tmp",
    "*~",
    ".git/**",
    "node_modules/**",
    ".speclang/**",
  ],
  /** Header marker in generated files */
  GENERATED_HEADER: "// SPECLANG-GENERATED",
  /** Block pattern regex */
  BLOCK_PATTERN: /^###\s+@block:(\w+)\s+@kind:(\w+)/m,
  /** Parameter pattern regex */
  PARAM_PATTERN: /^-\s+(\w+):\s+(\w+)\s+-\s+(.+)$/m,
};
