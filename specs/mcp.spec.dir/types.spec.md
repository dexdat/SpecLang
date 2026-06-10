---
id: "@specs/mcp/types"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/types.ts
tags: [mcp, types, interfaces]
short: TypeScript type definitions for MCP server
---

# MCP Server Types

Type definitions for MCP server configuration and tool interfaces.

## Configuration Types

- `MCPServerConfig` - Server configuration
- `MCPAuthConfig` - Authentication config
- `MCPSSEConfig` - SSE streaming config

## Tool Types

- `SearchInput`, `SearchResult` - Search
- `GetSpecInput`, `CreateSpecInput`, `UpdateSpecInput`, `ListSpecsInput` - Spec CRUD
- `LockInput`, `UnlockInput` - Locking
- `CascadeStatus`, `CascadeTriggerInput` - Cascades
- `CommandInput`, `QueuedCommand`, `QueryCommandsInput` - Commands

## SSE Types

- `SSEEventType` - Event type union
- `SSEEvent` - Event wrapper
- `FileChangeEventData`, `CascadeProgressEventData`, etc. - Event data types
