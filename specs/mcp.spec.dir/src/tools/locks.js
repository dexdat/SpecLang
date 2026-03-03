"use strict";
/**
 * SPECLANG-GENERATED: MCP Lock Tools
 * Source: @speclang/mcp
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocksToolHandler = void 0;
const crypto_1 = require("crypto");
/**
 * Lock tool handler
 */
class LocksToolHandler {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Handle speclang_lock - Acquire file lock
     */
    async handleLock(args) {
        const { resource, agent_id, ttl = 60 } = args;
        const lockId = (0, crypto_1.randomUUID)();
        const expiresAt = Date.now() + (ttl * 1000);
        const db = this.db.getDatabase();
        try {
            // Try to acquire lock
            const result = db.prepare(`
        INSERT INTO locks (file_path, session_id, locked_at, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(resource, agent_id, Date.now(), expiresAt);
            if (result.changes > 0) {
                return { acquired: true, lock_id: lockId };
            }
            // Lock exists, check if it expired
            const existing = db.prepare('SELECT * FROM locks WHERE file_path = ?').get(resource);
            if (existing && existing.expires_at < Date.now()) {
                // Lock expired, update it
                db.prepare(`
          UPDATE locks SET session_id = ?, locked_at = ?, expires_at = ?
          WHERE file_path = ?
        `).run(agent_id, Date.now(), expiresAt, resource);
                return { acquired: true, lock_id: lockId };
            }
            // Lock is held by someone else
            return { acquired: false, held_by: existing?.session_id };
        }
        catch (error) {
            console.error('Error acquiring lock:', error);
            return { acquired: false, held_by: 'unknown' };
        }
    }
    /**
     * Handle speclang_unlock - Release file lock
     */
    async handleUnlock(args) {
        const { lock_id, agent_id } = args;
        const db = this.db.getDatabase();
        try {
            // Find the lock by token (we store agent_id as session_id)
            const lock = db.prepare('SELECT * FROM locks WHERE session_id = ?').get(agent_id);
            if (!lock) {
                return { released: false };
            }
            // Delete the lock
            const result = db.prepare('DELETE FROM locks WHERE file_path = ? AND session_id = ?').run(lock.file_path, agent_id);
            return { released: result.changes > 0 };
        }
        catch (error) {
            console.error('Error releasing lock:', error);
            return { released: false };
        }
    }
    /**
     * Handle speclang_check_lock - Check if resource is locked
     */
    async handleCheckLock(args) {
        const { resource } = args;
        const db = this.db.getDatabase();
        const lock = db.prepare('SELECT * FROM locks WHERE file_path = ?').get(resource);
        if (!lock) {
            return { locked: false };
        }
        // Check if expired
        if (lock.expires_at < Date.now()) {
            db.prepare('DELETE FROM locks WHERE file_path = ?').run(resource);
            return { locked: false };
        }
        return {
            locked: true,
            held_by: lock.session_id,
            expires_at: lock.expires_at
        };
    }
    /**
     * Handle speclang_force_unlock - Force unlock (admin only)
     */
    async handleForceUnlock(args) {
        const { resource } = args;
        const db = this.db.getDatabase();
        const result = db.prepare('DELETE FROM locks WHERE file_path = ?').run(resource);
        return { released: result.changes > 0 };
    }
}
exports.LocksToolHandler = LocksToolHandler;
//# sourceMappingURL=locks.js.map