# speclang-header lines:12
id: "@speclang/mcp.configuration"
parent: "@ref:speclang/mcp"part: 11/12
siblings:
  next: "@ref:specs/mcp.spec.dir/cli"
short: Configuration options and schema
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, speclang]
version: 0.1.0
layer: 3
---
# MCP Configuration

### @mcp/config

```speclang
# @block:mcp/config @kind:entity
Configuration:
  file: .speclang/mcp.json
  
  schema:
    database:
      path: string (default: .speclang/speclang.db)
      wal_mode: boolean (default: true)
      
    server:
      mode: "stdio" | "http" | "socket"
      port: number (if http)
      host: string (default: localhost)
      
    auth:
      type: "none" | "basic" | "token"
      users: array (if basic)
      tokens: array (if token)
      
    logging:
      level: "debug" | "info" | "warn" | "error"
      file: string
      
    limits:
      max_connections: number
      query_timeout_ms: number
      max_results: number
```

### @mcp/config-example

```speclang
# @block:mcp/config-example @kind:code
```json
{
  "database": {
    "path": ".speclang/speclang.db",
    "wal_mode": true
  },
  "server": {
    "mode": "http",
    "port": 3000,
    "host": "127.0.0.1"
  },
  "auth": {
    "type": "token",
    "tokens": ["dev-token-123", "prod-token-456"]
  },
  "logging": {
    "level": "info",
    "file": ".speclang/mcp.log"
  },
  "limits": {
    "max_connections": 100,
    "query_timeout_ms": 5000,
    "max_results": 1000
  }
}
```
```
