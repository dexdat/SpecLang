# speclang-header lines:23
# id: @specs/tools
# version: 1.0.0
# layer: 5

# OpenCode Tools

Custom tools for agent use in Speclang.

## What are Tools?

Tools are functions that agents can call:
- Query the database
- Search specs
- Validate files
- Split specs
- Find dependencies

## Tool Structure

Each tool is defined in a markdown file with frontmatter:

```yaml
---
name: tool-name
description: What the tool does
category: file | git | sqlite | search
---

Tool implementation and usage documentation.
```

## Available Tools

### Search Tools

- `speclang_search` - Full-text search specs
- `speclang_semantic_search` - Vector search
- `speclang_find_dependents` - Find what depends on file
- `speclang_get_tree` - Get dependency tree

### Validation Tools

- `speclang_validate` - Validate current file
- `speclang_validate_header` - Check header format
- `speclang_validate_refs` - Check references

### Management Tools

- `speclang_split_if_needed` - Split oversized specs
- `speclang_get_size` - Estimate spec size
- `speclang_create_dir` - Create .spec.dir/ folder

### Query Tools

- `speclang_find_by_field` - Query by field
- `speclang_get_agent_status` - Check agent status
- `speclang_get_cascade_status` - Check cascade

### Git Tools

- `speclang_git_history` - Get file history
- `speclang_git_dependents` - Find git dependents
- `speclang_rollback` - Rollback file

## Tool Examples

### speclang_search
```typescript
const results = await mcp.call("speclang_search", {
  query: "auth login",
  limit: 10,
  tags: ["auth"]
});
```

### speclang_find_dependents
```typescript
const dependents = await mcp.call("speclang_find_dependents", {
  id: "@specs/auth"
});
```

### speclang_split_if_needed
```typescript
const result = await mcp.call("speclang_split_if_needed", {
  path: "specs/auth.spec.yaml",
  content: specContent
});

if (result.split) {
  for (const file of result.files) {
    await write(file.path, file.content);
  }
}
```

## Tool Implementation

Tools are implemented via:
- **MCP** - Model Context Protocol
- **SQLite** - Direct queries
- **Git** - Git operations
- **File system** - File operations

## Adding New Tools

1. Create a new `.md` file in this directory
2. Define the tool interface
3. Implement in MCP server or plugin
4. Document usage
5. Restart OpenCode to load

## References

- SIP 4: Reference System
- SIP 5: Splitting and Sizing
- MCP Documentation