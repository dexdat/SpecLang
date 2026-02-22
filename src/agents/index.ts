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
} from './tools';

// State persistence
export { StateManager, createStateManager } from './state';

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
