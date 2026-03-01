# speclang-header lines:12
id: "@speclang/roadmap/poc/file-watcher"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "File system watcher implementation"
tags: [poc, file-watcher, daemon, inotify]
---

# POC: File Watcher

Reliable file system watching for spec changes.

## Requirements

### @poc/file-watcher/core

**Watch Configuration:**
- Watch directory: `specs/`
- Recursive: Yes
- Ignore patterns: `*.tmp`, `*~`, `.git/`

**Event Types:**
- `created`: New file added
- `modified`: File content changed
- `deleted`: File removed
- `renamed`: File moved

**Event Format:**
```typescript
interface FileEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  timestamp: number;
  oldPath?: string; // for renames
}
```

## Implementation

### @poc/file-watcher/impl

**Options:**
1. **Node.js fs.watch** - Native, but platform differences
2. **chokidar** - Battle-tested, cross-platform

**Recommendation**: Use `chokidar` for reliability.

**Dependencies:**
```json
{
  "dependencies": {
    "chokidar": "^3.5.3"
  }
}
```

**Code Structure:**
```typescript
import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { access, constants } from 'fs/promises';
import { FileEvent, FileEventType } from './types';
import { POC_CONSTANTS } from './constants';
```

## Testing

### @poc/file-watcher/testing

**Test Cases:**
1. Create file → detect creation
2. Edit file → detect modification
3. Delete file → detect deletion
4. Rapid edits → debounced to single event
5. Multiple files → all detected
