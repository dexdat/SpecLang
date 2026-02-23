# speclang-header lines:12
id: "@speclang/opencode-plugin.spec.dir/overview"
version: 0.1.0
layer: 4
imports: ["@speclang/opencode-plugin", "@speclang/opencode"]
tags: [opencode, plugin, overview, implementation]
short: Overview and plugin lifecycle for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# OpenCode Plugin Overview

## Purpose

The OpenCode plugin integrates Speclang's reactive cascade system into OpenCode, enabling automatic spec indexing, event routing, and convergence detection.

## Plugin Lifecycle

```speclang
# @block:opencode-plugin/overview/lifecycle @kind:sequence
1. Plugin loads when OpenCode starts
2. Initializes SQLite database (if not exists)
3. Sets up event listeners:
   - file.edited → parse, index, route
   - agent.finished → convergence check
   - session.idle → ownership cleanup
4. Starts MCP client connection (if configured)
5. Begins monitoring spec directory for changes
```

## Key Components

- **Event System**: Listens to OpenCode file events, filters for spec files
- **Session Manager**: Tracks agent sessions and ownership
- **Ownership Guard**: Ensures only owning session can modify spec files
- **MCP Client**: Communicates with Speclang MCP server for tool execution
- **Git Integration**: Commits changes per file with speclang: messages
- **Convergence Detection**: Monitors quiet period to trigger pipeline

## Integration Points

- OpenCode plugin API (`events`, `db`, `tools`)
- SQLite database for spec index
- MCP server for tool execution
- Git for version control

## References

- @ref:speclang/opencode-plugin.spec.dir/architecture
- @ref:speclang/opencode-plugin.spec.dir/event-system
- @ref:speclang/opencode-plugin.spec.dir/session-manager