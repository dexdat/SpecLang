"use strict";
/**
 * speclang-header lines:10
 * @ref:specs/tools.spec.md#simpletoolregistry
 * @ref:specs/tools.spec.md#createtoolregistry
 * @ref:specs/tools.spec.md#getstandardtools
 *
 * SPECLANG-GENERATED: Tools Index
 * Source: @speclang/tools
 *
 * Main exports for the Agent Tools API
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
exports.sessionActivityTool = exports.unregisterSessionTool = exports.updateSessionTool = exports.registerSessionTool = exports.sessionsListTool = exports.sessionInfoTool = exports.clearPipelinesTool = exports.pipelineResultTool = exports.cancelPipelineTool = exports.listPipelinesTool = exports.pipelineStatusTool = exports.runPipelineTool = exports.gitAddTool = exports.gitBranchTool = exports.gitLogTool = exports.gitDiffTool = exports.gitStatusTool = exports.gitCommitTool = exports.processCascadeQueueTool = exports.clearCascadeQueueTool = exports.getCascadeQueueTool = exports.queueCascadeTool = exports.cascadeStatusTool = exports.triggerCascadeTool = exports.validateSpecTool = exports.validateRefsTool = exports.validateHeaderTool = exports.topologicalSortTool = exports.impactAnalysisTool = exports.graphAncestorsTool = exports.graphDependentsTool = exports.searchSpecsTool = exports.getTreeTool = exports.findByLevelTool = exports.findByTagTool = exports.findDependenciesTool = exports.findDependentsTool = exports.listFilesTool = exports.deleteSpecTool = exports.updateSpecTool = exports.readHeaderTool = exports.readFileTool = exports.createSpecTool = exports.createToolRegistry = exports.ToolRegistry = void 0;
exports.initializeTools = initializeTools;
exports.getToolRegistry = getToolRegistry;
exports.resetToolRegistry = resetToolRegistry;
// ============================================================================
// TYPES
// ============================================================================
__exportStar(require("./types.js"), exports);
// ============================================================================
// REGISTRY
// ============================================================================
var registry_js_1 = require("./registry.js");
Object.defineProperty(exports, "ToolRegistry", { enumerable: true, get: function () { return registry_js_1.ToolRegistry; } });
Object.defineProperty(exports, "createToolRegistry", { enumerable: true, get: function () { return registry_js_1.createToolRegistry; } });
// ============================================================================
// FILE TOOLS
// ============================================================================
var file_tools_js_1 = require("./file-tools.js");
Object.defineProperty(exports, "createSpecTool", { enumerable: true, get: function () { return file_tools_js_1.createSpecTool; } });
Object.defineProperty(exports, "readFileTool", { enumerable: true, get: function () { return file_tools_js_1.readFileTool; } });
Object.defineProperty(exports, "readHeaderTool", { enumerable: true, get: function () { return file_tools_js_1.readHeaderTool; } });
Object.defineProperty(exports, "updateSpecTool", { enumerable: true, get: function () { return file_tools_js_1.updateSpecTool; } });
Object.defineProperty(exports, "deleteSpecTool", { enumerable: true, get: function () { return file_tools_js_1.deleteSpecTool; } });
Object.defineProperty(exports, "listFilesTool", { enumerable: true, get: function () { return file_tools_js_1.listFilesTool; } });
// ============================================================================
// QUERY TOOLS
// ============================================================================
var query_tools_js_1 = require("./query-tools.js");
Object.defineProperty(exports, "findDependentsTool", { enumerable: true, get: function () { return query_tools_js_1.findDependentsTool; } });
Object.defineProperty(exports, "findDependenciesTool", { enumerable: true, get: function () { return query_tools_js_1.findDependenciesTool; } });
Object.defineProperty(exports, "findByTagTool", { enumerable: true, get: function () { return query_tools_js_1.findByTagTool; } });
Object.defineProperty(exports, "findByLevelTool", { enumerable: true, get: function () { return query_tools_js_1.findByLevelTool; } });
Object.defineProperty(exports, "getTreeTool", { enumerable: true, get: function () { return query_tools_js_1.getTreeTool; } });
Object.defineProperty(exports, "searchSpecsTool", { enumerable: true, get: function () { return query_tools_js_1.searchSpecsTool; } });
// ============================================================================
// GRAPH TOOLS
// ============================================================================
var graph_tools_js_1 = require("./graph-tools.js");
Object.defineProperty(exports, "graphDependentsTool", { enumerable: true, get: function () { return graph_tools_js_1.graphDependentsTool; } });
Object.defineProperty(exports, "graphAncestorsTool", { enumerable: true, get: function () { return graph_tools_js_1.graphAncestorsTool; } });
Object.defineProperty(exports, "impactAnalysisTool", { enumerable: true, get: function () { return graph_tools_js_1.impactAnalysisTool; } });
Object.defineProperty(exports, "topologicalSortTool", { enumerable: true, get: function () { return graph_tools_js_1.topologicalSortTool; } });
// ============================================================================
// VALIDATION TOOLS
// ============================================================================
var validation_tools_js_1 = require("./validation-tools.js");
Object.defineProperty(exports, "validateHeaderTool", { enumerable: true, get: function () { return validation_tools_js_1.validateHeaderTool; } });
Object.defineProperty(exports, "validateRefsTool", { enumerable: true, get: function () { return validation_tools_js_1.validateRefsTool; } });
Object.defineProperty(exports, "validateSpecTool", { enumerable: true, get: function () { return validation_tools_js_1.validateSpecTool; } });
// ============================================================================
// CASCADE TOOLS
// ============================================================================
var cascade_tools_js_1 = require("./cascade-tools.js");
Object.defineProperty(exports, "triggerCascadeTool", { enumerable: true, get: function () { return cascade_tools_js_1.triggerCascadeTool; } });
Object.defineProperty(exports, "cascadeStatusTool", { enumerable: true, get: function () { return cascade_tools_js_1.cascadeStatusTool; } });
Object.defineProperty(exports, "queueCascadeTool", { enumerable: true, get: function () { return cascade_tools_js_1.queueCascadeTool; } });
Object.defineProperty(exports, "getCascadeQueueTool", { enumerable: true, get: function () { return cascade_tools_js_1.getCascadeQueueTool; } });
Object.defineProperty(exports, "clearCascadeQueueTool", { enumerable: true, get: function () { return cascade_tools_js_1.clearCascadeQueueTool; } });
Object.defineProperty(exports, "processCascadeQueueTool", { enumerable: true, get: function () { return cascade_tools_js_1.processCascadeQueueTool; } });
// ============================================================================
// GIT TOOLS
// ============================================================================
var git_tools_js_1 = require("./git-tools.js");
Object.defineProperty(exports, "gitCommitTool", { enumerable: true, get: function () { return git_tools_js_1.gitCommitTool; } });
Object.defineProperty(exports, "gitStatusTool", { enumerable: true, get: function () { return git_tools_js_1.gitStatusTool; } });
Object.defineProperty(exports, "gitDiffTool", { enumerable: true, get: function () { return git_tools_js_1.gitDiffTool; } });
Object.defineProperty(exports, "gitLogTool", { enumerable: true, get: function () { return git_tools_js_1.gitLogTool; } });
Object.defineProperty(exports, "gitBranchTool", { enumerable: true, get: function () { return git_tools_js_1.gitBranchTool; } });
Object.defineProperty(exports, "gitAddTool", { enumerable: true, get: function () { return git_tools_js_1.gitAddTool; } });
// ============================================================================
// PIPELINE TOOLS
// ============================================================================
var pipeline_tools_js_1 = require("./pipeline-tools.js");
Object.defineProperty(exports, "runPipelineTool", { enumerable: true, get: function () { return pipeline_tools_js_1.runPipelineTool; } });
Object.defineProperty(exports, "pipelineStatusTool", { enumerable: true, get: function () { return pipeline_tools_js_1.pipelineStatusTool; } });
Object.defineProperty(exports, "listPipelinesTool", { enumerable: true, get: function () { return pipeline_tools_js_1.listPipelinesTool; } });
Object.defineProperty(exports, "cancelPipelineTool", { enumerable: true, get: function () { return pipeline_tools_js_1.cancelPipelineTool; } });
Object.defineProperty(exports, "pipelineResultTool", { enumerable: true, get: function () { return pipeline_tools_js_1.pipelineResultTool; } });
Object.defineProperty(exports, "clearPipelinesTool", { enumerable: true, get: function () { return pipeline_tools_js_1.clearPipelinesTool; } });
// ============================================================================
// SESSION TOOLS
// ============================================================================
var session_tools_js_1 = require("./session-tools.js");
Object.defineProperty(exports, "sessionInfoTool", { enumerable: true, get: function () { return session_tools_js_1.sessionInfoTool; } });
Object.defineProperty(exports, "sessionsListTool", { enumerable: true, get: function () { return session_tools_js_1.sessionsListTool; } });
Object.defineProperty(exports, "registerSessionTool", { enumerable: true, get: function () { return session_tools_js_1.registerSessionTool; } });
Object.defineProperty(exports, "updateSessionTool", { enumerable: true, get: function () { return session_tools_js_1.updateSessionTool; } });
Object.defineProperty(exports, "unregisterSessionTool", { enumerable: true, get: function () { return session_tools_js_1.unregisterSessionTool; } });
Object.defineProperty(exports, "sessionActivityTool", { enumerable: true, get: function () { return session_tools_js_1.sessionActivityTool; } });
// ============================================================================
// TOOL REGISTRY INITIALIZATION
// ============================================================================
const registry_js_2 = require("./registry.js");
const file_tools_js_2 = require("./file-tools.js");
const query_tools_js_2 = require("./query-tools.js");
const graph_tools_js_2 = require("./graph-tools.js");
const validation_tools_js_2 = require("./validation-tools.js");
const cascade_tools_js_2 = require("./cascade-tools.js");
const git_tools_js_2 = require("./git-tools.js");
const pipeline_tools_js_2 = require("./pipeline-tools.js");
const session_tools_js_2 = require("./session-tools.js");
/**
 * Initialize all tools and return a configured registry
 */
function initializeTools(ownershipChecker) {
    const registry = new registry_js_2.ToolRegistry(ownershipChecker);
    // File tools
    registry.register(file_tools_js_2.createSpecTool);
    registry.register(file_tools_js_2.readFileTool);
    registry.register(file_tools_js_2.readHeaderTool);
    registry.register(file_tools_js_2.updateSpecTool);
    registry.register(file_tools_js_2.deleteSpecTool);
    registry.register(file_tools_js_2.listFilesTool);
    // Query tools
    registry.register(query_tools_js_2.findDependentsTool);
    registry.register(query_tools_js_2.findDependenciesTool);
    registry.register(query_tools_js_2.findByTagTool);
    registry.register(query_tools_js_2.findByLevelTool);
    registry.register(query_tools_js_2.getTreeTool);
    registry.register(query_tools_js_2.searchSpecsTool);
    // Graph tools
    registry.register(graph_tools_js_2.graphDependentsTool);
    registry.register(graph_tools_js_2.graphAncestorsTool);
    registry.register(graph_tools_js_2.impactAnalysisTool);
    registry.register(graph_tools_js_2.topologicalSortTool);
    // Validation tools
    registry.register(validation_tools_js_2.validateHeaderTool);
    registry.register(validation_tools_js_2.validateRefsTool);
    registry.register(validation_tools_js_2.validateSpecTool);
    // Cascade tools
    registry.register(cascade_tools_js_2.triggerCascadeTool);
    registry.register(cascade_tools_js_2.cascadeStatusTool);
    registry.register(cascade_tools_js_2.queueCascadeTool);
    registry.register(cascade_tools_js_2.getCascadeQueueTool);
    registry.register(cascade_tools_js_2.clearCascadeQueueTool);
    registry.register(cascade_tools_js_2.processCascadeQueueTool);
    // Git tools
    registry.register(git_tools_js_2.gitCommitTool);
    registry.register(git_tools_js_2.gitStatusTool);
    registry.register(git_tools_js_2.gitDiffTool);
    registry.register(git_tools_js_2.gitLogTool);
    registry.register(git_tools_js_2.gitBranchTool);
    registry.register(git_tools_js_2.gitAddTool);
    // Pipeline tools
    registry.register(pipeline_tools_js_2.runPipelineTool);
    registry.register(pipeline_tools_js_2.pipelineStatusTool);
    registry.register(pipeline_tools_js_2.listPipelinesTool);
    registry.register(pipeline_tools_js_2.cancelPipelineTool);
    registry.register(pipeline_tools_js_2.pipelineResultTool);
    registry.register(pipeline_tools_js_2.clearPipelinesTool);
    // Session tools
    registry.register(session_tools_js_2.sessionInfoTool);
    registry.register(session_tools_js_2.sessionsListTool);
    registry.register(session_tools_js_2.registerSessionTool);
    registry.register(session_tools_js_2.updateSessionTool);
    registry.register(session_tools_js_2.unregisterSessionTool);
    registry.register(session_tools_js_2.sessionActivityTool);
    return registry;
}
/**
 * Default tool registry instance
 */
let defaultRegistry = null;
/**
 * Get or create default tool registry
 */
function getToolRegistry(ownershipChecker) {
    if (!defaultRegistry) {
        defaultRegistry = initializeTools(ownershipChecker);
    }
    return defaultRegistry;
}
/**
 * Reset default registry (for testing)
 */
function resetToolRegistry() {
    defaultRegistry = null;
}
//# sourceMappingURL=index.js.map