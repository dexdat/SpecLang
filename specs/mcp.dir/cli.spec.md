# speclang-header lines:7
id: "@speclang/mcp.cli"
parent: "@ref:specs/mcp"
part: 12/12
short: Command-line interface for MCP server
---
# MCP CLI Interface

### @mcp/cli

```speclang
# @block:mcp/cli @kind:entity
CLI:
  speclang mcp start [options]:
    Start MCP server
    Options:
      --remote: HTTP mode
      --port: Port number
      --auth: Auth type (none, basic, token)
      --user: Username (basic auth)
      --pass: Password (basic auth)
      --token: Token (token auth)
      --config: Config file path
      
  speclang mcp serve:
    Daemon mode
    Options:
      --config: Config file path
      
  speclang mcp status:
    Show server status
    
  speclang mcp stop:
    Stop daemon
    
  speclang mcp generate-openapi [options]:
    Generate MCP server from OpenAPI spec
    Options:
      --input, -i: Path or URL to OpenAPI spec (YAML/JSON)
      --output, -o: Output directory for generated MCP project
      --transport, -t: Transport mode (stdio, web, streamable-http)
      --port, -p: Port for web-based transports
      --server-name, -n: Name of MCP server
      --base-url, -b: Base URL for API requests
      --force: Overwrite existing files
      --register: Automatically register with SpecLang MCP server
```

### @mcp/checklist

```speclang
# @block:mcp/checklist @kind:table
| Component | Status | Notes |
|-----------|--------|-------|
| Server startup | DONE | stdio, HTTP, socket modes |
| Tool registration | DONE | 14 tools defined |
| Tool handlers | DONE | SQL implementations with handlers |
| Authentication | DONE | basic, token, none with config |
| SSE streaming | DONE | Real-time updates with polling |
| Error handling | DONE | All categories with retry logic |
| Configuration | DONE | JSON schema with examples |
| Connection mgmt | DONE | Cleanup on disconnect |
| Logging | DONE | Structured logging |
| CLI | DONE | Commands with options |
```