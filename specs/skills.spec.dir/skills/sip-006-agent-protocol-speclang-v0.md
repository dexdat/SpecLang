---
name: sip-006-agent-protocol-speclang-v0
title: "SIP 6: Agent Protocol"
version: 0.1.0
description: Multi-agent coordination and file ownership
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 6: Agent Protocol

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines multi-agent coordination and file ownership.

### Quick Start

1. **Core Agents:** north-star, spec-writer, code-gen, test-writer
2. **File Ownership:** One agent per file
3. **Access:** Read any, write only owned
4. **Communication:** Via SQLite commands table

### Example

```yaml
# Session
id: sess-abc-123
agent: spec-writer
owns: [specs/auth.spec.yaml]
status: active
```

### Key Concepts

- **Ownership:** Prevents conflicts
- **North Star:** Orchestrator, exempt from rules
- **Events:** File changes trigger agents
- **Guard Plugin:** Enforces ownership

### When to Read This

- **Agent development:** Understand lifecycle
- **Debugging:** Check ownership
- **Security:** Understand access control

### Related SIPs

- SIP 7: Cascade System
- SIP 8: Configuration

## Abstract

This SIP defines the agent protocol for Speclang. Agents are AI assistants that own specific files, communicate via events, and coordinate through the SQLite database.

## Motivation

Multiple AI agents need to:
- Work concurrently
- Not overwrite each other
- Maintain state
- Recover from failures

## Rationale

**One File, One Agent:**
- Prevents conflicts
- Clear ownership
- Easy debugging
- Git-friendly

**Event-Driven:**
- File changes trigger agents
- No polling
- Efficient
- Reactive

**SQLite Coordination:**
- Single source of truth
- ACID guarantees
- Queryable state
- Survives crashes

## Specification

### Agent Types

**Core Agents:**

| Agent | Purpose | Owns |
|-------|---------|------|
| `north-star` | Orchestrator | project.scl (exempt) |
| `spec-writer` | Expand specs | specs/**/*.spec.* |
| `code-gen` | Generate code | specs/**/*.go.spec, *.ts.spec, etc. |
| `test-writer` | Write tests | specs/**/*.test.spec.* |

**Support Agents:**

| Agent | Purpose | Owns |
|-------|---------|------|
| `back-sync` | Sync code→specs | Any code spec |
| `adversarial-reviewer` | Review specs | *.review.spec.* |
| `recovery-agent` | Handle failures | .speclang/recovery/*.spec.* |
| `spec-validator` | Validate | (read-only) |

### Agent Session

**Lifecycle:**
```
Created → Idle → Active → Done/Error
```

**Fields:**
```yaml
session:
  id: uuid
  agent: agent-type
  owns: [file-patterns]
  created: timestamp
  last_active: timestamp
  status: idle | active | done | error
  error: error-message?
```

### File Ownership

**Rule:** One owner per file

**Determination:**
1. Check header `owned_by`
2. Match file pattern
3. Default to spec-writer

**Examples:**
```yaml
# project.scl
owned_by: north-star

# specs/auth.spec.yaml  
owned_by: spec-writer

# auth.go.spec
owned_by: code-gen-go
```

### Access Control

**Permissions:**

| Action | Owner | Non-Owner | Orchestrator |
|--------|-------|-----------|--------------|
| read | yes | yes | yes |
| write | yes | no | yes |
| delete | yes | no | yes |
| create in dir | yes | no | yes |

**Guard Plugin:**
- Intercepts all writes
- Checks ownership
- Blocks unauthorized
- Logs violations

**Example:**
```
spec-writer tries to write to auth.go.spec
→ Guard blocks
→ Error: "Not owner"
→ Logged
→ Notified
```

### Event System

**Event Types:**

| Event | Description |
|-------|-------------|
| `file.edited` | File content changed |
| `file.created` | New file |
| `file.deleted` | File removed |
| `agent.finished` | Agent done processing |
| `cascade.start` | Cascade beginning |
| `cascade.end` | Cascade complete |

**Event Flow:**
```
File Change
  ↓
Daemon detects
  ↓
Router finds owner
  ↓
Event sent to agent
  ↓
Agent processes
  ↓
Agent writes files
  ↓
Git commit
  ↓
New events trigger
```

### Agent Communication

**Via SQLite:**

```sql
-- Commands table
INSERT INTO commands (session_id, action, target, payload)
VALUES ('sess-001', 'expand', 'specs/auth', {...});

-- Agent polls
SELECT * FROM commands 
WHERE session_id = 'sess-001' 
AND status = 'pending';
```

**Via MCP:**

```typescript
// Agent calls MCP tool
await mcp.call("speclang_search", {query: "auth"});

// Or commands
await mcp.call("speclang_expand", {path: "specs/auth"});
```

### Session Management

**Spawn:**
```python
def spawn_agent(agent_type, file):
    session = Session(
        id=uuid(),
        agent=agent_type,
        owns=[file],
        status='idle'
    )
    db.insert(session)
    return session
```

**Route:**
```python
def route_event(event):
    owner = find_owner(event.file)
    session = get_session(owner)
    session.status = 'active'
    session.last_active = now()
    notify(session, event)
```

**Complete:**
```python
def agent_complete(session, summary):
    session.status = 'done'
    db.update(session)
    git_commit(session.owns, summary)
    notify_north_star(session, summary)
```

## Workflow

### Normal Flow

```
1. User edits project.scl
2. inotify: file.edited
3. Router → North Star
4. North Star reads project.scl
5. North Star writes specs/auth.spec.yaml
6. inotify: file.edited
7. Router → spec-writer
8. Spec writer expands auth
9. Spec writer writes auth/entities.spec.yaml
10. Git commit
11. Repeat...
```

### Concurrent Flow

```
User edits project.scl
  ↓
North Star spawns
  ↓
Writes auth.spec.yaml
  ↓
Spec Writer A spawns (auth.spec.md)
Spec Writer B spawns (user.spec.md)
  ↓ (concurrent)
A writes auth/entities.spec.yaml
B writes user/profile.spec.yaml
  ↓
Both commit
  ↓
Both trigger Code Gen
  ↓ (concurrent)
Code Gen A (auth)
Code Gen B (user)
  ↓
Both commit
  ↓
Cascade continues...
```

### Conflict Resolution

**Lock Conflicts:**
```
Agent A wants to write file X
Agent B wants to write file X
  ↓
First acquires lock
Second waits
  ↓
First completes
Second proceeds
```

**SQLite Serialization:**
```sql
BEGIN TRANSACTION;
-- Lock row
SELECT * FROM specs WHERE file_path = ? FOR UPDATE;
-- Write
UPDATE specs SET ...;
COMMIT;
```

## Recovery

**Agent Failure:**
```
Agent timeout
  ↓
Kill session
  ↓
Release locks
  ↓
Notify North Star
  ↓
Recovery agent spawns
  ↓
Assess damage
  ↓
Rollback or retry
```

**Cascading Failures:**
```
Test fails
  ↓
Recovery agent
  ↓
Find last good commit
  ↓
Revert affected files
  ↓
Regenerate code
  ↓
Tests pass?
  Yes → Resume
  No → Escalate
```

## Integration

**With OpenCode:**
- Agent spawns as subagent
- Uses OpenCode events
- Integrates with guard plugin

**With Git:**
- One commit per agent finish
- Atomic per file
- Clear history

**With SQLite:**
- Sessions tracked
- Events logged
- State persisted

## Examples

### Session Example

```yaml
# Session record in SQLite
id: sess-abc-123
agent: spec-writer
owns:
  - specs/auth.spec.yaml
  - specs/auth/*.spec.yaml
created: 2024-01-15T10:30:00Z
last_active: 2024-01-15T10:35:00Z
status: done
error: null
```

### Event Example

```json
{
  "type": "file.edited",
  "file": "specs/auth.spec.yaml",
  "timestamp": "2024-01-15T10:30:00Z",
  "session": "sess-abc-123",
  "diff": "..."
}
```

### Command Example

```yaml
# commands table
id: cmd-xyz-789
session_id: sess-abc-123
action: expand
target: specs/auth/entities
payload:
  parent: specs/auth.spec.yaml
status: pending
created_at: 2024-01-15T10:30:00Z
```

## References

- SIP 1: How to Write a SIP
- SIP 7: Cascade System
- SIP 8: Configuration

## Copyright

This document is in the public domain.