# speclang-header lines:11
id: "@speclang/mcp-sse-stream"
parent: ""@ref:speclang/mcppart: 10/12
siblings:
  next: ""@ref:specs/mcp.spec.dir/configurationshort: SSE stream implementation for real-time events
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, speclang]
version: 0.1.0
layer: 3
---
# MCP SSE Stream

### @mcp/sse

```speclang
# @block:mcp/sse @kind:entity
SSEStream:
  purpose: Real-time updates to HTTP clients
  
  endpoint: /events
  format: text/event-stream
  
  events:
    file.changed:
      data: { path, change_type }
      
    agent.spawned:
      data: { session_id, agent, file }
      
    agent.completed:
      data: { session_id, file, status }
      
    cascade.converged:
      data: { cascade_id, duration }
      
    command.executed:
      data: { command_id, action, status }
      
  implementation:
    1. Client connects to /events
    2. Server sends periodic keepalive
    3. On SQLite change, broadcast to all clients
    4. Client reconnects on disconnect
```

### @mcp/sse-impl

```speclang
# @block:mcp/sse-impl @kind:code
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
  
  private async pollChanges() {
    const now = Date.now();
    // Query new events
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
```
