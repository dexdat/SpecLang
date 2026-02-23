---
name: sip-054-sqlite-schema-speclang-v0
title: "SIP 54: SQLite Schema"
version: 0.1.0
description: Complete database schema with all tables, relationships, and indexes
category: standard
---

# SIP 54: SQLite Schema

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the complete SQLite database schema used by SpecLang.

### Quick Start

```
.speclang/specs.db
├── specs (spec files)
├── events (daemon events)
├── commands (command queue)
├── locks (file locks)
└── versions (content history)
```

### Key Tables

- **specs:** Spec file metadata and content
- **events:** Daemon event log
- **commands:** Command queue
- **locks:** Active locks
- **versions:** Content version history

### When to Read This

- **Building tools:** Understanding data model
- **Debugging:** Querying state
- **Extending:** Adding new tables

### Related SIPs

- SIP 11: MCP Tools
- SIP 50: MCP Tools Detailed
- SIP 51: Daemon Events

## Abstract

This SIP specifies the complete SQLite database schema including all tables, relationships, indexes, and constraints.

## Specification

### Database Location

```yaml
DatabaseLocation:
  path: .speclang/specs.db
  
  alternate:
    environment: SPECLANG_DB_PATH
    cli_flag: --db-path
    
  requirements:
    sqlite_version: ">= 3.35.0"
    extensions:
      - fts5 (full-text search)
      - json1 (JSON functions)
```

### Core Tables

#### specs

```sql
CREATE TABLE specs (
  spec_pk INTEGER PRIMARY KEY,
  file_path TEXT UNIQUE NOT NULL,
  id TEXT UNIQUE,
  version TEXT DEFAULT '0.1.0',
  layer INTEGER DEFAULT 5,
  project_level TEXT,
  agent_support TEXT,
  short_desc TEXT,
  content TEXT NOT NULL,
  parsed_json TEXT,
  checksum TEXT NOT NULL,
  file_size INTEGER,
  token_count INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_specs_id ON specs(id);
CREATE INDEX idx_specs_layer ON specs(layer);
CREATE INDEX idx_specs_updated ON specs(updated_at);
CREATE INDEX idx_specs_checksum ON specs(checksum);
```

#### spec_tags

```sql
CREATE TABLE spec_tags (
  tag_pk INTEGER PRIMARY KEY,
  spec_pk INTEGER NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
  UNIQUE(spec_pk, tag)
);

CREATE INDEX idx_spec_tags_tag ON spec_tags(tag);
CREATE INDEX idx_spec_tags_spec ON spec_tags(spec_pk);
```

#### spec_dependencies

```sql
CREATE TABLE spec_dependencies (
  dep_pk INTEGER PRIMARY KEY,
  spec_pk INTEGER NOT NULL,
  depends_on TEXT NOT NULL,
  dep_type TEXT DEFAULT 'reference',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
  UNIQUE(spec_pk, depends_on)
);

CREATE INDEX idx_spec_deps_spec ON spec_dependencies(spec_pk);
CREATE INDEX idx_spec_deps_on ON spec_dependencies(depends_on);
```

### Event Tables

#### events

```sql
CREATE TABLE events (
  event_pk INTEGER PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  source TEXT NOT NULL,
  payload TEXT NOT NULL,
  priority INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  cascade_id TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_kind ON events(kind);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_cascade ON events(cascade_id);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_created ON events(created_at);
```

### Command Tables

#### commands

```sql
CREATE TABLE commands (
  command_pk INTEGER PRIMARY KEY,
  command_id TEXT UNIQUE NOT NULL,
  cascade_id TEXT,
  session_id TEXT,
  action TEXT NOT NULL,
  target_file TEXT,
  payload TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  result TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT
);

CREATE INDEX idx_commands_status ON commands(status);
CREATE INDEX idx_commands_cascade ON commands(cascade_id);
CREATE INDEX idx_commands_session ON commands(session_id);
CREATE INDEX idx_commands_priority ON commands(priority, created_at);
```

### Lock Tables

#### locks

```sql
CREATE TABLE locks (
  lock_pk INTEGER PRIMARY KEY,
  lock_id TEXT UNIQUE NOT NULL,
  lock_type TEXT NOT NULL,
  resource TEXT NOT NULL,
  session_id TEXT NOT NULL,
  lock_token TEXT UNIQUE NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locks_resource ON locks(resource);
CREATE INDEX idx_locks_session ON locks(session_id);
CREATE INDEX idx_locks_expires ON locks(expires_at);
CREATE INDEX idx_locks_type ON locks(lock_type);
```

### Version Tables

#### versions

```sql
CREATE TABLE versions (
  version_pk INTEGER PRIMARY KEY,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  checksum TEXT NOT NULL,
  cascade_id TEXT,
  session_id TEXT,
  agent_type TEXT,
  change_type TEXT,
  diff TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_versions_path ON versions(file_path);
CREATE INDEX idx_versions_cascade ON versions(cascade_id);
CREATE INDEX idx_versions_created ON versions(created_at);
```

### Error Tables

#### errors

```sql
CREATE TABLE errors (
  error_pk INTEGER PRIMARY KEY,
  error_id TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  file_path TEXT,
  line_number INTEGER,
  message TEXT NOT NULL,
  stack_trace TEXT,
  context TEXT,
  resolved INTEGER DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_errors_level ON errors(level);
CREATE INDEX idx_errors_source ON errors(source);
CREATE INDEX idx_errors_file ON errors(file_path);
CREATE INDEX idx_errors_resolved ON errors(resolved);
CREATE INDEX idx_errors_created ON errors(created_at);
```

### Session Tables

#### sessions

```sql
CREATE TABLE sessions (
  session_pk INTEGER PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  agent_type TEXT NOT NULL,
  parent_session TEXT,
  status TEXT DEFAULT 'active',
  cascade_id TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  files_processed INTEGER DEFAULT 0,
  files_written INTEGER DEFAULT 0,
  metadata TEXT
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_cascade ON sessions(cascade_id);
CREATE INDEX idx_sessions_agent ON sessions(agent_type);
```

### Cascade Tables

#### cascades

```sql
CREATE TABLE cascades (
  cascade_pk INTEGER PRIMARY KEY,
  cascade_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'running',
  depth INTEGER DEFAULT 0,
  trigger_file TEXT,
  trigger_kind TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  converged_at TEXT,
  failed_at TEXT,
  files_changed INTEGER DEFAULT 0,
  agents_involved TEXT,
  error_message TEXT
);

CREATE INDEX idx_cascades_status ON cascades(status);
CREATE INDEX idx_cascades_started ON cascades(started_at);
```

### FTS Tables

#### specs_fts

```sql
CREATE VIRTUAL TABLE specs_fts USING fts5(
  id,
  short_desc,
  content,
  content='specs',
  content_rowid='spec_pk',
  tokenize='porter unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER specs_ai AFTER INSERT ON specs BEGIN
  INSERT INTO specs_fts(rowid, id, short_desc, content)
  VALUES (new.spec_pk, new.id, new.short_desc, new.content);
END;

CREATE TRIGGER specs_ad AFTER DELETE ON specs BEGIN
  INSERT INTO specs_fts(specs_fts, rowid, id, short_desc, content)
  VALUES('delete', old.spec_pk, old.id, old.short_desc, old.content);
END;

CREATE TRIGGER specs_au AFTER UPDATE ON specs BEGIN
  INSERT INTO specs_fts(specs_fts, rowid, id, short_desc, content)
  VALUES('delete', old.spec_pk, old.id, old.short_desc, old.content);
  INSERT INTO specs_fts(rowid, id, short_desc, content)
  VALUES (new.spec_pk, new.id, new.short_desc, new.content);
END;
```

### Metadata Tables

#### config

```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Default config values
INSERT INTO config (key, value) VALUES
  ('schema_version', '1'),
  ('db_created_at', datetime('now')),
  ('quiet_period_seconds', '30'),
  ('lock_timeout_seconds', '30');
```

#### metrics

```sql
CREATE TABLE metrics (
  metric_pk INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  value REAL NOT NULL,
  labels TEXT,
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_name ON metrics(name);
CREATE INDEX idx_metrics_recorded ON metrics(recorded_at);
```

### Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    Entity Relationships                          │
└─────────────────────────────────────────────────────────────────┘

specs ─────────┬──────────> spec_tags
              │
              ├──────────> spec_dependencies
              │
              └──────────> versions
                   
sessions ─────┬──────────> commands
              │
              ├──────────> events
              │
              └──────────> locks
                   
cascades ─────┬──────────> sessions
              │
              ├──────────> events
              │
              └──────────> commands
                   
specs_fts <───┴────────── specs (virtual table)
```

### Index Strategy

```yaml
IndexStrategy:
  primary_keys:
    - All tables have INTEGER PRIMARY KEY
    - Auto-incrementing (rowid alias)
    
  unique_constraints:
    - file_path in specs
    - id in specs (nullable)
    - event_id, command_id, lock_id, etc.
    
  foreign_keys:
    - Enabled via PRAGMA foreign_keys = ON
    - CASCADE delete where appropriate
    
  covering_indexes:
    - Include frequently accessed columns
    - Optimize common query patterns
    
  fts_indexes:
    - specs_fts for full-text search
    - Porter stemming enabled
```

### Migration System

```sql
CREATE TABLE migrations (
  migration_pk INTEGER PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Example migration
-- V001_initial_schema.sql
-- V002_add_cascade_tables.sql
-- V003_add_metrics_table.sql
```

### Common Queries

```sql
-- Find spec by ID
SELECT * FROM specs WHERE id = @id;

-- Search specs
SELECT s.*, bm25(specs_fts) as score
FROM specs s
JOIN specs_fts f ON f.rowid = s.spec_pk
WHERE f MATCH @query
ORDER BY score
LIMIT @limit;

-- Get dependents
SELECT s.* FROM specs s
JOIN spec_dependencies d ON d.spec_pk = s.spec_pk
WHERE d.depends_on = @id;

-- Pending events
SELECT * FROM events
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC
LIMIT 1;

-- Active locks
SELECT * FROM locks
WHERE expires_at > datetime('now');

-- Recent errors
SELECT * FROM errors
WHERE resolved = 0
ORDER BY created_at DESC
LIMIT 50;
```

### Cleanup Jobs

```sql
-- Clean expired locks
DELETE FROM locks WHERE expires_at < datetime('now');

-- Clean old events
DELETE FROM events 
WHERE status IN ('completed', 'dropped')
AND created_at < datetime('now', '-7 days');

-- Clean old versions
DELETE FROM versions
WHERE created_at < datetime('now', '-30 days');

-- Archive old metrics
DELETE FROM metrics
WHERE recorded_at < datetime('now', '-90 days');
```

### Database Settings

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;  -- 64MB
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;  -- 256MB
PRAGMA foreign_keys = ON;
```

## References

- @ref:specs/database
- SIP 11: MCP Tools
- SIP 50: MCP Tools Detailed
- SIP 51: Daemon Events

## Copyright

This document is in the public domain.
