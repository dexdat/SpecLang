/**
 * SPECLANG-GENERATED: Agent Session Manager - Main exports
 * Source: @speclang/agent-protocol @block:protocol/overview
 * 
 * This is the main entry point for the Agent Session Manager.
 * It provides session management, ownership tracking, and tools for AI agents.
 */

// Types
export * from './types';

// Session management
export { SessionManager, createSessionManager } from './session';

// Ownership tracking
export { OwnershipRegistry, createOwnershipRegistry } from './ownership';

// Agent registry
export { AgentRegistry, createAgentRegistry } from './registry';

// Tools
export { SimpleToolRegistry, createToolRegistry, getStandardTools } from './tools';
export {
  readSpecHandler,
  writeSpecHandler,
  searchSpecsHandler,
  readFileHandler,
  writeFileHandler,
  listFilesHandler,
  getDependenciesHandler,
  getDependentsHandler,
  impactAnalysisHandler,
  triggerCascadeHandler,
  cascadeStatusHandler,
  createSpecFileHandler,
  commitHandler,
} from './tools';

// State persistence
export { StateManager, createStateManager } from './state';

// Session Lifecycle
export { SessionLifecycle } from './lifecycle';

// Interceptor (Write Guard)
export { 
  WriteInterceptor, 
  createWriteInterceptor, 
  initGuard, 
  getGuard, 
  resetGuard,
  checkOwnership,
  interceptWrite,
  getFileOwner,
  getViolations,
  getGuardStats,
  type InterceptorConfig,
  type WriteAttempt,
} from './interceptor';

// Rules
export {
  DEFAULT_RULES,
  ORCHESTRATOR_RULE,
  isExemptFromGuard,
  getAgentPriority,
  validateRules,
  createRule,
  mergeRules,
  getRulesForAgent,
  type ValidationResult,
} from './rules';

// Violations
export {
  ViolationTracker,
  createViolationTracker,
  type Violation,
  type ViolationStats,
} from './violations';

// Session API Server
export { SessionApiServer, createSessionApiServer } from './session-api';

// Metadata Routing
export {
  createMetadataRouting,
  parseProjectLevel,
  parseAgentSupport,
  extractMetadataFromHeader,
} from './metadata-routing';

// Re-export common types for convenience
export type {
  Agent,
  AgentRole,
  AgentStatus,
  Session,
  SessionState,
  Task,
  TaskType,
  TaskPriority,
  Tool,
  ToolHandler,
  OwnershipRule,
  OwnershipCheck,
  AgentState,
  AgentEvent,
  AgentEventType,
} from './types';
