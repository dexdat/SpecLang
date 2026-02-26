/**
speclang-header lines:5
id: @specs/opencode
version: 1.0.0
layer: 5
 */

import type { OpenCodeDatabase } from './types';

export interface FileLock {
  file_path: string;
  session_id: string;
  lock_token: string;
  acquired_at: number;
  expires_at: number;
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export class OwnershipGuard {
  private db: OpenCodeDatabase;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(db: OpenCodeDatabase) {
    this.db = db;
    this.initSchema();
    this.startCleanup();
  }

  private initSchema(): void {
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

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredLocks();
    }, 60000);
  }

  private cleanupExpiredLocks(): void {
    const now = Date.now();
    this.db.prepare('DELETE FROM file_locks WHERE expires_at < ?').run(now);
  }

  private generateToken(): string {
    return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async ownsFile(sessionId: string, filePath: string): Promise<boolean> {
    const lock = this.db.get<FileLock>(
      'SELECT * FROM file_locks WHERE file_path = ? AND session_id = ? AND expires_at > ?',
      [filePath, sessionId, Date.now()]
    );
    return !!lock;
  }

  async acquireOwnership(sessionId: string, filePath: string): Promise<string> {
    const lockToken = this.generateToken();
    const expiresAt = Date.now() + LOCK_TIMEOUT_MS;

    this.db.prepare(`
      INSERT OR REPLACE INTO file_locks (file_path, session_id, lock_token, acquired_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(filePath, sessionId, lockToken, Date.now(), expiresAt);

    return lockToken;
  }

  async releaseOwnership(sessionId: string, filePath?: string): Promise<void> {
    if (filePath) {
      this.db.prepare('DELETE FROM file_locks WHERE session_id = ? AND file_path = ?').run(sessionId, filePath);
    } else {
      this.db.prepare('DELETE FROM file_locks WHERE session_id = ?').run(sessionId);
    }
  }

  async releaseAllForSession(sessionId: string): Promise<void> {
    this.db.prepare('DELETE FROM file_locks WHERE session_id = ?').run(sessionId);
  }

  async getLockInfo(filePath: string): Promise<FileLock | undefined> {
    return this.db.get<FileLock>('SELECT * FROM file_locks WHERE file_path = ?', [filePath]);
  }

  async refreshLock(sessionId: string, filePath: string): Promise<boolean> {
    const lock = await this.getLockInfo(filePath);
    if (!lock || lock.session_id !== sessionId) {
      return false;
    }

    const expiresAt = Date.now() + LOCK_TIMEOUT_MS;
    this.db.prepare('UPDATE file_locks SET expires_at = ? WHERE file_path = ? AND session_id = ?')
      .run(expiresAt, filePath, sessionId);
    return true;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
