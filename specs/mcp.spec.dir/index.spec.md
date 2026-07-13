# speclang-header lines:10
id: "@specs/mcp/index"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/index.ts
tags: [mcp, server, integration]
short: MCP Server index exports and type re-exports
---

# MCP Server Index

This is the main entry point for the SpecLang MCP Server. It re-exports all public APIs from submodules.

## Public API

### Exports

```typescript
export { MCPServer } from './server.js';
export { MCPToolRegistry, getToolDefinitions } from './tools/index.js';
export { createAuth, MCPAuth } from './auth.js';
export { createSSEManager, SSEManager } from './sse.js';
export { loadConfig, getArg, getArgInt, getArgBool } from './config.js';
export * as errors from './errors/index.js';
```

### Type Re-exports

The following types are re-exported for consumers:

- `MCPServerConfig` - Server configuration
- `MCPAuthConfig` - Authentication configuration  
- `MCPSSEConfig` - SSE streaming configuration
- `SearchInput`, `SearchResult` - Search types
- `MCPSpecMetadata` - Spec metadata
- `GetSpecInput`, `CreateSpecInput`, `UpdateSpecInput`, `ListSpecsInput` - CRUD types
- `LockInput`, `UnlockInput` - Lock types
- `CascadeStatus`, `CascadeTriggerInput` - Cascade types
- `DependenciesInput`, `ImpactResult` - Graph types
- `ValidationResult`, `IndexRefreshResult` - Validation types
- `SSEEvent`, `SSEEventType` - SSE event types
