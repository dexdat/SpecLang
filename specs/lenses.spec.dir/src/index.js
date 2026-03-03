"use strict";
/**
 * SPECLANG-GENERATED: Lens System Index
 * Source: @speclang/lenses
 *
 * Main exports for the Lens System - bidirectional parsers/renderers
 * that convert between structured Block objects and various content formats.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionLens = exports.questionLens = exports.policyLens = exports.tableLens = exports.detectDiagramType = exports.diagramLens = exports.acceptanceLens = exports.mathLens = exports.operationLens = exports.entityLens = exports.codeLens = exports.proseLens = exports.defaultConverter = exports.defaultRegistry = exports.LensConverter = exports.LensRegistry = void 0;
exports.initializeLenses = initializeLenses;
const registry_1 = require("./registry");
Object.defineProperty(exports, "LensRegistry", { enumerable: true, get: function () { return registry_1.LensRegistry; } });
const converter_1 = require("./converter");
Object.defineProperty(exports, "LensConverter", { enumerable: true, get: function () { return converter_1.LensConverter; } });
const prose_lens_1 = require("./prose-lens");
const code_lens_1 = require("./code-lens");
const entity_lens_1 = require("./entity-lens");
const operation_lens_1 = require("./operation-lens");
const math_lens_1 = require("./math-lens");
const acceptance_lens_1 = require("./acceptance-lens");
const diagram_lens_1 = require("./diagram-lens");
const table_lens_1 = require("./table-lens");
const policy_lens_1 = require("./policy-lens");
const question_lens_1 = require("./question-lens");
const decision_lens_1 = require("./decision-lens");
function initializeLenses() {
    const registry = new registry_1.LensRegistry();
    // Register in priority order (highest first)
    registry.register(diagram_lens_1.diagramLens); // 70
    registry.register(acceptance_lens_1.acceptanceLens); // 65
    registry.register(entity_lens_1.entityLens); // 60
    registry.register(operation_lens_1.operationLens); // 55
    registry.register(code_lens_1.codeLens); // 50
    registry.register(math_lens_1.mathLens); // 45
    registry.register(table_lens_1.tableLens); // 40
    registry.register(decision_lens_1.decisionLens); // 32
    registry.register(question_lens_1.questionLens); // 30
    registry.register(policy_lens_1.policyLens); // 35
    registry.register(prose_lens_1.proseLens); // 0 (fallback)
    const converter = new converter_1.LensConverter(registry);
    return { registry, converter };
}
// Create default instance
const { registry: defaultRegistry, converter: defaultConverter } = initializeLenses();
exports.defaultRegistry = defaultRegistry;
exports.defaultConverter = defaultConverter;
// Re-export lens implementations
var prose_lens_2 = require("./prose-lens");
Object.defineProperty(exports, "proseLens", { enumerable: true, get: function () { return prose_lens_2.proseLens; } });
var code_lens_2 = require("./code-lens");
Object.defineProperty(exports, "codeLens", { enumerable: true, get: function () { return code_lens_2.codeLens; } });
var entity_lens_2 = require("./entity-lens");
Object.defineProperty(exports, "entityLens", { enumerable: true, get: function () { return entity_lens_2.entityLens; } });
var operation_lens_2 = require("./operation-lens");
Object.defineProperty(exports, "operationLens", { enumerable: true, get: function () { return operation_lens_2.operationLens; } });
var math_lens_2 = require("./math-lens");
Object.defineProperty(exports, "mathLens", { enumerable: true, get: function () { return math_lens_2.mathLens; } });
var acceptance_lens_2 = require("./acceptance-lens");
Object.defineProperty(exports, "acceptanceLens", { enumerable: true, get: function () { return acceptance_lens_2.acceptanceLens; } });
var diagram_lens_2 = require("./diagram-lens");
Object.defineProperty(exports, "diagramLens", { enumerable: true, get: function () { return diagram_lens_2.diagramLens; } });
Object.defineProperty(exports, "detectDiagramType", { enumerable: true, get: function () { return diagram_lens_2.detectDiagramType; } });
var table_lens_2 = require("./table-lens");
Object.defineProperty(exports, "tableLens", { enumerable: true, get: function () { return table_lens_2.tableLens; } });
var policy_lens_2 = require("./policy-lens");
Object.defineProperty(exports, "policyLens", { enumerable: true, get: function () { return policy_lens_2.policyLens; } });
var question_lens_2 = require("./question-lens");
Object.defineProperty(exports, "questionLens", { enumerable: true, get: function () { return question_lens_2.questionLens; } });
var decision_lens_2 = require("./decision-lens");
Object.defineProperty(exports, "decisionLens", { enumerable: true, get: function () { return decision_lens_2.decisionLens; } });
//# sourceMappingURL=index.js.map