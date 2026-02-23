/**
 * Type definitions for speclangd daemon simulation
 * 
 * Generated from: @speclang/daemon
 */

// File Events
export enum FileEventKind {
  Create = 'create',
  Modify = 'modify',
  Delete = 'delete',
  Rename = 'rename',
}

export interface FileEvent {
  kind: FileEventKind;
  path: string;
  oldPath?: string;  // For rename events
  timestamp: number;
}

// Agent Tasks
export type AgentId = string;

export enum AgentTaskKind {
  SpecWriter = 'spec_writer',
  CodeGen = 'code_gen',
  TestWriter = 'test_writer',
  BackSync = 'back_sync',
}

export interface AgentTask {
  kind: AgentTaskKind;
  trigger: string;
  spec?: string;
  target?: string;
  code?: string;
}

// Router types
export interface RouteRule {
  pattern: RegExp;
  agent: AgentId;
  taskKind: AgentTaskKind;
}

// Daemon Status
export enum DaemonStatusKind {
  Idle = 'idle',
  Cascading = 'cascading',
  Converged = 'converged',
  Paused = 'paused',
  Error = 'error',
}

export interface DaemonStatus {
  status: DaemonStatusKind;
  cascadeDepth: number;
  filesChanged: number;
  activeAgents: number;
  startedAt: number;
  lastEventAt?: number;
  quietSince?: number;
  error?: string;
}

// Daemon Commands (IPC)
export enum DaemonCommandKind {
  Status = 'status',
  Pause = 'pause',
  Resume = 'resume',
  Abort = 'abort',
  Trigger = 'trigger',
  Converge = 'converge',
}

export interface DaemonCommand {
  kind: DaemonCommandKind;
  path?: string;
}

// Agent communication
export interface AgentNotification {
  event: FileEvent;
  task: AgentTask;
  timestamp: number;
}

export interface AgentResponse {
  accepted: boolean;
  agent: AgentId;
  message?: string;
}

// Lock management
export interface Lock {
  agentId: string;
  file: string;
  acquiredAt: number;
  expiresAt: number;
  contentHash?: string;
}

// Convergence result
export interface ConvergenceResult {
  converged: boolean;
  filesChanged: number;
  duration: number;
  cascadeDepth: number;
  timestamp: number;
}

// Configuration types
export interface DaemonConfig {
  watch: {
    paths: string[];
    ignore: string[];
    debounce?: number;  // ms
  };
  convergence: {
    quietPeriod: number;  // seconds
    maxDepth: number;
  };
  agentApi: {
    port: number;
    host: string;
  };
  locks: {
    dir: string;
    timeout: number;  // seconds
  };
  logging: {
    level: string;
    file: string;
  };
}
