# speclang-header lines:24
id: "@speclang/mcp"
version: 0.3.0
layer: 3
imports: ["@speclang/core", "@speclang/sqlite"]
tags: [mcp, typescript, server, implementation]
status: draft
children:
  - "@ref:specs/mcp.dir/overview"
  - "@ref:specs/mcp.dir/architecture"
  - "@ref:specs/mcp.dir/run-modes"
  - "@ref:specs/mcp.dir/tools/search"
  - "@ref:specs/mcp.dir/tools/specs"
  - "@ref:specs/mcp.dir/tools/commands"
  - "@ref:specs/mcp.dir/tools/locks"
  - "@ref:specs/mcp.dir/authentication"
  - "@ref:specs/mcp.dir/error-handling"
  - "@ref:specs/mcp.dir/sse-stream"
  - "@ref:specs/mcp.dir/configuration"
  - "@ref:specs/mcp.dir/cli"
short: MCP server implementation for universal editor access (split into parts)
project_level: Alpha
agent_support: agent_assisted
---

# MCP Server Implementation

Standalone TypeScript MCP server providing SQLite access to any editor.

This spec has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- @ref:specs/mcp.dir/overview - Overview and high-level architecture
- @ref:specs/mcp.dir/architecture - Detailed architecture diagram and components
- @ref:specs/mcp.dir/run-modes - Three run modes: editor-initiated, remote, server
- @ref:specs/mcp.dir/tools/* - Individual MCP tool implementations
- @ref:specs/mcp.dir/authentication - Authentication and security
- @ref:specs/mcp.dir/error-handling - Error handling and logging
- @ref:specs/mcp.dir/sse-stream - SSE stream for real-time events
- @ref:specs/mcp.dir/configuration - Configuration options
- @ref:specs/mcp.dir/cli - Command-line interface

---

*See individual parts in mcp.dir/*
