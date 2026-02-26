/**
 * TypeScript types for the SpecLang UI Dashboard
 * Generated from: @implementation/ui-dashboard
 */

export interface CascadeState {
  status: 'idle' | 'running' | 'converged' | 'error';
  queueDepth: number;
  convergenceTimer: number;
  lastUpdate: Date;
  agents: AgentStatus[];
  fileWatcher: FileWatcherStatus;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  tasksCompleted: number;
  lastActivity: Date;
}

export interface FileWatcherStatus {
  isWatching: boolean;
  filesMonitored: number;
  lastChange: Date | null;
}

export interface DashboardConfig {
  refreshInterval: number;
  mcpServerUrl: string;
  enableSSE: boolean;
}

export interface SSEMessage {
  type: 'cascade_update' | 'agent_update' | 'file_change' | 'error';
  payload: unknown;
  timestamp: Date;
}
