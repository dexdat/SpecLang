# Bootstrap Phase 6.1: System Monitoring Dashboard

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.1 of the bootstrap process.

**Prerequisites**: 
- Phase 0-5 complete
- MCP server with UI tools operational
- SSE streaming working

## Your Task
Build the web-based system monitoring dashboard that provides real-time visibility into the SpecLang cascade, agent health, and system metrics.

## Read These Specs First
1. `specs/ui.spec.md` - Main dashboard spec
2. `specs/ui.spec.dir/overview.spec.md` - Architecture and views
3. `specs/ui.spec.dir/visual-design.spec.md` - Design system
4. `specs/ui.spec.dir/interactions.spec.md` - User interactions
5. `specs/ui.spec.dir/state-management.spec.md` - State handling
6. `specs/mcp-ui-tools.spec.md` - Backend tools

## Current State
- MCP tools provide data access
- SSE provides real-time events
- Need frontend UI to consume these

## What to Build

### Files to Create
```
src/dashboard/
├── index.html            # Entry point
├── app.tsx               # Main app component
├── main.tsx              # React entry
├── components/
│   ├── CascadeStatus.tsx
│   ├── AgentHealth.tsx
│   ├── EventTimeline.tsx
│   ├── QueueDepth.tsx
│   ├── SystemMetrics.tsx
│   ├── ControlPanel.tsx
│   ├── CascadeGraph.tsx
│   └── LogViewer.tsx
├── hooks/
│   ├── useSSE.ts
│   ├── useMCPTools.ts
│   └── useDashboardState.ts
├── api/
│   └── mcp-client.ts
├── styles/
│   ├── globals.css
│   └── theme.css
└── vite.config.ts

dist/dashboard/            # Built assets
```

### Requirements

#### 1. Core Views (from spec)
```typescript
// System Dashboard - Overview of system health
// Cascade Monitor - Real-time cascade visualization
// Agent Health - Monitor agent status
// Queue Status - View pending commands
// System Logs - Inspect logs and errors
```

#### 2. CascadeStatus Component
```tsx
interface CascadeStatusProps {
  status: 'idle' | 'cascading' | 'converged';
  depth: number;
  filesChanged: string[];
  timeElapsed: number;
}

function CascadeStatus({ status, depth, filesChanged, timeElapsed }: CascadeStatusProps) {
  const statusColor = {
    idle: 'gray',
    cascading: 'yellow',
    converged: 'green'
  }[status];
  
  return (
    <div className="cascade-status">
      <div className={`status-indicator ${statusColor}`}>
        {status.toUpperCase()}
      </div>
      <div className="metrics">
        <span>Depth: {depth}</span>
        <span>Files: {filesChanged.length}</span>
        <span>Time: {formatTime(timeElapsed)}</span>
      </div>
    </div>
  );
}
```

#### 3. AgentHealth Component
```tsx
interface AgentStatus {
  session_id: string;
  agent: string;
  status: 'idle' | 'active' | 'error';
  current_file: string | null;
  queue_depth: number;
  last_active: string;
}

function AgentHealth({ agents }: { agents: AgentStatus[] }) {
  return (
    <div className="agent-health">
      <h2>Agent Health</h2>
      <div className="agent-grid">
        {agents.map(agent => (
          <div key={agent.session_id} className={`agent-card ${agent.status}`}>
            <div className="agent-name">{agent.agent}</div>
            <div className="agent-status">{agent.status}</div>
            {agent.current_file && (
              <div className="agent-file">{agent.current_file}</div>
            )}
            <div className="agent-queue">Queue: {agent.queue_depth}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 4. EventTimeline Component
```tsx
interface Event {
  event_id: number;
  cascade_id: string;
  depth: number;
  trigger_file: string;
  agent: string;
  output_files: string[];
  timestamp: string;
}

function EventTimeline({ events }: { events: Event[] }) {
  return (
    <div className="event-timeline">
      <h2>Recent Events</h2>
      <div className="timeline">
        {events.map(event => (
          <div key={event.event_id} className="timeline-event">
            <div className="event-time">{event.timestamp}</div>
            <div className="event-agent">{event.agent}</div>
            <div className="event-file">{event.trigger_file}</div>
            <div className="event-depth">Depth: {event.depth}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5. QueueDepth Component
```tsx
interface QueueItem {
  command_id: string;
  action: string;
  target_file: string;
  priority: number;
  created_at: string;
  age_seconds: number;
}

function QueueDepth({ items }: { items: QueueItem[] }) {
  return (
    <div className="queue-depth">
      <h2>Queue ({items.length} pending)</h2>
      <div className="queue-list">
        {items.slice(0, 10).map(item => (
          <div key={item.command_id} className="queue-item">
            <span className="action">{item.action}</span>
            <span className="file">{item.target_file}</span>
            <span className="age">{item.age_seconds}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 6. SystemMetrics Component
```tsx
interface SystemStats {
  cpu_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_used_mb: number;
  disk_total_mb: number;
  uptime_seconds: number;
}

function SystemMetrics({ stats }: { stats: SystemStats }) {
  return (
    <div className="system-metrics">
      <h2>System</h2>
      <div className="metric">
        <label>CPU</label>
        <div className="bar">
          <div style={{ width: `${stats.cpu_percent}%` }} />
        </div>
        <span>{stats.cpu_percent.toFixed(1)}%</span>
      </div>
      <div className="metric">
        <label>Memory</label>
        <div className="bar">
          <div style={{ width: `${(stats.memory_used_mb / stats.memory_total_mb) * 100}%` }} />
        </div>
        <span>{stats.memory_used_mb} / {stats.memory_total_mb} MB</span>
      </div>
      <div className="metric">
        <label>Uptime</label>
        <span>{formatDuration(stats.uptime_seconds)}</span>
      </div>
    </div>
  );
}
```

#### 7. ControlPanel Component
```tsx
function ControlPanel({ onTrigger, onFinalize, onPause }: ControlProps) {
  return (
    <div className="control-panel">
      <h2>Controls</h2>
      <button onClick={onTrigger}>Trigger Cascade</button>
      <button onClick={onFinalize}>Finalize</button>
      <button onClick={onPause}>Pause</button>
    </div>
  );
}
```

#### 8. SSE Hook for Real-time Updates
```typescript
function useSSE(url: string, eventTypes: string[]) {
  const [events, setEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    const source = new EventSource(url);
    
    eventTypes.forEach(type => {
      source.addEventListener(type, (e) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [{ type, data, timestamp: Date.now() }, ...prev].slice(0, 100));
      });
    });
    
    source.addEventListener('file.changed', handleFileChange);
    source.addEventListener('agent.spawned', handleAgentSpawn);
    source.addEventListener('cascade.converged', handleConvergence);
    
    return () => source.close();
  }, [url]);
  
  return events;
}
```

#### 9. MCP Tools Hook
```typescript
function useMCPTools() {
  const client = useMCPClient();
  
  return {
    queryEvents: (params) => client.call('speclang_query_events', params),
    getAgentStatuses: (params) => client.call('speclang_get_agent_statuses', params),
    getProjectStats: () => client.call('speclang_get_project_stats'),
    getQueueStatus: (params) => client.call('speclang_get_queue_status', params),
    getSystemStats: () => client.call('speclang_get_system_stats'),
  };
}
```

#### 10. Main Dashboard Layout
```tsx
function Dashboard() {
  const { queryEvents, getAgentStatuses, getProjectStats, getQueueStatus, getSystemStats } = useMCPTools();
  const sseEvents = useSSE('/events', ['file.changed', 'agent.spawned', 'cascade.converged']);
  
  const [events, setEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [system, setSystem] = useState(null);
  
  // Poll for data
  useEffect(() => {
    const interval = setInterval(async () => {
      setEvents(await queryEvents({ limit: 20 }));
      setAgents(await getAgentStatuses({}));
      setStats(await getProjectStats());
      setQueue(await getQueueStatus({ limit: 50 }));
      setSystem(await getSystemStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="dashboard">
      <header>
        <h1>SpecLang Dashboard</h1>
        <CascadeStatus status={stats?.cascade_active ? 'cascading' : 'idle'} />
      </header>
      
      <main>
        <aside>
          <SystemMetrics stats={system} />
          <ControlPanel />
        </aside>
        
        <section>
          <EventTimeline events={events} />
          <QueueDepth items={queue} />
        </section>
        
        <aside>
          <AgentHealth agents={agents} />
        </aside>
      </main>
    </div>
  );
}
```

### Design System (Tailwind)
```css
/* theme.css */
:root {
  --color-background: #ffffff;
  --color-surface: #f5f5f5;
  --color-border: #e0e0e0;
  --color-text: #1a1a1a;
  --color-muted: #666666;
  --color-accent: #dc2626;
  --color-success: #16a34a;
  --color-warning: #ca8a04;
  --color-error: #dc2626;
}

/* Grid background */
.grid-background {
  background-image: 
    linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 8px 8px;
}
```

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  root: 'src/dashboard',
  build: {
    outDir: '../../dist/dashboard',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/events': 'http://localhost:3000'
    }
  }
});
```

## Test Cases
1. Dashboard loads and displays data
2. CascadeStatus shows correct state
3. AgentHealth updates on agent changes
4. EventTimeline shows recent events
5. QueueDepth shows pending commands
6. SystemMetrics shows resource usage
7. ControlPanel triggers actions
8. SSE updates dashboard in real-time

## Validation
```bash
# Build dashboard
cd src/dashboard && bun run build

# Start dev server
bun run dev

# Run tests
bun test tests/dashboard/
```

## Output Format
After completing, output:
1. Components created
2. Views implemented
3. Real-time features working
4. Build artifact location
