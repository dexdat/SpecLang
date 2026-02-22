# speclang-header lines:13
id: "@speclang/mcp.tools.commands"
version: 0.1.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, tools, commands]
parent: "@ref:speclang/mcp"
part: 6/12
siblings:
  next: "@ref:specs/mcp.dir/tools/locks"
short: "Command queue tools: get status, query commands, insert command"
---
# MCP Command Tools

### @mcp/tools-commands

```speclang
# @block:mcp/tools-commands @kind:entity
MCP_TOOLS:
  
  speclang_get_status:
    description: Current cascade status
    params: {}
    returns:
      active_sessions: number
      queue_depth: number
      converged: boolean
      cascade_depth: number
      last_build: object
    sql: |
      SELECT 
        (SELECT COUNT(*) FROM sessions WHERE status IN ('active', 'idle')) as active_sessions,
        (SELECT COUNT(*) FROM commands WHERE status = 'pending') as queue_depth,
        (SELECT (SELECT COUNT(*) FROM sessions WHERE status IN ('active', 'idle')) = 0 AND (SELECT COUNT(*) FROM commands WHERE status = 'pending') = 0 AND (SELECT COUNT(*) FROM events WHERE processed = 0) = 0) as converged,
        (SELECT MAX(depth) FROM cascades WHERE status = 'active') as cascade_depth,
        (SELECT MAX(created_at) FROM spec_versions) as last_build
    
  speclang_query_commands:
    description: Get pending commands
    params:
      status: string (optional, default 'pending')
      limit: integer (default 10)
    returns:
      List of commands
    sql: |
      SELECT * FROM commands 
      WHERE status = ? 
      ORDER BY priority DESC, created_at ASC
      LIMIT ?
    
  speclang_insert_command:
    description: Add command to queue
    params:
      cascade_id: string
      action: string
      target_file: string (optional)
      session_id: string (optional)
      payload: object (optional)
      priority: integer (default 0)
    returns:
      command_id: string
    sql: |
      INSERT INTO commands (command_id, cascade_id, action, target_file, session_id, payload, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      RETURNING command_id
```