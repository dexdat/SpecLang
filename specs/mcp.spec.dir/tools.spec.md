# speclang-header lines:10
id: "@specs/mcp/tools"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/tools/index.ts
tags: [mcp, tools, registry]
short: MCP tool registry and handlers
---

# MCP Tool Registry

Registry for all MCP protocol tools.

## Class: MCPToolRegistry

### Constructor

```typescript
constructor(db: SpecLangDB, config: MCPServerConfig)
```

Initializes all tool handlers.

### registerTools(server)

Registers tools with MCP server.

## Tools

### Search Tools
- `speclang_search` - Full-text FTS5 search
- `speclang_semantic_search` - Vector similarity

### Spec CRUD Tools
- `speclang_get_spec`
- `speclang_create_spec`
- `speclang_update_spec`
- `speclang_list_specs`

### Lock Tools
- `speclang_lock`, `speclang_unlock`
- `speclang_check_lock`, `speclang_force_unlock`

### Cascade Tools
- `speclang_cascade_status`
- `speclang_cascade_trigger`
- `speclang_cascade_abort`, `speclang_cascade_converge`

### Index Tools
- `speclang_index_refresh`, `speclang_index_stats`, `speclang_index_validate`

### Graph Tools
- `speclang_get_dependencies`, `speclang_get_dependents`, `speclang_impact_analysis`

### Dashboard Tools
- `speclang_query_events`, `speclang_get_agent_statuses`, `speclang_get_project_stats`

### Command Queue Tools
- `speclang_query_commands`, `speclang_insert_command`, `speclang_update_command`
