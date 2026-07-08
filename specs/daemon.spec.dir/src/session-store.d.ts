/**
 * Session Store for speclangd daemon
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Manages agent sessions, tracks active sessions, handles session cleanup.
 * Provides in-memory session storage with optional persistence.
 */
import { EventEmitter } from 'events';
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
export declare class SessionStore extends EventEmitter {
    private sessions;
    private agentToSession;
    private defaultTimeout;
    constructor(defaultTimeout?: number);
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Create a new session
     */
    create(agentId: AgentId, role: string): SessionData;
    /**
     * Get session by ID
     */
    get(sessionId: string): SessionData | null;
    /**
     * Get session by agent ID
     */
    getByAgent(agentId: AgentId): SessionData | null;
    /**
     * End a session
     */
    end(sessionId: string): boolean;
    /**
     * End session by agent ID
     */
    endByAgent(agentId: AgentId): boolean;
    /**
     * Update session status
     */
    setStatus(sessionId: string, status: 'idle' | 'busy' | 'error'): boolean;
    /**
     * Update session's current file
     */
    setCurrentFile(sessionId: string, file: string | null): boolean;
    /**
     * Add owned file to session
     */
    addOwnedFile(sessionId: string, file: string): boolean;
    /**
     * Remove owned file from session
     */
    removeOwnedFile(sessionId: string, file: string): boolean;
    /**
     * Check if session owns a file
     */
    ownsFile(sessionId: string, file: string): boolean;
    /**
     * Update session activity (refresh timeout)
     */
    touch(sessionId: string): boolean;
    /**
     * List all active sessions
     */
    list(): SessionData[];
    /**
     * Get active session count
     */
    getActiveCount(): number;
    /**
     * Get sessions by status
     */
    getByStatus(status: 'idle' | 'busy' | 'error'): SessionData[];
    /**
     * Clean up expired sessions
     */
    cleanup(): string[];
    /**
     * Get agent status for API
     */
    getAgentStatus(agentId: AgentId): AgentStatus | null;
    /**
     * Get all agent statuses
     */
    getAllAgentStatuses(): AgentStatus[];
    /**
     * Set default timeout
     */
    setDefaultTimeout(timeout: number): void;
    /**
     * Get session count by role
     */
    getCountByRole(role: string): number;
}
/**
 * Create a new session store
 */
export declare function createSessionStore(timeout?: number): SessionStore;
//# sourceMappingURL=session-store.d.ts.map