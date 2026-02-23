# Bootstrap Phase 2.10: MCP Command Tools

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.10 of the bootstrap process.

**Prerequisites**: Phase 2.1 (MCP Server), Phase 0.1 (SQLite) complete.

## Your Task
Implement MCP tools for command queue management: get status, query commands, insert command.

## Read These Specs First
1. `specs/mcp.spec.dir/tools/commands.spec.md` - Command queue tools

## Command Tools

### 1. speclang_get_status
```yaml
description: Current cascade status
params: {}
returns:
  active_sessions: number
  queue_depth: number
  converged: boolean
  cascade_depth: number
  last_build: object
```

### 2. speclang_query_commands
```yaml
description: Get pending commands
params:
  status: string (optional, default 'pending')
  limit: integer (default 10)
returns:
  List of commands
```

### 3. speclang_insert_command
```yaml
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
```

## Implementation

### 1. Tool Registration (`mcp/tools/commands.ts`)

```typescript
import { Tool, Database } from '../types';
import { randomUUID } from 'crypto';

interface StatusResult {
  active_sessions: number;
  queue_depth: number;
  converged: boolean;
  cascade_depth: number | null;
  last_build: string | null;
}

interface Command {
  command_id: string;
  cascade_id: string;
  action: string;
  target_file: string | null;
  session_id: string | null;
  payload: any;
  priority: number;
  status: string;
  created_at: number;
  updated_at: number;
}

export function registerCommandTools(db: Database): Tool[] {
  return [
    {
      name: 'speclang_get_status',
      description: 'Get current cascade and queue status',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (): Promise<StatusResult> => {
        return getStatus(db);
      },
    },
    
    {
      name: 'speclang_query_commands',
      description: 'Query commands from the queue',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by status',
            default: 'pending',
          },
          limit: {
            type: 'integer',
            description: 'Max results',
            default: 10,
          },
        },
      },
      handler: async (args: { status?: string; limit?: number }): Promise<Command[]> => {
        return queryCommands(db, args.status || 'pending', args.limit || 10);
      },
    },
    
    {
      name: 'speclang_insert_command',
      description: 'Insert a command into the queue',
      inputSchema: {
        type: 'object',
        properties: {
          cascade_id: {
            type: 'string',
            description: 'Cascade this command belongs to',
          },
          action: {
            type: 'string',
            description: 'Action to perform',
          },
          target_file: {
            type: 'string',
            description: 'Target file for the action',
          },
          session_id: {
            type: 'string',
            description: 'Associated session ID',
          },
          payload: {
            type: 'object',
            description: 'Additional payload data',
          },
          priority: {
            type: 'integer',
            description: 'Command priority (higher = more urgent)',
            default: 0,
          },
        },
        required: ['cascade_id', 'action'],
      },
      handler: async (args: {
        cascade_id: string;
        action: string;
        target_file?: string;
        session_id?: string;
        payload?: any;
        priority?: number;
      }): Promise<{ command_id: string }> => {
        return insertCommand(db, args);
      },
    },
  ];
}
```

### 2. Status Query

```typescript
function getStatus(db: Database): StatusResult {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM sessions WHERE status IN ('active', 'idle')) as active_sessions,
      (SELECT COUNT(*) FROM commands WHERE status = 'pending') as queue_depth,
      (SELECT MAX(depth) FROM cascades WHERE status = 'active') as cascade_depth,
      (SELECT MAX(created_at) FROM spec_versions) as last_build
  `;
  
  const row = db.prepare(sql).get() as any;
  
  const converged = 
    row.active_sessions === 0 && 
    row.queue_depth === 0 &&
    (db.prepare('SELECT COUNT(*) as count FROM events WHERE processed = 0').get() as any).count === 0;
  
  return {
    active_sessions: row.active_sessions || 0,
    queue_depth: row.queue_depth || 0,
    converged,
    cascade_depth: row.cascade_depth || null,
    last_build: row.last_build || null,
  };
}
```

### 3. Query Commands

```typescript
function queryCommands(db: Database, status: string, limit: number): Command[] {
  const sql = `
    SELECT 
      command_id,
      cascade_id,
      action,
      target_file,
      session_id,
      payload,
      priority,
      status,
      created_at,
      updated_at
    FROM commands 
    WHERE status = ? 
    ORDER BY priority DESC, created_at ASC
    LIMIT ?
  `;
  
  const rows = db.prepare(sql).all(status, limit) as any[];
  
  return rows.map(row => ({
    command_id: row.command_id,
    cascade_id: row.cascade_id,
    action: row.action,
    target_file: row.target_file,
    session_id: row.session_id,
    payload: row.payload ? JSON.parse(row.payload) : null,
    priority: row.priority,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}
```

### 4. Insert Command

```typescript
function insertCommand(db: Database, args: {
  cascade_id: string;
  action: string;
  target_file?: string;
  session_id?: string;
  payload?: any;
  priority?: number;
}): { command_id: string } {
  const commandId = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  
  const sql = `
    INSERT INTO commands (
      command_id,
      cascade_id,
      action,
      target_file,
      session_id,
      payload,
      priority,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `;
  
  db.prepare(sql).run(
    commandId,
    args.cascade_id,
    args.action,
    args.target_file || null,
    args.session_id || null,
    args.payload ? JSON.stringify(args.payload) : null,
    args.priority || 0,
    now,
    now
  );
  
  return { command_id: commandId };
}
```

### 5. Additional Command Operations

```typescript
export function updateCommandStatus(
  db: Database,
  commandId: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  error?: string
): void {
  const now = Math.floor(Date.now() / 1000);
  
  const sql = `
    UPDATE commands 
    SET status = ?, error = ?, updated_at = ?
    WHERE command_id = ?
  `;
  
  db.prepare(sql).run(status, error || null, now, commandId);
}

export function getNextCommand(db: Database): Command | null {
  const sql = `
    SELECT * FROM commands 
    WHERE status = 'pending' 
    ORDER BY priority DESC, created_at ASC 
    LIMIT 1
  `;
  
  const row = db.prepare(sql).get() as any;
  
  if (!row) return null;
  
  return {
    ...row,
    payload: row.payload ? JSON.parse(row.payload) : null,
  };
}

export function clearCompletedCommands(db: Database, olderThan: number): number {
  const sql = `
    DELETE FROM commands 
    WHERE status IN ('completed', 'failed') 
    AND updated_at < ?
  `;
  
  const result = db.prepare(sql).run(olderThan);
  return result.changes;
}
```

### 6. Batch Operations

```typescript
export function insertBatch(db: Database, commands: Array<{
  cascade_id: string;
  action: string;
  target_file?: string;
  priority?: number;
}>): string[] {
  const insert = db.prepare(`
    INSERT INTO commands (
      command_id, cascade_id, action, target_file, priority, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `);
  
  const now = Math.floor(Date.now() / 1000);
  const ids: string[] = [];
  
  const txn = db.transaction(() => {
    for (const cmd of commands) {
      const id = randomUUID();
      insert.run(
        id,
        cmd.cascade_id,
        cmd.action,
        cmd.target_file || null,
        cmd.priority || 0,
        now,
        now
      );
      ids.push(id);
    }
  });
  
  txn();
  return ids;
}
```

## Usage Examples

### Get Status
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "speclang_get_status",
    "arguments": {}
  }
}
```

Response:
```json
{
  "active_sessions": 2,
  "queue_depth": 5,
  "converged": false,
  "cascade_depth": 3,
  "last_build": 1704067200
}
```

### Query Commands
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "speclang_query_commands",
    "arguments": {
      "status": "pending",
      "limit": 5
    }
  }
}
```

### Insert Command
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "speclang_insert_command",
    "arguments": {
      "cascade_id": "cascade-123",
      "action": "generate_code",
      "target_file": "src/auth.ts",
      "priority": 10
    }
  }
}
```

## Test Cases
1. get_status returns correct counts
2. get_status detects convergence
3. query_commands filters by status
4. query_commands respects limit
5. query_commands orders by priority then time
6. insert_command creates valid UUID
7. insert_command stores payload as JSON
8. updateCommandStatus transitions states
9. getNextCommand returns highest priority
10. clearCompletedCommands respects age

## Output
1. Command tool registrations
2. Status query implementation
3. Command query implementation
4. Command insert implementation
5. Batch operations
6. Integration tests
