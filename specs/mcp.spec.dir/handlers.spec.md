---
id: "@specs/mcp/tools/handlers"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/tools/*.ts
tags: [mcp, tools, handlers]
short: Tool handler implementations
---

# MCP Tool Handlers

Individual tool handlers for MCP protocol tools.

## Handlers

### SearchToolHandler (search.ts)
- `handleSearch` - FTS5 full-text search with fallback
- `handleSemanticSearch` - Vector similarity search

### SpecsToolHandler (specs.ts)
- Spec CRUD: get, create, update, list

### LocksToolHandler (locks.ts)
- Lock operations: lock, unlock, check, force-unlock

### CascadeToolHandler (cascade.ts)
- Cascade: status, trigger, abort, converge

### IndexToolHandler (index-tools.ts)
- Index: refresh, stats, validate

### DashboardToolHandler (dashboard.ts)
- Dashboard queries: events, agents, stats, queue

### CommandsToolHandler (commands.ts)
- Command queue: query, insert, update, delete, batch
