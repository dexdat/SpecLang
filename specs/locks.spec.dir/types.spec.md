# speclang-header lines:10
id: "@speclang/locks/types"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [locks, types, file-locks]
parent: "@ref:speclang/lockspart: 1/2
short: "Lock types and structures for file locking"
---
# Lock Types

Locks prevent concurrent modifications to spec files during cascades. This spec defines lock types and their structures.

## @block:lock-types @kind:entity
Lock types categorize locks by scope and behavior:

- **FileLock**: Exclusive lock on a single spec file
- **DirectoryLock**: Lock on a directory (recursive or shallow)
- **ReadLock**: Shared lock allowing multiple readers
- **WriteLock**: Exclusive lock for modification

## @block:lock-metadata @kind:entity
Lock metadata tracks lock state:

```yaml
lock_id: string           # Unique identifier (UUID)
file_path: string         # Absolute path to locked file/directory
process_id: number        # PID of holding process
timestamp: datetime       # When lock acquired
timeout: number          # Seconds before auto-release (default: 30)
lock_type: string        # One of: file, directory, read, write
```

## @block:lock-structure @kind:code
Lock structure persisted in `.speclang/locks/` directory:

```typescript
interface Lock {
  id: string;
  path: string;
  pid: number;
  acquiredAt: Date;
  timeout: number;
  type: 'file' | 'directory' | 'read' | 'write';
}
```

## @block:lock-file-format @kind:entity
Lock files are JSON files named `<lock_id>.lock` in `.speclang/locks/`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "path": "/path/to/specs/auth.spec.md",
  "pid": 12345,
  "acquired_at": "2025-02-22T10:30:00Z",
  "timeout": 30,
  "type": "file"
}
```