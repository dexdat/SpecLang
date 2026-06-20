# speclang-header lines:9
id: "@speclang/opencode-plugin.spec.dir/session-manager"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/architecture"]
tags: [opencode, plugin, session, management]
short: Session management for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Session Manager

## Purpose

Tracks active agent sessions, maps sessions to owned files, manages session timeouts.

## Session Data

```speclang
# @block:opencode-plugin/session-manager/schema @kind:code
```typescript
interface Session {
  id: string;
  agent: string;
  status: 'active' | 'idle' | 'done' | 'error';
  current_file: string | null;
  owned_files: string[];
  created_at: number;
  last_active: number;
}
```
```

## Functions

### createSession(agent)

```speclang
# @block:opencode-plugin/session-manager/create @kind:code
```typescript
async function createSession(agent: string): Promise<string> {
  const sessionId = generateId();
  await db.run(
    `INSERT INTO sessions (session_id, agent, status, created, last_active) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, agent, 'active', Date.now(), Date.now()]
  );
  return sessionId;
}
```
```

### getCurrentSession()

```speclang
# @block:opencode-plugin/session-manager/get-current @kind:code
```typescript
function getCurrentSession(): string {
  // In OpenCode plugin, session is provided by context
  return global.currentSessionId;
}
```
```

### updateSessionActivity(sessionId)

```speclang
# @block:opencode-plugin/session-manager/update-activity @kind:code
```typescript
async function updateSessionActivity(sessionId: string): Promise<void> {
  await db.run(
    `UPDATE sessions SET last_active = ? WHERE session_id = ?`,
    [Date.now(), sessionId]
  );
}
```
```

## References

- "@ref:speclang/opencode-plugin.spec.dir/ownership-guard"
- @ref:speclang/sqlite (for database schema)