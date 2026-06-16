# Bootstrap Phase 6.4: Individual UI Components

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.4 of the bootstrap process.

**Prerequisites**: 
- Phase 6.1-6.3 (UI Dashboard, Components, State) complete
- UI visual design defined
- Component patterns established

## Your Task
Implement individual UI components for the SpecLang dashboard, including agent health grid, cascade graph, control panel, log viewer, and other visualization components.

## Read These Specs First
1. `specs/ui.spec.dir/components/agent-health.spec.md` - Agent health grid
2. `specs/ui.spec.dir/components/cascade-graph.spec.md` - Cascade visualization
3. `specs/ui.spec.dir/components/control-panel.spec.md` - Control panel
4. `specs/ui.spec.dir/components/log-viewer.spec.md` - Log viewer
5. `specs/ui.spec.dir/components/*.spec.md` - Other components

## What to Build

### Files to Create
```
src/ui/components/
├── index.ts                    # Component exports
├── agent-health-grid.tsx       # Agent status cards
├── cascade-graph.tsx           # Cascade visualization
├── control-panel.tsx           # Action controls
├── log-viewer.tsx              # Log display
├── queue-depth.tsx             # Queue visualization
├── event-timeline.tsx          # Event history
├── system-metrics.tsx          # System stats
├── cascade-status.tsx          # Cascade progress

tests/ui/components/
└── components.test.tsx
```

### Requirements

#### 1. Agent Health Grid

```tsx
// src/ui/components/agent-health-grid.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';

export interface AgentStatus {
  id: string;
  type: 'spec-writer' | 'code-gen' | 'test-writer' | 'north-star';
  status: 'idle' | 'active' | 'error' | 'paused';
  currentFile: string | null;
  queueDepth: number;
  uptimeSeconds: number;
  lastActive: string;
  performance: {
    processingTimeAvg: number;
    successRate: number;
    errorCount: number;
  };
  sessionId: string;
}

export interface AgentHealthGridProps {
  agents: AgentStatus[];
  agentTypes: string[];
  filterByType: string | null;
  filterByStatus: string[] | null;
  searchQuery: string;
  onAgentClick: (agentId: string) => void;
  onRestartAgent: (agentId: string) => Promise<void>;
  onPauseAgent: (agentId: string) => Promise<void>;
  onDebugAgent: (agentId: string) => void;
  onFilterChange: (filters: AgentFilters) => void;
  autoRefresh: boolean;
  refreshInterval: number;
  showHeatmap: boolean;
  compactView: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface AgentFilters {
  type: string | null;
  status: string[] | null;
  search: string;
}

export const AgentHealthGrid: React.FC<AgentHealthGridProps> = ({
  agents,
  agentTypes,
  filterByType,
  filterByStatus,
  searchQuery,
  onAgentClick,
  onRestartAgent,
  onPauseAgent,
  onDebugAgent,
  onFilterChange,
  autoRefresh,
  refreshInterval,
  showHeatmap,
  compactView,
  isLoading,
  error,
}) => {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof AgentStatus>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [restartingAgents, setRestartingAgents] = useState<Set<string>>(new Set());
  
  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = [...agents];
    
    if (filterByType) {
      result = result.filter(a => a.type === filterByType);
    }
    
    if (filterByStatus && filterByStatus.length > 0) {
      result = result.filter(a => filterByStatus.includes(a.status));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.id.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query) ||
        (a.currentFile?.toLowerCase().includes(query) ?? false)
      );
    }
    
    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    
    return result;
  }, [agents, filterByType, filterByStatus, searchQuery, sortBy, sortDirection]);
  
  const handleRestart = useCallback(async (agentId: string) => {
    setRestartingAgents(prev => new Set(prev).add(agentId));
    try {
      await onRestartAgent(agentId);
    } finally {
      setRestartingAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  }, [onRestartAgent]);
  
  const getStatusColor = (status: AgentStatus['status']): string => {
    switch (status) {
      case 'active': return 'var(--color-accent)';
      case 'error': return 'var(--color-error)';
      case 'paused': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };
  
  if (error) {
    return (
      <div className="agent-health-grid error" role="alert">
        <p>Error loading agents: {error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <div 
      className="agent-health-grid"
      role="grid"
      aria-label="Agent health status"
    >
      <div className="grid-header">
        <div className="filters">
          <select
            value={filterByType || ''}
            onChange={(e) => onFilterChange({ 
              type: e.target.value || null, 
              status: filterByStatus, 
              search: searchQuery 
            })}
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {agentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onFilterChange({ 
              type: filterByType, 
              status: filterByStatus, 
              search: e.target.value 
            })}
            placeholder="Search agents..."
            aria-label="Search agents"
          />
        </div>
        
        <div className="sort-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as keyof AgentStatus)}
            aria-label="Sort by"
          >
            <option value="type">Type</option>
            <option value="status">Status</option>
            <option value="queueDepth">Queue Depth</option>
            <option value="uptimeSeconds">Uptime</option>
          </select>
          
          <button
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      
      <div className={`grid-container ${compactView ? 'compact' : ''}`}>
        {isLoading && agents.length === 0 ? (
          <div className="loading-skeleton">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="empty-state">
            No agents match the current filters
          </div>
        ) : (
          filteredAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isExpanded={expandedAgentId === agent.id}
              isRestarting={restartingAgents.has(agent.id)}
              statusColor={getStatusColor(agent.status)}
              onClick={() => setExpandedAgentId(
                expandedAgentId === agent.id ? null : agent.id
              )}
              onRestart={() => handleRestart(agent.id)}
              onPause={() => onPauseAgent(agent.id)}
              onDebug={() => onDebugAgent(agent.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Agent Card sub-component
interface AgentCardProps {
  agent: AgentStatus;
  isExpanded: boolean;
  isRestarting: boolean;
  statusColor: string;
  onClick: () => void;
  onRestart: () => void;
  onPause: () => void;
  onDebug: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isExpanded,
  isRestarting,
  statusColor,
  onClick,
  onRestart,
  onPause,
  onDebug,
}) => {
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  return (
    <div
      className={`agent-card ${agent.status} ${isExpanded ? 'expanded' : ''}`}
      style={{ borderColor: statusColor }}
      role="gridcell"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="card-header">
        <span className="agent-type">{agent.type.toUpperCase()}</span>
        <span className="status-indicator" style={{ backgroundColor: statusColor }} />
      </div>
      
      <div className="card-metrics">
        <div className="metric">
          <span className="label">QUEUE</span>
          <span className="value">{agent.queueDepth}</span>
        </div>
        <div className="metric">
          <span className="label">UPTIME</span>
          <span className="value">{formatUptime(agent.uptimeSeconds)}</span>
        </div>
      </div>
      
      {agent.currentFile && (
        <div className="current-file">
          {agent.currentFile}
        </div>
      )}
      
      {isExpanded && (
        <div className="card-details">
          <div className="performance">
            <div>Avg Time: {agent.performance.processingTimeAvg}ms</div>
            <div>Success: {(agent.performance.successRate * 100).toFixed(1)}%</div>
            <div>Errors: {agent.performance.errorCount}</div>
          </div>
          
          <div className="actions">
            <button
              onClick={(e) => { e.stopPropagation(); onRestart(); }}
              disabled={isRestarting}
            >
              {isRestarting ? 'Restarting...' : 'Restart'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPause(); }}>
              {agent.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDebug(); }}>
              Debug
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 2. Cascade Graph

```tsx
// src/ui/components/cascade-graph.tsx

import React, { useRef, useEffect, useState } from 'react';

export interface CascadeNode {
  id: string;
  type: 'spec' | 'file' | 'agent';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  label: string;
  layer?: number;
}

export interface CascadeEdge {
  source: string;
  target: string;
  type: 'dependency' | 'trigger';
}

export interface CascadeGraphProps {
  nodes: CascadeNode[];
  edges: CascadeEdge[];
  highlightPath?: string[];
  onNodeClick?: (nodeId: string) => void;
  zoomLevel: number;
  showLabels: boolean;
  layout: 'tree' | 'force' | 'radial';
}

export const CascadeGraph: React.FC<CascadeGraphProps> = ({
  nodes,
  edges,
  highlightPath = [],
  onNodeClick,
  zoomLevel,
  showLabels,
  layout,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  
  // Calculate node positions based on layout
  useEffect(() => {
    if (!svgRef.current) return;
    
    const { width, height } = svgRef.current.getBoundingClientRect();
    setDimensions({ width, height });
    
    const newPositions = new Map<string, { x: number; y: number }>();
    
    if (layout === 'tree') {
      // Tree layout: group by layer
      const layers = new Map<number, CascadeNode[]>();
      nodes.forEach(node => {
        const layer = node.layer ?? 0;
        if (!layers.has(layer)) layers.set(layer, []);
        layers.get(layer)!.push(node);
      });
      
      const layerWidth = width / Math.max(layers.size, 1);
      layers.forEach((layerNodes, layerIdx) => {
        const layerHeight = height / Math.max(layerNodes.length, 1);
        layerNodes.forEach((node, nodeIdx) => {
          newPositions.set(node.id, {
            x: layerIdx * layerWidth + layerWidth / 2,
            y: nodeIdx * layerHeight + layerHeight / 2,
          });
        });
      });
    } else if (layout === 'radial') {
      // Radial layout
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;
      
      nodes.forEach((node, idx) => {
        const angle = (2 * Math.PI * idx) / nodes.length;
        newPositions.set(node.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });
    } else {
      // Force layout (simplified)
      nodes.forEach((node, idx) => {
        newPositions.set(node.id, {
          x: (idx % 4) * (width / 4) + width / 8,
          y: Math.floor(idx / 4) * 100 + 50,
        });
      });
    }
    
    setPositions(newPositions);
  }, [nodes, layout, dimensions]);
  
  const getNodeColor = (status: CascadeNode['status']): string => {
    switch (status) {
      case 'completed': return 'var(--color-success)';
      case 'processing': return 'var(--color-accent)';
      case 'failed': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };
  
  const isInHighlightPath = (nodeId: string): boolean =>
    highlightPath.includes(nodeId);
  
  return (
    <div className="cascade-graph-container">
      <svg
        ref={svgRef}
        className="cascade-graph"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-text-muted)" />
          </marker>
        </defs>
        
        {/* Edges */}
        <g className="edges">
          {edges.map((edge, idx) => {
            const source = positions.get(edge.source);
            const target = positions.get(edge.target);
            if (!source || !target) return null;
            
            const isHighlighted = isInHighlightPath(edge.source) && isInHighlightPath(edge.target);
            
            return (
              <line
                key={`${edge.source}-${edge.target}-${idx}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? 'var(--color-accent)' : 'var(--color-text-muted)'}
                strokeWidth={isHighlighted ? 2 : 1}
                markerEnd="url(#arrowhead)"
                className={`edge ${edge.type}`}
              />
            );
          })}
        </g>
        
        {/* Nodes */}
        <g className="nodes">
          {nodes.map(node => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            
            const isHighlighted = isInHighlightPath(node.id);
            
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onNodeClick?.(node.id)}
                className={`node ${node.status} ${isHighlighted ? 'highlighted' : ''}`}
                style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
              >
                <circle
                  r={20}
                  fill={getNodeColor(node.status)}
                  stroke={isHighlighted ? 'var(--color-accent)' : 'transparent'}
                  strokeWidth={isHighlighted ? 3 : 0}
                />
                {showLabels && (
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fill="var(--color-text)"
                    fontSize="10"
                  >
                    {node.label.slice(0, 12)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      
      <div className="graph-legend">
        <div className="legend-item">
          <span className="dot completed" /> Completed
        </div>
        <div className="legend-item">
          <span className="dot processing" /> Processing
        </div>
        <div className="legend-item">
          <span className="dot pending" /> Pending
        </div>
        <div className="legend-item">
          <span className="dot failed" /> Failed
        </div>
      </div>
    </div>
  );
};
```

#### 3. Control Panel

```tsx
// src/ui/components/control-panel.tsx

import React, { useState, useCallback } from 'react';

export interface ControlPanelProps {
  cascadeActive: boolean;
  cascadeConverged: boolean;
  queueDepth: number;
  agentCount: number;
  onTriggerCascade: (options: TriggerOptions) => Promise<void>;
  onPauseCascade: () => Promise<void>;
  onResumeCascade: () => Promise<void>;
  onFinalizeCascade: () => Promise<void>;
  onStepCascade: () => Promise<void>;
  onAbortCascade: () => Promise<void>;
  onOpenSettings: () => void;
  availableTargets: string[];
  defaultTarget: string | null;
  confirmDestructiveActions: boolean;
  showAdvancedControls: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface TriggerOptions {
  targetFile?: string;
  force?: boolean;
  dryRun?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  cascadeActive,
  cascadeConverged,
  queueDepth,
  agentCount,
  onTriggerCascade,
  onPauseCascade,
  onResumeCascade,
  onFinalizeCascade,
  onStepCascade,
  onAbortCascade,
  onOpenSettings,
  availableTargets,
  defaultTarget,
  confirmDestructiveActions,
  showAdvancedControls,
  isLoading,
  error,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(defaultTarget);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<{ action: string; message: string } | null>(null);
  const [triggerOptions, setTriggerOptions] = useState<TriggerOptions>({});
  const [isTriggering, setIsTriggering] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  
  const handleTrigger = useCallback(async () => {
    setIsTriggering(true);
    try {
      await onTriggerCascade({
        targetFile: selectedTarget || undefined,
        ...triggerOptions,
      });
      setShowTargetSelector(false);
    } finally {
      setIsTriggering(false);
    }
  }, [onTriggerCascade, selectedTarget, triggerOptions]);
  
  const handlePauseResume = useCallback(async () => {
    setIsPausing(true);
    try {
      if (cascadeActive) {
        await onPauseCascade();
      } else {
        await onResumeCascade();
      }
    } finally {
      setIsPausing(false);
    }
  }, [cascadeActive, onPauseCascade, onResumeCascade]);
  
  const handleFinalize = useCallback(async () => {
    if (confirmDestructiveActions) {
      setShowConfirmation({
        action: 'finalize',
        message: 'Finalize cascade? This will mark all pending specs as converged.',
      });
      return;
    }
    
    setIsFinalizing(true);
    try {
      await onFinalizeCascade();
    } finally {
      setIsFinalizing(false);
    }
  }, [confirmDestructiveActions, onFinalizeCascade]);
  
  const handleAbort = useCallback(async () => {
    if (confirmDestructiveActions) {
      setShowConfirmation({
        action: 'abort',
        message: 'Abort cascade? All pending changes will be lost.',
      });
      return;
    }
    
    setIsAborting(true);
    try {
      await onAbortCascade();
    } finally {
      setIsAborting(false);
    }
  }, [confirmDestructiveActions, onAbortCascade]);
  
  const confirmAction = useCallback(async () => {
    if (!showConfirmation) return;
    
    switch (showConfirmation.action) {
      case 'finalize':
        setIsFinalizing(true);
        try {
          await onFinalizeCascade();
        } finally {
          setIsFinalizing(false);
        }
        break;
      case 'abort':
        setIsAborting(true);
        try {
          await onAbortCascade();
        } finally {
          setIsAborting(false);
        }
        break;
    }
    
    setShowConfirmation(null);
  }, [showConfirmation, onFinalizeCascade, onAbortCascade]);
  
  return (
    <div className="control-panel">
      <div className="status-bar">
        <span className={`status ${cascadeActive ? 'active' : 'idle'}`}>
          {cascadeActive ? 'CASCADE ACTIVE' : 'IDLE'}
        </span>
        <span className="queue">Queue: {queueDepth}</span>
        <span className="agents">Agents: {agentCount}</span>
      </div>
      
      <div className="action-buttons">
        <button
          className="btn safe"
          onClick={() => setShowTargetSelector(true)}
          disabled={isLoading || cascadeActive}
        >
          TRIGGER CASCADE
        </button>
        
        <button
          className={`btn ${cascadeActive ? 'warning' : 'safe'}`}
          onClick={handlePauseResume}
          disabled={isLoading || isPausing}
        >
          {isPausing ? '...' : cascadeActive ? 'PAUSE' : 'RESUME'}
        </button>
        
        <button
          className="btn safe"
          onClick={() => { setIsStepping(true); onStepCascade().finally(() => setIsStepping(false)); }}
          disabled={isLoading || isStepping || !cascadeActive}
        >
          {isStepping ? 'STEPPING...' : 'STEP'}
        </button>
        
        <button
          className="btn warning"
          onClick={handleFinalize}
          disabled={isLoading || isFinalizing || !cascadeConverged}
        >
          {isFinalizing ? 'FINALIZING...' : 'FINALIZE'}
        </button>
        
        <button
          className="btn destructive"
          onClick={handleAbort}
          disabled={isLoading || isAborting || !cascadeActive}
        >
          {isAborting ? 'ABORTING...' : 'ABORT'}
        </button>
        
        <button className="btn" onClick={onOpenSettings}>
          SETTINGS
        </button>
      </div>
      
      {showTargetSelector && (
        <div className="target-selector">
          <h3>Select Target</h3>
          <select
            value={selectedTarget || ''}
            onChange={(e) => setSelectedTarget(e.target.value || null)}
          >
            <option value="">Entire Project</option>
            {availableTargets.map(target => (
              <option key={target} value={target}>{target}</option>
            ))}
          </select>
          
          {showAdvancedControls && (
            <div className="trigger-options">
              <label>
                <input
                  type="checkbox"
                  checked={triggerOptions.force || false}
                  onChange={(e) => setTriggerOptions(o => ({ ...o, force: e.target.checked }))}
                />
                Force (ignore locks)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={triggerOptions.dryRun || false}
                  onChange={(e) => setTriggerOptions(o => ({ ...o, dryRun: e.target.checked }))}
                />
                Dry Run
              </label>
            </div>
          )}
          
          <div className="actions">
            <button onClick={() => setShowTargetSelector(false)}>Cancel</button>
            <button onClick={handleTrigger} disabled={isTriggering}>
              {isTriggering ? 'Triggering...' : 'Trigger'}
            </button>
          </div>
        </div>
      )}
      
      {showConfirmation && (
        <div className="confirmation-dialog">
          <p>{showConfirmation.message}</p>
          <div className="actions">
            <button onClick={() => setShowConfirmation(null)}>Cancel</button>
            <button className="destructive" onClick={confirmAction}>
              Confirm
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}
    </div>
  );
};
```

#### 4. Log Viewer

```tsx
// src/ui/components/log-viewer.tsx

import React, { useRef, useEffect, useState, useMemo } from 'react';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface LogViewerProps {
  logs: LogEntry[];
  maxLines?: number;
  filterLevel?: LogEntry['level'][];
  filterSource?: string;
  searchQuery?: string;
  follow?: boolean;
  showTimestamp: boolean;
  showMetadata: boolean;
  onLogClick?: (entry: LogEntry) => void;
  onClear?: () => void;
  onExport?: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  maxLines = 1000,
  filterLevel,
  filterSource,
  searchQuery,
  follow = true,
  showTimestamp,
  showMetadata,
  onLogClick,
  onClear,
  onExport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(follow);
  
  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = logs.slice(-maxLines);
    
    if (filterLevel && filterLevel.length > 0) {
      result = result.filter(log => filterLevel.includes(log.level));
    }
    
    if (filterSource) {
      result = result.filter(log => log.source === filterSource);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(query) ||
        JSON.stringify(log.metadata).toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [logs, maxLines, filterLevel, filterSource, searchQuery]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);
  
  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'error': return 'var(--color-error)';
      case 'warn': return 'var(--color-warning)';
      case 'debug': return 'var(--color-text-muted)';
      default: return 'var(--color-text)';
    }
  };
  
  return (
    <div className="log-viewer">
      <div className="log-toolbar">
        <div className="filters">
          <select
            multiple
            value={filterLevel || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, o => o.value as LogEntry['level']);
              // Update filterLevel
            }}
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
          
          <input
            type="search"
            placeholder="Search logs..."
            value={searchQuery || ''}
            onChange={(e) => { /* Update searchQuery */ }}
          />
        </div>
        
        <div className="actions">
          <label>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Follow
          </label>
          {onClear && <button onClick={onClear}>Clear</button>}
          {onExport && <button onClick={onExport}>Export</button>}
        </div>
      </div>
      
      <div ref={containerRef} className="log-container">
        {filteredLogs.length === 0 ? (
          <div className="empty-state">No logs match the current filters</div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={`${log.timestamp}-${idx}`}
              className={`log-entry ${log.level}`}
              onClick={() => onLogClick?.(log)}
              style={{ color: getLevelColor(log.level) }}
            >
              {showTimestamp && (
                <span className="timestamp">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
              )}
              {log.source && (
                <span className="source">[{log.source}]</span>
              )}
              <span className="level">[{log.level.toUpperCase()}]</span>
              <span className="message">{log.message}</span>
              {showMetadata && log.metadata && Object.keys(log.metadata).length > 0 && (
                <span className="metadata">
                  {JSON.stringify(log.metadata)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

#### 5. Queue Depth & System Metrics

```tsx
// src/ui/components/queue-depth.tsx

import React from 'react';

export interface QueueDepthProps {
  current: number;
  max: number;
  history: Array<{ time: string; depth: number }>;
  showHistory: boolean;
}

export const QueueDepth: React.FC<QueueDepthProps> = ({
  current,
  max,
  history,
  showHistory,
}) => {
  const percentage = (current / max) * 100;
  const color = percentage > 80 ? 'var(--color-error)' 
    : percentage > 50 ? 'var(--color-warning)' 
    : 'var(--color-success)';
  
  return (
    <div className="queue-depth">
      <div className="depth-display">
        <span className="current">{current}</span>
        <span className="separator">/</span>
        <span className="max">{max}</span>
      </div>
      
      <div className="depth-bar">
        <div 
          className="fill" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      
      {showHistory && (
        <div className="depth-sparkline">
          {history.slice(-30).map((h, i) => (
            <div
              key={i}
              className="spark"
              style={{ 
                height: `${(h.depth / max) * 100}%`,
                backgroundColor: h.depth / max > 0.8 ? 'var(--color-error)' : 'var(--color-text-muted)'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// src/ui/components/system-metrics.tsx

export interface SystemMetricsProps {
  cpu: number;
  memory: { used: number; total: number };
  disk: { used: number; total: number };
  network: { in: number; out: number };
  uptime: number;
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  cpu,
  memory,
  disk,
  network,
  uptime,
}) => {
  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };
  
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };
  
  const MetricBar: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="metric-bar">
      <span className="label">{label}</span>
      <div className="bar">
        <div 
          className="fill" 
          style={{ 
            width: `${value}%`,
            backgroundColor: value > 80 ? 'var(--color-error)' : 'var(--color-accent)'
          }}
        />
      </div>
      <span className="value">{value.toFixed(1)}%</span>
    </div>
  );
  
  return (
    <div className="system-metrics">
      <MetricBar value={cpu} label="CPU" />
      <MetricBar value={(memory.used / memory.total) * 100} label="Memory" />
      <MetricBar value={(disk.used / disk.total) * 100} label="Disk" />
      
      <div className="network-stats">
        <span>↓ {formatBytes(network.in)}/s</span>
        <span>↑ {formatBytes(network.out)}/s</span>
      </div>
      
      <div className="uptime">
        Uptime: {formatUptime(uptime)}
      </div>
    </div>
  );
};
```

### Component Exports

```typescript
// src/ui/components/index.ts

export * from './agent-health-grid';
export * from './cascade-graph';
export * from './control-panel';
export * from './log-viewer';
export * from './queue-depth';
export * from './system-metrics';
```

## Test Cases
1. AgentHealthGrid renders with agents
2. AgentHealthGrid filters by type/status
3. CascadeGraph displays nodes and edges
4. ControlPanel triggers cascade
5. ControlPanel shows confirmation for destructive
6. LogViewer filters by level
7. LogViewer auto-scrolls
8. QueueDepth shows percentage
9. SystemMetrics displays all metrics
10. All components handle loading/error states

## Validation
```bash
bun test tests/ui/components/components.test.tsx
```

## Output Format
After completing, output:
1. AgentHealthGrid implemented
2. CascadeGraph implemented
3. ControlPanel implemented
4. LogViewer implemented
5. QueueDepth implemented
6. SystemMetrics implemented
7. Test results
