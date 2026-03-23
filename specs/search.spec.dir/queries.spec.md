# speclang-header lines:12
id: "@speclang/search/queries"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [search, queries, fts, semantic]
parent: ""@ref:speclang/search"part: 1/2
siblings:
  next: ""@ref:speclang/search/indexing"short: "Search query types: FTS, semantic, tag, layer"
---
# Search Queries

## @block:search/queries-fts @kind:entity

```speclang
# @block:search/queries-fts @kind:entity
FTS_QUERY:
  description: Full-text search using SQLite FTS5
  params:
    query: string (FTS5 query syntax)
    limit: integer (default 10)
    tags: string[] (optional filter)
  returns:
    - file_path: string
    - id: string (spec ID)
    - short_desc: string
    - score: float (bm25 ranking)
  sql: |
    SELECT s.file_path, s.id, s.short_desc, bm25(specs_fts) as score
    FROM specs s
    JOIN specs_fts f ON s.spec_pk = f.rowid
    WHERE specs_fts MATCH ?
    ORDER BY score
    LIMIT ?
```

## @block:search/queries-semantic @kind:entity

```speclang
# @block:search/queries-semantic @kind:entity
SEMANTIC_QUERY:
  description: Vector similarity search using embeddings
  params:
    query_embedding: number[] (1536 dimensions)
    limit: integer (default 5)
  returns:
    - file_path: string
    - id: string
    - short_desc: string
    - distance: float (cosine distance)
  implementation: |
    Cosine similarity on content_embedding column
    Requires sqlite-vss extension or computed in TypeScript
```

## @block:search/queries-tag @kind:entity

```speclang
# @block:search/queries-tag @kind:entity
TAG_QUERY:
  description: Search specs by tag
  params:
    tag: string
  returns:
    - file_path: string
    - id: string
    - short_desc: string
  sql: |
    SELECT s.file_path, s.id, s.short_desc
    FROM specs s
    JOIN spec_tags st ON s.spec_pk = st.spec_pk
    WHERE st.tag = ?
```

## @block:search/queries-layer @kind:entity

```speclang
# @block:search/queries-layer @kind:entity
LAYER_QUERY:
  description: Search specs by layer
  params:
    layer: integer (depth in tree)
  returns:
    - file_path: string
    - id: string
    - short_desc: string
  sql: |
    SELECT file_path, id, short_desc
    FROM specs
    WHERE layer = ?
```

## @block:search/queries-combined @kind:entity

```speclang
# @block:search/queries-combined @kind:entity
COMBINED_QUERY:
  description: Combine multiple filters (tags, layer, FTS)
  params:
    query: string (optional FTS query)
    tags: string[] (optional)
    layer: integer (optional)
    limit: integer (default 10)
  returns:
    - file_path: string
    - id: string
    - short_desc: string
    - score: float (if FTS)
  implementation: |
    Build SQL dynamically based on provided filters.
    Join specs, specs_fts, spec_tags as needed.
```