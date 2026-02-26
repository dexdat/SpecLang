# speclang-header lines:5
# id: @specs/ui-dashboard
# version: 1.0.0
# layer: 5

/**
 * MainContent component - displays dashboard content area
 * Generated from: @implementation/ui-dashboard
 */

import React from 'react';
import type { CascadeState, AgentStatus, FileWatcherStatus } from '../types';

interface MainContentProps {
  cascadeState?: CascadeState;
  agents?: AgentStatus[];
  fileWatcher?: FileWatcherStatus;
  activeView?: string;
}

const AgentCard: React.FC<{ agent: AgentStatus }> = ({ agent }) => {
  const statusColor = {
    active: 'text-green-400',
    idle: 'text-gray-400',
    error: 'text-red-400',
  }[agent.status];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm">{agent.name}</span>
        <span className={`text-xs ${statusColor}`}>{agent.status}</span>
      </div>
      <div className="text-xs text-gray-500">
        Tasks: {agent.tasksCompleted}
      </div>
    </div>
  );
};

const StatusCard: React.FC<{
  title: string;
  value: string | number;
  status?: 'success' | 'warning' | 'error' | 'info';
}> = ({ title, value, status = 'info' }) => {
  const statusColors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded p-4">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className={`text-2xl font-mono ${statusColors[status]}`}>{value}</div>
    </div>
  );
};

const FileWatcherCard: React.FC<{ status: FileWatcherStatus }> = ({ status }) => (
  <div className="bg-gray-900 border border-gray-800 rounded p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="font-mono text-sm">File Watcher</span>
      <span className={`text-xs ${status.isWatching ? 'text-green-400' : 'text-gray-400'}`}>
        {status.isWatching ? 'Watching' : 'Stopped'}
      </span>
    </div>
    <div className="text-xs text-gray-500">
      <div>Files Monitored: {status.filesMonitored}</div>
      {status.lastChange && (
        <div>Last Change: {status.lastChange.toLocaleTimeString()}</div>
      )}
    </div>
  </div>
);

export const MainContent: React.FC<MainContentProps> = ({
  cascadeState,
  agents = [],
  fileWatcher,
  activeView = 'overview',
}) => {
  const renderOverview = () => (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-mono mb-4">System Status</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatusCard
            title="Queue Depth"
            value={cascadeState?.queueDepth ?? 0}
            status={cascadeState?.queueDepth === 0 ? 'success' : 'warning'}
          />
          <StatusCard
            title="Convergence Time"
            value={`${cascadeState?.convergenceTimer ?? 0}s`}
            status="info"
          />
          <StatusCard
            title="Active Agents"
            value={agents.filter((a) => a.status === 'active').length}
            status="info"
          />
          <StatusCard
            title="Files Watched"
            value={fileWatcher?.filesMonitored ?? 0}
            status="info"
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-mono mb-4">Agents</h2>
        <div className="grid grid-cols-3 gap-4">
          {agents.length > 0 ? (
            agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
          ) : (
            <div className="text-gray-500 text-sm">No agents running</div>
          )}
        </div>
      </section>

      {fileWatcher && (
        <section>
          <h2 className="text-lg font-mono mb-4">File Watcher</h2>
          <FileWatcherCard status={fileWatcher} />
        </section>
      )}
    </div>
  );

  const renderCascade = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-mono">Cascade Status</h2>
      <div className="bg-gray-900 border border-gray-800 rounded p-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-4 h-4 rounded-full ${
              cascadeState?.status === 'running'
                ? 'bg-green-500 animate-pulse'
                : cascadeState?.status === 'converged'
                  ? 'bg-blue-500'
                  : cascadeState?.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
            }`}
          />
          <span className="font-mono capitalize">{cascadeState?.status ?? 'idle'}</span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'cascade':
        return renderCascade();
      case 'agents':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-mono">Agents</h2>
            <div className="grid grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <main className="ml-64 mt-16 p-6 bg-black min-h-screen">
      <div className="max-w-7xl mx-auto">{renderContent()}</div>
    </main>
  );
};

export default MainContent;
