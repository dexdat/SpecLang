---
name: sip-051-daemon-events-speclang-v0
title: "SIP 51: Daemon Events"
version: 0.1.0
description: Event types, event flow, and event filtering in the daemon
category: standard
---

# SIP 51: Daemon Events

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the event system used by speclangd for communication between components.

### Quick Start

```
File change → Event created → Filtered → Routed → Agent notified
```

### Event Types

- **file.changed:** Filesystem modification
- **cascade.started:** New cascade initiated
- **cascade.converged:** Cascade completed
- **agent.spawned:** New agent created
- **pipeline.started:** Build pipeline started

### When to Read This

- **Building agents:** Understanding event handling
- **Debugging:** Tracing event flow
- **Extending:** Adding new event types

### Related SIPs

- SIP 10: Daemon Architecture
- SIP 43: MCP Daemon
- SIP 52: Daemon Locks

## Abstract

This SIP specifies the event types, event flow, and event filtering mechanisms used by the speclangd daemon.

## Specification

### Event Structure

```typescript
interface DaemonEvent {
  event_pk: number;
  event_id: string;
  kind: EventKind;
  timestamp: string;
  source: EventSource;
  payload: Record<string, any>;
  metadata: {
    priority: number;
    retry_count: number;
    cascade_id?: string;
    session_id?: string;
  };
}

type EventKind =
  | "file.changed"
  | "file.deleted"
  | "file.created"
  | "cascade.started"
  | "cascade.converged"
  | "cascade.failed"
  | "agent.spawned"
  | "agent.idle"
  | "agent.error"
  | "pipeline.started"
  | "pipeline.completed"
  | "pipeline.failed"
  | "lock.acquired"
  | "lock.released"
  | "lock.expired"
  | "command.queued"
  | "command.started"
  | "command.completed";

type EventSource = "watcher" | "agent" | "pipeline" | "user" | "system";
```

### Event Types

#### File Events

```yaml
FileEvents:
  file.changed:
    description: File content modified
    payload:
      file_path: string
      kind: "modify"
      diff: string (optional)
      size_bytes: integer
      
  file.created:
    description: New file created
    payload:
      file_path: string
      kind: "create"
      size_bytes: integer
      
  file.deleted:
    description: File deleted
    payload:
      file_path: string
      kind: "delete"
      
  file.renamed:
    description: File moved or renamed
    payload:
      old_path: string
      new_path: string
      kind: "rename"
```

#### Cascade Events

```yaml
CascadeEvents:
  cascade.started:
    description: New cascade initiated
    payload:
      cascade_id: string
      trigger_file: string
      trigger_kind: string
      depth: integer
      
  cascade.converged:
    description: Cascade completed successfully
    payload:
      cascade_id: string
      duration_ms: integer
      files_changed: integer
      agents_involved: string[]
      
  cascade.failed:
    description: Cascade failed
    payload:
      cascade_id: string
      error_code: string
      error_message: string
      failed_at: string
```

#### Agent Events

```yaml
AgentEvents:
  agent.spawned:
    description: New agent session created
    payload:
      session_id: string
      agent_type: string
      parent_session: string (optional)
      
  agent.idle:
    description: Agent has no pending work
    payload:
      session_id: string
      files_processed: integer
      uptime_seconds: integer
      
  agent.error:
    description: Agent encountered error
    payload:
      session_id: string
      error_code: string
      error_message: string
      file_path: string (optional)
```

#### Pipeline Events

```yaml
PipelineEvents:
  pipeline.started:
    description: Build pipeline started
    payload:
      pipeline_id: string
      stages: string[]
      trigger: string
      
  pipeline.completed:
    description: Build completed successfully
    payload:
      pipeline_id: string
      duration_ms: integer
      outputs: string[]
      test_results:
        passed: integer
        failed: integer
        
  pipeline.failed:
    description: Build failed
    payload:
      pipeline_id: string
      failed_stage: string
      error_message: string
      logs: string
```

#### Lock Events

```yaml
LockEvents:
  lock.acquired:
    description: File lock acquired
    payload:
      file_path: string
      session_id: string
      lock_id: string
      expires_at: string
      
  lock.released:
    description: Lock released
    payload:
      file_path: string
      lock_id: string
      duration_seconds: integer
      
  lock.expired:
    description: Lock auto-expired
    payload:
      file_path: string
      lock_id: string
      session_id: string
```

#### Command Events

```yaml
CommandEvents:
  command.queued:
    description: Command added to queue
    payload:
      command_id: string
      action: string
      target_file: string (optional)
      priority: integer
      
  command.started:
    description: Command execution started
    payload:
      command_id: string
      worker_id: string
      
  command.completed:
    description: Command finished
    payload:
      command_id: string
      success: boolean
      result: object (optional)
      duration_ms: integer
```

### Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Event Lifecycle                          │
└─────────────────────────────────────────────────────────────────┘

1. GENERATION
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Watcher  │    │  Agent   │    │ Pipeline │
   └────┬─────┘    └────┬─────┘    └────┬─────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
                 ┌──────────────┐
                 │ Event Creator│
                 └──────┬───────┘
                        │
2. ENRICHMENT          ▼
                 ┌──────────────┐
                 │   Enricher   │ ← Add cascade_id, priority
                 └──────┬───────┘
                        │
3. FILTERING           ▼
                 ┌──────────────┐
                 │   Filters    │ ← Apply rules
                 └──────┬───────┘
                        │
4. ROUTING             ▼
                 ┌──────────────┐
                 │    Router    │ ← Find targets
                 └──────┬───────┘
                        │
5. DELIVERY            ▼
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  Agent   │   │   SSE    │   │   Log    │
   │ Session  │   │  Stream  │   │   File   │
   └──────────┘   └──────────┘   └──────────┘
```

### Event Flow States

```yaml
EventStates:
  pending:
    description: Event created, not processed
    transitions: [processing, dropped]
    
  processing:
    description: Event being handled
    transitions: [completed, failed, retried]
    
  completed:
    description: Event handled successfully
    transitions: []
    
  failed:
    description: Event handling failed
    transitions: [retried]
    
  dropped:
    description: Event filtered out
    transitions: []
    
  retried:
    description: Event being retried
    transitions: [processing, failed]
```

### Event Filtering

```yaml
EventFilters:
  syntax:
    pattern: "event.kind == 'file.changed' && event.payload.file_path startsWith 'specs/'"
    
  built_in:
    ignore_generated:
      condition: "!file_path.startsWith('generated/')"
      
    ignore_tests:
      condition: "!file_path.includes('__tests__')"
      
    debounce_rapid:
      condition: "time_since_last > 100ms"
      
    deduplicate:
      condition: "hash not in recent_hashes"
      
  custom:
    location: .speclang/filters.yaml
    format:
      - name: string
        condition: expression
        action: "drop" | "priority_boost" | "route_to"
```

### Filter Configuration

```yaml
FilterConfig:
  file: .speclang/filters.yaml
  
  rules:
    - name: "ignore-node-modules"
      condition: "file_path contains 'node_modules'"
      action: drop
      
    - name: "prioritize-user-edits"
      condition: "source == 'user'"
      action: priority_boost
      params:
        boost: 50
        
    - name: "debounce-specs"
      condition: "file_path endsWith '.spec'"
      action: debounce
      params:
        window_ms: 200
        
    - name: "route-tests"
      condition: "file_path contains '.test.'"
      action: route_to
      params:
        agent: "TestAgent"
```

### Event Priority

```yaml
EventPriority:
  levels:
    critical: 100        # System events, errors
    high: 75            # User edits
    normal: 50          # Spec expansions
    low: 25             # Generated code
    background: 0       # Cleanup, logging
    
  defaults:
    file.changed: normal
    file.created: normal
    cascade.started: high
    cascade.converged: high
    agent.error: critical
    pipeline.failed: critical
    
  modifiers:
    user_source: +25
    cascade_depth_gt_3: -10
    retry_count_gt_2: +15
```

### Event Delivery

```yaml
EventDelivery:
  methods:
    http_post:
      endpoint: "{agent_url}/event"
      timeout: 5s
      retries: 3
      
    ipc:
      socket: ".speclang/daemon.sock"
      timeout: 1s
      
    sse:
      endpoint: "/events"
      format: text/event-stream
      
  guarantees:
    at_most_once: "Events may be dropped under load"
    ordered: "Events for same file are ordered"
    persisted: "Events stored in SQLite for 7 days"
```

### Event Storage

```sql
CREATE TABLE events (
  event_pk INTEGER PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  source TEXT NOT NULL,
  payload TEXT NOT NULL,
  priority INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  cascade_id TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_kind ON events(kind);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_cascade ON events(cascade_id);
```

### Event Retention

```yaml
EventRetention:
  completed_events: 7 days
  failed_events: 30 days
  pending_events: 1 day (auto-cleanup)
  
  cleanup_schedule: "0 3 * * *"  # 3 AM daily
  
  archive:
    enabled: true
    location: ".speclang/archive/events/"
    format: "jsonl.gz"
```

## References

- @ref:specs/daemon.spec.dir/events
- SIP 10: Daemon Architecture
- SIP 43: MCP Daemon
- SIP 52: Daemon Locks
- SIP 54: SQLite Schema

## Copyright

This document is in the public domain.
