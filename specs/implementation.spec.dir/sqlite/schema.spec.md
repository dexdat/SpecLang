---
id: "@speclang/implementation.sqlite-schema"
version: 0.1.0
layer: 3
parent: ""@ref:speclang/implementation"imports: ["@speclang/sqlite", "@speclang/core", "@speclang/headers"]
tags: [sqlite, schema, implementation, migration, typescript]
short: SQLite database schema definitions and migration scripts for Speclang
project_level: Alpha
agent_support: agent_autonomous
status: stable
---

# SQLite Schema Implementation

Database schema, migration scripts, and initialization code for Speclang SQLite database.

---

## Schema Definition

### @implementation/sqlite/schema-ddl

```speclang
# @block:implementation/sqlite/schema-ddl @kind:code
```sql
CREATE TABLE specs (
  file_path TEXT PRIMARY KEY,
  id TEXT,
  parent_id TEXT,
  children TEXT,           -- JSON array
  owner_session TEXT,
  depends_on TEXT,         -- JSON array
  tags TEXT,               -- JSON array
  short_desc TEXT,
  header_raw TEXT,
  content_raw TEXT,
  content_embedding BLOB, -- optional; NULL if embedding generation fails
  parsed_json TEXT,
  part INTEGER DEFAULT 1,
  total_parts INTEGER DEFAULT 1,
  last_edited INTEGER,
  git_commit TEXT
);

CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  agent TEXT,
  status TEXT,
  current_file TEXT,
  created INTEGER,
  last_active INTEGER
);

CREATE TABLE events (
  event_pk INTEGER PRIMARY KEY,
  cascade_id TEXT,
  depth INTEGER,
  trigger_file TEXT,
  agent TEXT,
  output_files TEXT, -- JSON array
  timestamp INTEGER,
  processed BOOLEAN DEFAULT 0,
  claimed_by TEXT
);

CREATE TABLE commands (
  command_id TEXT PRIMARY KEY,
  cascade_id TEXT,
  action TEXT,
  target_file TEXT,
  session_id TEXT,
  payload TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT,
  created_at INTEGER
);

CREATE TABLE cascades (
  cascade_id TEXT PRIMARY KEY,
  depth INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at INTEGER,
  converged_at INTEGER,
  root_trigger_file TEXT
);

CREATE TABLE file_locks (
  file_path TEXT PRIMARY KEY,
  session_id TEXT,
  lock_token TEXT,
  acquired_at INTEGER DEFAULT (strftime('%s','now')),
  expires_at INTEGER
);

CREATE TABLE recovery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  operation TEXT,
  state TEXT,             -- JSON
  recovered BOOLEAN DEFAULT 0
);
```

---

## Full-Text Search Setup

### @implementation/sqlite/fts-setup

```speclang
# @block:implementation/sqlite/fts-setup @kind:code
```sql
-- Full-text search virtual table
CREATE VIRTUAL TABLE specs_fts USING fts5(
  id, short_desc, header_raw, content_raw,
  content='specs',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync with specs table
CREATE TRIGGER specs_ai AFTER INSERT ON specs BEGIN
  INSERT INTO specs_fts(rowid, id, short_desc, header_raw, content_raw)
  VALUES (new.rowid, new.id, new.short_desc, new.header_raw, new.content_raw);
END;

CREATE TRIGGER specs_ad AFTER DELETE ON specs BEGIN
  DELETE FROM specs_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER specs_au AFTER UPDATE ON specs BEGIN
  DELETE FROM specs_fts WHERE rowid = old.rowid;
  INSERT INTO specs_fts(rowid, id, short_desc, header_raw, content_raw)
  VALUES (new.rowid, new.id, new.short_desc, new.header_raw, new.content_raw);
END;
```

---

## Migration Scripts

### @implementation/sqlite/migration-001-initial

```speclang
# @block:implementation/sqlite/migration-001-initial @kind:code
```sql
-- Migration 001: Initial schema
-- Applied on database creation
-- No downgrade needed (initial)

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA foreign_keys = ON;

-- Tables created above
```

---

## TypeScript Interface

### @implementation/sqlite/typescript-client

```speclang
# @block:implementation/sqlite/typescript-client @kind:code
```typescript
import Database = require('better-sqlite3');
import { readFile } from 'fs/promises';
import * as path from 'path';

export interface SpecRow {
  file_path: string;
  id: string;
  parent_id: string | null;
  children: string[]; // JSON parsed
  owner_session: string | null;
  depends_on: string[];
  tags: string[];
  short_desc: string;
  header_raw: string;
  content_raw: string;
  content_embedding: Buffer | null;
  parsed_json: any;
  part: number;
  total_parts: number;
  last_edited: number;
  git_commit: string | null;
}

export interface SessionRow {
  id: string;
  agent: string;
  owns: string[];
  status: 'active' | 'idle' | 'done' | 'error';
  last_active: number;
}

export class SpeclangDatabase {
  private db!: InstanceType<typeof Database>;

  async initialize(path: string = '.speclang/speclang.db'): Promise<void> {
    this.db = new Database(path);
    
    // Run migrations
    await this.db.exec(await this.loadMigration('001-initial'));
    
    // Enable WAL
    await this.db.exec('PRAGMA journal_mode = WAL');
  }

  private async loadMigration(name: string): Promise<string> {
    // Load migration SQL from filesystem
    const migrationPath = path.join(process.cwd(), 'migrations', `${name}.sql`);
    return await readFile(migrationPath, 'utf-8');
  }
}
```

---

## Usage Examples

### @implementation/sqlite/usage-examples

```speclang
# @block:implementation/sqlite/usage-examples @kind:code
```typescript
// Example: Initialize database and insert a spec
// Example: Initialize database and insert a spec
// import { SpeclangDatabase } from './speclang-db';
// 
// const db = new SpeclangDatabase();
// await db.initialize();
// 
// // Insert a spec
// await db.db.run(
//   `INSERT INTO specs (file_path, id, short_desc, tags) VALUES (?, ?, ?, ?)`,
//   ['specs/auth.spec.md', '@specs/auth', 'Authentication spec', '["auth", "security"]']
// );
// 
// // Search using FTS
// const results = await db.db.all(
//   `SELECT file_path, id, short_desc FROM specs_fts WHERE specs_fts MATCH ?`,
//   ['authentication']
// );
```
