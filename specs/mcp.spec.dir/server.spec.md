# speclang-header lines:10
id: "@specs/mcp/server"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/server.ts
tags: [mcp, server, http, stdio]
short: MCP Server main implementation
---

# MCP Server

The main SpecLang MCP Server implementation.

## Class: MCPServer

### Constructor

```typescript
constructor(config?: Partial<MCPServerConfig>)
```

### Methods

#### startStdio()

Starts the server in stdio mode for Claude Desktop integration.

#### startHTTP(port?)

Starts the server in HTTP mode with Express.

#### stop()

Stops the server gracefully.

## CLI Commands

- `start` - Start server (stdio or http)
- `search <query>` - One-shot search
- `get <spec-id>` - One-shot spec retrieval
