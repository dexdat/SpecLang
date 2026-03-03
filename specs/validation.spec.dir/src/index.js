"use strict";
/**
 * SPECLANG-GENERATED: Validation module exports
 * Source: @speclang/validation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILTIN_RULES = exports.autonomousRule = exports.blocksRule = exports.refsRule = exports.idRule = exports.headerRule = exports.resetRegistry = exports.getRegistry = exports.RuleRegistry = exports.validateCommand = exports.formatSummary = exports.formatJSON = exports.formatBatch = exports.format = exports.ValidationReporter = exports.validateAll = exports.validate = exports.resetEngine = exports.getEngine = exports.ValidationEngine = void 0;
// Types
__exportStar(require("./types"), exports);
// Engine
var engine_1 = require("./engine");
Object.defineProperty(exports, "ValidationEngine", { enumerable: true, get: function () { return engine_1.ValidationEngine; } });
Object.defineProperty(exports, "getEngine", { enumerable: true, get: function () { return engine_1.getEngine; } });
Object.defineProperty(exports, "resetEngine", { enumerable: true, get: function () { return engine_1.resetEngine; } });
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return engine_1.validate; } });
Object.defineProperty(exports, "validateAll", { enumerable: true, get: function () { return engine_1.validateAll; } });
// Reporter
var reporter_1 = require("./reporter");
Object.defineProperty(exports, "ValidationReporter", { enumerable: true, get: function () { return reporter_1.ValidationReporter; } });
Object.defineProperty(exports, "format", { enumerable: true, get: function () { return reporter_1.format; } });
Object.defineProperty(exports, "formatBatch", { enumerable: true, get: function () { return reporter_1.formatBatch; } });
Object.defineProperty(exports, "formatJSON", { enumerable: true, get: function () { return reporter_1.formatJSON; } });
Object.defineProperty(exports, "formatSummary", { enumerable: true, get: function () { return reporter_1.formatSummary; } });
// CLI
var cli_1 = require("./cli");
Object.defineProperty(exports, "validateCommand", { enumerable: true, get: function () { return cli_1.validateCommand; } });
// Rules
var rules_1 = require("./rules");
Object.defineProperty(exports, "RuleRegistry", { enumerable: true, get: function () { return rules_1.RuleRegistry; } });
Object.defineProperty(exports, "getRegistry", { enumerable: true, get: function () { return rules_1.getRegistry; } });
Object.defineProperty(exports, "resetRegistry", { enumerable: true, get: function () { return rules_1.resetRegistry; } });
Object.defineProperty(exports, "headerRule", { enumerable: true, get: function () { return rules_1.headerRule; } });
Object.defineProperty(exports, "idRule", { enumerable: true, get: function () { return rules_1.idRule; } });
Object.defineProperty(exports, "refsRule", { enumerable: true, get: function () { return rules_1.refsRule; } });
Object.defineProperty(exports, "blocksRule", { enumerable: true, get: function () { return rules_1.blocksRule; } });
Object.defineProperty(exports, "autonomousRule", { enumerable: true, get: function () { return rules_1.autonomousRule; } });
Object.defineProperty(exports, "BUILTIN_RULES", { enumerable: true, get: function () { return rules_1.BUILTIN_RULES; } });
//# sourceMappingURL=index.js.map