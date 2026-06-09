# speclang-header lines:15
id: "@specs/mcp.guide"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [mcp, guide, documentation]
short: "MCP Server Usage Guide"
---

# MCP Server Usage Guide

This guide covers how to use the SpecLang MCP server for programmatic access to spec management.

## Quick Start

### Start Server in Stdio Mode (for Pi Agent or OpenCode)

```bash
npx speclang-mcp start
```

### Start Server in HTTP Mode

```bash
npx speclang-mcp start --http --port 3000
```

## Available Tools

### Search Tools

| Tool | Description |
|------|-------------|
| `speclang_search` | Full-text search across specs |
| `speclang_semantic_search` | Vector similarity search |

### Spec CRUD Tools

| Tool | Description |
|------|-------------|
| `speclang_get_spec` | Get spec by ID or path |
| `speclang_create_spec` | Create new spec |
| `speclang_update_spec` | Update existing spec |
| `speclang_list_specs` | List specs with filters |

### Lock Tools

| Tool | Description |
|------|-------------|
| `speclang_lock` | Acquire file lock |
| `speclang_unlock` | Release file lock |
| `speclang_check_lock` | Check if locked |
| `speclang_force_unlock` | Force unlock (admin) |

### Cascade Tools

| Tool | Description |
|------|-------------|
| `speclang_cascade_status` | Get cascade status |
| `speclang_cascade_trigger` | Trigger cascade |
| `speclang_cascade_abort` | Abort cascade |
| `speclang_cascade_converge` | Mark converged |

### Index Tools

| Tool | Description |
|------|-------------|
| `speclang_index_refresh` | Rebuild index |
| `speclang_index_stats` | Get index stats |
| `speclang_index_validate` | Validate index |

## Using with Pi Agent

1. Configure MCP in `.pi/mcp.json`:
```json
{
  "command": "npx",
  "args": ["speclang-mcp", "start"]
}
```

2. Pi Agent (or OpenCode) will automatically connect to the MCP server and provide tool access.

## Using with HTTP API

### Authentication

```bash
# Bearer token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/mcp/message

# Basic auth
curl -u user:pass http://localhost:3000/mcp/message
```

### Example: Search Specs

```bash
curl -X POST http://localhost:3000/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "speclang_search",
      "arguments": {"query": "authentication"}
    },
    "id": 1
  }'
```

### Example: Get Spec

```bash
curl -X POST http://localhost:3000/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "speclang_get_spec",
      "arguments": {"id": "@specs/auth"}
    },
    "id": 2
  }'
```

## SSE Events

Connect to `/events` for real-time updates:

```javascript
const eventSource = new EventSource('http://localhost:3000/events');
eventSource.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

## Configuration

See `specs/mcp.spec.dir/configuration.spec.md` for full config options.
