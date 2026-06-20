# speclang-header lines:10
id: "@specs/mcp/config/index"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/config/index.ts
tags: [mcp, config, submodule]
short: Config submodule exports
---

# MCP Config Submodule

Re-exports config utilities.

```typescript
export { loadConfig, loadConfigFromFile, validateConfig, getArg, getArgInt, getArgBool } from './config.js';
export * from './loader.js';
export * from './validator.js';
export * from './hot-reload.js';
export * from './types.js';
```
