"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeclangMCPServer = void 0;
#;
speclang - header;
lines: 3;
#;
target: src / speclang - mcp.ts;
// speclang-header lines:20
// id: @generated/mcp-server
// target: typescript
// produces: speclang-mcp.ts
// layer: 10
// refs: [@ref:specs/mcp]
// ---
// @block:mcp/main @kind:code
/**
 * Speclang MCP Server
 *
 * Standalone TypeScript MCP server providing SQLite access to any editor.
 *
 * Location: speclang-mcp.ts
 * Version: 0.3.0
 *
 * Generated from @ref:specs/mcp
 */
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
// ============================================================================
// Database Setup
// ============================================================================
class SpeclangDatabase {
    db;
    constructor(dbPath = '.speclang/speclang.db') {
        this.db = new better_sqlite3_1.default(dbPath);
        this.setupTables();
    }
    setupTables() {
        // Create tables if they don't exist
        // This is a simplified version - actual schema is in schema.sql
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS specs (
        spec_pk INTEGER PRIMARY KEY,
        file_path TEXT UNIQUE NOT NULL,
        id TEXT UNIQUE NOT NULL,
        header_lines INTEGER NOT NULL,
        header_raw TEXT NOT NULL,
        content_raw TEXT NOT NULL,
        owner_session_id TEXT,
        owned_by TEXT,
        content_hash TEXT NOT NULL,
        short_desc TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS spec_tags (
        spec_pk INTEGER NOT NULL,
        tag TEXT NOT NULL,
        FOREIGN KEY (spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
        PRIMARY KEY (spec_pk, tag)
      );

      CREATE TABLE IF NOT EXISTS spec_deps (
        src_spec_pk INTEGER NOT NULL,
        dst_spec_pk INTEGER NOT NULL,
        dep_kind TEXT NOT NULL,
        FOREIGN KEY (src_spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
        FOREIGN KEY (dst_spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
        PRIMARY KEY (src_spec_pk, dst_spec_pk)
      );

      CREATE TABLE IF NOT EXISTS events (
        event_pk INTEGER PRIMARY KEY,
        cascade_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        path TEXT NOT NULL,
        session_id TEXT,
        file_hash_before TEXT,
        file_hash_after TEXT,
        details TEXT,
        processed INTEGER DEFAULT 0,
        claimed_by TEXT,
        claimed_at INTEGER,
        attempts INTEGER DEFAULT 0,
        timestamp INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS commands (
        command_id TEXT PRIMARY KEY,
        cascade_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_file TEXT,
        session_id TEXT,
        payload TEXT,
        priority INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s','now')),
        started_at INTEGER,
        completed_at INTEGER,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        agent TEXT NOT NULL,
        status TEXT NOT NULL,
        current_file TEXT,
        cascade_id TEXT NOT NULL,
        last_active INTEGER DEFAULT (strftime('%s','now')),
        ended_at INTEGER,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS cascades (
        cascade_id TEXT PRIMARY KEY,
        root_trigger TEXT NOT NULL,
        status TEXT NOT NULL,
        depth INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        converged_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS error_logs (
        error_pk INTEGER PRIMARY KEY,
        source TEXT NOT NULL,
        file TEXT,
        session_id TEXT,
        message TEXT NOT NULL,
        level TEXT NOT NULL,
        timestamp INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS file_locks (
        file_path TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        lock_token TEXT NOT NULL,
        acquired_at INTEGER DEFAULT (strftime('%s','now')),
        expires_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS spec_versions (
        version_pk INTEGER PRIMARY KEY,
        spec_pk INTEGER NOT NULL,
        cascade_id TEXT,
        session_id TEXT,
        content_hash TEXT NOT NULL,
        content_raw TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS specs_fts USING fts5(
        file_path,
        id,
        short_desc,
        content_raw,
        tokenize="porter"
      );
    `);
    }
    query(sql, params = []) {
        return this.db.prepare(sql).all(...params);
    }
    execute(sql, params = []) {
        const result = this.db.prepare(sql).run(...params);
        return result.changes;
    }
    prepare(sql) {
        return this.db.prepare(sql);
    }
}
// ============================================================================
// Tool Handlers
// ============================================================================
class ToolHandlers {
    db;
    constructor(db) {
        this.db = db;
    }
    async handleSearch(args) {
        const { query, limit = 10, tags } = args;
        let sql = `
      SELECT s.file_path, s.id, s.short_desc, 
             bm25(specs_fts) as score
      FROM specs_fts f
      JOIN specs s ON f.rowid = s.spec_pk
      WHERE f MATCH ?
    `;
        const params = [query];
        if (tags && tags.length > 0) {
            sql += ` AND EXISTS (
        SELECT 1 FROM spec_tags st 
        WHERE st.spec_pk = s.spec_pk AND st.tag IN (${tags.map(() => '?').join(',')})
      )`;
            params.push(...tags);
        }
        sql += ` ORDER BY score LIMIT ?`;
        params.push(limit);
        const results = this.db.prepare(sql).all(...params);
        return results;
    }
    async handleClaimEvent(args) {
        const { worker_id } = args;
        // Atomic claim - returns the event or null
        const event = this.db.prepare(`
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
    async handleAcquireLock(args) {
        const { file_path, session_id, lock_token, timeout = 60 } = args;
        const result = this.db.prepare(`
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
    async handleGetTree(args) {
        const { id, depth = 10 } = args;
        const tree = this.db.prepare(`
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
    async handleQuery(args) {
        const { sql, params = [] } = args;
        // Security: only allow SELECT statements
        const trimmed = sql.trim().toLowerCase();
        if (!trimmed.startsWith('select')) {
            throw new Error('Only SELECT statements are allowed');
        }
        const rows = this.db.query(sql, params);
        return { rows };
    }
    async handleExecute(args) {
        const { sql, params = [] } = args;
        // Security: disallow certain dangerous operations
        const trimmed = sql.trim().toLowerCase();
        if (trimmed.startsWith('drop') || trimmed.startsWith('alter')) {
            throw new Error('DROP and ALTER statements are not allowed');
        }
        const changes = this.db.execute(sql, params);
        return { rows_affected: changes };
    }
    async handleGetStatus() {
        const result = this.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM sessions WHERE status IN ('active', 'idle')) as active_sessions,
        (SELECT COUNT(*) FROM commands WHERE status = 'pending') as queue_depth,
        (SELECT (SELECT COUNT(*) FROM sessions WHERE status IN ('active', 'idle')) = 0 AND (SELECT COUNT(*) FROM commands WHERE status = 'pending') = 0 AND (SELECT COUNT(*) FROM events WHERE processed = 0) = 0) as converged,
        (SELECT MAX(depth) FROM cascades WHERE status = 'active') as cascade_depth,
        (SELECT MAX(created_at) FROM spec_versions) as last_build
    `);
        return result[0] || {};
    }
    async handleInsertCommand(args) {
        const { cascade_id, action, target_file, session_id, payload, priority = 0 } = args;
        const command_id = (0, crypto_1.randomUUID)();
        this.db.execute(`INSERT INTO commands (command_id, cascade_id, action, target_file, session_id, payload, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`, [command_id, cascade_id, action, target_file, session_id,
            payload ? JSON.stringify(payload) : null, priority]);
        return { command_id };
    }
}
// ============================================================================
// Authentication Middleware
// ============================================================================
class AuthMiddleware {
    users = new Map();
    tokens = new Set();
    basicAuth(args) {
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
    tokenAuth(args) {
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
    getArg(args, name) {
        const index = args.indexOf(name);
        return index !== -1 && index + 1 < args.length ? args[index + 1] : '';
    }
}
// ============================================================================
// SSE Manager
// ============================================================================
class SSEManager {
    clients = new Map();
    db;
    lastPollTime = Date.now();
    constructor(db) {
        this.db = db;
    }
    start() {
        // Poll SQLite for changes
        setInterval(() => this.pollChanges(), 1000);
    }
    addClient(id, res) {
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
    broadcast(event, data) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const [id, res] of this.clients) {
            try {
                res.write(message);
            }
            catch (e) {
                // Client disconnected
                this.clients.delete(id);
            }
        }
    }
    async pollChanges() {
        const now = Date.now();
        // Query new events
        const newEvents = this.db.query(`SELECT * FROM events WHERE timestamp > ? AND processed = 0`, [Math.floor(this.lastPollTime / 1000)]);
        for (const event of newEvents) {
            this.broadcast('file.changed', {
                path: event.path,
                change_type: event.kind
            });
        }
        this.lastPollTime = now;
    }
}
// ============================================================================
// Main MCP Server
// ============================================================================
class SpeclangMCPServer {
    db;
    mode = 'stdio';
    transports = new Map();
    toolHandlers;
    authMiddleware;
    sseManager;
    constructor() {
        this.db = new SpeclangDatabase();
        this.toolHandlers = new ToolHandlers(this.db);
        this.authMiddleware = new AuthMiddleware();
        this.sseManager = new SSEManager(this.db);
    }
    async start(args) {
        // Detect mode from args
        if (args.includes('--remote')) {
            await this.startHTTP(args);
        }
        else if (args.includes('--serve')) {
            await this.startSocket(args);
        }
        else {
            await this.startStdio();
        }
    }
    async startStdio() {
        this.mode = 'stdio';
        const server = new index_js_1.Server({
            name: "speclang",
            version: "1.0.0"
        }, {
            capabilities: { tools: {} }
        });
        this.registerTools(server);
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.error("Speclang MCP server running on stdio");
    }
    async startHTTP(args) {
        this.mode = 'http';
        const port = this.getArg(args, '--port', '3000');
        const authType = this.getArg(args, '--auth', 'none');
        const app = (0, express_1.default)();
        // Auth middleware
        if (authType === 'basic') {
            app.use(this.authMiddleware.basicAuth(args));
        }
        else if (authType === 'token') {
            app.use(this.authMiddleware.tokenAuth(args));
        }
        // SSE endpoint
        app.get('/mcp', (req, res) => {
            const clientId = (0, crypto_1.randomUUID)();
            const transport = new sse_js_1.SSEServerTransport('/mcp/message', res);
            this.transports.set(clientId, transport);
            const server = new index_js_1.Server({ name: "speclang", version: "1.0.0" });
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
        app.post('/mcp/message', express_1.default.json(), (req, res) => {
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
            }
            catch (err) {
                console.error('Error handling message:', err);
                res.status(500).json({ error: 'Failed to process message' });
            }
        });
        // Events SSE stream
        app.get('/events', (req, res) => {
            this.sseManager.addClient((0, crypto_1.randomUUID)(), res);
        });
        // Start SSE polling
        this.sseManager.start();
        app.listen(parseInt(port), () => {
            console.error(`Speclang MCP server on port ${port}`);
        });
    }
    async startSocket(args) {
        // Unix socket or named pipe
        const socketPath = process.platform === 'win32'
            ? '\\\\.\\pipe\\speclang-mcp'
            : '/tmp/speclang-mcp.sock';
        console.error(`Socket mode not fully implemented (path: ${socketPath})`);
        // Implementation would use net.Server or similar
    }
    registerTools(server) {
        // Register all tools
        server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case 'speclang_search':
                        result = await this.toolHandlers.handleSearch(args);
                        break;
                    case 'speclang_query':
                        result = await this.toolHandlers.handleQuery(args);
                        break;
                    case 'speclang_execute':
                        result = await this.toolHandlers.handleExecute(args);
                        break;
                    case 'speclang_get_status':
                        result = await this.toolHandlers.handleGetStatus();
                        break;
                    case 'speclang_insert_command':
                        result = await this.toolHandlers.handleInsertCommand(args);
                        break;
                    case 'speclang_claim_event':
                        result = await this.toolHandlers.handleClaimEvent(args);
                        break;
                    case 'speclang_acquire_lock':
                        result = await this.toolHandlers.handleAcquireLock(args);
                        break;
                    case 'speclang_get_tree':
                        result = await this.toolHandlers.handleGetTree(args);
                        break;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
                return {
                    content: [{ type: 'text', text: JSON.stringify(result) }]
                };
            }
            catch (error) {
                return {
                    content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
                    isError: true
                };
            }
        });
    }
    getArg(args, name, defaultValue = '') {
        const index = args.indexOf(name);
        return index !== -1 && index + 1 < args.length ? args[index + 1] : defaultValue;
    }
}
exports.SpeclangMCPServer = SpeclangMCPServer;
// ============================================================================
// CLI Entry Point
// ============================================================================
async function main() {
    const args = process.argv.slice(2);
    const server = new SpeclangMCPServer();
    try {
        await server.start(args);
    }
    catch (error) {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=speclang-mcp.js.map