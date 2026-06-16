// SPECLANG-GENERATED: @speclang/cascade/triggers
// This file implements the reactive trigger system for cascade reactions

/**
 * Trigger source types - what initiates a cascade
 */
export type TriggerSource = 
  | 'user_edit'     // Human or orchestrator edits
  | 'agent_write'   // Agent writes its owned file
  | 'external';     // Git pull, file sync

/**
 * Trigger priority levels
 */
export type TriggerPriority = 'high' | 'normal' | 'low';

/**
 * File change kinds
 */
export type FileChangeKind = 'create' | 'modify' | 'delete';

/**
 * Core trigger interface - what starts a cascade
 */
export interface Trigger {
  id: string;
  source: TriggerSource;
  file: string;
  kind: FileChangeKind;
  timestamp: Date;
  priority: TriggerPriority;
  cascade_id?: string;
}

/**
 * Trigger source configuration
 */
export interface TriggerSourceConfig {
  source: TriggerSource;
  files: string[];           // File patterns
  priority: TriggerPriority;
  starts_cascade?: boolean;
  triggers?: string[];       // Agent types to trigger
}

/**
 * File event from watcher
 */
export interface FileEvent {
  path: string;
  kind: FileChangeKind;
  timestamp: Date;
}

/**
 * Cascade state
 */
export interface CascadeState {
  id: string;
  depth: number;
  started_at: Date;
  last_activity: Date;
  max_depth: number;
  max_files: number;
  max_duration_ms: number;
  status: 'running' | 'paused' | 'converged' | 'aborted';
}

/**
 * Agent registry interface for routing
 */
export interface AgentRegistry {
  getAgentsForFile(filePath: string): string[];
  getAgentByName(name: string): AgentInfo | null;
  listAgents(): AgentInfo[];
}

/**
 * Agent information
 */
export interface AgentInfo {
  name: string;
  owned_files: string[];
  triggers: string[];
}

/**
 * Trigger routing result
 */
export interface RoutingResult {
  agents: string[];
  priority: TriggerPriority;
  starts_cascade: boolean;
}

/**
 * Handler result
 */
export interface HandlerResult {
  handled: boolean;
  cascadeStarted?: string;
  agentsInvoked?: string[];
  error?: string;
}

/**
 * Watch configuration
 */
export interface WatchConfig {
  watch_patterns: string[];
  ignore_patterns: string[];
  debounce_ms: number;
}
