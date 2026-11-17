# speclang-header lines:14
id: "@speclang/sqlite/migrations"
version: 0.1.0
layer: 2
part: 3
total_parts: 4
tags: [sqlite, migrations, database]
imports: ["@speclang/sqlite"]
status: draft
project_level: Alpha
agent_support: agent_autonomous
target: src/db/migrations.ts
short: SQLite database migrations
---

# Database Migrations

Versioned migrations for the SQLite database schema.

## @block:sqlite/migrations/overview

### Migration System

```speclang
MigrationSystem:
  current_version: tracks schema version
  migrations: ordered list of changes
  apply: runs pending migrations
  rollback: reverts migrations (optional)
```

## @block:sqlite/migrations/schema

### Migration Interface

```typescript
interface Migration {
  version: number;
  name: string;
  up: (db: Database) => void;
  down?: (db: Database) => void;
}
```

### Migrations

The list below mirrors `src/db/migrations.ts` (the implementation is authoritative).
Earlier drafts listed "Version 3: Vector Search" and "Version 4: Graph Traversal"; neither
ever shipped as its own migration (`content_embedding` is created in version 1), so they are
no longer listed as applied versions.

**Version 1: Initial Schema**
- Create specs table
- Create sessions table
- Create events table (includes `cascade_id`)
- Create commands table (includes `cascade_id`)
- Create locks table
- Create recovery table
- Create specs_fts virtual table for FTS

**Version 2: Add events.processed**
- Add `processed INTEGER NOT NULL DEFAULT 0` to events
- Create index `idx_events_processed_timestamp (processed, timestamp)`

**Version 3: Cascades**
- Create the `cascades` table used by the MCP cascade / dashboard / status / SSE tools
- Column set is the union of what the code actually reads and writes:
  `root_trigger` + `created_at` (mcp `tools/cascade.ts`), `started_at` + `converged_at`
  (SSE convergence polling, mcp server), `root_trigger_file` (original signed DDL)
- Create indexes on `status`, `started_at`, `converged_at`, `root_trigger_file`
- Generated to `src/migrations/003_cascades.sql`

## @block:sqlite/migrations/cascades-ddl

### Cascades Table DDL

Source of `src/migrations/003_cascades.sql`. Keep the column set in sync with
`migrations.ts` version 3 — a mismatch means the MCP tools 500 at runtime.

```sql
CREATE TABLE IF NOT EXISTS cascades (
  cascade_id TEXT PRIMARY KEY,
  depth INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at INTEGER,
  created_at INTEGER,
  converged_at INTEGER,
  root_trigger TEXT,
  root_trigger_file TEXT
);

CREATE INDEX IF NOT EXISTS idx_cascades_status ON cascades(status);
CREATE INDEX IF NOT EXISTS idx_cascades_started_at ON cascades(started_at);
CREATE INDEX IF NOT EXISTS idx_cascades_converged_at ON cascades(converged_at);
CREATE INDEX IF NOT EXISTS idx_cascades_root_trigger_file ON cascades(root_trigger_file);
```

## @block:sqlite/migrations/api

### Migration Functions

```typescript
// Run all pending migrations
function migrate(db: Database): { applied: number; currentVersion: number }

// Get current schema version
function getCurrentVersion(db: Database): number

// Check if migration needed
function needsMigration(db: Database): boolean
```