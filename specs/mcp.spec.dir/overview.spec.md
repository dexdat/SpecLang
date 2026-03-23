# speclang-header lines:12
id: "@speclang/mcp.overview"
parent: ""@ref:speclang/mcp"part: 1/12
siblings:
  next: ""@ref:specs/mcp.spec.dir/architecture"short: MCP server overview
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
