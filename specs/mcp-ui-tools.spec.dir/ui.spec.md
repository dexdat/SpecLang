# speclang-header lines:13
id: "@speclang/mcp-ui-tools/ui"
version: 0.1.0
layer: 2
imports: ["@speclang/mcp", "@speclang/sqlite", "@speclang/cascade", "@speclang/agent-protocol"]
tags: [mcp, ui, dashboard, monitoring]
status: draft
short: UI integration for MCP dashboard monitoring tools
project_level: Alpha
agent_support: agent_assisted
parent: "speclang/mcp-ui-tools"

---
# MCP UI Tools - UI Integration

Integration of monitoring tools with the system dashboard UI.

---

## Integration with Existing MCP Tools

### @mcp-ui-tools/integration

```speclang
# @block:mcp-ui-tools/integration @kind:note
These tools complement existing MCP tools:
- speclang_get_status: high-level status (already exists)
- speclang_query_commands: pending commands (already exists)
- speclang_query_events: detailed event history (new)
- speclang_get_agent_statuses: detailed agent status (new)
- speclang_get_project_stats: project metrics (new)
- speclang_get_queue_status: queue details (new)
- speclang_subscribe_events: SSE stream (enhancement)

Dashboard uses these tools to provide comprehensive monitoring.
```

---

## References

### @mcp-ui-tools/refs

```speclang
# @block:mcp-ui-tools/refs @kind:table
| Spec | Purpose | Relationship |
|-------|---------|--------------|
| @ref:specs/mcp | MCP server architecture | Base implementation |
| @ref:specs/sqlite | Database schema | SQL table definitions |
| @ref:specs/cascade | Cascade events | Event data source |
| @ref:specs/agent-protocol | Agent sessions | Agent status data |
| @ref:specs/ui | Dashboard UI | Consumer of these tools |
```

---

## Next Steps

### @mcp-ui-tools/next-steps

```speclang
# @block:mcp-ui-tools/next-steps @kind:table
| Priority | Task | Owner |
|----------|------|-------|
| High | Implement tool handlers in MCP server | MCP Team |
| High | Update SQL schema migration | Database Team |
| Medium | Add SSE stream enhancements | MCP Team |
| Low | Add system metrics collection | System Team |
```