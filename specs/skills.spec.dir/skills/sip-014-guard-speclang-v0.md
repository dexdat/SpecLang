---
name: sip-014-guard-speclang-v0
title: "SIP 14: File Guard System"
version: 0.1.0
description: File ownership enforcement and guard plugin protocol
category: standard
---
# speclang-header lines:216
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 14: File Guard System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP explains the file guard system that enforces ownership rules.

### Quick Start

1. **One File, One Owner:** Each file has exactly one agent owner
2. **Read Any, Write Owned:** Agents can read anything but only write owned files
3. **Guard Plugin:** Intercepts writes at the AI editor level
4. **Orchestrator Exempt:** North Star has full access

### Key Concepts

- **Ownership:** Prevents concurrent write conflicts
- **Access Control:** Read any, write only owned
- **Guard Plugin:** Enforces rules at editor level
- **Locking:** Prevents concurrent writes with auto-expiry

### When to Read This

- **Agent development:** Understand ownership rules
- **Guard plugin implementation:** Enforce access control
- **Debugging:** Investigate blocked writes

### Related SIPs

- SIP 6: Agent Protocol
- SIP 7: Cascade System

## Abstract

This SIP defines the file guard system for SpecLang. The guard plugin enforces file ownership at the AI editor level, ensuring that agents can only write to files they own while being able to read any file in the project.

## Motivation

Multiple AI agents working concurrently need:
- Prevention of write conflicts
- Clear ownership boundaries
- Safe read access to all files
- Enforcement at the editor level

## Rationale

**One File, One Owner:**
- Prevents conflicts
- Clear responsibility
- Easy debugging
- Git-friendly commits

**Guard at Editor Level:**
- Catches violations before they happen
- Works with any AI editor
- Transparent to agents
- Centralized enforcement

**Orchestrator Exempt:**
- North Star coordinates everything
- Needs full access for orchestration
- Can transfer ownership when needed

## Specification

### Ownership Rules

```yaml
FileOwnership:
  rule: "Each file has exactly one owner"
  
  permissions:
    read: "Any agent can read any file"
    write: "Only owner can write"
    delete: "Only owner can delete"
    create: "Only in owned directories"
  
  exceptions:
    orchestrator: "Full access to all files"
```

### Ownership Patterns

| File Pattern | Owner Agent |
|--------------|-------------|
| project.scl | orchestrator |
| specs/**/*.scl | spec-writer |
| specs/**/*.spec.md | spec-writer |
| tests/**/*.test.spec.* | test-writer |
| generated/**/*.go | code-gen-go |
| generated/**/*.ts | code-gen-ts |
| generated/**/*.py | code-gen-py |

### Guard Plugin

```yaml
GuardPlugin:
  name: speclang-guard
  targets: [OpenCode, VS Code, Cursor, Windsurf]
  
  purpose: "Enforce file ownership at AI editor level"
  
  behavior:
    - Intercepts all file write requests
    - Checks if agent owns the file
    - Blocks if not owner
    - Logs all blocked attempts
    - Orchestrator sessions whitelisted
```

### Guard Check Algorithm

```
on_file_write(agent, path):
  session = get_session(agent)
  
  if session.is_orchestrator:
    return ALLOW  # full access
    
  if session.owns(path):
    return ALLOW
    
  log("BLOCKED: {agent} tried to write {path}")
  notify(session.owner, "Unauthorized write attempt")
  return DENY
```

### Locking Mechanism

```yaml
FileLock:
  file: Path
  holder: SessionId
  acquired: DateTime
  expires: DateTime  # auto-expires after 30s
  
LockRules:
  - Required before any write
  - Auto-expires after 30 seconds
  - Only owner can acquire lock
  - Released after write complete
```

### Lock Flow

```
Agent -> Guard: request write
Guard -> LockManager: acquire lock
alt lock available
    LockManager -> Guard: granted
    Guard -> Agent: allow
    Agent -> FileSystem: write
    Agent -> LockManager: release
else lock held
    LockManager -> Guard: denied
    Guard -> Agent: block
end
```

## Violation Handling

### Detection

```yaml
ViolationDetection:
  triggers:
    - Agent attempts write to non-owned file
    - Lock acquisition fails
    - Session timeout during write
    
  logging:
    - agent: which agent attempted
    - file: target file path
    - session: session ID
    - timestamp: when it occurred
    - reason: why it was blocked
```

### Response

```yaml
ViolationResponse:
  immediate:
    - Block the write operation
    - Return error to agent
    - Log the violation
    
  notification:
    - Alert orchestrator
    - Alert file owner (if different)
    
  escalation:
    - Repeated violations: session review
    - Possible session termination
```

### Custom Agents

```yaml
CustomAgentSetup:
  steps:
    1. Create SKILL.md without speclang-agent marker
    2. Agent has full read/write access (not guarded)
    3. Or add speclang-agent: true to restrict
    4. Define owns pattern for file ownership
    
  example:
    ---
    name: my-custom-agent
    speclang-agent: true
    owns: custom/**/*.generated.*
    ---
```

## Examples

### Ownership Registry

```json
{
  "sessions": {
    "sess-001": {
      "agent": "orchestrator",
      "owns": ["project.scl", "build.yaml"]
    },
    "sess-002": {
      "agent": "spec-writer",
      "owns": ["specs/**/*.scl", "specs/**/*.spec.md"]
    },
    "sess-003": {
      "agent": "code-gen-go",
      "owns": ["generated/go/**/*.go"]
    }
  }
}
```

### Access Rules

```yaml
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
    can_write: ["**/*"]
    exempt_from_guard: true
```

### Blocked Write Event

```json
{
  "event": "write_blocked",
  "agent": "spec-writer",
  "file": "generated/go/auth/login.go",
  "reason": "not_owner",
  "owner": "code-gen-go",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## References

- "@ref:speclang/agent-protocol/ownership
- SIP 6: Agent Protocol
- SIP 7: Cascade System

## Copyright

This document is in the public domain.
