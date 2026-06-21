# speclang-header lines:11
id: "@speclang/sqlite/fts"
version: 0.1.0
layer: 2
part: 2/7
tags: [sqlite, fts, full-text-search]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: SQLite full-text search
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