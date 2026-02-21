# speclang-header lines:9
id: "@speclang/sqlite"
version: 0.1.0
layer: 0
tags: [sqlite, vector, fts, search, database]
imports: ["@speclang/core", "@speclang/headers"]
status: draft

---

# SQLite + Vector DB

Embedded database for full-text search, vector search, and graph queries.

## Overview

```speclang
# @block:sqlite/overview @kind:note
Every spec is indexed in an embedded SQLite database.

Features:
- Full-text search on spec content
- Vector embeddings for semantic search
- Graph queries for dependencies
- JSON columns for structured queries

Result: impossible to lose anything.
Even with 5000+ specs, any agent finds what it needs in <50ms.
```

---

## Database Mode

### @sqlite/wal

```speclang
# @block:sqlite/wal @kind:entity
WALMode:
  enabled: true
  reason: durability + concurrent reads during writes
  
  benefits:
    - survives crashes without corruption
    - readers don't block writers
    - automatic recovery on startup
    - better performance for our workload
    
  recovery:
    on_startup: check for uncommitted WAL
    action: replay WAL to recover state
    result: resume from last committed state
    
  config:
    PRAGMA journal_mode = WAL
    PRAGMA synchronous = NORMAL
    PRAGMA cache_size = 10000
    PRAGMA temp_store = MEMORY
```

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

---

## Full-Text Search

### @sqlite/fts

```speclang
# @block:sqlite/fts @kind:entity
FullTextSearch:
  description: "Search specs by text content"
  
  what_is_indexed:
    - id
    - short_desc
    - header_raw (full header as text)
    - content_raw (full spec content)
    
  queries:
    - "auth" → all specs mentioning auth
    - "rate limiting" → specs about rate limiting
    - "id:@specs/auth" → exact id match
```

### @sqlite/fts-queries

```speclang
# @block:sqlite/fts-queries @kind:code
```sql
-- Basic text search
SELECT file_path, id, short_desc, bm25(specs_fts) as score
FROM specs_fts
WHERE specs_fts MATCH 'auth login'
ORDER BY score
LIMIT 10;

-- Search with tag filter
SELECT s.file_path, s.id, s.short_desc
FROM specs s, specs_fts f
WHERE s.file_path = f.file_path
  AND s.tags LIKE '%auth%'
  AND specs_fts MATCH 'rate limit'
ORDER BY bm25(specs_fts);
```
```

---

## Vector Search

### @sqlite/vector

```speclang
# @block:sqlite/vector @kind:entity
VectorSearch:
  description: "Semantic search using embeddings"
  
  how_it_works:
    - On spec write, generate embedding
    - Store in content_embedding column
    - Query with embedding similarity
    
  use_cases:
    - "find specs similar to this one"
    - "find specs about authentication"
    - "find specs related to error handling"
    
  implementation:
    - sqlite-vss extension
    - or libsql with built-in vector support
    - or simple cosine similarity in plugin
```

### @sqlite/vector-queries

```speclang
# @block:sqlite/vector-queries @kind:code
```sql
-- Find similar specs (using vss extension)
SELECT file_path, id, short_desc, vss_distance()
FROM specs_vec
WHERE vss_search(content_embedding, ?)
ORDER BY vss_distance()
LIMIT 5;

-- Or with cosine similarity in plugin
-- SELECT file_path FROM specs
-- ORDER BY cosine_similarity(content_embedding, ?)
-- LIMIT 5;
```
```

---

## Graph Queries

### @sqlite/graph

```speclang
# @block:sqlite/graph @kind:entity
GraphQueries:
  description: "Query dependency relationships"
  
  supported:
    - find all dependents
    - find all dependencies
    - get full tree
    - find ancestors to north star
    - detect cycles
```

### @sqlite/graph-queries

```speclang
# @block:sqlite/graph-queries @kind:code
```sql
-- Find all dependents of a spec
SELECT file_path, id, short_desc
FROM specs
WHERE depends_on LIKE '%"@specs/auth"%';

-- Recursive tree query
WITH RECURSIVE tree AS (
  SELECT file_path, id, 0 as depth
  FROM specs
  WHERE file_path = 'specs/auth.spec.yaml'
  
  UNION ALL
  
  SELECT s.file_path, s.id, t.depth + 1
  FROM specs s, tree t
  WHERE s.parent_id = t.id
)
SELECT * FROM tree ORDER BY depth;

-- Find path to north star
WITH RECURSIVE ancestors AS (
  SELECT file_path, id, parent_id, 0 as depth
  FROM specs WHERE file_path = ?
  
  UNION ALL
  
  SELECT s.file_path, s.id, s.parent_id, a.depth + 1
  FROM specs s, ancestors a
  WHERE s.id = a.parent_id
)
SELECT * FROM ancestors WHERE parent_id IS NULL;
```
```

---

## JSON Queries

### @sqlite/json

```speclang
# @block:sqlite/json @kind:entity
JSONQueries:
  description: "Query parsed spec structure"
  
  what_is_stored:
    - parsed_json: full spec parsed as JSON
    - depends_on: JSON array
    - tags: JSON array
    - children: JSON array
    
  benefits:
    - Query specific fields
    - Filter by domain, target, etc.
    - Extract structured data
```

### @sqlite/json-queries

```speclang
# @block:sqlite/json-queries @kind:code
```sql
-- Find specs with specific tag
SELECT file_path, id
FROM specs
WHERE tags LIKE '%"auth"%';

-- Find specs targeting Go
SELECT file_path, id
FROM specs
WHERE json_extract(parsed_json, '$.target') = 'go';

-- Find specs by domain
SELECT file_path, id, short_desc
FROM specs
WHERE json_extract(parsed_json, '$.domain') = 'authentication';

-- Count specs by level
SELECT 
  json_extract(parsed_json, '$.level') as level,
  COUNT(*) as count
FROM specs
GROUP BY level;
```
```

---

## Indexing

### @sqlite/indexing

```speclang
# @block:sqlite/indexing @kind:entity
Indexing:
  when: on every file write
  
  steps:
    1. Parse header
    2. Extract all fields
    3. Read full content
    4. Generate embedding (if vector enabled)
    5. Update SQLite
    6. Update FTS index
    
  performance:
    - <10ms for header-only
    - <100ms with embedding
    - Async embedding possible
```

---

## Tools for Agents

### @sqlite/tools

```speclang
# @block:sqlite/tools @kind:entity
DatabaseTools:
  
  speclang_search:
    params: { query, limit?, tags? }
    returns: matching specs with scores
    uses: FTS + optional tag filter
    
  speclang_semantic_search:
    params: { query, limit? }
    returns: semantically similar specs
    uses: vector embeddings
    
  speclang_find_dependents:
    params: { id }
    returns: all specs depending on this
    uses: graph query
    
  speclang_get_tree:
    params: { path, depth? }
    returns: parent + children tree
    uses: recursive query
    
  speclang_find_by_field:
    params: { field, value }
    returns: specs matching field
    uses: JSON query
```

---

## Vector Embeddings

### @sqlite/embeddings

```speclang
# @block:sqlite/embeddings @kind:entity
EmbeddingGeneration:
  when: on spec write (async option)
  
  model:
    - openai text-embedding-3-small
    - or local model (sentence-transformers)
    - configurable in .speclangrc
    
  dimensions: 1536 (or configurable)
  
  caching:
    - only regenerate if content changed
    - hash comparison before embedding
    
  config:
    embeddings:
      enabled: true
      model: openai/text-embedding-3-small
      dimensions: 1536
      batch_size: 100
```

---

## Performance

### @sqlite/performance

```speclang
# @block:sqlite/performance @kind:entity
Performance:
  database_size:
    - ~1KB per spec (without embedding)
    - ~7KB per spec (with embedding)
    - 10k specs ≈ 70MB
    
  query_speed:
    - FTS search: <10ms
    - Vector search: <50ms
    - Graph query: <20ms
    
  optimization:
    - Index on id, parent_id
    - FTS virtual table
    - Vector index (if extension)
    - Connection pooling
```
