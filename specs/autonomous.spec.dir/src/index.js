"use strict";
/**
 * SPECLANG-GENERATED: Main exports for autonomous testing system
 * Source: @speclang/autonomous-validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationReport = exports.validateAutonomousReadiness = exports.AutonomousValidator = exports.validateScenarioConfig = exports.getScenariosByType = exports.getCriticalScenarios = exports.getScenarioByName = exports.AUTONOMOUS_SCENARIOS = exports.formatTestReport = exports.runAutonomousTests = exports.AutonomousTestRunner = void 0;
// Core components
var test_runner_js_1 = require("./test-runner.js");
Object.defineProperty(exports, "AutonomousTestRunner", { enumerable: true, get: function () { return test_runner_js_1.AutonomousTestRunner; } });
Object.defineProperty(exports, "runAutonomousTests", { enumerable: true, get: function () { return test_runner_js_1.runAutonomousTests; } });
Object.defineProperty(exports, "formatTestReport", { enumerable: true, get: function () { return test_runner_js_1.formatTestReport; } });
var scenarios_js_1 = require("./scenarios.js");
Object.defineProperty(exports, "AUTONOMOUS_SCENARIOS", { enumerable: true, get: function () { return scenarios_js_1.AUTONOMOUS_SCENARIOS; } });
Object.defineProperty(exports, "getScenarioByName", { enumerable: true, get: function () { return scenarios_js_1.getScenarioByName; } });
Object.defineProperty(exports, "getCriticalScenarios", { enumerable: true, get: function () { return scenarios_js_1.getCriticalScenarios; } });
Object.defineProperty(exports, "getScenariosByType", { enumerable: true, get: function () { return scenarios_js_1.getScenariosByType; } });
Object.defineProperty(exports, "validateScenarioConfig", { enumerable: true, get: function () { return scenarios_js_1.validateScenarioConfig; } });
var validator_js_1 = require("./validator.js");
Object.defineProperty(exports, "AutonomousValidator", { enumerable: true, get: function () { return validator_js_1.AutonomousValidator; } });
Object.defineProperty(exports, "validateAutonomousReadiness", { enumerable: true, get: function () { return validator_js_1.validateAutonomousReadiness; } });
Object.defineProperty(exports, "formatValidationReport", { enumerable: true, get: function () { return validator_js_1.formatValidationReport; } });
//# sourceMappingURL=index.js.map