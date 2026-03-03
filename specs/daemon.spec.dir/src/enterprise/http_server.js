"use strict";
/**
 * Enterprise HTTP Server with SSE for speclangd
 *
 * Generated from: @speclang/mcp-daemon/architecture
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPServer = void 0;
const express_1 = __importDefault(require("express"));
const events_1 = require("events");
class HTTPServer {
    app;
    server = null;
    port;
    host;
    eventEmitter;
    queue;
    worktrees;
    startTime;
    filesWatching;
    paused;
    constructor(port = 8765, host = 'localhost') {
        this.port = port;
        this.host = host;
        this.eventEmitter = new events_1.EventEmitter();
        this.queue = new Map();
        this.worktrees = new Map();
        this.startTime = Date.now();
        this.filesWatching = 0;
        this.paused = false;
        this.app = (0, express_1.default)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.app.use(express_1.default.json());
        // GET /status
        this.app.get('/status', (_req, res) => {
            const status = {
                mode: 'enterprise',
                queue_depth: this.queue.size,
                files_watching: this.filesWatching,
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
            };
            res.json(status);
        });
        // GET /events - SSE stream
        this.app.get('/events', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            const onEvent = (event) => {
                res.write(`event: ${event.event}\n`);
                res.write(`data: ${JSON.stringify(event.data)}\n\n`);
            };
            this.eventEmitter.on('event', onEvent);
            req.on('close', () => {
                this.eventEmitter.off('event', onEvent);
            });
        });
        // GET /queue
        this.app.get('/queue', (_req, res) => {
            const pending = [];
            const in_progress = [];
            const completed = [];
            for (const item of this.queue.values()) {
                if (item.state === 'pending')
                    pending.push(item.file);
                else if (item.state === 'in_progress')
                    in_progress.push(item.file);
                else if (item.state === 'completed')
                    completed.push(item.file);
            }
            const response = { pending, in_progress, completed };
            res.json(response);
        });
        // POST /command
        this.app.post('/command', (req, res) => {
            const { command, params } = req.body;
            switch (command) {
                case 'pause':
                    this.paused = true;
                    res.json({ ok: true, queue_paused: true });
                    break;
                case 'resume':
                    this.paused = false;
                    res.json({ ok: true, queue_paused: false });
                    break;
                case 'priority':
                    if (params?.file) {
                        const item = this.queue.get(params.file);
                        if (item) {
                            item.priority = 'high';
                            this.broadcastQueueUpdate();
                        }
                    }
                    res.json({ ok: true });
                    break;
                case 'worktree':
                    res.json({ ok: true, worktree_command: 'processed' });
                    break;
                default:
                    res.status(400).json({ error: 'Unknown command' });
            }
        });
        // GET /worktrees
        this.app.get('/worktrees', (_req, res) => {
            res.json(Array.from(this.worktrees.values()));
        });
        // POST /worktree/create
        this.app.post('/worktree/create', (req, res) => {
            const { name, base_commit } = req.body;
            const worktree = {
                name,
                path: `.speclang/worktrees/${name}`,
                base_commit,
                ready: true,
                created_at: Date.now(),
            };
            this.worktrees.set(name, worktree);
            res.json({ path: worktree.path, ready: worktree.ready });
        });
        // POST /worktree/:name/test
        this.app.post('/worktree/:name/test', (req, res) => {
            const { name } = req.params;
            const { filter } = req.body;
            const testResult = {
                test_id: `test-${Date.now()}`,
                status: 'running',
            };
            res.json(testResult);
        });
        // POST /worktree/:name/deploy
        this.app.post('/worktree/:name/deploy', (req, res) => {
            const { name } = req.params;
            const { target } = req.body;
            const deployment = {
                deployment_id: `deploy-${Date.now()}`,
                status: 'deployed',
                target: target || 'production',
                timestamp: Date.now(),
            };
            res.json(deployment);
        });
    }
    broadcastQueueUpdate() {
        const pending = [];
        const in_progress = [];
        for (const item of this.queue.values()) {
            if (item.state === 'pending')
                pending.push(item.file);
            else if (item.state === 'in_progress')
                in_progress.push(item.file);
        }
        this.emit('queue.updated', {
            depth: this.queue.size,
            added: pending,
            removed: in_progress,
        });
    }
    emit(event, data) {
        this.eventEmitter.emit('event', { event, data });
    }
    addToQueue(file, priority = 'normal') {
        const item = {
            id: `item-${Date.now()}`,
            file,
            state: 'pending',
            priority,
            addedAt: Date.now(),
        };
        this.queue.set(file, item);
        this.broadcastQueueUpdate();
    }
    setFilesWatching(count) {
        this.filesWatching = count;
    }
    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, this.host, () => {
                console.log(`[HTTPServer] Enterprise daemon listening on http://${this.host}:${this.port}`);
                resolve();
            });
        });
    }
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('[HTTPServer] Stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
}
exports.HTTPServer = HTTPServer;
//# sourceMappingURL=http_server.js.map