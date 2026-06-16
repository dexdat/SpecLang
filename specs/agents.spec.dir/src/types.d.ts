/**
 * Type definitions for Agent Session Manager
 *
 * Generated from: @speclang/agent-protocol
 */
/** Agent roles in the system */
export type AgentRole = 'north-star' | 'spec-writer' | 'code-gen' | 'test-writer' | 'back-sync' | 'pipeline';
/** Agent status */
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error';
/** Agent interface */
export interface Agent {
    id: string;
    role: AgentRole;
    owns: string[];
    depends_on: string[];
    status: AgentStatus;
    last_activity: Date;
    session_id?: string;
}
/** Session status for lifecycle management */
export type SessionStatus = 'created' | 'idle' | 'active' | 'paused' | 'done' | 'error';
/** Agent session interface (for lifecycle management) */
export interface AgentSession {
    id: string;
    agent: AgentRole;
    owns: string[];
    created: Date;
    last_active: Date;
    status: SessionStatus;
    cascade_id?: string;
    current_task?: string;
    completed_tasks: string[];
    error?: AgentError;
}
/** Transition result from lifecycle state machine */
export interface TransitionResult {
    success: boolean;
    previous?: SessionStatus;
    current?: SessionStatus;
    error?: string;
}
/** Session state */
export interface SessionState {
    workingOn: string | null;
    pendingTasks: Task[];
    completedTasks: Task[];
    errors: Error[];
}
/** Session interface */
export interface Session {
    id: string;
    agent: Agent;
    created: Date;
    state: SessionState;
    tools: ToolRegistry;
}
/** Task types */
export type TaskType = 'react' | 'expand' | 'generate' | 'write-test' | 'back-sync';
/** Task priority */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
/** Task interface */
export interface Task {
    id: string;
    type: TaskType;
    priority: TaskPriority;
    trigger: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    created: Date;
    started?: Date;
    completed?: Date;
    result?: any;
    error?: string;
}
/** Tool interface */
export interface Tool {
    name: string;
    description: string;
    input_schema: object;
    handler: ToolHandler;
}
export interface ToolContext {
    session: Session;
    ownership: any;
    index?: any;
}
/** Tool handler function */
export type ToolHandler = (input: any, context: ToolContext) => Promise<any>;
/** Tool registry */
export interface ToolRegistry {
    get(name: string): Tool | undefined;
    list(): Tool[];
    register(tool: Tool): void;
}
/** Ownership rule */
export interface OwnershipRule {
    agent: AgentRole;
    patterns: string[];
    priority: number;
}
/** Ownership check result */
export interface OwnershipCheck {
    allowed: boolean;
    owner?: AgentRole;
    reason?: string;
}
/** Persisted agent state */
export interface AgentState {
    session_id: string;
    agent_role: AgentRole;
    working_on: string | null;
    pending_tasks: Task[];
    completed_tasks: Task[];
    errors: Error[];
    last_updated: number;
}
/** Agent events */
export type AgentEventType = 'session-created' | 'session-ended' | 'task-queued' | 'task-started' | 'task-completed' | 'task-failed' | 'ownership-changed' | 'error';
/** Agent event */
export interface AgentEvent {
    type: AgentEventType;
    session_id?: string;
    agent_id?: string;
    task_id?: string;
    data?: any;
    timestamp: number;
}
/** Default ownership rules */
export declare const DEFAULT_OWNERSHIP_RULES: OwnershipRule[];
/** Agent role to display name */
export declare const AGENT_DISPLAY_NAMES: Record<AgentRole, string>;
/** Agent role descriptions */
export declare const AGENT_DESCRIPTIONS: Record<AgentRole, string>;
/** Agent error types */
export type AgentErrorType = 'AccessDenied' | 'LockTimeout' | 'SessionNotFound' | 'AgentTimeout';
/** Agent error */
export interface AgentError {
    type: AgentErrorType;
    message: string;
    sessionId?: string;
    agentId?: string;
    file?: string;
    timestamp: Date;
    recoverable: boolean;
    retryCount?: number;
}
/** Error recovery options */
export interface ErrorRecovery {
    logError: (error: AgentError) => Promise<void>;
    notifyOrchestrator: (error: AgentError) => Promise<void>;
    retryWithBackoff: (error: AgentError, maxRetries: number) => Promise<boolean>;
    abortSession: (error: AgentError) => Promise<void>;
}
/** Concurrency configuration */
export interface ConcurrencyConfig {
    maxConcurrentAgents: number;
    maxFileChangesPerCascade: number;
    lockTimeoutMs: number;
    agentIdleTimeoutMs: number;
}
/** Default concurrency limits */
export declare const DEFAULT_CONCURRENCY_CONFIG: ConcurrencyConfig;
/** Project maturity levels */
export type ProjectLevel = 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Production' | 'Startup' | 'SMB' | 'MSB' | 'Enterprise';
/** Agent support levels */
export type AgentSupportLevel = 'human_only' | 'agent_assisted' | 'agent_autonomous';
/** Spec metadata for routing */
export interface SpecMetadata {
    id: string;
    project_level: ProjectLevel;
    agent_support: AgentSupportLevel;
    layer: number;
    tags?: string[];
}
/** Metadata-based routing rules */
export interface MetadataRouting {
    checkPermissions: (metadata: SpecMetadata, action: 'read' | 'write' | 'deploy') => boolean;
    getInteractionStyle: (metadata: SpecMetadata) => 'autonomous' | 'assisted' | 'human_required';
    shouldRequestApproval: (metadata: SpecMetadata) => boolean;
    getResourceAllocation: (metadata: SpecMetadata) => number;
    getPriority: (metadata: SpecMetadata) => 'low' | 'normal' | 'high' | 'urgent';
}
/** Ownership transfer during maturity transitions */
export interface OwnershipTransfer {
    fromAgent: AgentRole;
    toAgent: AgentRole;
    files: string[];
    metadata: SpecMetadata;
    timestamp: Date;
}
//# sourceMappingURL=types.d.ts.map