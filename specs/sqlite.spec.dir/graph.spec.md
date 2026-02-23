# speclang-header lines:14
id: "@speclang/sqlite/graph"
version: 0.1.0
layer: 2
part: 4
total_parts: 4
tags: [sqlite, graph, dependencies]
imports: ["@speclang/sqlite"]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: SQLite graph queries
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