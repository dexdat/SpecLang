# Bootstrap Phase 2.4: MCP UI Tools

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.4 of the bootstrap process.

**Prerequisites**: 
- Phase 0-2 complete
- MCP server operational
- SQLite database with events/sessions/commands tables

## Your Task
Implement additional MCP tools required by the system dashboard for monitoring cascade status, agent health, and system metrics.

## Read These Specs First
1. `specs/mcp-ui-tools.spec.md` - Full tool specification
2. `specs/mcp.spec.md` - MCP server architecture
3. `specs/sqlite.spec.md` - Database schema

## Current State
- Basic MCP tools exist (search, get, create spec)
- SQLite has base tables
- Need monitoring-specific tools

## What to Build

### Files to Create/Modify
```
src/mcp/tools/
├── index.ts              # Add new tools
├── dashboard.ts          # Dashboard monitoring tools
└── sse.ts                # Enhanced SSE stream

src/sqlite/
└── migrations/
    └── 004_dashboard.sql # Dashboard tables
```

### Requirements

#### 1. Query Events Tool
```typescript
// speclang_query_events
{
  name: 'speclang_query_events',
  description: 'Query recent cascade events with filtering',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 20 },
      cascade_id: { type: 'string' },
      agent: { type: 'string' },
      file_pattern: { type: 'string' },
      since: { type: 'string', format: 'date-time' }
    }
  },
  returns: [{
    event_id: 'integer',
    cascade_id: 'string',
    depth: 'integer',
    trigger_file: 'string',
    agent: 'string',
    output_files: 'array',
    timestamp: 'string'
  }]
}

// SQL implementation
const QUERY_EVENTS_SQL = `
  SELECT 
    e.event_pk as event_id,
    e.cascade_id,
    e.depth,
    e.trigger_file,
    e.agent,
    e.output_files,
    datetime(e.timestamp, 'unixepoch') as timestamp
  FROM events e
  WHERE 1=1
    AND (? IS NULL OR e.cascade_id = ?)
    AND (? IS NULL OR e.agent = ?)
    AND (? IS NULL OR e.trigger_file LIKE ?)
    AND (? IS NULL OR e.timestamp >= ?)
  ORDER BY e.timestamp DESC
  LIMIT ?
`;
```

#### 2. Get Agent Statuses Tool
```typescript
// speclang_get_agent_statuses
{
  name: 'speclang_get_agent_statuses',
  description: 'Get detailed status for all agent sessions',
  inputSchema: {
    type: 'object',
    properties: {
      agent_type: { type: 'string' },
      status: { type: 'string', enum: ['idle', 'active', 'error'] }
    }
  },
  returns: [{
    session_id: 'string',
    agent: 'string',
    status: 'string',
    current_file: 'string',
    queue_depth: 'integer',
    last_active: 'string',
    uptime_seconds: 'integer'
  }]
}

// SQL implementation
const AGENT_STATUSES_SQL = `
  SELECT 
    s.session_id,
    s.agent,
    s.status,
    s.current_file,
    (SELECT COUNT(*) FROM commands c WHERE c.session_id = s.session_id AND c.status = 'pending') as queue_depth,
    datetime(s.last_active, 'unixepoch') as last_active,
    (strftime('%s','now') - s.created) as uptime_seconds
  FROM sessions s
  WHERE 1=1
    AND (? IS NULL OR s.agent = ?)
    AND (? IS NULL OR s.status = ?)
  ORDER BY s.last_active DESC
`;
```

#### 3. Get Project Stats Tool
```typescript
// speclang_get_project_stats
{
  name: 'speclang_get_project_stats',
  description: 'Get project statistics (specs count, generated files, tests)',
  inputSchema: { type: 'object', properties: {} },
  returns: {
    specs_count: 'integer',
    generated_files_count: 'integer',
    test_files_count: 'integer',
    total_files: 'integer',
    cascade_active: 'boolean',
    cascade_depth: 'integer',
    queue_depth: 'integer'
  }
}

// SQL implementation
const PROJECT_STATS_SQL = `
  SELECT 
    (SELECT COUNT(*) FROM specs) as specs_count,
    (SELECT COUNT(*) FROM specs WHERE file_path LIKE 'generated/%') as generated_files_count,
    (SELECT COUNT(*) FROM specs WHERE file_path LIKE 'tests/%') as test_files_count,
    (SELECT COUNT(*) FROM specs) as total_files,
    (SELECT COUNT(*) > 0 FROM cascades WHERE status = 'active') as cascade_active,
    (SELECT MAX(depth) FROM cascades WHERE status = 'active') as cascade_depth,
    (SELECT COUNT(*) FROM commands WHERE status = 'pending') as queue_depth
`;
```

#### 4. Get Queue Status Tool
```typescript
// speclang_get_queue_status
{
  name: 'speclang_get_queue_status',
  description: 'Get detailed queue status (pending commands)',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 50 }
    }
  },
  returns: [{
    command_id: 'string',
    action: 'string',
    target_file: 'string',
    session_id: 'string',
    priority: 'integer',
    created_at: 'string',
    age_seconds: 'integer'
  }]
}

// SQL implementation
const QUEUE_STATUS_SQL = `
  SELECT 
    c.command_id,
    c.action,
    c.target_file,
    c.session_id,
    c.priority,
    datetime(c.created_at, 'unixepoch') as created_at,
    (strftime('%s','now') - c.created_at) as age_seconds
  FROM commands c
  WHERE c.status = 'pending'
  ORDER BY c.priority DESC, c.created_at ASC
  LIMIT ?
`;
```

#### 5. Subscribe Events Tool (SSE)
```typescript
// speclang_subscribe_events
{
  name: 'speclang_subscribe_events',
  description: 'Server-Sent Events (SSE) stream for real-time updates',
  inputSchema: {
    type: 'object',
    properties: {
      types: { 
        type: 'array', 
        items: { type: 'string' },
        default: ['all']
      }
    }
  },
  returns: {
    stream: 'EventSource stream'
  }
}

// Event types streamed
// file.changed: { path, change_type }
// agent.spawned: { session_id, agent, file }
// agent.completed: { session_id, file, status }
// cascade.converged: { cascade_id, duration }
// command.executed: { command_id, action, status }

// Implementation
app.get('/events', async (req, res) => {
  const types = req.query.types?.split(',') || ['all'];
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const client = { res, types };
  sseClients.add(client);
  
  req.on('close', () => sseClients.delete(client));
});
```

#### 6. Get System Stats Tool
```typescript
// speclang_get_system_stats
{
  name: 'speclang_get_system_stats',
  description: 'Get system-level statistics (CPU, memory, disk)',
  inputSchema: { type: 'object', properties: {} },
  returns: {
    cpu_percent: 'number',
    memory_used_mb: 'integer',
    memory_total_mb: 'integer',
    disk_used_mb: 'integer',
    disk_total_mb: 'integer',
    uptime_seconds: 'integer'
  }
}

// Implementation (Node.js)
import os from 'os';
import fs from 'fs';

function getSystemStats() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  return {
    cpu_percent: calculateCpuUsage(cpus),
    memory_used_mb: Math.round((totalMem - freeMem) / 1024 / 1024),
    memory_total_mb: Math.round(totalMem / 1024 / 1024),
    disk_used_mb: getDiskUsed(),
    disk_total_mb: getDiskTotal(),
    uptime_seconds: Math.round(process.uptime())
  };
}
```

### SQL Schema Migration
```sql
-- 004_dashboard.sql

-- Events table for cascade events
CREATE TABLE IF NOT EXISTS events (
  event_pk INTEGER PRIMARY KEY,
  cascade_id TEXT,
  depth INTEGER,
  trigger_file TEXT,
  agent TEXT,
  output_files TEXT, -- JSON array
  timestamp INTEGER,
  processed BOOLEAN DEFAULT 0,
  claimed_by TEXT
);

-- Sessions table for agent status
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  agent TEXT,
  status TEXT,
  current_file TEXT,
  created INTEGER,
  last_active INTEGER
);

-- Commands table for queue
CREATE TABLE IF NOT EXISTS commands (
  command_id TEXT PRIMARY KEY,
  action TEXT,
  target_file TEXT,
  session_id TEXT,
  payload TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT,
  created_at INTEGER
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_cascade ON events(cascade_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
```

### Tool Handler Implementation
```typescript
class DashboardToolHandlers {
  private db: Database;
  
  async handleQueryEvents(args: any) {
    const { limit = 20, cascade_id, agent, file_pattern, since } = args;
    return this.db.prepare(QUERY_EVENTS_SQL).all(
      cascade_id, cascade_id,
      agent, agent,
      file_pattern ? `${file_pattern}%` : null, file_pattern ? `${file_pattern}%` : null,
      since ? new Date(since).getTime() / 1000 : null, since ? new Date(since).getTime() / 1000 : null,
      limit
    );
  }
  
  async handleGetAgentStatuses(args: any) {
    const { agent_type, status } = args;
    return this.db.prepare(AGENT_STATUSES_SQL).all(
      agent_type, agent_type,
      status, status
    );
  }
  
  async handleGetProjectStats() {
    return this.db.prepare(PROJECT_STATS_SQL).get();
  }
  
  async handleGetQueueStatus(args: any) {
    const { limit = 50 } = args;
    return this.db.prepare(QUEUE_STATUS_SQL).all(limit);
  }
  
  async handleGetSystemStats() {
    return getSystemStats();
  }
}
```

## Test Cases
1. Query events returns filtered results
2. Agent statuses shows all sessions
3. Project stats returns correct counts
4. Queue status shows pending commands
5. SSE streams real-time events
6. System stats returns valid metrics

## Validation
```bash
# Run tests
bun test tests/mcp/dashboard.test.ts

# Test tools via CLI
speclang-mcp tool speclang_query_events --limit 10
speclang-mcp tool speclang_get_agent_statuses
speclang-mcp tool speclang_get_project_stats
speclang-mcp tool speclang_get_queue_status
```

## Output Format
After completing, output:
1. Tools implemented
2. SQL migrations applied
3. Test results
4. SSE event types supported
