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

// ============================================================================
// TYPES
// ============================================================================

export * from './types.js';

// ============================================================================
// CONTEXT
// ============================================================================

export * from './context.js';

// ============================================================================
// REGISTRY
// ============================================================================

export { ToolRegistry, createToolRegistry } from './registry.js';

// ============================================================================
// FILE TOOLS
// ============================================================================

export {
  createSpecTool,
  readFileTool,
  readHeaderTool,
  updateSpecTool,
  deleteSpecTool,
  listFilesTool,
} from './file-tools.js';

// ============================================================================
// QUERY TOOLS
// ============================================================================

export {
  findDependentsTool,
  findDependenciesTool,
  findByTagTool,
  findByLevelTool,
  getTreeTool,
  searchSpecsTool,
} from './query-tools.js';

// ============================================================================
// GRAPH TOOLS
// ============================================================================

export {
  graphDependentsTool,
  graphAncestorsTool,
  impactAnalysisTool,
  topologicalSortTool,
} from './graph-tools.js';

// ============================================================================
// VALIDATION TOOLS
// ============================================================================

export {
  validateHeaderTool,
  validateRefsTool,
  validateSpecTool,
} from './validation-tools.js';

// ============================================================================
// CASCADE TOOLS
// ============================================================================

export {
  triggerCascadeTool,
  cascadeStatusTool,
  queueCascadeTool,
  getCascadeQueueTool,
  clearCascadeQueueTool,
  processCascadeQueueTool,
} from './cascade-tools.js';

// ============================================================================
// GIT TOOLS
// ============================================================================

export {
  gitCommitTool,
  gitStatusTool,
  gitDiffTool,
  gitLogTool,
  gitBranchTool,
  gitAddTool,
} from './git-tools.js';

// ============================================================================
// PIPELINE TOOLS
// ============================================================================

export {
  runPipelineTool,
  pipelineStatusTool,
  listPipelinesTool,
  cancelPipelineTool,
  pipelineResultTool,
  clearPipelinesTool,
} from './pipeline-tools.js';

// ============================================================================
// SESSION TOOLS
// ============================================================================

export {
  sessionInfoTool,
  sessionsListTool,
  registerSessionTool,
  updateSessionTool,
  unregisterSessionTool,
  sessionActivityTool,
} from './session-tools.js';

// ============================================================================
// TOOL REGISTRY INITIALIZATION
// ============================================================================

import { ToolRegistry } from './registry.js';
import { createSpecTool, readFileTool, readHeaderTool, updateSpecTool, deleteSpecTool, listFilesTool } from './file-tools.js';
import { findDependentsTool, findDependenciesTool, findByTagTool, findByLevelTool, getTreeTool, searchSpecsTool } from './query-tools.js';
import { graphDependentsTool, graphAncestorsTool, impactAnalysisTool, topologicalSortTool } from './graph-tools.js';
import { validateHeaderTool, validateRefsTool, validateSpecTool } from './validation-tools.js';
import { triggerCascadeTool, cascadeStatusTool, queueCascadeTool, getCascadeQueueTool, clearCascadeQueueTool, processCascadeQueueTool } from './cascade-tools.js';
import { gitCommitTool, gitStatusTool, gitDiffTool, gitLogTool, gitBranchTool, gitAddTool } from './git-tools.js';
import { runPipelineTool, pipelineStatusTool, listPipelinesTool, cancelPipelineTool, pipelineResultTool, clearPipelinesTool } from './pipeline-tools.js';
import { sessionInfoTool, sessionsListTool, registerSessionTool, updateSessionTool, unregisterSessionTool, sessionActivityTool } from './session-tools.js';

/**
 * Initialize all tools and return a configured registry
 */
export function initializeTools(ownershipChecker?: any): ToolRegistry {
  const registry = new ToolRegistry(ownershipChecker);

  // File tools
  registry.register(createSpecTool);
  registry.register(readFileTool);
  registry.register(readHeaderTool);
  registry.register(updateSpecTool);
  registry.register(deleteSpecTool);
  registry.register(listFilesTool);

  // Query tools
  registry.register(findDependentsTool);
  registry.register(findDependenciesTool);
  registry.register(findByTagTool);
  registry.register(findByLevelTool);
  registry.register(getTreeTool);
  registry.register(searchSpecsTool);

  // Graph tools
  registry.register(graphDependentsTool);
  registry.register(graphAncestorsTool);
  registry.register(impactAnalysisTool);
  registry.register(topologicalSortTool);

  // Validation tools
  registry.register(validateHeaderTool);
  registry.register(validateRefsTool);
  registry.register(validateSpecTool);

  // Cascade tools
  registry.register(triggerCascadeTool);
  registry.register(cascadeStatusTool);
  registry.register(queueCascadeTool);
  registry.register(getCascadeQueueTool);
  registry.register(clearCascadeQueueTool);
  registry.register(processCascadeQueueTool);

  // Git tools
  registry.register(gitCommitTool);
  registry.register(gitStatusTool);
  registry.register(gitDiffTool);
  registry.register(gitLogTool);
  registry.register(gitBranchTool);
  registry.register(gitAddTool);

  // Pipeline tools
  registry.register(runPipelineTool);
  registry.register(pipelineStatusTool);
  registry.register(listPipelinesTool);
  registry.register(cancelPipelineTool);
  registry.register(pipelineResultTool);
  registry.register(clearPipelinesTool);

  // Session tools
  registry.register(sessionInfoTool);
  registry.register(sessionsListTool);
  registry.register(registerSessionTool);
  registry.register(updateSessionTool);
  registry.register(unregisterSessionTool);
  registry.register(sessionActivityTool);

  return registry;
}

/**
 * Default tool registry instance
 */
let defaultRegistry: ToolRegistry | null = null;

/**
 * Get or create default tool registry
 */
export function getToolRegistry(ownershipChecker?: any): ToolRegistry {
  if (!defaultRegistry) {
    defaultRegistry = initializeTools(ownershipChecker);
  }
  return defaultRegistry;
}

/**
 * Reset default registry (for testing)
 */
export function resetToolRegistry(): void {
  defaultRegistry = null;
}
