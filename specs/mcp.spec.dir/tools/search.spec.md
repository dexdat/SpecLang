# speclang-header lines:11
id: "@speclang/mcp.tools.search"
version: 0.1.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, tools, search]
parent: "@ref:speclang/mcp"
part: 4/12
short: "Search tools: speclang_search and speclang_semantic_search"
---
# MCP Search Tools

### @mcp/tools-search

```speclang
# @block:mcp/tools-search @kind:entity
MCP_TOOLS:
  
  speclang_search:
    description: Full-text search using FTS5
    params:
      query: string (FTS5 query syntax)
      limit: integer (default 10)
      tags: string[] (optional filter)
    returns:
      - file_path
      - id
      - short_desc
      - score (bm25)
    sql: |
      SELECT s.file_path, s.id, s.short_desc, bm25(specs_fts) as score
      FROM specs s
      JOIN specs_fts f ON s.spec_pk = f.rowid
      WHERE specs_fts MATCH ?
      ORDER BY score
      LIMIT ?
    
  speclang_semantic_search:
    description: Vector similarity search
    params:
      query_embedding: number[] (1536 dims)
      limit: integer (default 5)
    returns:
      - file_path
      - id
      - short_desc
      - distance
    implementation: |
      Cosine similarity on content_embedding column
      Requires sqlite-vss extension or computed in TypeScript
```

### @mcp/tool-handler-search

```speclang
# @block:mcp/tool-handler-search @kind:code
```typescript
async handleSearch(args: any) {
  const { query, limit = 10, tags } = args;
  
  let sql = `
    SELECT s.file_path, s.id, s.short_desc, 
           bm25(specs_fts) as score
    FROM specs_fts f
    JOIN specs s ON f.rowid = s.spec_pk
    WHERE f MATCH ?
  `;
  const params: any[] = [query];
  
  if (tags && tags.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM spec_tags st 
      WHERE st.spec_pk = s.spec_pk AND st.tag IN (${tags.map(() => '?').join(',')})
    )`;
    params.push(...tags);
  }
  
  sql += ` ORDER BY score LIMIT ?`;
  params.push(limit);
  
  const results = this.db.prepare(sql).all(...params);
  return results;
}
```
```