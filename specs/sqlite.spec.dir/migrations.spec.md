---
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

**Version 1: Initial Schema**
- Create specs table
- Create sessions table
- Create events table
- Create commands table
- Create locks table
- Create recovery table
- Create specs_fts virtual table for FTS

**Version 2: Cascade Support**
- Add cascade_id to events table
- Add cascade_id to commands table

**Version 3: Vector Search**
- Add content_embedding column to specs
- Create specs_vec virtual table (if using sqlite-vss)

**Version 4: Graph Traversal**
- Create specs_graph table for relationships
- Add indexes for graph queries

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