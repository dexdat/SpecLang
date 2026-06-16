# speclang-header lines:7
id: "@speclang/roadmap/poc/file-watcher"
parent: ""@ref:specs/roadmap/poc"version: 0.1.0
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
import { POC_CONSTANTS } from './types';

/**
 * File system watcher with debouncing
 * Emits: 'change', 'ready', 'error'
 */
export class FileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Start watching a directory
   * @param directory - Directory to watch
   * @returns Promise that resolves when watcher is ready
   */
  async watch(directory: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.watcher = watch(directory, {
        ignored: POC_CONSTANTS.IGNORE_PATTERNS,
        persistent: true,
        ignoreInitial: false  // Process existing files on startup
      });
      
      // Handle file changes
      this.watcher.on('change', (path: string) => {
        this.handleFileChange('modified', path);
      });
      
      this.watcher.on('add', (path: string) => {
        this.handleFileChange('created', path);
      });
      
      this.watcher.on('unlink', (path: string) => {
        this.handleFileChange('deleted', path);
      });
      
      // Handle ready event
      this.watcher.on('ready', () => {
        this.emit('ready');
        resolve();
      });
      
      // Handle errors
      this.watcher.on('error', (error: Error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }
  
  /**
   * Stop watching
   * @returns Promise that resolves when watcher is closed
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
  
  /**
   * Handle file change with debouncing
   */
  private handleFileChange(type: FileEventType, path: string): void {
    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(path);
    }
    
    // Set new debounced timer
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(path);
      
      // RACE CONDITION FIX: Verify file still exists before emitting
      // File may have been deleted during debounce period
      if (type !== 'deleted') {
        try {
          await access(path, constants.F_OK);
        } catch {
          // File no longer exists, skip emitting
          console.log(`[FileWatcher] File deleted during debounce: ${path}`);
          return;
        }
      }
      
      const event: FileEvent = {
        type,
        path,
        timestamp: Date.now()
      };
      
      this.emit('change', event);
    }, POC_CONSTANTS.DEBOUNCE_MS);
    
    this.debounceTimers.set(path, timer);
  }
}
```

## Testing

### @poc/file-watcher/testing

**Test Cases:**
1. Create file → detect creation
2. Edit file → detect modification
3. Delete file → detect deletion
4. Rapid edits → debounced to single event
5. Multiple files → all detected
