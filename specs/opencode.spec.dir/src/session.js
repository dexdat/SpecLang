"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
class SessionManager {
    db;
    currentSessionId = null;
    cleanupInterval = null;
    constructor(db) {
        this.db = db;
        this.initSchema();
        this.startCleanup();
    }
    initSchema() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        agent TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        current_file TEXT,
        owns TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL,
        last_active INTEGER NOT NULL
      )
    `);
    }
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleSessions();
        }, 60000);
    }
    cleanupStaleSessions() {
        const cutoff = Date.now() - SESSION_TIMEOUT_MS;
        this.db.prepare('UPDATE sessions SET status = ? WHERE last_active < ? AND status = ?')
            .run('idle', cutoff);
    }
    generateId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    createSession(agent) {
        const sessionId = this.generateId();
        this.db.prepare(`
      INSERT INTO sessions (id, agent, status, owns, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, agent, 'active', '[]', Date.now(), Date.now());
        this.currentSessionId = sessionId;
        return sessionId;
    }
    setCurrentSession(sessionId) {
        this.currentSessionId = sessionId;
    }
    getCurrentSession() {
        return this.currentSessionId;
    }
    async getSession(sessionId) {
        const row = this.db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (!row)
            return undefined;
        return {
            ...row,
            status: row.status,
            owns: JSON.parse(row.owns),
        };
    }
    updateActivity(sessionId) {
        this.db.prepare('UPDATE sessions SET last_active = ? WHERE id = ?').run(Date.now(), sessionId);
    }
    updateStatus(sessionId, status) {
        this.db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, sessionId);
    }
    setCurrentFile(sessionId, filePath) {
        this.db.prepare('UPDATE sessions SET current_file = ? WHERE id = ?').run(filePath, sessionId);
    }
    async addOwnedFile(sessionId, filePath) {
        const session = await this.getSession(sessionId);
        if (!session)
            return;
        const owns = session.owns;
        if (!owns.includes(filePath)) {
            owns.push(filePath);
            this.db.prepare('UPDATE sessions SET owns = ? WHERE id = ?').run(JSON.stringify(owns), sessionId);
        }
    }
    async removeOwnedFile(sessionId, filePath) {
        const session = await this.getSession(sessionId);
        if (!session)
            return;
        const owns = session.owns.filter(f => f !== filePath);
        this.db.prepare('UPDATE sessions SET owns = ? WHERE id = ?').run(JSON.stringify(owns), sessionId);
    }
    async getSessionByAgent(agent) {
        const row = this.db.get('SELECT * FROM sessions WHERE agent = ? ORDER BY created_at DESC LIMIT 1', [agent]);
        if (!row)
            return undefined;
        return {
            ...row,
            status: row.status,
            owns: JSON.parse(row.owns),
        };
    }
    async getActiveSessions() {
        const rows = this.db.all('SELECT * FROM sessions WHERE status != ? AND status != ?', ['done', 'error']);
        return rows.map(row => ({
            ...row,
            status: row.status,
            owns: JSON.parse(row.owns),
        }));
    }
    async allIdle() {
        const active = await this.getActiveSessions();
        return active.every(s => s.status === 'idle');
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session.js.map