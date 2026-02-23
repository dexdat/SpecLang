# speclang-header lines:12
id: "@speclang/opencode-plugin.spec.dir/ownership-guard"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/session-manager"]
tags: [opencode, plugin, ownership, locks]
short: Ownership guard for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Ownership Guard

## Purpose

Ensures only the session that owns a file can modify it. Uses lock tokens and expiration.

## Ownership Rules

1. A file can be owned by at most one session at a time.
2. Ownership is acquired when a session first edits a file.
3. Ownership expires after a timeout (e.g., 5 minutes).
4. Ownership can be released manually when session becomes idle.

## Lock Schema

```speclang
# @block:opencode-plugin/ownership-guard/schema @kind:code
```typescript
interface FileLock {
  file_path: string;
  session_id: string;
  lock_token: string;
  acquired_at: number;
  expires_at: number;
}
```
```

## Functions

### ownsFile(sessionId, filePath)

```speclang
# @block:opencode-plugin/ownership-guard/owns-file @kind:code
```typescript
async function ownsFile(sessionId: string, filePath: string): Promise<boolean> {
  const lock = await db.get(
    `SELECT * FROM file_locks WHERE file_path = ? AND session_id = ? AND expires_at > ?`,
    [filePath, sessionId, Date.now()]
  );
  return !!lock;
}
```
```

### acquireOwnership(sessionId, filePath)

```speclang
# @block:opencode-plugin/ownership-guard/acquire @kind:code
```typescript
async function acquireOwnership(sessionId: string, filePath: string): Promise<void> {
  const lockToken = generateToken();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  await db.run(
    `INSERT OR REPLACE INTO file_locks (file_path, session_id, lock_token, acquired_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [filePath, sessionId, lockToken, Date.now(), expiresAt]
  );
}
```
```

### releaseOwnership(sessionId)

```speclang
# @block:opencode-plugin/ownership-guard/release @kind:code
```typescript
async function releaseOwnership(sessionId: string): Promise<void> {
  await db.run(
    `DELETE FROM file_locks WHERE session_id = ?`,
    [sessionId]
  );
}
```
```

## References

- @ref:speclang/opencode-plugin.spec.dir/session-manager
- @ref:speclang/sqlite (for file_locks table)