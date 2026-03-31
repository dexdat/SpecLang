/**
 * Session Store for speclangd daemon
 * 
 * Generated from: @speclang/daemon/architecture
 * 
 * Manages agent sessions, tracks active sessions, handles session cleanup.
 * Provides in-memory session storage with optional persistence.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { AgentId, AgentStatusKind, AgentStatus } from './types';

/**
 * Session data structure
 */
export interface SessionData {
  id: string;
  agentId: AgentId;
  role: string;
  status: 'idle' | 'busy' | 'error';
  currentFile: string | null;
  ownedFiles: string[];
  createdAt: number;
  lastActive: number;
  expiresAt?: number;
}

/**
 * Session Store events
 */
export interface SessionStoreEvents {
  'session.created': (session: SessionData) => void;
  'session.ended': (session: SessionData) => void;
  'session.updated': (session: SessionData) => void;
  'status.changed': (agentId: AgentId, status: AgentStatusKind) => void;
}

/**
 * Session Store - manages agent sessions for the daemon
 * 
 * Features:
 * - Create/destroy sessions
 * - Track owned files
 * - Session timeout management
 * - Event emission for session lifecycle
 */
export class SessionStore extends EventEmitter {
  private sessions: Map<string, SessionData>;
  private agentToSession: Map<AgentId, string>;
  private defaultTimeout: number;  // ms

  constructor(defaultTimeout: number = 300000) {  // 5 minutes default
    super();
    this.sessions = new Map();
    this.agentToSession = new Map();
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Create a new session
   */
  create(agentId: AgentId, role: string): SessionData {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: SessionData = {
      id: sessionId,
      agentId,
      role,
      status: 'idle',
      currentFile: null,
      ownedFiles: [],
      createdAt: now,
      lastActive: now,
      expiresAt: now + this.defaultTimeout,
    };

    this.sessions.set(sessionId, session);
    this.agentToSession.set(agentId, sessionId);

    this.emit('session.created', session);
    console.log(`[SessionStore] Created session ${sessionId} for agent ${agentId} (${role})`);

    return session;
  }

  /**
   * Get session by ID
   */
  get(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get session by agent ID
   */
  getByAgent(agentId: AgentId): SessionData | null {
    const sessionId = this.agentToSession.get(agentId);
    if (!sessionId) return null;
    return this.sessions.get(sessionId) || null;
  }

  /**
   * End a session
   */
  end(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionStore] Session ${sessionId} not found`);
      return false;
    }

    // Remove agent mapping
    this.agentToSession.delete(session.agentId);

    // Remove session
    this.sessions.delete(sessionId);

    this.emit('session.ended', session);
    console.log(`[SessionStore] Ended session ${sessionId}`);

    return true;
  }

  /**
   * End session by agent ID
   */
  endByAgent(agentId: AgentId): boolean {
    const sessionId = this.agentToSession.get(agentId);
    if (!sessionId) return false;
    return this.end(sessionId);
  }

  /**
   * Update session status
   */
  setStatus(sessionId: string, status: 'idle' | 'busy' | 'error'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = status;
    session.lastActive = Date.now();

    if (session.expiresAt) {
      session.expiresAt = Date.now() + this.defaultTimeout;
    }

    this.emit('status.changed', session.agentId, status);
    this.emit('session.updated', session);

    return true;
  }

  /**
   * Update session's current file
   */
  setCurrentFile(sessionId: string, file: string | null): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.currentFile = file;
    session.lastActive = Date.now();

    this.emit('session.updated', session);
    return true;
  }

  /**
   * Add owned file to session
   */
  addOwnedFile(sessionId: string, file: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (!session.ownedFiles.includes(file)) {
      session.ownedFiles.push(file);
      session.lastActive = Date.now();
      this.emit('session.updated', session);
    }

    return true;
  }

  /**
   * Remove owned file from session
   */
  removeOwnedFile(sessionId: string, file: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.ownedFiles = session.ownedFiles.filter(f => f !== file);
    session.lastActive = Date.now();

    this.emit('session.updated', session);
    return true;
  }

  /**
   * Check if session owns a file
   */
  ownsFile(sessionId: string, file: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return session.ownedFiles.includes(file);
  }

  /**
   * Update session activity (refresh timeout)
   */
  touch(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.lastActive = Date.now();
    if (session.expiresAt) {
      session.expiresAt = Date.now() + this.defaultTimeout;
    }

    return true;
  }

  /**
   * List all active sessions
   */
  list(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get active session count
   */
  getActiveCount(): number {
    return this.sessions.size;
  }

  /**
   * Get sessions by status
   */
  getByStatus(status: 'idle' | 'busy' | 'error'): SessionData[] {
    return this.list().filter(s => s.status === status);
  }

  /**
   * Clean up expired sessions
   */
  cleanup(): string[] {
    const now = Date.now();
    const expired: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt && now > session.expiresAt) {
        console.log(`[SessionStore] Session ${sessionId} expired`);
        this.end(sessionId);
        expired.push(sessionId);
      }
    }

    return expired;
  }

  /**
   * Get agent status for API
   */
  getAgentStatus(agentId: AgentId): AgentStatus | null {
    const session = this.getByAgent(agentId);
    if (!session) return null;

    return {
      id: agentId,
      status: session.status as AgentStatusKind,
      lastUpdate: session.lastActive,
      currentTask: session.currentFile || undefined,
    };
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): AgentStatus[] {
    return this.list().map(session => ({
      id: session.agentId,
      status: session.status as AgentStatusKind,
      lastUpdate: session.lastActive,
      currentTask: session.currentFile || undefined,
    }));
  }

  /**
   * Set default timeout
   */
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  /**
   * Get session count by role
   */
  getCountByRole(role: string): number {
    return this.list().filter(s => s.role === role).length;
  }
}

/**
 * Create a new session store
 */
export function createSessionStore(timeout?: number): SessionStore {
  return new SessionStore(timeout);
}
