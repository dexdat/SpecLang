# Bootstrap Phase 6.2: UI Component Library

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.2 of the bootstrap process.

**Prerequisites**: 
- Phase 0-6.1 complete
- Dashboard shell exists
- SSE streaming working
- MCP tools available

## Your Task
Implement the complete UI component library for the dashboard with real-time updates, brutalist design system, and comprehensive accessibility. Each component connects to MCP tools and SSE events.

## Read These Specs First
1. `specs/ui.spec.dir/components/cascade-graph.spec.md` - Dependency graph
2. `specs/ui.spec.dir/components/agent-health.spec.md` - Agent status grid
3. `specs/ui.spec.dir/components/control-panel.spec.md` - Control buttons
4. `specs/ui.spec.dir/components/system-metrics.spec.md` - Resource charts
5. `specs/ui.spec.dir/components/queue-depth.spec.md` - Queue visualization
6. `specs/ui.spec.dir/components/event-timeline.spec.md` - Event log
7. `specs/ui.spec.dir/components/log-viewer.spec.md` - Log streaming
8. `specs/ui.spec.dir/visual-design.spec.md` - Design system

## What to Build

### Files to Create
```
src/dashboard/components/
├── CascadeGraph.tsx         # D3.js dependency graph
├── AgentHealth.tsx          # Agent status grid
├── ControlPanel.tsx         # Action buttons
├── SystemMetrics.tsx        # Resource charts
├── QueueDepth.tsx           # Queue visualization
├── EventTimeline.tsx        # Event log
├── LogViewer.tsx            # Log streaming
├── CascadeStatus.tsx        # Status indicator
└── shared/
    ├── useSSE.ts            # SSE hook
    ├── useMCPTools.ts       # MCP client hook
    ├── usePolling.ts        # Polling hook
    ├── ErrorBoundary.tsx    # Error handling
    └── BrutalistTheme.tsx   # Design tokens

tests/dashboard/
└── components.test.tsx
```

### Requirements

#### 1. Design System Tokens (BrutalistTheme.tsx)

```typescript
export const theme = {
  colors: {
    background: '#ffffff',
    surface: '#f5f5f5',
    border: '#000000',
    text: '#1a1a1a',
    muted: '#666666',
    accent: '#dc2626',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626'
  },
  
  fonts: {
    display: '"JetBrains Mono", monospace',
    body: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace'
  },
  
  spacing: [0, 4, 8, 16, 24, 32, 48, 64],
  
  borders: {
    thin: '1px solid #000',
    thick: '2px solid #000',
    accent: '2px solid #dc2626'
  },
  
  animations: {
    brutalistSlide: 'slideIn 0.2s linear',
    brutalistPulse: 'pulse 1s linear infinite',
    brutalistBlink: 'blink 0.5s step-end infinite'
  }
};

export const css = `
  @keyframes slideIn {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  
  .grid-background {
    background-image: 
      linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
    background-size: 8px 8px;
  }
  
  .brutalist-border {
    border: 1px solid #000;
  }
  
  .brutalist-border-accent {
    border: 2px solid #dc2626;
  }
`;
```

#### 2. Shared Hooks

```typescript
// useSSE.ts
export function useSSE(url: string, eventTypes: string[]) {
  const [events, setEvents] = useState<Event[]>([]);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const source = new EventSource(url);
    
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    
    eventTypes.forEach(type => {
      source.addEventListener(type, (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [{ type, data, timestamp: Date.now() }, ...prev].slice(0, 100));
      });
    });
    
    return () => source.close();
  }, [url]);
  
  return { events, connected };
}

// useMCPTools.ts
export function useMCPTools() {
  const call = useCallback(async (tool: string, params: any) => {
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, params })
    });
    return response.json();
  }, []);
  
  return {
    queryEvents: (params) => call('speclang_query_events', params),
    getAgentStatuses: (params) => call('speclang_get_agent_statuses', params),
    getQueueStatus: (params) => call('speclang_get_queue_status', params),
    getSystemStats: () => call('speclang_get_system_stats'),
    getProjectStats: () => call('speclang_get_project_stats'),
    triggerCascade: (path) => call('speclang_trigger_cascade', { path }),
    pauseCascade: () => call('speclang_pause_cascade', {}),
    resumeCascade: () => call('speclang_resume_cascade', {}),
    finalizeCascade: () => call('speclang_finalize_cascade', {})
  };
}

// usePolling.ts
export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number = 2000
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const poll = async () => {
      try {
        const result = await fetcher();
        setData(result);
        setError(null);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };
    
    poll();
    const id = setInterval(poll, interval);
    return () => clearInterval(id);
  }, [fetcher, interval]);
  
  return { data, error, loading, refetch: () => fetcher().then(setData) };
}
```

#### 3. CascadeGraph Component

```tsx
import * as d3 from 'd3';
import { useSSE } from '../shared/useSSE';

interface GraphNode {
  id: string;
  type: 'spec' | 'generated' | 'test' | 'agent';
  label: string;
  filePath: string;
  layer: number;
  status: 'unchanged' | 'modified' | 'generated' | 'error';
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'dependency' | 'trigger' | 'generates';
}

export function CascadeGraph({ 
  nodes, 
  edges, 
  onNodeClick 
}: CascadeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { events } = useSSE('/events', ['file.changed', 'cascade.triggered']);
  
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous
    svg.selectAll('*').remove();
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Draw edges
    const link = svg.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', d => d.type === 'trigger' ? '#dc2626' : '#666666')
      .attr('stroke-width', 1);
    
    // Draw nodes
    const node = svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('width', 60)
      .attr('height', 40)
      .attr('fill', '#ffffff')
      .attr('stroke', d => {
        switch (d.status) {
          case 'modified': return '#dc2626';
          case 'generated': return '#16a34a';
          case 'error': return '#dc2626';
          default: return '#000000';
        }
      })
      .attr('stroke-width', 1)
      .on('click', (_, d) => onNodeClick(d));
    
    // Labels
    svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text(d => d.label.slice(0, 10))
      .attr('font-size', 10)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em');
    
    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x + 30)
        .attr('y1', (d: any) => d.source.y + 20)
        .attr('x2', (d: any) => d.target.x + 30)
        .attr('y2', (d: any) => d.target.y + 20);
      
      node
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
    
  }, [nodes, edges]);
  
  return (
    <div className="cascade-graph grid-background brutalist-border" style={{ width: '100%', height: 400 }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}
```

#### 4. AgentHealth Component

```tsx
export function AgentHealth({ 
  agents, 
  onAgentClick, 
  onRestartAgent 
}: AgentHealthProps) {
  const { data: statusData, refetch } = usePolling(
    () => fetch('/api/agents').then(r => r.json()),
    3000
  );
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'border-red-600 bg-black text-white';
      case 'idle': return 'border-gray-400';
      case 'error': return 'border-red-600 text-red-600';
      case 'paused': return 'border-gray-400 line-through';
      default: return 'border-gray-400';
    }
  };
  
  return (
    <div className="agent-health">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-mono text-sm uppercase">Agent Health</h2>
        <button onClick={refetch} className="brutalist-border px-2 py-1 text-xs">
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {agents.map(agent => (
          <div
            key={agent.id}
            className={`p-4 border-2 cursor-pointer ${getStatusClass(agent.status)}`}
            onClick={() => onAgentClick(agent.id)}
          >
            <div className="font-mono text-sm uppercase">{agent.type}</div>
            <div className="font-mono text-2xl font-bold">{agent.queueDepth}</div>
            <div className="text-xs uppercase text-gray-500">Queue</div>
            
            {agent.status === 'error' && (
              <button
                onClick={(e) => { e.stopPropagation(); onRestartAgent(agent.id); }}
                className="mt-2 text-xs border px-2 py-1"
              >
                Restart
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5. ControlPanel Component

```tsx
export function ControlPanel({
  cascadeActive,
  cascadeConverged,
  onTriggerCascade,
  onPauseCascade,
  onResumeCascade,
  onFinalizeCascade,
  onStepCascade,
  onAbortCascade
}: ControlPanelProps) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  
  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      await onTriggerCascade();
    } finally {
      setIsTriggering(false);
    }
  };
  
  const handleDestructive = (action: () => Promise<void>, name: string) => {
    if (confirmAction === name) {
      action();
      setConfirmAction(null);
    } else {
      setConfirmAction(name);
    }
  };
  
  return (
    <div className="control-panel brutalist-border p-4">
      <h2 className="font-mono text-sm uppercase mb-4">Controls</h2>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Safe actions */}
        <button
          onClick={handleTrigger}
          disabled={isTriggering || cascadeActive}
          className="border-2 border-green-600 p-3 text-sm uppercase disabled:opacity-50 disabled:line-through"
        >
          {isTriggering ? 'Triggering...' : 'Trigger'}
        </button>
        
        <button
          onClick={cascadeActive ? onPauseCascade : onResumeCascade}
          className={`border-2 p-3 text-sm uppercase ${
            cascadeActive ? 'border-yellow-600' : 'border-green-600'
          }`}
        >
          {cascadeActive ? 'Pause' : 'Resume'}
        </button>
        
        <button
          onClick={onStepCascade}
          disabled={cascadeActive}
          className="border-2 border-gray-600 p-3 text-sm uppercase disabled:opacity-50"
        >
          Step
        </button>
        
        <button
          onClick={onFinalizeCascade}
          disabled={!cascadeConverged}
          className="border-2 border-green-600 p-3 text-sm uppercase disabled:opacity-50"
        >
          Finalize
        </button>
        
        {/* Destructive action */}
        <button
          onClick={() => handleDestructive(onAbortCascade, 'abort')}
          className={`col-span-2 border-2 p-3 text-sm uppercase ${
            confirmAction === 'abort' 
              ? 'border-red-600 bg-red-600 text-white' 
              : 'border-red-600'
          }`}
        >
          {confirmAction === 'abort' ? 'Confirm Abort?' : 'Abort'}
        </button>
      </div>
    </div>
  );
}
```

#### 6. SystemMetrics Component

```tsx
export function SystemMetrics({ stats }: SystemMetricsProps) {
  const { data, refetch } = usePolling(
    () => fetch('/api/system-stats').then(r => r.json()),
    2000
  );
  
  const metrics = data || stats;
  
  const MetricBar = ({ label, value, max, color }: MetricBarProps) => {
    const percent = (value / max) * 100;
    const isWarning = percent > 80;
    const isCritical = percent > 95;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs uppercase mb-1">
          <span className="font-mono">{label}</span>
          <span className="font-mono">{value.toFixed(1)}%</span>
        </div>
        <div className="h-4 border-2 border-black bg-white relative">
          <div
            className={`h-full ${
              isCritical ? 'bg-red-600' : isWarning ? 'bg-yellow-600' : `bg-${color}-600`
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="system-metrics brutalist-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-mono text-sm uppercase">System</h2>
        <span className="text-xs text-gray-500">
          Uptime: {formatDuration(metrics?.uptime_seconds || 0)}
        </span>
      </div>
      
      <MetricBar label="CPU" value={metrics?.cpu_percent || 0} max={100} color="red" />
      <MetricBar 
        label="Memory" 
        value={metrics?.memory_used_mb || 0} 
        max={metrics?.memory_total_mb || 1} 
        color="green"
      />
      <MetricBar 
        label="Disk" 
        value={metrics?.disk_used_mb || 0} 
        max={metrics?.disk_total_mb || 1} 
        color="gray"
      />
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
```

#### 7. QueueDepth Component

```tsx
export function QueueDepth({ items }: QueueDepthProps) {
  const { data } = usePolling(
    () => fetch('/api/queue').then(r => r.json()),
    1000
  );
  
  const queue = data?.items || items;
  
  const getAgeColor = (ageSeconds: number) => {
    if (ageSeconds > 60) return 'text-red-600';
    if (ageSeconds > 30) return 'text-yellow-600';
    return 'text-gray-500';
  };
  
  return (
    <div className="queue-depth brutalist-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-mono text-sm uppercase">Queue</h2>
        <span className="font-mono text-lg font-bold">{queue.length}</span>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {queue.slice(0, 20).map(item => (
          <div
            key={item.command_id}
            className="flex justify-between items-center border-t py-2"
          >
            <span className="font-mono text-xs uppercase">{item.action}</span>
            <span className="text-xs truncate max-w-32">{item.target_file}</span>
            <span className={`font-mono text-xs ${getAgeColor(item.age_seconds)}`}>
              {item.age_seconds}s
            </span>
          </div>
        ))}
        
        {queue.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">Queue empty</div>
        )}
      </div>
    </div>
  );
}
```

#### 8. EventTimeline Component

```tsx
export function EventTimeline({ events }: EventTimelineProps) {
  const { events: sseEvents } = useSSE('/events', [
    'file.changed',
    'cascade.started',
    'cascade.converged',
    'agent.spawned'
  ]);
  
  const allEvents = [...sseEvents, ...events].slice(0, 50);
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'file.changed': return '📝';
      case 'cascade.started': return '⚡';
      case 'cascade.converged': return '✓';
      case 'agent.spawned': return '🤖';
      default: return '•';
    }
  };
  
  return (
    <div className="event-timeline brutalist-border p-4">
      <h2 className="font-mono text-sm uppercase mb-4">Events</h2>
      
      <div className="space-y-0">
        {allEvents.map((event, i) => (
          <div
            key={`${event.timestamp}-${i}`}
            className="flex items-start py-2 border-t"
          >
            <span className="mr-2">{getEventIcon(event.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs uppercase">{event.type}</div>
              <div className="text-xs truncate text-gray-500">
                {event.data?.path || event.data?.file || ''}
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 9. LogViewer Component

```tsx
export function LogViewer({ streamUrl }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const source = new EventSource(streamUrl);
    
    source.addEventListener('log', (e: MessageEvent) => {
      const entry = JSON.parse(e.data);
      setLogs(prev => [...prev.slice(-500), entry]);
    });
    
    return () => source.close();
  }, [streamUrl]);
  
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);
  
  const filteredLogs = filter
    ? logs.filter(l => l.message.toLowerCase().includes(filter.toLowerCase()))
    : logs;
  
  const getLevelClass = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="log-viewer brutalist-border">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-mono text-sm uppercase">Logs</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border px-2 py-1 text-xs font-mono"
          />
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="mr-1"
            />
            Auto-scroll
          </label>
        </div>
      </div>
      
      <div
        ref={containerRef}
        className="h-64 overflow-y-auto font-mono text-xs p-2 grid-background"
      >
        {filteredLogs.map((log, i) => (
          <div key={i} className="py-0.5">
            <span className="text-gray-400">{log.timestamp}</span>
            {' '}
            <span className={getLevelClass(log.level)}>[{log.level.toUpperCase()}]</span>
            {' '}
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 10. ErrorBoundary

```tsx
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, { hasError: boolean; error: Error | null }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="brutalist-border-accent p-4 bg-white">
          <h2 className="font-mono text-sm uppercase text-red-600 mb-2">Error</h2>
          <p className="text-sm">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 border-2 px-4 py-2 text-sm uppercase"
          >
            Retry
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Test Cases
1. CascadeGraph renders with nodes and edges
2. AgentHealth displays agent status cards
3. ControlPanel triggers cascade on click
4. SystemMetrics shows CPU/memory bars
5. QueueDepth displays pending items
6. EventTimeline shows real-time events
7. LogViewer streams and filters logs
8. ErrorBoundary catches and displays errors
9. SSE hook connects and receives events
10. Polling hook fetches data on interval

## Validation
```bash
# Build dashboard
cd src/dashboard && bun run build

# Run component tests
bun test tests/dashboard/components.test.tsx

# Start dev server
bun run dev
```

## Output Format
After completing, output:
1. Components created
2. Hooks implemented
3. Design system tokens
4. Test results
