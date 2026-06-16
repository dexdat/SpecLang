"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipGuard = void 0;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
class OwnershipGuard {
    db;
    cleanupInterval = null;
    constructor(db) {
        this.db = db;
        this.initSchema();
        this.startCleanup();
    }
    initSchema() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS file_locks (
        file_path TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        lock_token TEXT NOT NULL,
        acquired_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);
    }
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredLocks();
        }, 60000);
    }
    cleanupExpiredLocks() {
        const now = Date.now();
        this.db.prepare('DELETE FROM file_locks WHERE expires_at < ?').run(now);
    }
    generateToken() {
        return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    async ownsFile(sessionId, filePath) {
        const lock = this.db.get('SELECT * FROM file_locks WHERE file_path = ? AND session_id = ? AND expires_at > ?', [filePath, sessionId, Date.now()]);
        return !!lock;
    }
    async acquireOwnership(sessionId, filePath) {
        const lockToken = this.generateToken();
        const expiresAt = Date.now() + LOCK_TIMEOUT_MS;
        this.db.prepare(`
      INSERT OR REPLACE INTO file_locks (file_path, session_id, lock_token, acquired_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(filePath, sessionId, lockToken, Date.now(), expiresAt);
        return lockToken;
    }
    async releaseOwnership(sessionId, filePath) {
        if (filePath) {
            this.db.prepare('DELETE FROM file_locks WHERE session_id = ? AND file_path = ?').run(sessionId, filePath);
        }
        else {
            this.db.prepare('DELETE FROM file_locks WHERE session_id = ?').run(sessionId);
        }
    }
    async releaseAllForSession(sessionId) {
        this.db.prepare('DELETE FROM file_locks WHERE session_id = ?').run(sessionId);
    }
    async getLockInfo(filePath) {
        return this.db.get('SELECT * FROM file_locks WHERE file_path = ?', [filePath]);
    }
    async refreshLock(sessionId, filePath) {
        const lock = await this.getLockInfo(filePath);
        if (!lock || lock.session_id !== sessionId) {
            return false;
        }
        const expiresAt = Date.now() + LOCK_TIMEOUT_MS;
        this.db.prepare('UPDATE file_locks SET expires_at = ? WHERE file_path = ? AND session_id = ?')
            .run(expiresAt, filePath, sessionId);
        return true;
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}
exports.OwnershipGuard = OwnershipGuard;
//# sourceMappingURL=ownership.js.map