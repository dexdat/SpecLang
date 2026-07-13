# speclang-header lines:11
id: "@speclang/mcp-run-modes"
version: 0.1.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, run-modes]
parent: ""@ref:speclang/mcppart: 3/12
siblings:
  next: ""@ref:specs/mcp.spec.dir/tools/searchshort: "Three run modes: editor-initiated, remote, server"
---
# MCP Server Run Modes

### @mcp/modes

```speclang
# @block:mcp/modes @kind:entity
RunModes:
  
  editor_initiated:
    command: speclang mcp start
    process: Editor spawns MCP server via stdio
    connection: stdio (bidirectional JSON-RPC)
    lifetime: Editor lifetime
    use_case: Personal projects, solo development
    
  remote_mode:
    command: speclang mcp start --remote --port 3000 [--auth=basic|token]
    process: Standalone daemon process
    connection: HTTP/SSE or WebSocket
    lifetime: Until killed or --daemon
    use_case: Team projects, shared access, remote agents
    security: 
      - Optional basic auth (--user, --pass)
      - Optional bearer token (--token)
      - TLS recommended for production
      
  server_mode:
    command: speclang mcp serve [--config=mcp.json]
    process: System daemon
    connection: Named pipe or socket
    lifetime: System boot to shutdown
    use_case: Enterprise, always-on
    
  comparison:
    | Mode | Spawned By | Connection | Auth | Use Case |
    |------|-----------|------------|------|----------|
    | Editor | Editor | stdio | None | Personal |
    | Remote | User | HTTP | Optional | Team |
    | Server | System | Socket | Config | Enterprise |

  client_reconnection:
    description: Client reconnection logic for remote mode
    strategy: exponential backoff with jitter
    max_retries: 10
    max_delay: 30 seconds
    on_disconnect: wait for retry, then restart cascade if needed
```

### @mcp/mode-implementation

```speclang
# @block:mcp/mode-implementation @kind:code
```typescript
// Mode detection and startup
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { randomUUID } from "crypto";

class SpeclangMCPServer {
  private db: Database;
  private mode: 'stdio' | 'http' | 'socket';
  private transports = new Map<string, SSEServerTransport>();
  private users: Map<string, string> = new Map();
  private tokens: Set<string> = new Set();
  
  async start(args: string[]) {
    // Detect mode from args
    if (args.includes('--remote')) {
      await this.startHTTP(args);
    } else if (args.includes('--serve')) {
      await this.startSocket(args);
    } else {
      await this.startStdio();
    }
  }
  
  async startStdio() {
    this.mode = 'stdio';
    const server = new Server({
      name: "speclang",
      version: "1.0.0"
    }, {
      capabilities: { tools: {} }
    });
    
    this.registerTools(server);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Speclang MCP server running on stdio");
  }
  
  loadFromConfig(configPath: string): void {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.auth?.users) {
      for (const user of config.auth.users) {
        this.users.set(user.name, user.hash);
      }
    }
    if (config.auth?.tokens) {
      for (const token of config.auth.tokens) {
        this.tokens.add(token);
      }
    }
  }
  
  async startHTTP(args: string[]) {
    this.mode = 'http';
    const port = this.getArg(args, '--port', '3000');
    const authType = this.getArg(args, '--auth', 'none');

    const app = express();

    // Auth middleware
    if (authType === 'basic') {
      app.use(this.basicAuthMiddleware(args));
    } else if (authType === 'token') {
      app.use(this.tokenAuthMiddleware(args));
    }

    // SSE endpoint
    app.get('/mcp', (req, res) => {
      const clientId = randomUUID();
      const transport = new SSEServerTransport('/mcp/message', res);
      this.transports.set(clientId, transport);
      const server = new Server({ name: "speclang", version: "1.0.0" });
      this.registerTools(server);
      server.connect(transport);

      // Clean up on disconnect
      res.on('close', () => {
        this.transports.delete(clientId);
      });

      // Send client ID to client (optional)
      res.write(`data: ${JSON.stringify({ clientId })}\n\n`);
    });

    // Message endpoint for SSE transport
    app.post('/mcp/message', express.json(), (req, res) => {
      const clientId = req.headers['x-client-id'] || req.body.clientId;
      if (!clientId || typeof clientId !== 'string') {
        res.status(400).json({ error: 'Missing client ID' });
        return;
      }
      const transport = this.transports.get(clientId);
      if (!transport) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      try {
        // Forward message to transport
        transport.handleMessage(req.body);
        res.status(200).json({ ok: true });
      } catch (err) {
        console.error('Error handling message:', err);
        res.status(500).json({ error: 'Failed to process message' });
      }
    });

    app.listen(port, () => {
      console.error(`Speclang MCP server on port ${port}`);
    });
  }
  
  async startSocket(args: string[]) {
    // Unix socket or named pipe
    const socketPath = process.platform === 'win32' 
      ? '\\\\.\\pipe\\speclang-mcp'
      : '/tmp/speclang-mcp.sock';
    
    // Implementation for socket server...
  }
}
```
```