# speclang-header lines:13
id: @specs/mcp/errors/index
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/errors/index.ts
tags: [mcp, errors, recovery]
short: Error handling submodule
---

# MCP Errors Submodule

Error handling and recovery utilities.

## Components

- `MCPErrorHandler` - Central error handler
- `ErrorRecovery` - Automatic error recovery
- Error message translations
- `MCPError` - Base error class
- `ErrorCode` - Error code enum

```typescript
export * from './handler.js';
export * from './recovery.js';
export * from './translations.js';
export * from './types.js';
```
