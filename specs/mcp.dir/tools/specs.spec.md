# speclang-header lines:7
id: "@speclang/mcp.tools.specs"
parent: @ref:specs/mcp
part: 5/12
siblings:
  next: @ref:specs/mcp.dir/tools/commands
short: Spec-related tools: get spec, find dependents, get tree, validate, split, query errors, versioning, SQL
---
# MCP Spec Tools

### @mcp/tools-specs

```speclang
# @block:mcp/tools-specs @kind:entity
MCP_TOOLS:
  
  speclang_get_spec:
    description: Get full spec by ID or path
    params:
      id: string (optional)
      file_path: string (optional)
    returns:
      Full spec record with parsed_json, tags (joined), deps (joined)
    sql: |
      SELECT s.*, 
             GROUP_CONCAT(st.tag) as tags,
             (SELECT json_group_array(json_object('id', d.id, 'path', d.file_path))
              FROM specs d 
              JOIN spec_deps sd ON d.spec_pk = sd.dst_spec_pk 
              WHERE sd.src_spec_pk = s.spec_pk) as dependencies
      FROM specs s
      LEFT JOIN spec_tags st ON s.spec_pk = st.spec_pk
      WHERE s.id = ? OR s.file_path = ?
      GROUP BY s.spec_pk
    
  speclang_find_dependents:
    description: Find specs that depend on this one
    params:
      id: string
    returns:
      List of specs with dependency relationship
    sql: |
      SELECT s.file_path, s.id, s.short_desc, sd.dep_kind
      FROM specs s
      JOIN spec_deps sd ON s.spec_pk = sd.src_spec_pk
      JOIN specs target ON sd.dst_spec_pk = target.spec_pk
      WHERE target.id = ?
    
  speclang_get_tree:
    description: Get dependency tree recursively
    params:
      id: string
      depth: integer (default 10)
    returns:
      Nested tree structure
    sql: |
      WITH RECURSIVE tree AS (
        SELECT s.spec_pk, s.id, s.file_path, s.short_desc, 0 as level
        FROM specs s
        WHERE s.id = ?
        UNION ALL
        SELECT s.spec_pk, s.id, s.file_path, s.short_desc, t.level + 1
        FROM specs s
        JOIN spec_deps sd ON sd.dst_spec_pk = s.spec_pk
        JOIN tree t ON sd.src_spec_pk = t.spec_pk
        WHERE t.level < ?
      )
      SELECT * FROM tree
    
  speclang_validate:
    description: Validate spec file header and content
    params:
      file_path: string
    returns:
      valid: boolean
      errors: string[]
    implementation: |
      Parse header, validate YAML syntax, check required fields

  speclang_split_if_needed:
    description: Split spec if exceeds token limit
    params:
      file_path: string
      max_tokens: integer (optional, default 4000)
    returns:
      split: boolean
      new_files: string[] (optional)
    implementation: |
      Count tokens, if exceeds limit, split by sections, create new files

  speclang_query_errors:
    description: Query error logs
    params:
      level: string (optional)
      source: string (optional)
      file: string (optional)
      limit: integer (default 50)
    returns:
      List of errors
    sql: |
      SELECT * FROM error_logs
      ORDER BY timestamp DESC
      LIMIT ?

  speclang_create_version:
    description: Create content snapshot
    params:
      file_path: string
      content: string
      cascade_id: string (optional)
      session_id: string (optional)
    returns:
      version_pk: number
    sql: |
      INSERT INTO spec_versions (spec_pk, cascade_id, session_id, content_hash, content_raw)
      SELECT spec_pk, ?, ?, ?, ? FROM specs WHERE file_path = ?
      RETURNING version_pk

  speclang_get_previous_version:
    description: Get previous version for rollback
    params:
      file_path: string
    returns:
      content: string
      version_pk: number
    sql: |
      SELECT content_raw, version_pk
      FROM spec_versions sv
      JOIN specs s ON sv.spec_pk = s.spec_pk
      WHERE s.file_path = ?
      ORDER BY sv.created_at DESC
      LIMIT 1 OFFSET 1

  speclang_query:
    description: Execute a read-only SQL query
    params:
      sql: string
      params: any[] (optional)
    returns:
      rows: any[]
    implementation: |
      Executes SQL query with parameters. Only SELECT statements allowed.
      Returns array of rows.

  speclang_execute:
    description: Execute a write SQL statement
    params:
      sql: string
      params: any[] (optional)
    returns:
      rows_affected: number
    implementation: |
      Executes SQL statement with parameters. Returns number of rows affected.
```

### @mcp/tool-handler-get-tree

```speclang
# @block:mcp/tool-handler-get-tree @kind:code
```typescript
async handleGetTree(args: any) {
  const { id, depth = 10 } = args;
  
  const tree = this.db.prepare(`
    WITH RECURSIVE tree AS (
      SELECT s.spec_pk, s.id, s.file_path, s.short_desc, 0 as level
      FROM specs s
      WHERE s.id = ?
      
      UNION ALL
      
      SELECT s.spec_pk, s.id, s.file_path, s.short_desc, t.level + 1
      FROM specs s
      JOIN spec_deps sd ON sd.dst_spec_pk = s.spec_pk
      JOIN tree t ON sd.src_spec_pk = t.spec_pk
      WHERE t.level < ?
    )
    SELECT * FROM tree
  `).all(id, depth);
  
  return { tree };
}
```
```