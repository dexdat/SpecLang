/**
speclang-header lines:5
id: @specs/opencode
version: 1.0.0
layer: 5
 */

import type { OpenCodeDatabase } from './types';

export interface Session {
  id: string;
  agent: string;
  status: 'active' | 'idle' | 'done' | 'error';
  current_file: string | null;
  owns: string[];
  created_at: number;
  last_active: number;
}

const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

export class SessionManager {
  private db: OpenCodeDatabase;
  private currentSessionId: string | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(db: OpenCodeDatabase) {
    this.db = db;
    this.initSchema();
    this.startCleanup();
  }

  private initSchema(): void {
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

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleSessions();
    }, 60000);
  }

  private cleanupStaleSessions(): void {
    const cutoff = Date.now() - SESSION_TIMEOUT_MS;
    this.db.prepare('UPDATE sessions SET status = ? WHERE last_active < ? AND status = ?')
      .run('idle', cutoff);
  }

  private generateId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  createSession(agent: string): string {
    const sessionId = this.generateId();
    this.db.prepare(`
      INSERT INTO sessions (id, agent, status, owns, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, agent, 'active', '[]', Date.now(), Date.now());

    this.currentSessionId = sessionId;
    return sessionId;
  }

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  getCurrentSession(): string | null {
    return this.currentSessionId;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const row = this.db.get<{
      id: string;
      agent: string;
      status: string;
      current_file: string | null;
      owns: string;
      created_at: number;
      last_active: number;
    }>('SELECT * FROM sessions WHERE id = ?', [sessionId]);

    if (!row) return undefined;

    return {
      ...row,
      status: row.status as Session['status'],
      owns: JSON.parse(row.owns),
    };
  }

  updateActivity(sessionId: string): void {
    this.db.prepare('UPDATE sessions SET last_active = ? WHERE id = ?').run(Date.now(), sessionId);
  }

  updateStatus(sessionId: string, status: Session['status']): void {
    this.db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, sessionId);
  }

  setCurrentFile(sessionId: string, filePath: string | null): void {
    this.db.prepare('UPDATE sessions SET current_file = ? WHERE id = ?').run(filePath, sessionId);
  }

  async addOwnedFile(sessionId: string, filePath: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const owns = session.owns;
    if (!owns.includes(filePath)) {
      owns.push(filePath);
      this.db.prepare('UPDATE sessions SET owns = ? WHERE id = ?').run(JSON.stringify(owns), sessionId);
    }
  }

  async removeOwnedFile(sessionId: string, filePath: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const owns = session.owns.filter(f => f !== filePath);
    this.db.prepare('UPDATE sessions SET owns = ? WHERE id = ?').run(JSON.stringify(owns), sessionId);
  }

  async getSessionByAgent(agent: string): Promise<Session | undefined> {
    const row = this.db.get<{
      id: string;
      agent: string;
      status: string;
      current_file: string | null;
      owns: string;
      created_at: number;
      last_active: number;
    }>('SELECT * FROM sessions WHERE agent = ? ORDER BY created_at DESC LIMIT 1', [agent]);

    if (!row) return undefined;

    return {
      ...row,
      status: row.status as Session['status'],
      owns: JSON.parse(row.owns),
    };
  }

  async getActiveSessions(): Promise<Session[]> {
    const rows = this.db.all<{
      id: string;
      agent: string;
      status: string;
      current_file: string | null;
      owns: string;
      created_at: number;
      last_active: number;
    }>('SELECT * FROM sessions WHERE status != ? AND status != ?', ['done', 'error']);

    return rows.map(row => ({
      ...row,
      status: row.status as Session['status'],
      owns: JSON.parse(row.owns),
    }));
  }

  async allIdle(): Promise<boolean> {
    const active = await this.getActiveSessions();
    return active.every(s => s.status === 'idle');
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
