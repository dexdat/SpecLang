/**
 * SPECLANG-GENERATED: MCP Server Types
 * Source: @speclang/mcp
 */

import type { SpecLangDB } from '../db/index.js';

// ============================================================================
// MCP SERVER TYPES
// ============================================================================

/** MCP server configuration */
export interface MCPServerConfig {
  port: number;
  host: string;
  database: string;
  databaseWalMode?: boolean;
  serverMode?: 'stdio' | 'http' | 'socket';
  specsDir: string;
  auth: MCPAuthConfig;
  sse: MCPSSEConfig;
  logging?: MCPLoggingConfig;
  limits?: MCPLimitsConfig;
}

/** Authentication configuration */
export interface MCPAuthConfig {
  enabled: boolean;
  type: 'none' | 'basic' | 'token' | 'config_file' | 'tls_client_cert';
  apiKeys?: string[];
  user?: string;
  pass?: string;
  token?: string;
  configPath?: string;
  tlsCertPath?: string;
}

/** User entry for config_file auth */
export interface MCPAuthUser {
  user: string;
  hash: string;
  permissions: string[];
}

/** Config file auth users */
export interface MCPAuthUsersConfig {
  users: MCPAuthUser[];
}

/** SSE configuration */
export interface MCPSSEConfig {
  enabled: boolean;
  heartbeatInterval: number;
}

/** Logging configuration */
export interface MCPLoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
}

/** Limits configuration */
export interface MCPLimitsConfig {
  maxConnections: number;
  queryTimeoutMs: number;
  maxResults: number;
}

/** MCP tool definition */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  returns?: Record<string, unknown>;
}

/** Search tool input */
export interface SearchInput {
  query: string;
  tags?: string[];
  layer?: number;
  limit?: number;
}

/** Search result */
export interface SearchResult {
  id: string;
  file: string;
  score: number;
  snippet: string;
}

/** Spec metadata for MCP responses */
export interface MCPSpecMetadata {
  id: string;
  file_path: string;
  version?: string;
  layer?: number;
  tags: string[];
  short_desc?: string;
  depends_on: string[];
  created_at?: number;
  updated_at?: number;
}

/** Get spec input */
export interface GetSpecInput {
  id?: string;
  file_path?: string;
  include_content?: boolean;
}

/** Create spec input */
export interface CreateSpecInput {
  id: string;
  content: string;
  agent_id?: string;
  file_path?: string;
}

/** Update spec input */
export interface UpdateSpecInput {
  id: string;
  content: string;
  message?: string;
  agent_id?: string;
}

/** List specs input */
export interface ListSpecsInput {
  tags?: string[];
  layer?: number;
  prefix?: string;
  limit?: number;
}

/** Lock input */
export interface LockInput {
  resource: string;
  agent_id: string;
  ttl?: number;
}

/** Unlock input */
export interface UnlockInput {
  lock_id: string;
  agent_id: string;
}

/** Cascade status */
export interface CascadeStatus {
  status: 'idle' | 'cascading' | 'converged';
  depth?: number;
  files_changed?: string[];
  active_agents?: string[];
  time_elapsed?: number;
}

/** Cascade trigger input */
export interface CascadeTriggerInput {
  spec_id: string;
  change_type: 'create' | 'modify' | 'delete';
}

/** Dependencies input */
export interface DependenciesInput {
  id: string;
  transitive?: boolean;
}

/** Impact analysis result */
export interface ImpactResult {
  direct_impact: string[];
  transitive_impact: string[];
  files_affected: string[];
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Index refresh result */
export interface IndexRefreshResult {
  specs_indexed: number;
  refs_found: number;
  errors: string[];
}

// ============================================================================
// SSE EVENT TYPES
// ============================================================================

/** SSE event types */
export type SSEEventType = 
  | 'file.changed'
  | 'agent.spawned'
  | 'agent.completed'
  | 'cascade.converged'
  | 'command.executed'
  | 'cascade.progress'
  | 'lock.acquired'
  | 'lock.released';

/** SSE event */
export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

/** File change event data */
export interface FileChangeEventData {
  path: string;
  kind: 'create' | 'modify' | 'delete';
  cascade_id?: string;
  agent_id?: string;
}

/** Cascade progress event data */
export interface CascadeProgressEventData {
  cascade_id: string;
  depth: number;
  agent: string;
  action: string;
}

/** Agent activity event data */
export interface AgentActivityEventData {
  agent_id: string;
  role: string;
  status: 'spawned' | 'active' | 'completed' | 'failed';
  working_on?: string;
}

/** Convergence event data */
export interface ConvergenceEventData {
  cascade_id: string;
  files_changed: string[];
  duration: number;
}

/** Command executed event data */
export interface CommandEventData {
  command_id: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  target?: string;
}

/** Command input */
export interface CommandInput {
  cascade_id: string;
  action: string;
  target_file?: string;
  session_id?: string;
  payload?: Record<string, unknown>;
  priority?: number;
}

/** Command from queue */
export interface QueuedCommand {
  command_id: string;
  cascade_id: string;
  action: string;
  target_file: string | null;
  session_id: string | null;
  payload: Record<string, unknown> | null;
  priority: number;
  status: string;
  created_at: number;
  updated_at: number;
}

/** Query commands input */
export interface QueryCommandsInput {
  status?: string;
  limit?: number;
  cascade_id?: string;
  session_id?: string;
}

/** Status result */
export interface StatusResult {
  active_sessions: number;
  queue_depth: number;
  converged: boolean;
  cascade_depth: number | null;
  last_build: number | null;
}

/** Default server configuration */
export const DEFAULT_MCP_CONFIG: MCPServerConfig = {
  port: 3000,
  host: '0.0.0.0',
  database: '.speclang/speclang.db',
  databaseWalMode: true,
  serverMode: 'http',
  specsDir: 'specs',
  auth: {
    enabled: false,
    type: 'none'
  },
  sse: {
    enabled: true,
    heartbeatInterval: 30000
  },
  logging: {
    level: 'info'
  },
  limits: {
    maxConnections: 100,
    queryTimeoutMs: 5000,
    maxResults: 1000
  }
};
