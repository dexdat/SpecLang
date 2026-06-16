# Bootstrap Phase 2.16: MCP Run Modes

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.16 of the bootstrap process.

**Prerequisites**: Phase 2.15 (MCP Architecture) complete.

## Your Task
Implement all three MCP server run modes: editor-initiated, remote, and server. Each mode has different connection, authentication, and lifetime characteristics.

## Read These Specs First
1. `specs/mcp.spec.dir/run-modes.spec.md` - Run mode specifications
2. `specs/mcp.spec.dir/architecture.spec.md` - Architecture

## Run Mode Overview

### Mode Comparison
| Mode | Spawned By | Connection | Auth | Use Case |
|------|-----------|------------|------|----------|
| Editor-Initiated | Editor | stdio | None | Personal projects |
| Remote | User/daemon | HTTP/SSE | Optional | Team projects |
| Server | System | Socket | Config | Enterprise |

## Implementation

### 1. Mode Detection and Startup
```typescript
// src/mcp/runmodes.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import http from "http";
import net from "net";
import { randomUUID } from "crypto";

export type RunMode = 'stdio' | 'http' | 'socket';

interface RunModeConfig {
  mode: RunMode;
  port?: number;
  socketPath?: string;
  auth?: AuthConfig;
  database: DatabaseConfig;
}

export class RunModeManager {
  private server: Server;
  private transports: Map<string, any> = new Map();
  
  async start(config: RunModeConfig): Promise<void> {
    switch (config.mode) {
      case 'stdio':
        await this.startStdioMode();
        break;
      case 'http':
        await this.startHttpMode(config);
        break;
      case 'socket':
        await this.startSocketMode(config);
        break;
    }
  }
  
  private async startStdioMode(): Promise<void> {
    console.error('Starting in stdio mode...');
    
    const server = new Server({
      name: "speclang",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    });
    
    this.registerTools(server);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('SpecLang MCP running on stdio');
  }
  
  private async startHttpMode(config: RunModeConfig): Promise<void> {
    console.error(`Starting HTTP mode on port ${config.port || 3000}...`);
    
    const app = express();
    app.use(express.json());
    
    // CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });
    
    // Auth middleware
    if (config.auth?.enabled) {
      app.use(this.createAuthMiddleware(config.auth));
    }
    
    // SSE endpoint for streaming
    app.get('/mcp/sse', (req, res) => {
      const clientId = randomUUID();
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      const transport = new SSEServerTransport('/mcp', res);
      this.transports.set(clientId, transport);
      
      const server = new Server({ name: "speclang", version: "1.0.0" });
      this.registerTools(server);
      server.connect(transport).catch(err => {
        console.error('SSE connection error:', err);
      });
      
      // Send client ID
      res.write(`data: ${JSON.stringify({ clientId })}\n\n`);
      
      // Heartbeat
      const heartbeat = setInterval(() => {
        res.write(`: heartbeat\n\n`);
      }, 30000);
      
      res.on('close', () => {
        clearInterval(heartbeat);
        this.transports.delete(clientId);
      });
    });
    
    // Message endpoint
    app.post('/mcp/message', (req, res) => {
      const clientId = req.headers['x-client-id'] as string;
      if (!clientId) {
        res.status(400).json({ error: 'Missing client ID' });
        return;
      }
      
      const transport = this.transports.get(clientId);
      if (!transport) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      try {
        transport.handleMessage(req.body);
        res.json({ ok: true });
      } catch (err) {
        console.error('Message handling error:', err);
        res.status(500).json({ error: 'Failed to process message' });
      }
    });
    
    // Tool listing endpoint
    app.get('/mcp/tools', (req, res) => {
      res.json({
        tools: this.getToolDefinitions()
      });
    });
    
    const port = config.port || 3000;
    const httpServer = app.listen(port, () => {
      console.error(`SpecLang MCP running on http://localhost:${port}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      httpServer.close(() => {
        process.exit(0);
      });
    });
  }
  
  private async startSocketMode(config: RunModeConfig): Promise<void> {
    const socketPath = config.socketPath || 
      (process.platform === 'win32' 
        ? '\\\\.\\pipe\\speclang-mcp' 
        : '/tmp/speclang-mcp.sock');
    
    console.error(`Starting socket mode on ${socketPath}...`);
    
    // Clean up existing socket
    if (process.platform !== 'win32') {
      try {
        await fs.unlink(socketPath);
      } catch {
        // Ignore if doesn't exist
      }
    }
    
    const server = net.createServer(async (socket) => {
      const clientId = randomUUID();
      
      const transport = new StdioServerTransport();
      this.transports.set(clientId, transport);
      
      const mcpServer = new Server({ name: "speclang", version: "1.0.0" });
      this.registerTools(mcpServer);
      
      // Wrap socket as stdio-like
      transport stdin = {
        read: () => new Promise((resolve) => {
          socket.once('data', (data) => resolve(data));
        })
      };
      
      await mcpServer.connect(transport);
      
      socket.on('close', () => {
        this.transports.delete(clientId);
      });
    });
    
    server.listen(socketPath, () => {
      console.error(`SpecLang MCP running on socket ${socketPath}`);
    });
    
    if (process.platform !== 'win32') {
      await fs.chmod(socketPath, '0666');
    }
  }
  
  private createAuthMiddleware(auth: AuthConfig): express.RequestHandler {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      
      if (auth.type === 'basic') {
        const [user, pass] = Buffer.from(authHeader.slice(6), 'base64')
          .toString().split(':');
        
        if (user !== auth.user || pass !== auth.password) {
          res.status(401).json({ error: 'Invalid credentials' });
          return;
        }
      } else if (auth.type === 'token') {
        const token = authHeader.slice(7);
        if (token !== auth.token) {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }
      }
      
      next();
    };
  }
  
  private registerTools(server: Server): void {
    // Register all MCP tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.getToolDefinitions() };
    });
    
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.handleToolCall(request.params.name, request.params.arguments);
    });
  }
  
  private getToolDefinitions(): Tool[] {
    return [
      {
        name: 'speclang_query',
        description: 'Execute SQL query on spec database',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'SQL query' },
            params: { type: 'array', description: 'Query parameters' }
          },
          required: ['sql']
        }
      },
      // ... other tools
    ];
  }
  
  private async handleToolCall(name: string, args: any): Promise<CallToolResult> {
    // Tool implementation
    return { content: [] };
  }
}
```

### 2. CLI Integration
```typescript
// src/mcp/cli.ts
export function parseArgs(args: string[]): RunModeConfig {
  const mode = args.includes('--remote') ? 'http' 
    : args.includes('--serve') ? 'socket' 
    : 'stdio';
  
  const config: RunModeConfig = {
    mode,
    database: {
      path: getArg(args, '--db', './speclang.db')
    }
  };
  
  if (mode === 'http') {
    config.port = parseInt(getArg(args, '--port', '3000'));
    
    if (args.includes('--auth=basic')) {
      config.auth = {
        enabled: true,
        type: 'basic',
        user: getArg(args, '--user', 'admin'),
        password: getArg(args, '--pass', '')
      };
    } else if (args.includes('--auth=token')) {
      config.auth = {
        enabled: true,
        type: 'token',
        token: getArg(args, '--token', '')
      };
    }
  }
  
  if (mode === 'socket') {
    config.socketPath = getArg(args, '--socket', '/tmp/speclang-mcp.sock');
  }
  
  return config;
}

function getArg(args: string[], flag: string, defaultValue: string = ''): string {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : defaultValue;
}
```

### 3. Reconnection Strategy
```typescript
// Client-side reconnection for remote mode
class ReconnectionManager {
  private maxRetries = 10;
  private maxDelay = 30000;
  private baseDelay = 1000;
  
  async connectWithRetry(
    url: string,
    onConnect: (client: MCPClient) => void,
    onDisconnect: () => void
  ): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        const client = await this.connect(url);
        attempts = 0;
        onConnect(client);
        
        await this.waitForDisconnect(client);
        onDisconnect();
      } catch (error) {
        attempts++;
        const delay = this.calculateDelay(attempts);
        console.warn(`Connection failed, retry ${attempts}/${this.maxRetries} in ${delay}ms`);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Max reconnection attempts exceeded');
  }
  
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Environment Variables
```bash
# Editor-initiated (default)
SPECLANG_DB=./speclang.db

# Remote mode
SPECLANG_MODE=http
SPECLANG_PORT=3000
SPECLANG_AUTH=basic
SPECLANG_USER=admin
SPECLANG_PASS=secret

# Server mode  
SPECLANG_MODE=socket
SPECLANG_SOCKET=/var/run/speclang-mcp.sock
SPECLANG_AUTH=config
SPECLANG_AUTH_CONFIG=/etc/speclang/mcp-auth.json
```

### 5. Mode Detection from Environment
```typescript
function detectRunMode(): RunMode {
  // CLI flags override environment
  if (process.argv.includes('--remote') || process.argv.includes('--http')) {
    return 'http';
  }
  if (process.argv.includes('--serve') || process.argv.includes('--socket')) {
    return 'socket';
  }
  
  // Environment variable
  const mode = process.env.SPECLANG_MODE;
  if (mode === 'http' || mode === 'remote') {
    return 'http';
  }
  if (mode === 'socket' || mode === 'server') {
    return 'socket';
  }
  
  // Default: editor-initiated (stdio)
  return 'stdio';
}
```

## Test Cases
1. Stdio mode starts and communicates correctly
2. HTTP mode accepts SSE connections
3. HTTP mode accepts POST messages
4. Socket mode creates Unix socket
5. Auth middleware blocks unauthorized requests
6. Reconnection manager retries on disconnect
7. Graceful shutdown works for all modes
8. Heartbeat keeps connections alive

## Output
1. RunModeManager class
2. CLI argument parsing
3. Reconnection strategy
4. Environment variable support
5. Integration tests for all modes
