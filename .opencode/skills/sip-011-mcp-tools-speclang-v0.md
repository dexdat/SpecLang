---
name: sip-011-mcp-tools-speclang-v0
title: "SIP 11: MCP Tool Definitions"
version: 0.1.0
description: MCP server providing SQLite access for universal editor integration
category: standard
---

# SIP 11: MCP Tool Definitions

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the MCP (Model Context Protocol) server that provides SQLite access to any MCP-compatible editor.

### Quick Start

1. **Connect:** Editor connects via stdio or HTTP/SSE
2. **Query:** Call MCP tools to search, read, write specs
3. **Command:** Queue commands for agent execution
4. **Lock:** Coordinate file access between agents

### Example

```typescript
// Search for auth-related specs
speclang_search({ query: "authentication", limit: 5 })

// Get full spec content
speclang_get_spec({ id: "@specs/auth" })

// Find what depends on auth
speclang_find_dependents({ id: "@specs/auth" })
```

### Key Concepts

- **Universal Access:** Works with Cursor, Claude Code, Zed, Windsurf, etc.
- **SQLite Backend:** Fast queries via MCP tools
- **Three Run Modes:** Editor-initiated, remote, server
- **Lock Coordination:** Prevents concurrent write conflicts

### When to Read This

- **Integrating editors:** How to connect any MCP editor
- **Tool reference:** What tools are available
- **Building agents:** How agents use the MCP API

### Related SIPs

- SIP 6: Agent Protocol
- SIP 10: Daemon Architecture

## Abstract

This SIP defines the MCP server implementation for SpecLang. The server provides SQLite access via MCP tools, enabling any MCP-compatible editor to search specs, query dependencies, and coordinate with the cascade system.

## Motivation

SpecLang needs to work with any editor:
- Cursor, Claude Code, Zed, Windsurf, etc.
- Each has MCP support
- We need a single server that works everywhere

A standalone MCP server provides universal access.

## Rationale

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                Any MCP-Compatible Editor                │
│   Cursor    Claude Code    OpenCode    Zed    Windsurf │
└──────────────────────┬──────────────────────────────────┘
                       │ MCP (stdio or HTTP/SSE)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              MCP Server (speclang-mcp.ts)               │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │  Router  │→ │   Auth   │→ │   Tool Handlers       │ │
│  └──────────┘  └──────────┘  └───────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ SQL
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     SQLite Database                     │
│   specs     events     commands     locks     FTS       │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- Universal editor support
- Single codebase
- Fast SQLite queries
- Real-time updates via SSE

## Specification

### Run Modes

```speclang
RunModes:
  editor_initiated:
    description: Editor spawns the server
    transport: stdio
    example: Claude Code starts speclang-mcp
    
  remote:
    description: Server runs remotely
    transport: HTTP/SSE
    example: Team shares a server
    
  server:
    description: Persistent server mode
    transport: HTTP/SSE
    example: CI/CD integration
```

### Tool Categories

| Category | Tools | Purpose |
|----------|-------|---------|
| Search | `speclang_search`, `speclang_semantic_search` | Full-text and vector search |
| Specs | `speclang_get_spec`, `speclang_find_dependents`, etc. | Read spec data |
| Commands | `speclang_get_status`, `speclang_query_commands`, etc. | Agent coordination |
| Locks | `speclang_claim_event`, `speclang_acquire_lock`, etc. | File coordination |
| SQL | `speclang_query`, `speclang_execute` | Direct SQL access |

### Search Tools

#### speclang_search

Full-text search using FTS5.

```yaml
params:
  query: string (FTS5 query syntax)
  limit: integer (default 10)
  tags: string[] (optional filter)
returns:
  - file_path
  - id
  - short_desc
  - score (bm25)
```

Example:
```typescript
speclang_search({ 
  query: "authentication login", 
  limit: 5,
  tags: ["auth", "security"]
})
```

#### speclang_semantic_search

Vector similarity search.

```yaml
params:
  query_embedding: number[] (1536 dims)
  limit: integer (default 5)
returns:
  - file_path
  - id
  - short_desc
  - distance
```

### Spec Tools

#### speclang_get_spec

Get full spec by ID or path.

```yaml
params:
  id: string (optional)
  file_path: string (optional)
returns:
  Full spec record with parsed_json, tags, dependencies
```

#### speclang_find_dependents

Find specs that depend on this one.

```yaml
params:
  id: string
returns:
  List of specs with dependency relationship
```

#### speclang_get_tree

Get dependency tree recursively.

```yaml
params:
  id: string
  depth: integer (default 10)
returns:
  Nested tree structure
```

#### speclang_validate

Validate spec file header and content.

```yaml
params:
  file_path: string
returns:
  valid: boolean
  errors: string[]
```

#### speclang_split_if_needed

Split spec if exceeds token limit.

```yaml
params:
  file_path: string
  max_tokens: integer (default 4000)
returns:
  split: boolean
  new_files: string[] (optional)
```

#### speclang_query_errors

Query error logs.

```yaml
params:
  level: string (optional)
  source: string (optional)
  file: string (optional)
  limit: integer (default 50)
returns:
  List of errors
```

#### speclang_create_version

Create content snapshot.

```yaml
params:
  file_path: string
  content: string
  cascade_id: string (optional)
  session_id: string (optional)
returns:
  version_pk: number
```

#### speclang_get_previous_version

Get previous version for rollback.

```yaml
params:
  file_path: string
returns:
  content: string
  version_pk: number
```

### Command Tools

#### speclang_get_status

Current cascade status.

```yaml
params: {}
returns:
  active_sessions: number
  queue_depth: number
  converged: boolean
  cascade_depth: number
  last_build: object
```

#### speclang_query_commands

Get pending commands.

```yaml
params:
  status: string (default 'pending')
  limit: integer (default 10)
returns:
  List of commands
```

#### speclang_insert_command

Add command to queue.

```yaml
params:
  cascade_id: string
  action: string
  target_file: string (optional)
  session_id: string (optional)
  payload: object (optional)
  priority: integer (default 0)
returns:
  command_id: string
```

### Lock Tools

#### speclang_claim_event

Atomically claim an event for processing.

```yaml
params:
  worker_id: string
returns:
  event: object or null
```

#### speclang_acquire_lock

Acquire file lock.

```yaml
params:
  file_path: string
  session_id: string
  lock_token: string
  timeout: integer (seconds)
returns:
  success: boolean
```

#### speclang_release_lock

Release file lock.

```yaml
params:
  file_path: string
  lock_token: string
returns:
  success: boolean
```

### SQL Tools

#### speclang_query

Execute a read-only SQL query.

```yaml
params:
  sql: string
  params: any[] (optional)
returns:
  rows: any[]
```

Validates SQL starts with "SELECT" and contains no semicolons.

#### speclang_execute

Execute a write SQL statement.

```yaml
params:
  sql: string
  params: any[] (optional)
returns:
  rows_affected: number
```

## Implementation

### Tool Handler Example

```typescript
async handleSearch(args: any) {
  const { query, limit = 10, tags } = args;
  
  let sql = `
    SELECT s.file_path, s.id, s.short_desc, 
           bm25(specs_fts) as score
    FROM specs_fts f
    JOIN specs s ON f.rowid = s.spec_pk
    WHERE f MATCH ?
  `;
  const params: any[] = [query];
  
  if (tags && tags.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM spec_tags st 
      WHERE st.spec_pk = s.spec_pk AND st.tag IN (${tags.map(() => '?').join(',')})
    )`;
    params.push(...tags);
  }
  
  sql += ` ORDER BY score LIMIT ?`;
  params.push(limit);
  
  return this.db.prepare(sql).all(...params);
}
```

### Deadlock Prevention

```yaml
strategies:
  - All locks have expiration timeouts
  - Clients implement retry with exponential backoff
  - Lock ordering: acquire in alphabetical file path order
  - Deadlock detection via timeout; release on timeout
```

## SSE Stream

Real-time events via Server-Sent Events:

```yaml
endpoint: /sse
events:
  - spec_changed: { file_path, id }
  - cascade_started: { cascade_id }
  - cascade_converged: { cascade_id, duration }
  - command_queued: { command_id, action }
```

## References

- @ref:specs/mcp - MCP spec (parent)
- @ref:specs/mcp.spec.dir/overview - Overview
- @ref:specs/mcp.spec.dir/architecture - Architecture
- @ref:specs/mcp.spec.dir/tools/search - Search tools
- @ref:specs/mcp.spec.dir/tools/specs - Spec tools
- @ref:specs/mcp.spec.dir/tools/commands - Command tools
- @ref:specs/mcp.spec.dir/tools/locks - Lock tools
- SIP 6: Agent Protocol
- SIP 10: Daemon Architecture

## Copyright

This document is in the public domain.
