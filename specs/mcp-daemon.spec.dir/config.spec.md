# speclang-header lines:15
id: "@speclang/mcp-daemon/config"
version: 0.1.0
layer: 2
tags: [mcp, daemon, http, sse, enterprise]
imports: ["@speclang/core", "@speclang/daemon", "@speclang/deployment"]
status: draft
project_level: Alpha
agent_support: agent_assisted
parent: "@speclang/mcp-daemon"
part: 2/2
siblings:
  prev: "@speclang/mcp-daemon/architecture"
short: MCP Daemon Configuration
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
