# Bootstrap Phase 2.6: MCP SSE Stream

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.6 of the bootstrap process.

**Prerequisites**: Phase 2.1 (MCP Server), Phase 2.5 (MCP OpenAPI) complete.

## Your Task
Implement Server-Sent Events (SSE) streaming for real-time updates to HTTP clients.

## Read These Specs First
1. `specs/mcp.spec.dir/sse-stream.spec.md` - SSE stream implementation

## SSE Overview

SSE provides real-time push notifications from server to client over HTTP. Clients connect to `/events` endpoint and receive a stream of events.

## Event Types

```typescript
interface SSEEvents {
  'file.changed': {
    path: string;
    change_type: 'create' | 'modify' | 'delete' | 'rename';
  };
  
  'agent.spawned': {
    session_id: string;
    agent: string;
    file: string;
  };
  
  'agent.completed': {
    session_id: string;
    file: string;
    status: 'done' | 'error';
  };
  
  'cascade.converged': {
    cascade_id: string;
    duration: number;
  };
  
  'command.executed': {
    command_id: string;
    action: string;
    status: 'success' | 'error';
  };
}
```

## Implementation

### 1. SSE Manager (`mcp/sse.ts`)
```typescript
class SSEManager {
  private clients: Map<string, Response> = new Map();
  private db: Database;
  private lastPollTime = Date.now();
  
  start() {
    // Poll SQLite for changes
    setInterval(() => this.pollChanges(), 1000);
  }
  
  addClient(id: string, res: Response) {
    this.clients.set(id, res);
    
    // Send initial headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send keepalive every 30s
    const keepalive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);
    
    // Cleanup on disconnect
    res.on('close', () => {
      clearInterval(keepalive);
      this.clients.delete(id);
    });
  }
  
  broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    for (const [id, res] of this.clients) {
      try {
        res.write(message);
      } catch (e) {
        // Client disconnected
        this.clients.delete(id);
      }
    }
  }
}
```

### 2. Change Polling
```typescript
class SSEManager {
  private async pollChanges() {
    const now = Date.now();
    
    // Query new file events
    const newEvents = this.db.prepare(
      `SELECT * FROM events WHERE timestamp > ? AND processed = 0`
    ).all(Math.floor(this.lastPollTime / 1000));
    
    for (const event of newEvents) {
      this.broadcast('file.changed', {
        path: event.path,
        change_type: event.kind
      });
    }
    
    // Query new commands
    const newCommands = this.db.prepare(
      `SELECT * FROM commands WHERE created_at > ?`
    ).all(Math.floor(this.lastPollTime / 1000));
    
    for (const cmd of newCommands) {
      this.broadcast('command.executed', {
        command_id: cmd.command_id,
        action: cmd.action,
        status: cmd.status
      });
    }
    
    // Query session changes
    const newSessions = this.db.prepare(
      `SELECT * FROM sessions WHERE last_active > ?`
    ).all(Math.floor(this.lastPollTime / 1000));
    
    for (const session of newSessions) {
      if (session.status === 'active') {
        this.broadcast('agent.spawned', {
          session_id: session.session_id,
          agent: session.agent,
          file: session.current_file
        });
      } else if (session.status === 'done' || session.status === 'error') {
        this.broadcast('agent.completed', {
          session_id: session.session_id,
          file: session.current_file,
          status: session.status
        });
      }
    }
    
    // Query cascade converged
    const convergedCascades = this.db.prepare(
      `SELECT * FROM cascades WHERE converged_at > ?`
    ).all(Math.floor(this.lastPollTime / 1000));
    
    for (const cascade of convergedCascades) {
      this.broadcast('cascade.converged', {
        cascade_id: cascade.cascade_id,
        duration: cascade.converged_at - cascade.started_at
      });
    }
    
    this.lastPollTime = now;
  }
}
```

### 3. HTTP Endpoint
```typescript
// Express/hono route
app.get('/events', async (req, res) => {
  const clientId = uuidv4();
  sseManager.addClient(clientId, res);
});
```

### 4. Client Usage
```typescript
// Browser client
const eventSource = new EventSource('/events');

eventSource.addEventListener('file.changed', (e) => {
  const data = JSON.parse(e.data);
  console.log('File changed:', data.path);
});

eventSource.addEventListener('agent.spawned', (e) => {
  const data = JSON.parse(e.data);
  console.log('Agent spawned:', data.agent);
});

eventSource.addEventListener('cascade.converged', (e) => {
  const data = JSON.parse(e.data);
  console.log('Cascade converged:', data.duration);
});

eventSource.onerror = () => {
  // Auto-reconnect on disconnect
  console.log('Reconnecting...');
};
```

## SSE Message Format

```
event: file.changed
data: {"path":"specs/auth.spec.md","change_type":"modify"}

event: agent.spawned
data: {"session_id":"abc123","agent":"spec-writer","file":"specs/auth.spec.md"}

:keepalive

```

## Configuration

```yaml
sse:
  endpoint: /events
  keepalive_interval: 30s
  poll_interval: 1s
  max_clients: 100
```

## Dependencies
```json
{
  "dependencies": {
    "better-sqlite3": "^9.0.0"
  }
}
```

## Test Cases
1. Client connects and receives headers
2. Client receives file.changed events
3. Client receives agent.spawned/completed events
4. Client receives cascade.converged events
5. Keepalive sent every 30s
6. Client auto-reconnects on disconnect
7. Cleanup on client disconnect
8. Multiple clients receive same events
9. Poll SQLite for changes correctly

## Output
1. SSEManager class
2. HTTP endpoint `/events`
3. Change polling implementation
4. Client documentation/examples
5. Integration tests
