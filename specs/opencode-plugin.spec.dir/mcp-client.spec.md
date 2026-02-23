# speclang-header lines:12
id: "@speclang/opencode-plugin.spec.dir/mcp-client"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/architecture", "@speclang/mcp"]
tags: [opencode, plugin, mcp, client]
short: MCP client integration for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# MCP Client Integration

## Purpose

Connects to Speclang MCP server, invokes tools (`speclang_query`, `speclang_execute`).

## Client Setup

```speclang
# @block:opencode-plugin/mcp-client/setup @kind:code
```typescript
import { MCPServer } from '@modelcontextprotocol/sdk/server';
import { StdioTransport } from '@modelcontextprotocol/sdk/stdio';

let mcpClient: MCPServer | null = null;

async function connectToMCP(): Promise<void> {
  const transport = new StdioTransport({
    command: 'speclang-mcp-server',
    args: []
  });
  
  mcpClient = new MCPServer({
    name: 'speclang-opencode-plugin',
    version: '0.1.0'
  });
  
  await mcpClient.connect(transport);
}
```
```

## Tool Invocation

### speclang_query

```speclang
# @block:opencode-plugin/mcp-client/query @kind:code
```typescript
async function speclangQuery(sql: string, params: any[] = []): Promise<any[]> {
  if (!mcpClient) await connectToMCP();
  
  const result = await mcpClient!.callTool('speclang_query', {
    sql,
    params: JSON.stringify(params)
  });
  
  return JSON.parse(result.content);
}
```
```

### speclang_execute

```speclang
# @block:opencode-plugin/mcp-client/execute @kind:code
```typescript
async function speclangExecute(sql: string, params: any[] = []): Promise<void> {
  if (!mcpClient) await connectToMCP();
  
  await mcpClient!.callTool('speclang_execute', {
    sql,
    params: JSON.stringify(params)
  });
}
```
```

## References

- @ref:speclang/mcp (MCP server spec)
- @ref:speclang/sqlite (for query/execute)