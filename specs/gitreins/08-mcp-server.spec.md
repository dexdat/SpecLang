# speclang-header lines:11
id: "@gitreins/08-mcp-server"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, mcp, server]
status: imported
short: "MCP Server — exposes GitReins tools via stdio MCP for task management, guard execution, agentic evaluation, and pipeline control"
realized_by: gitreins-poc/gitreins_mcp/server.py
---

# 08 — MCP Server

> **Status:** Implemented
> **Realized by:** `gitreins_mcp/server.py` (407 lines)
> **Reverse-engineered:** 2026-06-09

## Overview

The MCP server exposes GitReins as a Model Context Protocol server over stdio transport. Primary AI coding agents connect via stdio and use 9 tools to manage tasks, run guards, evaluate, and commit.

### @block:mcp/json-rpc-20-protocol @kind:requirement

The server MUST implement JSON-RPC 2.0 over line-delimited stdio. Messages can span multiple lines — the server buffers until balanced braces are detected before parsing.

**Realized by:** `gitreins_mcp/server.py:1-9` (docstring), `328-395` (`run_stdio()`).

### @block:mcp/nine-exposed-tools @kind:requirement

The server MUST expose exactly 9 tools:

| Tool | Description |
|------|-------------|
| `task.create` | Create task with id, title, criteria |
| `task.start` | Mark task as in-progress |
| `task.complete` | Mark task complete; triggers evaluation |
| `task.list` | List tasks, optionally filtered by status |
| `task.get` | Get task by ID |
| `task.delete` | Delete task by ID |
| `commit` | Create git commit after guard checks |
| `guard.run` | Run Tier 1 static guards |
| `judge.evaluate` | Run full evaluation pipeline on a task |

**Realized by:** `gitreins_mcp/server.py:35-45` (dispatch map), `47-151` (schemas), `155-270` (handlers).

### @block:mcp/mcp-protocol-handshake @kind:requirement

The server MUST handle:
- `initialize` — Returns protocol version (`2024-11-05`), capabilities (`tools`), server info (`gitreins v0.1.0`)
- `tools/list` — Returns tool schemas
- `tools/call` — Dispatches to handler, wraps result in `content: [{type: text, text: ...}]`
- `notifications/initialized` — No response (MCP notification)

**Realized by:** `gitreins_mcp/server.py:272-326`.

### @block:mcp/commit-guard-enforcement @kind:requirement

The `commit` tool MUST run Tier 1 guards before allowing a commit. It MUST also check that no tasks are in `in_progress` status. Commit is blocked if either check fails.

**Realized by:** `gitreins_mcp/server.py:213-241` — `_commit()`.

### @block:mcp/auto-evaluation-on-complete @kind:requirement

When `task.complete` is called and `GITREINS_LLM_API_KEY` is set, the server MUST automatically run the evaluation pipeline and include the verdict in the response. If no LLM key is configured, it adds a note: "LLM not configured — skipping evaluation".

**Realized by:** `gitreins_mcp/server.py:165-193` — `_task_complete()`.

### @block:mcp/evaluation-response-format @kind:requirement

The `judge.evaluate` tool MUST return: `task_id`, `passed`, `tier1_passed`, `verdict`, `items` (criterion list with status/detail), `summary`.

**Realized by:** `gitreins_mcp/server.py:253-270`.

### @block:mcp/guard-response-format @kind:requirement

The `guard.run` tool MUST return: `passed`, `results` (list of name/passed/output arrays).

**Realized by:** `gitreins_mcp/server.py:243-251`.

### @block:mcp/error-handling @kind:requirement

- Unknown tools: JSON-RPC error code -32601
- Handler exceptions: JSON-RPC error code -32000
- All exceptions are logged to stderr

**Realized by:** `gitreins_mcp/server.py:299-326`.

### @block:mcp/logging @kind:requirement

Server logging MUST write to stderr (not stdout, to avoid interfering with MCP message transport). Log level: INFO, format: timestamp + logger name + level.

**Realized by:** `gitreins_mcp/server.py:399-407`.

### @block:mcp/standalone-entry-point @kind:requirement

The module MUST be runnable directly: `python gitreins_mcp/server.py`. It creates a `GitReinsMCPServer` and calls `run_stdio()`.

**Realized by:** `gitreins_mcp/server.py:399-407`.
