# speclang-header lines:12
id: "@speclang/mcp-overview"
parent: "@ref:speclang/mcp"
siblings:
  next: "@ref:specs/mcp.spec.dir/architecture"
short: MCP server overview
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, speclang]
version: 0.1.0
layer: 3
---
# MCP Server Overview

```speclang
# @block:mcp/overview @kind:note
MCP Server (~600 lines TypeScript):
- Standalone server, not tied to OpenCode
- Provides SQLite access via MCP tools
- Works with ANY MCP-compatible editor (Cursor, Claude Code, Zed, etc.)
- Three run modes: editor-initiated, remote, server
- Commands table for inter-agent communication
- Error logs accessible via MCP tools

Location: speclang-mcp.ts
```

## Tool Definitions

```speclang
# @block:mcp/tools @kind:table
| Tool Name | Description | Parameters | Returns |
|-----------|-------------|------------|---------|
| sqlite_query | Execute SQL SELECT query | `{ "query": "string", "params": [] }` | `{ "rows": [], "columns": [] }` |
| sqlite_exec | Execute SQL INSERT/UPDATE/DELETE | `{ "query": "string", "params": [] }` | `{ "changes": number, "lastInsertRowid": number }` |
| spec_search | Full-text search across specs | `{ "query": "string", "limit": number }` | `{ "results": [] }` |
| spec_get | Get spec by ID | `{ "id": "string" }` | `{ "spec": {} }` |
| spec_validate | Validate spec file | `{ "path": "string" }` | `{ "valid": boolean, "errors": [] }` |
| cascade_trigger | Trigger cascade on spec | `{ "spec_id": "string" }` | `{ "triggered": boolean, "cascade_id": "string" }` |
| cascade_status | Get cascade status | `{ "cascade_id": "string" }` | `{ "status": "string", "progress": number }` |
| commands_list | List pending commands | `{ "limit": number }` | `{ "commands": [] }` |
| commands_add | Add command to queue | `{ "command": "string", "data": {} }` | `{ "id": "string" }` |
| commands_mark_done | Mark command as done | `{ "id": "string" }` | `{ "success": boolean }` |
| logs_query | Query error logs | `{ "level": "string", "since": "timestamp" }` | `{ "logs": [] }` |
```

## Request/Response Schemas

```speclang
# @block:mcp/request-schema @kind:code
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: {
    arguments?: Record<string, any>;
    [key: string]: any;
  };
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: {
    content?: Array<{
      type: "text";
      text: string;
    }>;
    [key: string]: any;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

## Authentication Flows

```speclang
# @block:mcp/auth-flows @kind:note
Authentication supports three modes:

1. **API Key** (for remote access):
   - Client includes `X-API-Key` header
   - Server validates against stored keys
   - Keys can be scoped to specific tools

2. **Token-based** (for editor integration):
   - Editor provides token via MCP handshake
   - Token validated against session store
   - Auto-refresh with refresh tokens

3. **No auth** (local development):
   - When running in development mode
   - Only accepts connections from localhost
   - No authentication required

Security considerations:
- All traffic over HTTPS in production
- API keys rotated monthly
- Token expiration: 24 hours
- Rate limiting per client
```

## References

```speclang
# @block:mcp/references @kind:note
Related specifications:

- @ref:specs/mcp.spec.dir/architecture - Architecture diagram and components
- @ref:specs/mcp.spec.dir/run-modes - Three run modes details
- @ref:specs/mcp.spec.dir/authentication - Detailed authentication implementation
- @ref:specs/mcp.spec.dir/tools - Complete tool implementations
- @ref:specs/mcp.spec.dir/openapi-generation - OpenAPI spec generation
- @ref:specs/mcp.spec.dir/messages - MCP message protocol

See also:
- @ref:specs/sqlite.spec.dir/types - SQLite schema definitions
- @ref:specs/daemon.spec.dir/architecture - Daemon integration
```
