# speclang-header lines:13
id: "@speclang/mcp-daemon"
version: 0.1.0
layer: 0
tags: [mcp, daemon, http, sse, enterprise]
imports: ["@speclang/core", "@speclang/daemon", "@speclang/deployment"]
status: draft
project_level: Alpha
agent_support: agent_assisted
children:
  - "@speclang/mcp-daemon/architecture"
  - "@speclang/mcp-daemon/config"

short: MCP Daemon (2 parts)
---

# MCP Daemon

This spec has been split into sub‑specs. See `mcp‑daemon.dir/` for details.