"use strict";
/**
 * Session API Server
 *
 * HTTP endpoints for session management
 * Generated from: @speclang/agent-protocol/sessions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionApiServer = void 0;
exports.createSessionApiServer = createSessionApiServer;
const express_1 = __importDefault(require("express"));
class SessionApiServer {
    app;
    port;
    sessionManager;
    server = null;
    constructor(config) {
        this.app = (0, express_1.default)();
        this.port = config.port;
        this.sessionManager = config.sessionManager;
        this.app.use(express_1.default.json());
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupRoutes() {
        // POST /session/create - Create new session
        this.app.post('/session/create', (req, res) => {
            try {
                const body = req.body;
                const { agent, owns } = body;
                if (!agent) {
                    res.status(400).json({ error: 'agent is required' });
                    return;
                }
                const session = this.sessionManager.create(agent);
                const response = {
                    session_id: session.id,
                    agent_id: session.agent.id,
                };
                res.status(201).json(response);
            }
            catch (error) {
                console.error('[SessionAPI] Error creating session:', error);
                res.status(500).json({ error: 'Failed to create session' });
            }
        });
        // GET /session/:id/status - Get session status
        this.app.get('/session/:id/status', (req, res) => {
            try {
                const id = req.params.id;
                const session = this.sessionManager.get(id);
                if (!session) {
                    res.status(404).json({ error: 'Session not found' });
                    return;
                }
                const response = {
                    status: session.agent.status,
                    agent: {
                        id: session.agent.id,
                        role: session.agent.role,
                        status: session.agent.status,
                        last_activity: session.agent.last_activity.toISOString(),
                    },
                    working_on: session.state.workingOn,
                    pending_tasks: session.state.pendingTasks.length,
                    completed_tasks: session.state.completedTasks.length,
                    created: session.created.toISOString(),
                };
                res.json(response);
            }
            catch (error) {
                console.error('[SessionAPI] Error getting session status:', error);
                res.status(500).json({ error: 'Failed to get session status' });
            }
        });
        // POST /session/:id/event - Send event to session
        this.app.post('/session/:id/event', (req, res) => {
            try {
                const id = req.params.id;
                const body = req.body;
                const { kind, path, details } = body;
                const session = this.sessionManager.get(id);
                if (!session) {
                    res.status(404).json({ error: 'Session not found' });
                    return;
                }
                // Handle different event kinds
                if (kind === 'file-changed') {
                    this.sessionManager.setAgentStatus(session.agent.id, 'working');
                    if (path) {
                        this.sessionManager.setWorkingOn(session.agent.id, Array.isArray(path) ? path[0] : path);
                    }
                }
                else if (kind === 'work-done') {
                    this.sessionManager.setAgentStatus(session.agent.id, 'idle');
                    this.sessionManager.setWorkingOn(session.agent.id, null);
                }
                const response = {
                    accepted: true,
                };
                res.json(response);
            }
            catch (error) {
                console.error('[SessionAPI] Error handling session event:', error);
                res.status(500).json({ error: 'Failed to handle event' });
            }
        });
        // DELETE /session/:id - Delete session
        this.app.delete('/session/:id', (req, res) => {
            try {
                const id = req.params.id;
                const session = this.sessionManager.get(id);
                if (!session) {
                    res.status(404).json({ error: 'Session not found' });
                    return;
                }
                this.sessionManager.end(id);
                const response = {
                    ok: true,
                };
                res.json(response);
            }
            catch (error) {
                console.error('[SessionAPI] Error deleting session:', error);
                res.status(500).json({ error: 'Failed to delete session' });
            }
        });
        // GET /sessions - List all sessions
        this.app.get('/sessions', (_req, res) => {
            try {
                const sessions = this.sessionManager.list();
                const response = sessions.map(s => ({
                    id: s.id,
                    agent_id: s.agent.id,
                    role: s.agent.role,
                    status: s.agent.status,
                    created: s.created.toISOString(),
                }));
                res.json(response);
            }
            catch (error) {
                console.error('[SessionAPI] Error listing sessions:', error);
                res.status(500).json({ error: 'Failed to list sessions' });
            }
        });
        // Health check
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'ok',
                active_sessions: this.sessionManager.getActiveCount(),
            });
        });
    }
    setupErrorHandling() {
        this.app.use((err, _req, res, _next) => {
            console.error('[SessionAPI] Unhandled error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`[SessionAPI] Server running on port ${this.port}`);
                resolve();
            });
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log('[SessionAPI] Server stopped');
                        resolve();
                    }
                });
            }
            else {
                resolve();
            }
        });
    }
}
exports.SessionApiServer = SessionApiServer;
function createSessionApiServer(sessionManager, port = 3100) {
    return new SessionApiServer({ port, sessionManager });
}
//# sourceMappingURL=session-api.js.map