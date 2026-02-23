# speclang-header lines:13
id: "@speclang/mcp-ui-tools/tools"
version: 0.1.0
layer: 2
imports: ["@speclang/mcp", "@speclang/sqlite", "@speclang/cascade", "@speclang/agent-protocol"]
tags: [mcp, tools, dashboard, monitoring]
status: draft
short: MCP tool definitions for dashboard monitoring
project_level: Alpha
agent_support: agent_assisted
parent: "@speclang/mcp-ui-tools"
part: 1/2
siblings:
  next: "@speclang/mcp-ui-tools/ui"
---
# MCP UI Tools - Tool Definitions

Additional MCP tools required by the system dashboard for monitoring cascade status, agent health, and system metrics.

---

## Overview

```speclang
# @block:mcp-ui-tools/overview @kind:note
These tools extend the MCP server with monitoring-specific queries:
- Query recent cascade events
- Get detailed agent statuses
- Get project statistics (specs count, generated files, tests)
- Get queue status (pending commands)
- Subscribe to real-time events via SSE

All tools are implemented as SQL queries against the SQLite database.
```

---

## Tool Definitions

### @mcp-ui-tools/query-events

```speclang
# @block:mcp-ui-tools/query-events @kind:entity
speclang_query_events:
  description: Query recent cascade events with filtering
  params:
    limit: integer (default: 20)
    cascade_id: string (optional)
    agent: string (optional)
    file_pattern: string (optional)
    since: timestamp (optional)
  returns:
    - event_id: integer
    - cascade_id: string
    - depth: integer
    - trigger_file: string
    - agent: string
    - output_files: JSON array
    - timestamp: string
  sql: |
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
```

### @mcp-ui-tools/get-agent-statuses

```speclang
# @block:mcp-ui-tools/get-agent-statuses @kind:entity
speclang_get_agent_statuses:
  description: Get detailed status for all agent sessions
  params:
    agent_type: string (optional)
    status: string (optional)
  returns:
    - session_id: string
    - agent: string
    - status: string (idle, active, error)
    - current_file: string (optional)
    - queue_depth: integer
    - last_active: timestamp
    - uptime_seconds: integer
  sql: |
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
```

### @mcp-ui-tools/get-project-stats

```speclang
# @block:mcp-ui-tools/get-project-stats @kind:entity
speclang_get_project_stats:
  description: Get project statistics (specs count, generated files, tests)
  params: {}
  returns:
    - specs_count: integer
    - generated_files_count: integer
    - test_files_count: integer
    - total_files: integer
    - cascade_active: boolean
    - cascade_depth: integer
    - queue_depth: integer
  sql: |
    SELECT 
      (SELECT COUNT(*) FROM specs) as specs_count,
      (SELECT COUNT(*) FROM specs WHERE file_path LIKE 'generated/%') as generated_files_count,
      (SELECT COUNT(*) FROM specs WHERE file_path LIKE 'tests/%') as test_files_count,
      (SELECT COUNT(*) FROM specs) as total_files,
      (SELECT COUNT(*) > 0 FROM cascades WHERE status = 'active') as cascade_active,
      (SELECT MAX(depth) FROM cascades WHERE status = 'active') as cascade_depth,
      (SELECT COUNT(*) FROM commands WHERE status = 'pending') as queue_depth
```

### @mcp-ui-tools/get-queue-status

```speclang
# @block:mcp-ui-tools/get-queue-status @kind:entity
speclang_get_queue_status:
  description: Get detailed queue status (pending commands)
  params:
    limit: integer (default: 50)
  returns:
    - command_id: string
    - action: string
    - target_file: string (optional)
    - session_id: string (optional)
    - priority: integer
    - created_at: timestamp
    - age_seconds: integer
  sql: |
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
```

### @mcp-ui-tools/subscribe-events

```speclang
# @block:mcp-ui-tools/subscribe-events @kind:entity
speclang_subscribe_events:
  description: Server-Sent Events (SSE) stream for real-time updates
  params:
    types: string[] (optional, default: all)
  returns:
    stream: EventSource stream
  implementation: |
    Client connects to /events endpoint with optional query params.
    Server sends events as they occur:
    - file.changed: { path, change_type }
    - agent.spawned: { session_id, agent, file }
    - agent.completed: { session_id, file, status }
    - cascade.converged: { cascade_id, duration }
    - command.executed: { command_id, action, status }
    Uses existing SSE infrastructure from @ref:specs/mcp#sse.
```

### @mcp-ui-tools/get-system-stats

```speclang
# @block:mcp-ui-tools/get-system-stats @kind:entity
speclang_get_system_stats:
  description: Get system-level statistics (CPU, memory, disk)
  params: {}
  returns:
    - cpu_percent: float
    - memory_used_mb: integer
    - memory_total_mb: integer
    - disk_used_mb: integer
    - disk_total_mb: integer
    - uptime_seconds: integer
  implementation: |
    Platform-specific system metrics collection.
    On Node.js: use os module for CPU/memory, fs for disk.
    Returns cached values (updated every 5s).
```

---

## SQL Schema Updates

### @mcp-ui-tools/schema-updates

```speclang
# @block:mcp-ui-tools/schema-updates @kind:code
```sql
-- Ensure required tables exist (already defined in @ref:specs/sqlite)
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
```
```

---

## Implementation Notes

### @mcp-ui-tools/implementation

```speclang
# @block:mcp-ui-tools/implementation @kind:code
```typescript
// Example tool handler implementation
class DashboardToolHandlers {
  async handleQueryEvents(args: any) {
    const { limit = 20, cascade_id, agent, file_pattern, since } = args;
    const sql = `...`; // Use SQL from above
    return this.db.prepare(sql).all(
      cascade_id, cascade_id,
      agent, agent,
      file_pattern ? `${file_pattern}%` : null, file_pattern ? `${file_pattern}%` : null,
      since, since,
      limit
    );
  }
}
```
```