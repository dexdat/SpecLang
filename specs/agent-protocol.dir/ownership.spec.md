# speclang-header lines:11
id: "@speclang/agent-protocol/ownership"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
tags: [agents, protocol, ownership, access, guard, locking]
short: File Ownership and Access Control
parent: "@ref:speclang/agent-protocol"
part: 2/2
---

## File Ownership

### @protocol/ownership

```speclang
# @block:protocol/ownership @kind:entity
FileOwnership:
  file: Path
  owner: SessionId
  lock: Lock?
  
Rules:
  - Each file has exactly one owner
  - Owner can read and write
  - Non-owners can only read
  - Lock prevents concurrent writes
```

### @protocol/ownership-patterns

```speclang
# @block:protocol/ownership-patterns @kind:table
| File Pattern | Owner Agent |
|--------------|-------------|
| project.scl | orchestrator |
| specs/**/*.scl | spec-writer |
| tests/**/*.test.spec.* | test-writer |
| generated/**/*.go | code-gen-go |
| generated/**/*.ts | code-gen-ts |
| generated/**/*.py | code-gen-py |
```

### @protocol/ownership-example

```speclang
# @block:protocol/ownership-example @kind:code
```yaml
# .speclang/ownership.json
{
  "sessions": {
    "sess-001": {
      "agent": "orchestrator",
      "owns": ["project.scl", "build.yaml"]
    },
    "sess-002": {
      "agent": "spec-writer",
      "owns": ["specs/**/*.scl"]
    },
    "sess-003": {
      "agent": "code-gen-go",
      "owns": ["generated/go/**/*.go"]
    }
  }
}
```
```

---

## Access Control

### @protocol/access

```speclang
# @block:protocol/access @kind:entity
AccessLevel:
  read: any file in project
  write: only owned files
  delete: only owned files
  create: only in owned directories
  
Enforcement:
  - Guard plugin intercepts all file operations
  - Blocked operations return error, logged
  - Orchestrator session is exempt (full access)
```

### @protocol/access-rules

```speclang
# @block:protocol/access-rules @kind:code
```yaml
# access rules enforced by guard plugin
rules:
  - agent: spec-writer
    can_read: ["**/*"]
    can_write: ["specs/**/*.scl", "specs/**/*.spec.*"]
    cannot_write: ["generated/**", "project.scl"]
    
  - agent: code-gen-go
    can_read: ["**/*"]
    can_write: ["generated/go/**"]
    cannot_write: ["specs/**", "tests/**"]
    
  - agent: orchestrator
    can_read: ["**/*"]
    can_write: ["**/*"]  # full access
    exempt_from_guard: true
```
```

---

## Communication

### @protocol/events

```speclang
# @block:protocol/events @kind:entity
AgentEvent:
  kind: create | modify | delete
  path: FilePath
  session: SessionId?
  timestamp: DateTime
  
EventRouting:
  1. speclangd detects file change
  2. speclangd identifies file owner
  3. speclangd sends event to owner's session
  4. Agent receives and processes
```

### @protocol/event-format

```speclang
# @block:protocol/event-format @kind:code
```json
{
  "event": "modify",
  "path": "specs/auth.scl",
  "timestamp": "2024-01-15T10:30:00Z",
  "session": "sess-002",
  "diff": {
    "added": 15,
    "removed": 3,
    "blocks_changed": ["auth/login", "auth/user"]
  }
}
```
```

---

## Guard Plugin

### @protocol/guard

```speclang
# @block:protocol/guard @kind:entity
GuardPlugin:
  name: speclang-guard
  targets: OpenCode, VS Code, Cursor, Windsurf
  
  purpose: enforce file ownership at AI editor level
  
  behavior:
    - Intercepts all file write requests from agents
    - Checks if agent owns the file
    - Blocks if not owner, allows if owner
    - Logs all blocked attempts
    - Orchestrator sessions are whitelisted
```

### @protocol/guard-check

```speclang
# @block:protocol/guard-check @kind:pseudocode
```
on_file_write(agent, path):
  session = get_session(agent)
  
  if session.is_orchestrator:
    return ALLOW  # full access
    
  if session.owns(path):
    return ALLOW
    
  log("BLOCKED: {agent} tried to write {path}")
  return DENY
```
```

### @protocol/guard-skill-marker

```speclang
# @block:protocol/guard-skill-marker @kind:note
Skills that should be guarded include a marker:

```yaml
# SKILL.md
---
speclang-agent: true
session-type: spec-writer
owns: specs/**/*.scl
---
```

The guard only applies to skills with `speclang-agent: true`.
User-created skills without this marker are not restricted.
```

---

## Locking

### @protocol/lock

```speclang
# @block:protocol/lock @kind:entity
FileLock:
  file: Path
  holder: SessionId
  acquired: DateTime
  expires: DateTime
  
LockRules:
  - Required before any write
  - Auto-expires after 30s
  - Only owner can acquire lock
  - Lock released after write complete
```

### @protocol/lock-flow

```speclang
# @block:protocol/lock-flow @kind:diagram
```mermaid
sequenceDiagram
    Agent->>Guard: request write to file
    Guard->>LockManager: acquire lock
    alt lock available
        LockManager-->>Guard: lock granted
        Guard->>Agent: allow write
        Agent->>FileSystem: write file
        Agent->>LockManager: release lock
    else lock held
        LockManager-->>Guard: lock denied
        Guard->>Agent: block write
    end
```
```

---

## Custom Agents

### @protocol/custom

```speclang
# @block:protocol/custom @kind:entity
CustomAgent:
  description: "Users can create their own agents"
  
  steps:
    1. Create SKILL.md without speclang-agent marker
    2. Agent has full read/write access (not guarded)
    3. Or, add speclang-agent: true to restrict
    4. Define owns pattern for file ownership
    
  example:
    ```yaml
    ---
    name: my-custom-agent
    speclang-agent: true
    owns: custom/**/*.generated.*
    ---
    ```
```