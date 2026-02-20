# speclang-header
id: "@speclang/mcp-daemon"
version: 0.1.0
layer: 0
tags: [mcp, daemon, http, sse, enterprise]
imports: ["@speclang/core", "@speclang/daemon", "@speclang/deployment"]
status: draft

---

# MCP Daemon

The enterprise speclangd daemon with HTTP/SSE server and queue management.

## Overview

```speclang
# @block:mcp/overview @kind:note
speclangd is an optional daemon for enterprise mode:

- HTTP server with SSE for events
- MCP-compatible API
- Queue visibility and control
- Worktree management
- Agent control commands

Exposes queue status to the main editor.
Enables testing while building next version.
```

---

## Architecture

### @mcp/arch

```speclang
# @block:mcp/arch @kind:diagram
```mermaid
flowchart TD
    subgraph Daemon[speclangd]
        W[File Watcher<br/>inotify/fsnotify]
        Q[Event Queue]
        S[SSE Stream]
        H[HTTP API]
        M[MCP Server]
    end
    
    subgraph OpenCode
        P[Speclang Plugin]
        E[Editor UI]
    end
    
    W -->|file events| Q
    Q -->|broadcast| S
    S -->|SSE| P
    P <-->|HTTP| H
    E <-->|MCP| M
    
    H -->|commands| Q
    M -->|tools| Q
```
```

---

## HTTP API

### @mcp/http

```speclang
# @block:mcp/http @kind:entity
HTTPServer:
  port: 8765 (configurable)
  host: localhost
  
  endpoints:
    GET /status
      returns: { mode, queue_depth, files_watching, uptime }
      
    GET /events
      returns: SSE stream of all events
      
    GET /queue
      returns: { pending: [], in_progress: [], completed: [] }
      
    POST /command
      body: { command, params }
      commands: pause, resume, priority, worktree
      
    GET /worktrees
      returns: list of active worktrees
      
    POST /worktree/create
      body: { name, base_commit? }
      returns: { path, ready }
      
    POST /worktree/{name}/test
      body: { filter? }
      returns: { test_id, status }
```

### @mcp/http-examples

```speclang
# @block:mcp/http-examples @kind:code
```bash
# Get status
curl http://localhost:8765/status
# {"mode":"enterprise","queue_depth":12,"files_watching":847,"uptime":3600}

# Get queue
curl http://localhost:8765/queue
# {"pending":["auth.scl","user.scl"],"in_progress":["api.scl"],"completed":45}

# Pause queue
curl -X POST http://localhost:8765/command \
  -d '{"command":"pause"}'
# {"ok":true,"queue_paused":true}

# Create worktree
curl -X POST http://localhost:8765/worktree/create \
  -d '{"name":"test-v1.2"}'
# {"path":".speclang/worktrees/test-v1.2","ready":true}

# Run tests in worktree
curl -X POST http://localhost:8765/worktree/test-v1.2/test
# {"test_id":"test-001","status":"running"}
```
```

---

## SSE Events

### @mcp/sse

```speclang
# @block:mcp/sse @kind:entity
SSEEventStream:
  endpoint: GET /events
  format: text/event-stream
  
  event_types:
    file.changed:
      data: { path, kind, timestamp }
      
    queue.updated:
      data: { depth, added, removed }
      
    agent.started:
      data: { session, agent, file }
      
    agent.finished:
      data: { session, summary, files_written }
      
    convergence.detected:
      data: { quiet_seconds, files_changed }
      
    pipeline.started:
      data: { stages }
      
    pipeline.finished:
      data: { success, duration }
```

### @mcp/sse-example

```speclang
# @block:mcp/sse-example @kind:code
```
event: file.changed
data: {"path":"specs/auth.scl","kind":"modify","timestamp":1705312200}

event: queue.updated
data: {"depth":5,"added":["user.scl"],"removed":[]}

event: agent.started
data: {"session":"sess-003","agent":"spec-writer","file":"specs/auth.scl"}

event: agent.finished
data: {"session":"sess-003","summary":"expanded auth entities","files_written":2}

event: convergence.detected
data: {"quiet_seconds":30,"files_changed":12}
```
```

---

## MCP Tools

### @mcp/tools

```speclang
# @block:mcp/tools @kind:entity
MCPTools:
  
  speclang_queue_status:
    description: "Get current queue status"
    returns: { pending, in_progress, completed, depth }
    
  speclang_queue_pause:
    description: "Pause queue processing"
    returns: { ok, paused_at }
    
  speclang_queue_resume:
    description: "Resume queue processing"
    returns: { ok, resumed_at }
    
  speclang_worktree_create:
    params: { name, base_commit? }
    description: "Create isolated worktree"
    returns: { path, ready }
    
  speclang_worktree_test:
    params: { worktree, filter? }
    description: "Run tests in worktree"
    returns: { test_id, status, results }
    
  speclang_worktree_deploy:
    params: { worktree, target }
    description: "Deploy worktree version"
    returns: { deployment_id, status }
    
  speclang_agent_control:
    params: { session, command }
    commands: pause, resume, split, re-expand, priority
    description: "Control a specific agent"
    returns: { ok, new_status }
```

---

## Queue Management

### @mcp/queue

```speclang
# @block:mcp/queue @kind:entity
EventQueue:
  max_size: 1000 (configurable)
  
  states:
    pending: waiting to be processed
    in_progress: being processed by agent
    completed: finished
    failed: error occurred
    
  priority:
    - user edits: high
    - spec expansions: normal
    - code generation: normal
    - tests: low
    
  commands:
    pause: stop processing new items
    resume: continue processing
    priority: move item to front
    clear: remove all pending
```

---

## Worktree Isolation

### @mcp/worktree

```speclang
# @block:mcp/worktree @kind:entity
WorktreeManagement:
  purpose: "Test versions while building next"
  
  location: .speclang/worktrees/{name}/
  
  workflow:
    1. Create worktree from commit
    2. Run tests in worktree
    3. If tests pass, merge
    4. If tests fail, fix in main
    
  use_cases:
    - Test v1.2 while building v1.3
    - Run integration tests in parallel
    - Deploy specific version
    
  commands:
    create: new isolated worktree
    test: run tests in worktree
    merge: merge worktree back
    delete: remove worktree
```

### @mcp/worktree-flow

```speclang
# @block:mcp/worktree-flow @kind:diagram
```mermaid
sequenceDiagram
    Main as Main Work
    WT as Worktree test-v1.2
    DA as Daemon
    
    Main->>DA: building v1.3
    DA->>WT: create worktree from v1.2 commit
    DA->>WT: run tests in worktree
    WT-->>DA: tests pass
    DA->>Main: notify tests passed
    Main->>DA: continue building v1.3
```
```

---

## Agent Control

### @mcp/agent-control

```speclang
# @block:mcp/agent-control @kind:entity
AgentControl:
  description: "One agent controls another"
  
  who_can_control:
    - orchestrator (primary) can control all
    - north star can control sub-agents
    
  commands:
    pause: stop agent, keep state
    resume: continue agent
    split: force split of current file
    re-expand: regenerate from parent
    priority: change queue priority
    kill: terminate agent (rollback)
    
  safety:
    - only orchestrator can kill
    - pause/resume logged for audit
    - control commands require reason
```

---

## Binary

### @mcp/binary

```speclang
# @block:mcp/binary @kind:entity
BinarySpec:
  name: speclangd
  size: ~5-10MB
  languages: Go or Rust
  
  platforms:
    - Linux (amd64, arm64)
    - macOS (amd64, arm64)
    - Windows (amd64)
    
  commands:
    speclangd start
    speclangd stop
    speclangd status
    speclangd config
    
  config:
    location: .speclang/daemon.json
    fields:
      - port: HTTP port
      - queue_size: max queue depth
      - worktrees: max worktrees
      - log_level: debug/info/warn
```
