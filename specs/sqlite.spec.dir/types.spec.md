# speclang-header lines:13
id: "@speclang/sqlite/types"
version: 0.1.0
layer: 2
part: 2
total_parts: 4
tags: [sqlite, types, database]
imports: ["@speclang/sqlite"]
status: draft
project_level: Alpha
agent_support: agent_autonomous
target: src/db/types.ts
short: SQLite database TypeScript types
---

# Database Types

TypeScript type definitions for the SQLite database layer.

## @block:sqlite/types/records

### SpecRecord

Spec metadata extracted from spec headers.

```typescript
interface SpecRecord {
  file_path: string;
  id: string | null;
  parent_id: string | null;
  children: string[];         // JSON array
  owner_session: string | null;
  depends_on: string[];      // JSON array of @refs
  tags: string[];             // JSON array of tags
  short_desc: string | null;
  header_raw: string;         // Full header for FTS
  header_lines: number;
  content_raw: string;        // Full content for FTS
  content_embedding: Buffer | null;  // Vector embedding
  parsed_json: object | null; // Parsed YAML as JSON
  part: number;               // Which part if split
  total_parts: number;        // Total parts
  last_edited: number | null;
  git_commit: string | null;
}
```

### SessionRecord

Session for agent registry.

```typescript
interface SessionRecord {
  id: string;
  agent: string;
  owns: string[];      // JSON array of file paths
  status: 'active' | 'idle' | 'completed';
  last_active: number;
}
```

### EventRecord

Event log for cascade system.

```typescript
interface EventRecord {
  id?: number;         // Auto-increment
  timestamp: number;
  kind: string;
  path?: string | null;
  session?: string | null;
  cascade_id?: string | null;
  details?: object | null;
}
```

### CommandRecord

Command queue for agents.

```typescript
interface CommandRecord {
  id: string;
  session_id?: string | null;
  cascade_id?: string | null;
  action: string;
  target?: string | null;
  payload?: object | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: number;
}
```

### LockRecord

Lock for concurrent file access.

```typescript
interface LockRecord {
  file_path: string;
  session_id: string;
  locked_at: number;
  expires_at: number | null;
}
```

## @block:sqlite/types/search

### SearchResult

FTS search result.

```typescript
interface SearchResult {
  file_path: string;
  id: string | null;
  short_desc: string | null;
  score: number;
  rank: number;
}
```

### SearchOptions

Search options.

```typescript
interface SearchOptions {
  query: string;
  limit?: number;
  tags?: string[];
}
```

## @block:sqlite/types/config

### DatabaseConfig

Database configuration.

```typescript
interface DatabaseConfig {
  path: string;
  wal?: boolean;
  verbose?: boolean;
}
```