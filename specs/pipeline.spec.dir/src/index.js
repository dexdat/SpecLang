"use strict";
/**
 * Pipeline Module - Main Exports
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline
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
exports.createPipelineExecutor = exports.PipelineExecutor = exports.recordConvergenceOutcome = exports.recordRecoveryOutcome = exports.recordStageOutcome = exports.recordCounter = exports.resolveLedgerPath = exports.readLedger = exports.STAGE_DURATION_FAMILY = exports.CONVERGENCE_FAMILY = exports.RECOVERY_FAMILY = exports.STAGE_RESULTS_FAMILY = exports.DEFAULT_LEDGER_RELATIVE_PATH = exports.LEDGER_ENV_VAR = exports.RecoveryActions = exports.RecoveryExecutor = exports.createHookContext = exports.BuiltInHooks = exports.HookExecutor = exports.areDependenciesMet = exports.orderStages = exports.StageExecutor = exports.getPipelineConfig = exports.loadPipelineConfig = exports.PipelineConfigManager = void 0;
// Types
__exportStar(require("./types"), exports);
// Config
var config_1 = require("./config");
Object.defineProperty(exports, "PipelineConfigManager", { enumerable: true, get: function () { return config_1.PipelineConfigManager; } });
Object.defineProperty(exports, "loadPipelineConfig", { enumerable: true, get: function () { return config_1.loadPipelineConfig; } });
Object.defineProperty(exports, "getPipelineConfig", { enumerable: true, get: function () { return config_1.getPipelineConfig; } });
// Stages
var stages_1 = require("./stages");
Object.defineProperty(exports, "StageExecutor", { enumerable: true, get: function () { return stages_1.StageExecutor; } });
Object.defineProperty(exports, "orderStages", { enumerable: true, get: function () { return stages_1.orderStages; } });
Object.defineProperty(exports, "areDependenciesMet", { enumerable: true, get: function () { return stages_1.areDependenciesMet; } });
// Hooks
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "HookExecutor", { enumerable: true, get: function () { return hooks_1.HookExecutor; } });
Object.defineProperty(exports, "BuiltInHooks", { enumerable: true, get: function () { return hooks_1.BuiltInHooks; } });
Object.defineProperty(exports, "createHookContext", { enumerable: true, get: function () { return hooks_1.createHookContext; } });
// Recovery
var recovery_1 = require("./recovery");
Object.defineProperty(exports, "RecoveryExecutor", { enumerable: true, get: function () { return recovery_1.RecoveryExecutor; } });
Object.defineProperty(exports, "RecoveryActions", { enumerable: true, get: function () { return recovery_1.RecoveryActions; } });
// Outcome ledger (OBS-2 — cross-process counters for the MCP /metrics endpoint)
var metrics_ledger_1 = require("./metrics-ledger");
Object.defineProperty(exports, "LEDGER_ENV_VAR", { enumerable: true, get: function () { return metrics_ledger_1.LEDGER_ENV_VAR; } });
Object.defineProperty(exports, "DEFAULT_LEDGER_RELATIVE_PATH", { enumerable: true, get: function () { return metrics_ledger_1.DEFAULT_LEDGER_RELATIVE_PATH; } });
Object.defineProperty(exports, "STAGE_RESULTS_FAMILY", { enumerable: true, get: function () { return metrics_ledger_1.STAGE_RESULTS_FAMILY; } });
Object.defineProperty(exports, "RECOVERY_FAMILY", { enumerable: true, get: function () { return metrics_ledger_1.RECOVERY_FAMILY; } });
Object.defineProperty(exports, "CONVERGENCE_FAMILY", { enumerable: true, get: function () { return metrics_ledger_1.CONVERGENCE_FAMILY; } });
Object.defineProperty(exports, "STAGE_DURATION_FAMILY", { enumerable: true, get: function () { return metrics_ledger_1.STAGE_DURATION_FAMILY; } });
Object.defineProperty(exports, "readLedger", { enumerable: true, get: function () { return metrics_ledger_1.readLedger; } });
Object.defineProperty(exports, "resolveLedgerPath", { enumerable: true, get: function () { return metrics_ledger_1.resolveLedgerPath; } });
Object.defineProperty(exports, "recordCounter", { enumerable: true, get: function () { return metrics_ledger_1.recordCounter; } });
Object.defineProperty(exports, "recordStageOutcome", { enumerable: true, get: function () { return metrics_ledger_1.recordStageOutcome; } });
Object.defineProperty(exports, "recordRecoveryOutcome", { enumerable: true, get: function () { return metrics_ledger_1.recordRecoveryOutcome; } });
Object.defineProperty(exports, "recordConvergenceOutcome", { enumerable: true, get: function () { return metrics_ledger_1.recordConvergenceOutcome; } });
// Executor
var executor_1 = require("./executor");
Object.defineProperty(exports, "PipelineExecutor", { enumerable: true, get: function () { return executor_1.PipelineExecutor; } });
Object.defineProperty(exports, "createPipelineExecutor", { enumerable: true, get: function () { return executor_1.createPipelineExecutor; } });
//# sourceMappingURL=index.js.map