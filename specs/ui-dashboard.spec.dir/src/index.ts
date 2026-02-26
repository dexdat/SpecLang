/**
speclang-header lines:5
id: @specs/ui-dashboard
version: 1.0.0
layer: 5
 */

/**
 * UI Dashboard main exports
 * Generated from: @implementation/ui-dashboard
 */

// Components
export { SystemDashboard, default as SystemDashboardDefault } from './components/SystemDashboard';
export { DashboardHeader, default as DashboardHeaderDefault } from './components/DashboardHeader';
export { Sidebar, default as SidebarDefault } from './components/Sidebar';
export { MainContent, default as MainContentDefault } from './components/MainContent';
export { CascadeIndicator, default as CascadeIndicatorDefault } from './components/CascadeIndicator';

// Hooks
export {
  useCascadeStatus,
  useAgentStatus,
  useFileWatcherStatus,
} from './hooks/useCascadeStatus';

// Types
export type {
  CascadeState,
  AgentStatus,
  FileWatcherStatus,
  DashboardConfig,
  SSEMessage,
} from './types';
