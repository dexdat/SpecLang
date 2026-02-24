/**
 * Type definitions for Agent Session Manager
 * 
 * Generated from: @speclang/agent-protocol
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

/** Agent roles in the system */
export type AgentRole = 
  | 'north-star'    // User intent coordinator
  | 'spec-writer'   // Expands specs
  | 'code-gen'      // Generates code
  | 'test-writer'   // Writes tests
  | 'back-sync'     // Syncs code changes back
  | 'pipeline';     // Executes build/test/deploy

/** Agent status */
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error';

/** Agent interface */
export interface Agent {
  id: string;
  role: AgentRole;
  owns: string[];           // File patterns this agent owns
  depends_on: string[];     // Files this agent watches
  status: AgentStatus;
  last_activity: Date;
  session_id?: string;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/** Session status for lifecycle management */
export type SessionStatus = 
  | 'created'   // Just spawned
  | 'idle'      // Registered, waiting
  | 'active'    // Processing work
  | 'paused'    // Paused by user
  | 'done'      // Converged
  | 'error';    // Failed

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
  workingOn: string | null;  // Current file being processed
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

// ============================================================================
// TASK TYPES
// ============================================================================

/** Task types */
export type TaskType = 
  | 'react'           // React to file change
  | 'expand'          // Expand a spec
  | 'generate'        // Generate code
  | 'write-test'      // Write tests
  | 'back-sync';      // Sync changes back

/** Task priority */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Task interface */
export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  trigger: string;         // File that triggered this task
  status: 'pending' | 'running' | 'completed' | 'failed';
  created: Date;
  started?: Date;
  completed?: Date;
  result?: any;
  error?: string;
}

// ============================================================================
// TOOL TYPES
// ============================================================================

/** Tool interface */
export interface Tool {
  name: string;
  description: string;
  input_schema: object;
  handler: ToolHandler;
}

// Forward declaration for ToolContext
export interface ToolContext {
  session: Session;
  ownership: any;  // OwnershipRegistry - defined in ownership.ts to avoid circular deps
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

// ============================================================================
// OWNERSHIP TYPES
// ============================================================================

/** Ownership rule */
export interface OwnershipRule {
  agent: AgentRole;
  patterns: string[];      // Glob patterns
  priority: number;         // Higher wins on conflict
}

/** Ownership check result */
export interface OwnershipCheck {
  allowed: boolean;
  owner?: AgentRole;
  reason?: string;
}

// ============================================================================
// STATE TYPES
// ============================================================================

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

// ============================================================================
// EVENT TYPES
// ============================================================================

/** Agent events */
export type AgentEventType = 
  | 'session-created'
  | 'session-ended'
  | 'task-queued'
  | 'task-started'
  | 'task-completed'
  | 'task-failed'
  | 'ownership-changed'
  | 'error';

/** Agent event */
export interface AgentEvent {
  type: AgentEventType;
  session_id?: string;
  agent_id?: string;
  task_id?: string;
  data?: any;
  timestamp: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/** Default ownership rules */
export const DEFAULT_OWNERSHIP_RULES: OwnershipRule[] = [
  { agent: 'north-star', patterns: ['project.scl'], priority: 100 },
  { agent: 'spec-writer', patterns: ['specs/**/*.scl', 'specs/**/*.spec.*'], priority: 50 },
  { agent: 'code-gen', patterns: ['src/**/*.{ts,js,go,py,rs,java}'], priority: 40 },
  { agent: 'test-writer', patterns: ['tests/**/*'], priority: 30 },
  { agent: 'back-sync', patterns: ['generated/**/*', 'src/**/*.{ts,js,go,py,rs,java}'], priority: 20 },
  { agent: 'pipeline', patterns: ['.github/**/*', 'Dockerfile*', '*.yml', '*.yaml'], priority: 10 },
];

/** Agent role to display name */
export const AGENT_DISPLAY_NAMES: Record<AgentRole, string> = {
  'north-star': 'North Star',
  'spec-writer': 'Spec Writer',
  'code-gen': 'Code Generator',
  'test-writer': 'Test Writer',
  'back-sync': 'Back Sync',
  'pipeline': 'Pipeline',
};

/** Agent role descriptions */
export const AGENT_DESCRIPTIONS: Record<AgentRole, string> = {
  'north-star': 'Coordinates overall project direction and intent',
  'spec-writer': 'Expands high-level specs into detailed specifications',
  'code-gen': 'Generates implementation code from specs',
  'test-writer': 'Writes and maintains test specifications',
  'back-sync': 'Synchronizes code changes back to specs',
  'pipeline': 'Executes build, test, and deployment workflows',
};

// ============================================================================
// ERROR TYPES
// ============================================================================

/** Agent error types */
export type AgentErrorType = 
  | 'AccessDenied'      // Tried to write non-owned file
  | 'LockTimeout'       // Couldn't acquire lock
  | 'SessionNotFound'   // Invalid session ID
  | 'AgentTimeout';     // Agent didn't respond

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

// ============================================================================
// CONCURRENCY TYPES
// ============================================================================

/** Concurrency configuration */
export interface ConcurrencyConfig {
  maxConcurrentAgents: number;
  maxFileChangesPerCascade: number;
  lockTimeoutMs: number;
  agentIdleTimeoutMs: number;
}

/** Default concurrency limits */
export const DEFAULT_CONCURRENCY_CONFIG: ConcurrencyConfig = {
  maxConcurrentAgents: 50,
  maxFileChangesPerCascade: 100,
  lockTimeoutMs: 5000,
  agentIdleTimeoutMs: 60000,
};

// ============================================================================
// METADATA ROUTING TYPES
// ============================================================================

/** Project maturity levels */
export type ProjectLevel = 
  | 'POC' 
  | 'MVP' 
  | 'Alpha' 
  | 'Beta' 
  | 'Production' 
  | 'Startup' 
  | 'SMB' 
  | 'MSB' 
  | 'Enterprise';

/** Agent support levels */
export type AgentSupportLevel = 
  | 'human_only' 
  | 'agent_assisted' 
  | 'agent_autonomous';

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
