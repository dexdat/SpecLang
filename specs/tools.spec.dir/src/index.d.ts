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
export * from './types.js';
export { ToolRegistry, createToolRegistry } from './registry.js';
export { createSpecTool, readFileTool, readHeaderTool, updateSpecTool, deleteSpecTool, listFilesTool, } from './file-tools.js';
export { findDependentsTool, findDependenciesTool, findByTagTool, findByLevelTool, getTreeTool, searchSpecsTool, } from './query-tools.js';
export { graphDependentsTool, graphAncestorsTool, impactAnalysisTool, topologicalSortTool, } from './graph-tools.js';
export { validateHeaderTool, validateRefsTool, validateSpecTool, } from './validation-tools.js';
export { triggerCascadeTool, cascadeStatusTool, queueCascadeTool, getCascadeQueueTool, clearCascadeQueueTool, processCascadeQueueTool, } from './cascade-tools.js';
export { gitCommitTool, gitStatusTool, gitDiffTool, gitLogTool, gitBranchTool, gitAddTool, } from './git-tools.js';
export { runPipelineTool, pipelineStatusTool, listPipelinesTool, cancelPipelineTool, pipelineResultTool, clearPipelinesTool, } from './pipeline-tools.js';
export { sessionInfoTool, sessionsListTool, registerSessionTool, updateSessionTool, unregisterSessionTool, sessionActivityTool, } from './session-tools.js';
import { ToolRegistry } from './registry.js';
/**
 * Initialize all tools and return a configured registry
 */
export declare function initializeTools(ownershipChecker?: any): ToolRegistry;
/**
 * Get or create default tool registry
 */
export declare function getToolRegistry(ownershipChecker?: any): ToolRegistry;
/**
 * Reset default registry (for testing)
 */
export declare function resetToolRegistry(): void;
//# sourceMappingURL=index.d.ts.map