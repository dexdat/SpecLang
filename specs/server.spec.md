# speclang-header lines:12
id: "@speclang/server"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated, mcp, server]
short: "MCP Server implementation for SpecLang"
status: generated
depends_on:
  - "@speclang/mcp"
- "@speclang/core"
---

# MCP Server Spec

Auto-generated spec for server.ts from cascade.

## Overview

### @block::mcpserver @kind:code

```typescript
export class MCPServer {
  private db: SpecLangDB;
  private server: McpServer;
  
  constructor(db: SpecLangDB, options?: ServerOptions);
  
  // Start the MCP server
  async start(): Promise<void>;
  
  // Stop the server
  async stop(): Promise<void>;
  
  // Handle incoming requests
  async handleRequest(request: MCPRequest): Promise<MCPResponse>;
  
  // Register tool handlers
  registerTools(tools: ToolDefinition[]): void;
}
```

### @block::server-options @kind:code

```typescript
interface ServerOptions {
  port: number;
  host: string;
  cors: boolean;
  auth?: AuthConfig;
  logging?: LoggingConfig;
}
```

### @block::mcp-protocol @kind:prose

The MCP Server implements the Model Context Protocol:

1. **Initialize**: Client sends initialize request
2. **Tools**: Server advertises available tools
3. **Resources**: Server provides spec resources
4. **Prompts**: Server offers prompt templates

### @block::tools @kind:prose

**Available Tools:**

- `speclang_validate` - Validate spec files
- `speclang_cascade` - Run cascade on specs
- `speclang_search` - Search spec content
- `speclang_expand` - Expand block content

### @block::error-handling @kind:prose

Server handles errors gracefully:

- Invalid requests return error code
- Timeout after 30 seconds
- Rate limiting on expensive operations
- Detailed error messages for debugging

