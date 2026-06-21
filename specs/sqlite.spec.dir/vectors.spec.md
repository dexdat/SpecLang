# speclang-header lines:11
id: "@speclang/sqlite/vectors"
version: 0.1.0
layer: 2
part: 3/7
tags: [sqlite, vectors, embeddings, semantic-search]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: SQLite vector search
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