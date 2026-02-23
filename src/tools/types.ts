/**
 * SPECLANG-GENERATED: Tool Types
 * Source: @speclang/tools
 * 
 * Type definitions for the Agent Tools API
 */

// ============================================================================
// CORE TOOL TYPES
// ============================================================================

/** JSON Schema for tool input validation */
export interface JSONSchema {
  type: string;
  description?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  [key: string]: any;
}

/** Tool handler function signature */
export type ToolHandler<I = any, O = any> = (
  input: I, 
  context: ToolContext
) => Promise<ToolResult<O>>;

/** Tool context provided to all handlers */
export interface ToolContext {
  sessionId: string;
  agentRole: string;
  owns: string[];
  workingDirectory: string;
  // Optional injected dependencies
  db?: any;
  index?: any;
  ownership?: any;
  daemon?: any;
  sessionManager?: any;
}

/** Tool result returned by all handlers */
export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  sideEffects?: string[];
  warnings?: string[];
}

/** Tool metadata for listing */
export interface ToolMetadata {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  requiresOwnership?: boolean;
  auditLog?: boolean;
  category?: string;
}

/** Complete tool definition */
export interface Tool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler<TInput, TOutput>;
  requiresOwnership?: boolean;
  auditLog?: boolean;
  category?: string;
}

// ============================================================================
// TOOL REGISTRY TYPES
// ============================================================================

/** Ownership checker interface */
export interface OwnershipChecker {
  canWrite(agentId: string, agentRole: string, filepath: string): OwnershipCheck;
  canRead(agentId: string, filepath: string): OwnershipCheck;
  getOwner(filepath: string): string | null;
}

/** Ownership check result */
export interface OwnershipCheck {
  allowed: boolean;
  owner?: string;
  reason?: string;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errors?: string[];
}

// ============================================================================
// INPUT/OUTPUT TYPES FOR TOOLS
// ============================================================================

// File Tools
export interface CreateSpecInput {
  path: string;
  header: Record<string, any>;
  content: string;
}

export interface CreateSpecOutput {
  path: string;
}

export interface ReadFileInput {
  path: string;
}

export interface ReadFileOutput {
  content: string;
  header?: Record<string, any>;
}

export interface ReadHeaderInput {
  path: string;
}

export interface ReadHeaderOutput {
  header: Record<string, any>;
  headerLines: number;
}

export interface UpdateSpecInput {
  path: string;
  header?: Record<string, any>;
  content?: string;
  append?: boolean;
}

export interface UpdateSpecOutput {
  path: string;
}

export interface DeleteSpecInput {
  path: string;
}

export interface DeleteSpecOutput {
  dependents: string[];
}

// Query Tools
export interface FindDependentsInput {
  id: string;
}

export interface FindDependentsOutput {
  dependents: Array<{ path: string; id: string; layer: number }>;
}

export interface FindDependenciesInput {
  path: string;
}

export interface FindDependenciesOutput {
  dependencies: Array<{ path: string | null; id: string; resolved: boolean }>;
}

export interface FindByTagInput {
  tag: string;
  layer?: number;
}

export interface FindByTagOutput {
  specs: Array<{ path: string; id: string; short: string }>;
}

export interface FindByLevelInput {
  level: number;
  parent?: string;
}

export interface FindByLevelOutput {
  specs: Array<{ path: string; id: string; short: string }>;
}

export interface GetTreeInput {
  path: string;
  depth?: number;
}

export interface GetTreeOutput {
  tree: {
    path: string;
    id: string;
    parent: any;
    children: any[];
  };
}

// Graph Tools
export interface GraphDependentsInput {
  id: string;
  max_depth?: number;
}

export interface GraphDependentsOutput {
  graph: {
    nodes: Array<{ id: string; path: string; layer: number }>;
    edges: Array<{ from: string; to: string }>;
  };
}

export interface GraphAncestorsInput {
  path: string;
}

export interface GraphAncestorsOutput {
  ancestors: Array<{ path: string; id: string; level: number }>;
}

// Validation Tools
export interface ValidateHeaderInput {
  header: Record<string, any>;
}

export interface ValidateHeaderOutput {
  errors: string[];
  warnings: string[];
}

export interface ValidateRefsInput {
  path: string;
}

export interface ValidateRefsOutput {
  broken_refs: string[];
}

// Cascade Tools
export interface TriggerCascadeInput {
  path: string;
}

export interface TriggerCascadeOutput {
  cascade_id: string;
  status: string;
}

export interface CascadeStatusInput {}

export interface CascadeStatusOutput {
  active: boolean;
  depth: number;
  files_changed: number;
  last_change: number | null;
}

// Git Tools
export interface GitCommitInput {
  files: string[];
  message: string;
}

export interface GitCommitOutput {
  commit_hash: string;
}

export interface GitStatusInput {}

export interface GitStatusOutput {
  modified: string[];
  added: string[];
  deleted: string[];
}

// Session Tools
export interface SessionInfoInput {}

export interface SessionInfoOutput {
  session_id: string;
  agent: string;
  owns: string[];
  status: string;
}

export interface SessionsListInput {}

export interface SessionsListOutput {
  sessions: Array<{
    id: string;
    agent: string;
    status: string;
    current_file: string | null;
  }>;
}

// Pipeline Tools
export interface RunPipelineInput {
  name: string;
  input?: Record<string, any>;
}

export interface RunPipelineOutput {
  pipeline_id: string;
  status: string;
  result?: any;
}

export interface PipelineStatusInput {
  pipeline_id: string;
}

export interface PipelineStatusOutput {
  status: string;
  progress?: number;
  result?: any;
  error?: string;
}
