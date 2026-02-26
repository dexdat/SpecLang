# speclang-header lines:15
id: "@speclang/mcp"
version: 0.2.0
target: src/mcp/
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [mcp, server, typescript, opensource, protocol]
children:
  - "@ref:specs/mcp.spec.dir/overview"
  - "@ref:specs/mcp.spec.dir/architecture"
  - "@ref:specs/mcp.spec.dir/authentication"
  - "@ref:specs/mcp.spec.dir/cli"
  - "@ref:specs/mcp.spec.dir/configuration"
  - "@ref:specs/mcp.spec.dir/error-handling"
  - "@ref:specs/mcp.spec.dir/run-modes"
  - "@ref:specs/mcp.spec.dir/sse-stream"
short: "MCP Server - Model Context Protocol server for SpecLang"
status: draft
---

# MCP Server

Model Context Protocol (MCP) server implementation for SpecLang. Provides programmatic access to the spec database, file watching events, and agent control via standard MCP protocol.

## Overview

```speclang
# @block:mcp/overview @kind:entity
MCPServer:
  language: TypeScript
  protocol: MCP (Model Context Protocol)
  
  capabilities:
    - tools: Query specs, trigger events, control agents
    - resources: Read spec files, headers, dependencies
    - prompts: Generate spec expansions, code generation
  
  run_modes:
    - local: Stdio communication with OpenCode
    - remote: HTTP/SSE server for team collaboration
    - embedded: Part of speclangd (enterprise)
  
  clients:
    - OpenCode editor (primary)
    - CLI tools
    - Custom agents
    - External integrations
```

## Architecture

See @ref:specs/mcp.spec.dir/architecture for server architecture and component diagram.

## Authentication

See @ref:specs/mcp.spec.dir/authentication for auth methods (API keys, tokens, session-based).

## CLI Interface

See @ref:specs/mcp.spec.dir/cli for command-line interface to start/stop/configure MCP server.

## Configuration

See @ref:specs/mcp.spec.dir/configuration for server configuration options.

## Error Handling

See @ref:specs/mcp.spec.dir/error-handling for error codes and recovery procedures.

## Run Modes

See @ref:specs/mcp.spec.dir/run-modes for local, remote, and embedded operation modes.

## SSE Stream

See @ref:specs/mcp.spec.dir/sse-stream for Server-Sent Events streaming of file changes and agent events.

## Integration with SpecLang

The MCP server is the programmable interface to SpecLang. It enables:

1. **External tool integration**: Other tools can query specs via MCP
2. **Team collaboration**: Remote server allows multiple editors to share spec database
3. **Agent control**: AI agents can use MCP tools to interact with SpecLang
4. **Monitoring**: Real-time events stream for dashboards and logging

