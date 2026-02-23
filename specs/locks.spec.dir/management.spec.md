# speclang-header lines:12
id: "@speclang/locks/management"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [locks, management, acquisition, release]
parent: "@ref:speclang/locks"
part: 2/2
short: "Lock acquisition, release, and management operations"
---
# Lock Management

Operations for acquiring, releasing, and managing locks during spec cascades.

## @block:lockstoolhandler @kind:entity
```text
export class LocksToolHandler {
```

## @block:lock-acquisition @kind:process
Lock acquisition flow:

1. **Check existing locks**: Scan `.speclang/locks/` for conflicting locks on same path
2. **Validate timeout**: Remove stale locks (timestamp + timeout < now)
3. **Create lock file**: Write lock metadata to `<lock_id>.lock`
4. **Log acquisition**: Append to `.speclang/locks.log`
5. **Return lock ID**: For later release

## @block:lock-release @kind:process
Lock release flow:

1. **Verify ownership**: Ensure calling process matches lock PID (or override)
2. **Delete lock file**: Remove `<lock_id>.lock`
3. **Log release**: Append to `.speclang/locks.log`
4. **Notify waiters**: If any processes waiting for lock

## @block:deadlock-detection @kind:entity
Deadlock detection parameters:

- **Timeout-based**: Locks auto-release after timeout
- **Process health**: Monitor PID existence; clean up if process dead
- **Cycle detection**: Graph of lock dependencies (future)

## @block:lock-timeout @kind:entity
Default timeout values:

- **FileLock**: 30 seconds
- **DirectoryLock**: 60 seconds
- **ReadLock**: 15 seconds (short-lived reads)
- **WriteLock**: 45 seconds (longer modifications)

## @block:lock-logging @kind:entity
Lock logging format in `.speclang/locks.log`:

```
[2025-02-22T10:30:00Z] ACQUIRE lock_id=550e8400... path=/specs/auth.spec.md pid=12345 type=file
[2025-02-22T10:30:15Z] RELEASE lock_id=550e8400... path=/specs/auth.spec.md pid=12345
[2025-02-22T10:30:20Z] TIMEOUT lock_id=deadbeef... path=/specs/dir pid=9999
```