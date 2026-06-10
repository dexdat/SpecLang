"use strict";
/**
 * SPECLANG-GENERATED: MCP Server SSE Streaming
 * Source: @speclang/mcp
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEManager = void 0;
exports.createSSEManager = createSSEManager;
/**
 * SSE Manager for real-time event streaming
 */
class SSEManager {
    constructor(db, config) {
        this.clients = new Map();
        this.pollInterval = null;
        this.lastPollTime = Date.now();
        this.db = db;
        this.config = config;
    }
    /**
     * Start SSE polling
     */
    start() {
        if (!this.config.enabled) {
            return;
        }
        this.pollInterval = setInterval(() => {
            this.pollChanges();
        }, 1000);
    }
    /**
     * Stop SSE polling
     */
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    /**
     * Add a new SSE client
     */
    addClient(id, res) {
        const client = {
            id,
            res,
            keepalive: null
        };
        // Send initial headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        // Send keepalive periodically
        if (this.config.heartbeatInterval > 0) {
            client.keepalive = setInterval(() => {
                try {
                    res.write(':keepalive\n\n');
                }
                catch {
                    this.removeClient(id);
                }
            }, this.config.heartbeatInterval);
        }
        this.clients.set(id, client);
    }
    /**
     * Remove a client
     */
    removeClient(id) {
        const client = this.clients.get(id);
        if (client) {
            if (client.keepalive) {
                clearInterval(client.keepalive);
            }
            this.clients.delete(id);
        }
    }
    /**
     * Broadcast event to all clients
     */
    broadcast(type, data) {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString()
        };
        const message = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;
        for (const [id, client] of this.clients) {
            try {
                client.res.write(message);
            }
            catch {
                // Client disconnected
                this.removeClient(id);
            }
        }
    }
    /**
     * Broadcast file change event
     */
    broadcastFileChange(data) {
        this.broadcast('file.changed', {
            path: data.path,
            change_type: data.kind
        });
    }
    /**
     * Broadcast cascade progress event
     */
    broadcastCascadeProgress(data) {
        this.broadcast('cascade.progress', data);
    }
    /**
     * Broadcast agent activity event
     */
    broadcastAgentActivity(data) {
        if (data.status === 'spawned' || data.status === 'active') {
            this.broadcast('agent.spawned', {
                session_id: data.agent_id,
                agent: data.role,
                file: data.working_on
            });
        }
        else if (data.status === 'completed' || data.status === 'failed') {
            this.broadcast('agent.completed', {
                session_id: data.agent_id,
                file: data.working_on,
                status: data.status
            });
        }
    }
    /**
     * Broadcast convergence event
     */
    broadcastConvergence(data) {
        this.broadcast('cascade.converged', {
            cascade_id: data.cascade_id,
            duration: data.duration
        });
    }
    broadcastCommand(data) {
        this.broadcast('command.executed', {
            command_id: data.command_id,
            action: data.action,
            status: data.status
        });
    }
    /**
     * Get client count
     */
    getClientCount() {
        return this.clients.size;
    }
    /**
     * Poll database for changes
     */
    pollChanges() {
        if (!this.db)
            return;
        const now = Date.now();
        const timestamp = Math.floor(this.lastPollTime / 1000);
        try {
            // Poll for new events
            const db = this.db.getDatabase();
            // Check for new file events
            const newEvents = db.prepare(`SELECT * FROM events WHERE timestamp > ? AND processed = 0 ORDER BY timestamp LIMIT 10`).all(timestamp);
            for (const event of newEvents) {
                this.broadcastFileChange({
                    path: event.path,
                    kind: event.kind,
                    cascade_id: event.cascade_id || undefined
                });
            }
            // Check for session changes
            const activeSessions = db.prepare(`SELECT * FROM sessions WHERE last_active > ?`).all(timestamp);
            for (const session of activeSessions) {
                this.broadcastAgentActivity({
                    agent_id: session.id,
                    role: session.agent,
                    status: session.status,
                    working_on: session.current_file || undefined
                });
            }
            // Check for new commands
            const newCommands = db.prepare(`SELECT * FROM commands WHERE created_at > ?`).all(timestamp);
            for (const cmd of newCommands) {
                this.broadcastCommand({
                    command_id: cmd.id,
                    action: cmd.action,
                    status: cmd.status,
                    target: cmd.target || undefined
                });
            }
            // Check for converged cascades
            const convergedCascades = db.prepare(`SELECT * FROM cascades WHERE converged_at IS NOT NULL AND converged_at > ?`).all(timestamp);
            for (const cascade of convergedCascades) {
                // Get files changed in this cascade
                const filesChanged = db.prepare(`SELECT DISTINCT path FROM events WHERE cascade_id = ?`).all(cascade.cascade_id);
                this.broadcastConvergence({
                    cascade_id: cascade.cascade_id,
                    files_changed: filesChanged.map(f => f.path),
                    duration: cascade.converged_at - cascade.created_at
                });
            }
        }
        catch (error) {
            console.error('Error polling for SSE changes:', error);
        }
        this.lastPollTime = now;
    }
    /**
     * Create Express handler for /events endpoint
     */
    expressHandler() {
        return (req, res) => {
            const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            this.addClient(clientId, res);
            // Clean up on disconnect
            req.on('close', () => {
                this.removeClient(clientId);
            });
        };
    }
}
exports.SSEManager = SSEManager;
/**
 * Create SSE manager instance
 */
function createSSEManager(db, config) {
    const manager = new SSEManager(db, config);
    manager.start();
    return manager;
}
