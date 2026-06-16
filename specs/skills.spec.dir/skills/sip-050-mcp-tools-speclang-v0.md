---
name: sip-050-mcp-tools-speclang-v0
title: "SIP 50: MCP Tools Detailed"
version: 0.1.0
description: Complete specification of all MCP tools, protocol, and response formats
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 50: MCP Tools Detailed

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP provides the complete specification of all MCP tools available in SpecLang.

### Quick Start

```typescript
// Search tools
speclang_search({ query: "auth", limit: 10 })
speclang_semantic_search({ query_embedding: [...], limit: 5 })

// Spec tools
speclang_get_spec({ id: "@specs/auth" })
speclang_find_dependents({ id: "@specs/auth" })

// Command tools
speclang_get_status({})
speclang_insert_command({ cascade_id: "c1", action: "regenerate" })

// Lock tools
speclang_acquire_lock({ file_path: "specs/auth.spec", session_id: "s1" })
```

### When to Read This

- **Tool reference:** Complete tool API documentation
- **Building integrations:** Implementing MCP clients
- **Debugging:** Understanding tool responses

### Related SIPs

- SIP 11: MCP Tool Definitions
- SIP 43: MCP Daemon
- SIP 54: SQLite Schema

## Abstract

This SIP provides comprehensive documentation of all MCP tools, including parameters, return types, error handling, and response formats.

## Specification

### Tool Protocol

```yaml
MCPToolProtocol:
  version: "1.0"
  
  request_format:
    jsonrpc: "2.0"
    id: string | number
    method: "tools/call"
    params:
      name: string
      arguments: object
      
  response_format:
    jsonrpc: "2.0"
    id: string | number
    result:
      content:
        - type: "text"
          text: string (JSON)
      isError: boolean
      
  error_format:
    code: number
    message: string
    data: object (optional)
```

### Response Envelope

```typescript
interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    duration_ms: number;
    query_count?: number;
  };
}
```

### Search Tools

#### speclang_search

```yaml
tool:
  name: speclang_search
  description: Full-text search using FTS5
  
parameters:
  query:
    type: string
    required: true
    description: FTS5 query syntax
    examples:
      - "authentication"
      - "auth AND login"
      - "user* NEAR role"
      
  limit:
    type: integer
    required: false
    default: 10
    minimum: 1
    maximum: 100
    
  tags:
    type: array
    items: string
    required: false
    description: Filter by tags
    
  layer:
    type: integer
    required: false
    description: Filter by layer (0-10)
    
returns:
  type: array
  items:
    file_path: string
    id: string
    short_desc: string
    score: number (bm25)
    tags: string[]
    layer: integer

errors:
  INVALID_QUERY:
    code: "E001"
    message: "Invalid FTS5 query syntax"
  NO_RESULTS:
    code: "E002"
    message: "No matching specs found"

example:
  request:
    query: "authentication"
    limit: 5
    tags: ["auth", "security"]
  response:
    success: true
    data:
      - file_path: "specs/auth.spec"
        id: "@specs/auth"
        short_desc: "Authentication and authorization"
        score: -2.45
        tags: ["auth", "security"]
        layer: 2
```

#### speclang_semantic_search

```yaml
tool:
  name: speclang_semantic_search
  description: Vector similarity search
  
parameters:
  query_embedding:
    type: array
    items: number
    required: true
    description: 1536-dimensional embedding vector
    
  limit:
    type: integer
    required: false
    default: 5
    minimum: 1
    maximum: 50
    
  threshold:
    type: number
    required: false
    default: 0.7
    minimum: 0.0
    maximum: 1.0
    description: Minimum similarity threshold

returns:
  type: array
  items:
    file_path: string
    id: string
    short_desc: string
    distance: number (cosine distance)
```

### Spec Tools

#### speclang_get_spec

```yaml
tool:
  name: speclang_get_spec
  description: Get full spec by ID or path
  
parameters:
  id:
    type: string
    required: false
    pattern: "^@[^/]+/[^/]+"
    description: Spec ID (e.g., @specs/auth)
    
  file_path:
    type: string
    required: false
    description: Relative file path

returns:
  type: object
  properties:
    spec_pk: integer
    file_path: string
    id: string
    version: string
    layer: integer
    short_desc: string
    content: string
    parsed_json: object (parsed header)
    tags: string[]
    dependencies: string[]
    created_at: string (ISO 8601)
    updated_at: string (ISO 8601)

errors:
  SPEC_NOT_FOUND:
    code: "E010"
    message: "Spec not found"
  AMBIGUOUS_REFERENCE:
    code: "E011"
    message: "Multiple specs match, use exact ID"
```

#### speclang_find_dependents

```yaml
tool:
  name: speclang_find_dependents
  description: Find specs that depend on this one
  
parameters:
  id:
    type: string
    required: true
    
  transitive:
    type: boolean
    required: false
    default: false
    description: Include transitive dependents

returns:
  type: array
  items:
    id: string
    file_path: string
    short_desc: string
    dependency_type: "direct" | "transitive"
    depth: integer
```

#### speclang_get_tree

```yaml
tool:
  name: speclang_get_tree
  description: Get dependency tree
  
parameters:
  id:
    type: string
    required: true
    
  depth:
    type: integer
    required: false
    default: 10
    minimum: 1
    maximum: 20
    
  direction:
    type: string
    required: false
    default: "dependents"
    enum: ["dependents", "dependencies"]

returns:
  type: object
  description: Nested tree structure
  properties:
    id: string
    short_desc: string
    children: array (recursive)
```

#### speclang_validate

```yaml
tool:
  name: speclang_validate
  description: Validate spec file
  
parameters:
  file_path:
    type: string
    required: true
    
  strict:
    type: boolean
    required: false
    default: false
    description: Enable strict validation

returns:
  type: object
  properties:
    valid: boolean
    errors:
      - line: integer
        column: integer
        message: string
        severity: "error" | "warning"
    warnings:
      - line: integer
        message: string
```

#### speclang_split_if_needed

```yaml
tool:
  name: speclang_split_if_needed
  description: Split spec if too large
  
parameters:
  file_path:
    type: string
    required: true
    
  max_tokens:
    type: integer
    required: false
    default: 4000
    
  strategy:
    type: string
    required: false
    default: "section"
    enum: ["section", "layer", "manual"]

returns:
  type: object
  properties:
    split: boolean
    reason: string
    new_files:
      - path: string
        blocks: string[]
```

### Command Tools

#### speclang_get_status

```yaml
tool:
  name: speclang_get_status
  description: Get current cascade status
  
parameters: {}

returns:
  type: object
  properties:
    active_sessions: integer
    queue_depth: integer
    converged: boolean
    cascade_depth: integer
    last_build:
      timestamp: string
      success: boolean
      duration_ms: integer
    uptime_seconds: integer
    mode: "standard" | "enterprise"
```

#### speclang_query_commands

```yaml
tool:
  name: speclang_query_commands
  description: Query command queue
  
parameters:
  status:
    type: string
    required: false
    default: "pending"
    enum: ["pending", "running", "completed", "failed"]
    
  limit:
    type: integer
    required: false
    default: 10
    
  cascade_id:
    type: string
    required: false

returns:
  type: array
  items:
    command_pk: integer
    command_id: string
    cascade_id: string
    action: string
    target_file: string
    status: string
    created_at: string
    started_at: string (optional)
    completed_at: string (optional)
    result: object (optional)
```

#### speclang_insert_command

```yaml
tool:
  name: speclang_insert_command
  description: Insert command into queue
  
parameters:
  cascade_id:
    type: string
    required: true
    
  action:
    type: string
    required: true
    enum: ["regenerate", "expand", "validate", "test", "build", "commit"]
    
  target_file:
    type: string
    required: false
    
  session_id:
    type: string
    required: false
    
  payload:
    type: object
    required: false
    
  priority:
    type: integer
    required: false
    default: 0
    minimum: -100
    maximum: 100

returns:
  type: object
  properties:
    command_id: string
    position: integer
    estimated_start: string (optional)
```

### Lock Tools

#### speclang_claim_event

```yaml
tool:
  name: speclang_claim_event
  description: Atomically claim an event
  
parameters:
  worker_id:
    type: string
    required: true
    description: Unique worker identifier

returns:
  type: object | null
  properties:
    event_pk: integer
    file_path: string
    kind: string
    timestamp: string
  nullable: true
```

#### speclang_acquire_lock

```yaml
tool:
  name: speclang_acquire_lock
  description: Acquire file lock
  
parameters:
  file_path:
    type: string
    required: true
    
  session_id:
    type: string
    required: true
    
  lock_token:
    type: string
    required: true
    description: UUID for lock identification
    
  timeout:
    type: integer
    required: false
    default: 30
    description: Lock timeout in seconds

returns:
  type: object
  properties:
    success: boolean
    lock_id: string (optional)
    expires_at: string (optional)
    message: string

errors:
  LOCK_CONFLICT:
    code: "E020"
    message: "File is locked by another session"
  LOCK_TIMEOUT:
    code: "E021"
    message: "Lock acquisition timed out"
```

#### speclang_release_lock

```yaml
tool:
  name: speclang_release_lock
  description: Release file lock
  
parameters:
  file_path:
    type: string
    required: true
    
  lock_token:
    type: string
    required: true

returns:
  type: object
  properties:
    success: boolean
    message: string
```

### SQL Tools

#### speclang_query

```yaml
tool:
  name: speclang_query
  description: Execute read-only SQL query
  
parameters:
  sql:
    type: string
    required: true
    validation:
      - must start with "SELECT"
      - no semicolons
      - no multiple statements
      
  params:
    type: array
    required: false
    description: Parameterized query values

returns:
  type: object
  properties:
    rows: array
    rowCount: integer
    fields:
      - name: string
        type: string

errors:
  INVALID_SQL:
    code: "E030"
    message: "Invalid SQL syntax"
  WRITE_VIOLATION:
    code: "E031"
    message: "Only SELECT queries allowed"
```

#### speclang_execute

```yaml
tool:
  name: speclang_execute
  description: Execute write SQL statement
  
parameters:
  sql:
    type: string
    required: true
    validation:
      - must start with INSERT, UPDATE, or DELETE
      - no semicolons
      
  params:
    type: array
    required: false

returns:
  type: object
  properties:
    rowsAffected: integer
    lastInsertRowid: integer (optional)

security:
  - Only allowed for trusted sessions
  - Audit logged
  - Rate limited
```

## Error Codes

```yaml
ErrorCodes:
  E001: "Invalid query syntax"
  E002: "No results found"
  E010: "Spec not found"
  E011: "Ambiguous reference"
  E020: "Lock conflict"
  E021: "Lock timeout"
  E030: "Invalid SQL"
  E031: "Write violation"
  E040: "Unauthorized"
  E041: "Rate limited"
  E050: "Internal error"
  E051: "Database error"
```

## References

- "@ref:specs/mcp
- SIP 11: MCP Tool Definitions
- SIP 43: MCP Daemon
- SIP 54: SQLite Schema

## Copyright

This document is in the public domain.
