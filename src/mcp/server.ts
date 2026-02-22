// Generated MCP server TypeScript code
// DO NOT EDIT MANUALLY

// Import dependencies
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { randomUUID } from "crypto";
import Database = require('better-sqlite3');
import * as path from 'path';
import * as fs from 'fs';

// Global database instance (provided by runtime)
declare const db: Database;

// Block: mcp/mode-implementation from run-modes.spec.md
// Mode detection and startup

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

// Block: mcp/tool-handler-search from search.spec.md
export async function handleSearch(args: any) {
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
  
  const results = db.prepare(sql).all(...params);
  return results;
}

// Block: mcp/tool-handler-get-tree from specs.spec.md
export async function handleGetTree(args: any) {
  const { id, depth = 10 } = args;
  
  const tree = db.prepare(`
    WITH RECURSIVE tree AS (
      SELECT s.spec_pk, s.id, s.file_path, s.short_desc, 0 as level
      FROM specs s
      WHERE s.id = ?
      
      UNION ALL
      
      SELECT s.spec_pk, s.id, s.file_path, s.short_desc, t.level + 1
      FROM specs s
      JOIN spec_deps sd ON sd.dst_spec_pk = s.spec_pk
      JOIN tree t ON sd.src_spec_pk = t.spec_pk
      WHERE t.level < ?
    )
    SELECT * FROM tree
  `).all(id, depth);
  
  return { tree };
}

// Block: mcp/tool-handler-locks from locks.spec.md
export async function handleClaimEvent(args: any) {
  const { worker_id } = args;
  
  // Atomic claim - returns the event or null
  const event = db.prepare(`
    UPDATE events
    SET claimed_by = ?, claimed_at = strftime('%s','now'), attempts = attempts + 1
    WHERE event_pk = (
      SELECT event_pk FROM events
      WHERE processed = 0 AND claimed_by IS NULL
      ORDER BY timestamp
      LIMIT 1
    )
    RETURNING *
  `).get(worker_id);
  
  return { event };
}

async function handleAcquireLock(args: any) {
  const { file_path, session_id, lock_token, timeout = 60 } = args;
  
  const result = db.prepare(`
    INSERT INTO file_locks(file_path, session_id, lock_token, expires_at)
    VALUES (?, ?, ?, strftime('%s','now') + ?)
    ON CONFLICT(file_path) DO UPDATE SET
      session_id = excluded.session_id,
      lock_token = excluded.lock_token,
      acquired_at = excluded.acquired_at,
      expires_at = excluded.expires_at
    WHERE file_locks.expires_at IS NULL OR file_locks.expires_at < strftime('%s','now')
    RETURNING file_path
  `).get(file_path, session_id, lock_token, timeout);
  
  return { success: !!result };
}

// Block: mcp/auth-impl from authentication.spec.md
class AuthMiddleware {
  private users: Map<string, string> = new Map();
  private tokens: Set<string> = new Set();
  
  basicAuth(args: string[]): (req, res, next) => void {
    const user = this.getArg(args, '--user');
    const pass = this.getArg(args, '--pass');
    const expected = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
    
    return (req, res, next) => {
      const auth = req.headers.authorization;
      if (auth !== expected) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    };
  }
  
  tokenAuth(args: string[]): (req, res, next) => void {
    const token = this.getArg(args, '--token');
    this.tokens.add(token);
    
    return (req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const provided = auth.slice(7);
      if (!this.tokens.has(provided)) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      
      next();
    };
  }
}

// Block: mcp/sse-impl from sse-stream.spec.md
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
    const newEvents = db.prepare(
      `SELECT * FROM events WHERE timestamp > ? AND processed = 0`
    ).all(Math.floor(this.lastPollTime / 1000));
    for (const event of newEvents) {
      this.broadcast('file.changed', {
        path: event.path,
        change_type: event.kind
      });
    }
    // Query new commands
    const newCommands = db.prepare(
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
    const newSessions = db.prepare(
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
    const convergedCascades = db.prepare(
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
