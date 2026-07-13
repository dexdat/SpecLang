# speclang-header lines:7
id: "@speclang/roadmap/poc/database"
parent: "@ref:specs/roadmap/pocversion: 0.1.0
layer: 2
short: "SQLite database schema for POC"
tags: [poc, database, sqlite, schema]
---

# POC: Database Schema

SQLite database for tracking POC state.

## Schema Overview

### @poc/database/overview

**Database**: `.speclang/poc.db`

**Tables:**
1. `file_events` - Track file changes
2. `cascades` - Track cascade execution
3. `generated_files` - Track code generation
4. `specs` - Cache parsed specs
5. `tasks` - Track agent tasks

## Table Schemas

### @poc/database/file-events

**Aligned with TypeScript FileEvent interface**

```sql
-- File change events
CREATE TABLE file_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('created', 'modified', 'deleted', 'renamed')),
  path TEXT NOT NULL,
  old_path TEXT, -- For renames
  hash TEXT, -- Content hash for modifications (maps to FileEvent.hash)
  timestamp INTEGER NOT NULL, -- Unix timestamp (ms)
  processed BOOLEAN DEFAULT FALSE,
  cascade_id INTEGER, -- Maps to FileEvent.cascadeId
  FOREIGN KEY (cascade_id) REFERENCES cascades(id)
);

-- Index for unprocessed events
CREATE INDEX idx_unprocessed ON file_events(processed, timestamp);

-- Index by file path
CREATE INDEX idx_file_path ON file_events(path);
```

**Columns:**
| Column | Type | Description | TypeScript Field |
|--------|------|-------------|------------------|
| id | INTEGER | Primary key | - (auto-generated) |
| type | TEXT | created/modified/deleted/renamed | FileEvent.type |
| path | TEXT | Absolute file path | FileEvent.path |
| old_path | TEXT | Previous path (renames only) | FileEvent.oldPath |
| hash | TEXT | MD5 hash of content | FileEvent.hash |
| timestamp | INTEGER | Unix timestamp (ms) | FileEvent.timestamp |
| processed | BOOLEAN | Has been processed | - |
| cascade_id | INTEGER | FK to cascade | FileEvent.cascadeId |

### @poc/database/cascades

```sql
-- Cascade tracking
CREATE TABLE cascades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER,
  depth INTEGER DEFAULT 0,
  files_changed_count INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  error_message TEXT
);

-- Index by status
CREATE INDEX idx_cascade_status ON cascades(status, started_at);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| status | TEXT | running/completed/failed |
| started_at | INTEGER | Unix timestamp (ms) |
| completed_at | INTEGER | Unix timestamp (ms) |
| duration_ms | INTEGER | Total duration |
| depth | INTEGER | Max cascade depth reached |
| files_changed_count | INTEGER | Number of files changed |
| tasks_completed | INTEGER | Successful tasks |
| tasks_failed | INTEGER | Failed tasks |
| error_message | TEXT | Error if failed |

### @poc/database/generated-files

```sql
-- Generated code files
CREATE TABLE generated_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  spec_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  last_modified INTEGER NOT NULL,
  is_symlink BOOLEAN DEFAULT TRUE,
  symlink_target TEXT,
  cascade_id INTEGER,
  FOREIGN KEY (cascade_id) REFERENCES cascades(id)
);

-- Index by spec
CREATE INDEX idx_gen_spec ON generated_files(spec_id, block_id);

-- Index by cascade
CREATE INDEX idx_gen_cascade ON generated_files(cascade_id);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| file_path | TEXT | Path to generated file |
| spec_id | TEXT | Source spec ID |
| block_id | TEXT | Source block ID |
| content_hash | TEXT | MD5 hash of content |
| generated_at | INTEGER | Unix timestamp (ms) |
| last_modified | INTEGER | Unix timestamp (ms) |
| is_symlink | BOOLEAN | Is a symlink |
| symlink_target | TEXT | Symlink target path |
| cascade_id | INTEGER | FK to cascade |

### @poc/database/specs

```sql
-- Cached parsed specs
CREATE TABLE specs (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  short TEXT NOT NULL,
  header_lines INTEGER NOT NULL,
  raw_header TEXT NOT NULL,
  parsed_at INTEGER NOT NULL,
  last_modified INTEGER NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  parse_error TEXT
);

-- Index by file path
CREATE INDEX idx_spec_path ON specs(file_path);

-- Index by validity
CREATE INDEX idx_spec_valid ON specs(is_valid);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Spec ID from header |
| file_path | TEXT | Absolute file path |
| version | TEXT | Version from header |
| short | TEXT | Short description |
| header_lines | INTEGER | Number of header lines |
| raw_header | TEXT | Raw header text |
| parsed_at | INTEGER | Unix timestamp (ms) |
| last_modified | INTEGER | Unix timestamp (ms) |
| is_valid | BOOLEAN | Parse succeeded |
| parse_error | TEXT | Error message if invalid |

### @poc/database/tasks

```sql
-- Agent tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('parse', 'generate', 'write', 'symlink')),
  file_path TEXT NOT NULL,
  cascade_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  result TEXT, -- JSON result
  FOREIGN KEY (cascade_id) REFERENCES cascades(id)
);

-- Index by cascade
CREATE INDEX idx_task_cascade ON tasks(cascade_id, status);

-- Index by status
CREATE INDEX idx_task_status ON tasks(status, created_at);

-- Index by file
CREATE INDEX idx_task_file ON tasks(file_path);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Task UUID |
| type | TEXT | parse/generate/write/symlink |
| file_path | TEXT | Target file path |
| cascade_id | INTEGER | FK to cascade |
| status | TEXT | pending/running/completed/failed |
| created_at | INTEGER | Unix timestamp (ms) |
| started_at | INTEGER | Unix timestamp (ms) |
| completed_at | INTEGER | Unix timestamp (ms) |
| duration_ms | INTEGER | Task duration |
| error_message | TEXT | Error if failed |
| result | TEXT | JSON result data |

## Database Access

### @poc/database/access

```typescript
import { Database } from 'sqlite3';
import { FileEvent, AgentTask, TaskResult, CascadeStats, GeneratedFileRecord, ParsedSpec, DaemonStats, POCError } from './types';

// Complete database schema from earlier in this spec
const SCHEMA_SQL = `
-- File change events
CREATE TABLE IF NOT EXISTS file_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('created', 'modified', 'deleted', 'renamed')),
  path TEXT NOT NULL,
  old_path TEXT, -- For renames
  hash TEXT, -- Content hash for modifications (maps to FileEvent.hash)
  timestamp INTEGER NOT NULL, -- Unix timestamp (ms)
  processed BOOLEAN DEFAULT FALSE,
  cascade_id INTEGER, -- Maps to FileEvent.cascadeId
  FOREIGN KEY (cascade_id) REFERENCES cascades(id) ON DELETE SET NULL
);

-- Cascade tracking
CREATE TABLE IF NOT EXISTS cascades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER,
  depth INTEGER DEFAULT 0,
  files_changed_count INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  error_message TEXT
);

-- Generated code files
CREATE TABLE IF NOT EXISTS generated_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  spec_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  last_modified INTEGER NOT NULL,
  is_symlink BOOLEAN DEFAULT TRUE,
  symlink_target TEXT,
  cascade_id INTEGER,
  FOREIGN KEY (cascade_id) REFERENCES cascades(id) ON DELETE SET NULL
);

-- Cached parsed specs
CREATE TABLE IF NOT EXISTS specs (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  short TEXT NOT NULL,
  header_lines INTEGER NOT NULL,
  raw_header TEXT NOT NULL,
  parsed_at INTEGER NOT NULL,
  last_modified INTEGER NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  parse_error TEXT
);

-- Agent tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('parse', 'generate', 'write', 'symlink')),
  file_path TEXT NOT NULL,
  cascade_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  result TEXT, -- JSON result
  FOREIGN KEY (cascade_id) REFERENCES cascades(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unprocessed ON file_events(processed, timestamp);
CREATE INDEX IF NOT EXISTS idx_file_path ON file_events(path);
CREATE INDEX IF NOT EXISTS idx_cascade_status ON cascades(status, started_at);
CREATE INDEX IF NOT EXISTS idx_gen_spec ON generated_files(spec_id, block_id);
CREATE INDEX IF NOT EXISTS idx_gen_cascade ON generated_files(cascade_id);
CREATE INDEX IF NOT EXISTS idx_spec_path ON specs(file_path);
CREATE INDEX IF NOT EXISTS idx_spec_valid ON specs(is_valid);
CREATE INDEX IF NOT EXISTS idx_task_cascade ON tasks(cascade_id, status);
CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status, created_at);
CREATE INDEX IF NOT EXISTS idx_task_file ON tasks(file_path);
`;

export class POCDatabase {
  private db: Database;
  
  constructor(dbPath: string = '.speclang/poc.db') {
    this.db = new Database(dbPath);
    this.init();
  }
  
  private init(): void {
    try {
      // Enable foreign keys
      this.db.exec('PRAGMA foreign_keys = ON;');
      // Run schema creation
      this.db.exec(SCHEMA_SQL);
      // Clean up any stale cascades from previous crash
      this.cleanupStaleCascades();
    } catch (error: any) {
      throw new POCError(
        'DATABASE_ERROR',
        `Failed to initialize database: ${error.message}`,
        undefined,
        error
      );
    }
  }
  
  // File Events
  insertFileEvent(event: FileEvent): number {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO file_events (type, path, old_path, hash, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(event.type, event.path, event.oldPath, event.hash, event.timestamp);
      return result.lastInsertRowid as number;
    } catch (error: any) {
      throw new POCError(
        'DATABASE_ERROR',
        `Failed to insert file event: ${error.message}`,
        event.path,
        error
      );
    }
  }
  
  getUnprocessedEvents(): FileEvent[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        type,
        path,
        old_path as oldPath,
        hash,
        timestamp,
        cascade_id as cascadeId
      FROM file_events 
      WHERE processed = FALSE 
      ORDER BY timestamp ASC
    `);
    return stmt.all() as FileEvent[];
  }
  
  markEventProcessed(eventId: number, cascadeId: number): void {
    const stmt = this.db.prepare(`
      UPDATE file_events 
      SET processed = TRUE, cascade_id = ? 
      WHERE id = ?
    `);
    stmt.run(cascadeId, eventId);
  }
  
  // Cascades
  createCascade(): number {
    const stmt = this.db.prepare(`
      INSERT INTO cascades (status, started_at)
      VALUES ('running', ?)
    `);
    const result = stmt.run(Date.now());
    return result.lastInsertRowid as number;
  }
  
  completeCascade(cascadeId: number, stats: CascadeStats): void {
    const stmt = this.db.prepare(`
      UPDATE cascades 
      SET status = 'completed',
          completed_at = ?,
          duration_ms = ?,
          depth = ?,
          files_changed_count = ?,
          tasks_completed = ?,
          tasks_failed = ?
      WHERE id = ?
    `);
    stmt.run(
      Date.now(),
      stats.duration,
      stats.depth,
      stats.filesChanged,
      stats.tasksCompleted,
      stats.tasksFailed,
      cascadeId
    );
  }
  
  failCascade(cascadeId: number, error: string): void {
    const stmt = this.db.prepare(`
      UPDATE cascades 
      SET status = 'failed',
          completed_at = ?,
          error_message = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), error, cascadeId);
  }
  
  // Generated Files
  recordGeneratedFile(file: GeneratedFileRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO generated_files 
        (file_path, spec_id, block_id, content_hash, generated_at, last_modified, cascade_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET
        content_hash = excluded.content_hash,
        last_modified = excluded.last_modified,
        cascade_id = excluded.cascade_id
    `);
    stmt.run(
      file.path,
      file.specId,
      file.blockId,
      file.contentHash,
      file.generatedAt,
      file.lastModified,
      file.cascadeId
    );
  }
  
  // Specs
  cacheSpec(spec: ParsedSpec): void {
    const stmt = this.db.prepare(`
      INSERT INTO specs 
        (id, file_path, version, short, header_lines, raw_header, parsed_at, last_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        version = excluded.version,
        short = excluded.short,
        header_lines = excluded.header_lines,
        raw_header = excluded.raw_header,
        parsed_at = excluded.parsed_at,
        last_modified = excluded.last_modified
    `);
    stmt.run(
      spec.id,
      spec.filePath,
      spec.version,
      spec.short,
      spec.headerLines.length,
      spec.headerLines.join('\n'),
      spec.parsedAt,
      Date.now()
    );
  }
  
  getCachedSpec(specId: string): ParsedSpec | undefined {
    const stmt = this.db.prepare('SELECT * FROM specs WHERE id = ?');
    return stmt.get(specId) as ParsedSpec | undefined;
  }
  
  // Tasks
  createTask(task: AgentTask, cascadeId: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, type, file_path, cascade_id, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `);
    stmt.run(task.id, task.type, task.event.path, cascadeId, task.createdAt);
  }
  
  startTask(taskId: string): void {
    const stmt = this.db.prepare(`
      UPDATE tasks SET status = 'running', started_at = ? WHERE id = ?
    `);
    stmt.run(Date.now(), taskId);
  }
  
  completeTask(taskId: string, result: TaskResult): void {
    const stmt = this.db.prepare(`
      UPDATE tasks 
      SET status = 'completed',
          completed_at = ?,
          duration_ms = ?,
          result = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), result.duration, JSON.stringify(result), taskId);
  }
  
  failTask(taskId: string, error: string): void {
    const stmt = this.db.prepare(`
      UPDATE tasks 
      SET status = 'failed',
          completed_at = ?,
          error_message = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), error, taskId);
  }
  
  // Stats
  getStats(): DaemonStats {
    const uptime = this.db.prepare(`
      SELECT COALESCE(MAX(started_at), 0) as start FROM cascades
    `).get() as { start: number };
    
    const events = this.db.prepare('SELECT COUNT(*) as count FROM file_events').get() as { count: number };
    const cascades = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(duration_ms) as avg_duration
      FROM cascades WHERE status = 'completed'
    `).get() as { total: number; avg_duration: number };
    
    const success = this.db.prepare(`
      SELECT 
        CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as rate
      FROM cascades
    `).get() as { rate: number };
    
    return {
      uptime: Date.now() - uptime.start,
      eventsProcessed: events.count,
      avgCascadeDuration: cascades.avg_duration || 0,
      successRate: success.rate || 0,
      filesWatched: 0 // Set by FileWatcher
    };
  }
  
  /**
   * Clean up stale cascades (e.g., after daemon crash)
   * Marks all "running" cascades as "failed"
   */
  cleanupStaleCascades(): void {
    try {
      const stmt = this.db.prepare(`
        UPDATE cascades 
        SET status = 'failed',
            completed_at = ?,
            error_message = 'Daemon crashed or restarted'
        WHERE status = 'running'
      `);
      stmt.run(Date.now());
    } catch (error: any) {
      console.error('[POCDatabase] Failed to cleanup stale cascades:', error.message);
    }
  }
  
  /**
   * Close database connection
   */
  close(): void {
    try {
      this.db.close();
    } catch (error: any) {
      console.error('[POCDatabase] Failed to close database:', error.message);
    }
  }
}
```

## Migration

### @poc/database/migration

**Initial Migration** (version 0.1.0):
```sql
-- All tables created above
-- No data migration needed for POC
```

## Testing

### @poc/database/testing

```typescript
describe('POCDatabase', () => {
  let db: POCDatabase;
  
  beforeEach(() => {
    db = new POCDatabase(':memory:'); // In-memory for tests
  });
  
  it('should insert and retrieve file events', () => {
    const event: FileEvent = {
      type: 'modified',
      path: '/test/spec.md',
      timestamp: Date.now()
    };
    
    const id = db.insertFileEvent(event);
    const events = db.getUnprocessedEvents();
    
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(id);
  });
  
  it('should track cascade lifecycle', () => {
    const cascadeId = db.createCascade();
    
    db.completeCascade(cascadeId, {
      duration: 1000,
      depth: 3,
      filesChanged: 2,
      tasksCompleted: 4,
      tasksFailed: 0
    });
    
    // Verify cascade marked complete
  });
});
```
