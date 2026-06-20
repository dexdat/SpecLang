# speclang-header lines:14
id: "@speclang/sqlite/schema"
version: 0.1.0
layer: 2
part: 1
total_parts: 4
tags: [sqlite, schema, database]
imports: ["@speclang/sqlite"]
status: draft
project_level: Alpha
agent_support: agent_autonomous
target: src/db/index.ts
short: SQLite database schema - Main SpecLangDB class and operations
---
## Database Schema

### @sqlite/schema

```speclang
# @block:sqlite/schema @kind:entity
Database:
  location: .speclang/speclang.db
  mode: WAL (Write-Ahead Logging)
  size: few MB even for 10k files
  durability: survives crashes, power loss, panics
  
Tables:
  specs:
    file_path: TEXT PRIMARY KEY
    id: TEXT                    # @project/feature
    parent_id: TEXT             # @ref to parent (for .dir children)
    children: JSON              # array of child @refs
    owner_session: TEXT
    depends_on: JSON            # array of @refs
    refs: JSON                  # outgoing links
    tags: JSON                  # array of strings
    short_desc: TEXT
    header_raw: TEXT            # full header for FTS
    header_lines: INTEGER       # line count from declaration
    content_raw: TEXT           # full content for FTS
    content_embedding: BLOB     # vector embedding
    parsed_json: JSON           # parsed YAML as JSON
    part: INTEGER               # which part if split
    total_parts: INTEGER        # total parts
    last_edited: INTEGER
    git_commit: TEXT
    
  sessions:
    id: TEXT PRIMARY KEY
    agent: TEXT
    owns: JSON
    status: TEXT
    last_active: INTEGER
    
  events:
    id: INTEGER PRIMARY KEY
    timestamp: INTEGER
    kind: TEXT
    path: TEXT
    session: TEXT
    cascade_id: TEXT              # optional, links events to a cascade
    details: JSON
    
  commands:
    id: TEXT PRIMARY KEY
    session_id: TEXT
    cascade_id: TEXT              # optional, links commands to a cascade
    action: TEXT
    target: TEXT
    payload: JSON
    status: TEXT
    created_at: INTEGER
    
  recovery:
    id: INTEGER PRIMARY KEY
    timestamp: INTEGER
    operation: TEXT
    state: JSON
    recovered: BOOLEAN
```

### @sqlite/schema-sql

```speclang
# @block:sqlite/schema-sql @kind:code
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
  content_embedding BLOB,
  parsed_json TEXT,
  part INTEGER DEFAULT 1,
  total_parts INTEGER DEFAULT 1,
  last_edited INTEGER,
  git_commit TEXT
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE specs_fts USING fts5(
  id, short_desc, header_raw, content_raw,
  content='specs',
  content_rowid='rowid'
);

-- Vector search (using sqlite-vss or libsql)
-- CREATE VIRTUAL TABLE specs_vec USING vss0(
--   content_embedding(1536)
-- );
```
```