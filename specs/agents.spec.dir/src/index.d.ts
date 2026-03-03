/**
 * SPECLANG-GENERATED: Agent Session Manager - Main exports
 * Source: @speclang/agent-protocol @block:protocol/overview
 *
 * This is the main entry point for the Agent Session Manager.
 * It provides session management, ownership tracking, and tools for AI agents.
 */
export * from './types';
export { SessionManager, createSessionManager } from './session';
export { OwnershipRegistry, createOwnershipRegistry } from './ownership';
export { AgentRegistry, createAgentRegistry } from './registry';
export { SimpleToolRegistry, createToolRegistry, getStandardTools } from './tools';
export { readSpecHandler, writeSpecHandler, searchSpecsHandler, readFileHandler, writeFileHandler, listFilesHandler, getDependenciesHandler, getDependentsHandler, impactAnalysisHandler, triggerCascadeHandler, cascadeStatusHandler, createSpecFileHandler, commitHandler, } from './tools';
export { StateManager, createStateManager } from './state';
export { SessionLifecycle } from './lifecycle';
export { WriteInterceptor, createWriteInterceptor, initGuard, getGuard, resetGuard, checkOwnership, interceptWrite, getFileOwner, getViolations, getGuardStats, type InterceptorConfig, type WriteAttempt, } from './interceptor';
export { DEFAULT_RULES, ORCHESTRATOR_RULE, isExemptFromGuard, getAgentPriority, validateRules, createRule, mergeRules, getRulesForAgent, type ValidationResult, } from './rules';
export { ViolationTracker, createViolationTracker, type Violation, type ViolationStats, } from './violations';
export { SessionApiServer, createSessionApiServer } from './session-api';
export { createMetadataRouting, parseProjectLevel, parseAgentSupport, extractMetadataFromHeader, } from './metadata-routing';
export type { Agent, AgentRole, AgentStatus, Session, SessionState, Task, TaskType, TaskPriority, Tool, ToolHandler, OwnershipRule, OwnershipCheck, AgentState, AgentEvent, AgentEventType, } from './types';
//# sourceMappingURL=index.d.ts.map