"use strict";
/**
 * Session Store for speclangd daemon
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Manages agent sessions, tracks active sessions, handles session cleanup.
 * Provides in-memory session storage with optional persistence.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStore = void 0;
exports.createSessionStore = createSessionStore;
const events_1 = require("events");
const crypto = __importStar(require("crypto"));
/**
 * Session Store - manages agent sessions for the daemon
 *
 * Features:
 * - Create/destroy sessions
 * - Track owned files
 * - Session timeout management
 * - Event emission for session lifecycle
 */
class SessionStore extends events_1.EventEmitter {
    sessions;
    agentToSession;
    defaultTimeout; // ms
    constructor(defaultTimeout = 300000) {
        super();
        this.sessions = new Map();
        this.agentToSession = new Map();
        this.defaultTimeout = defaultTimeout;
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }
    /**
     * Create a new session
     */
    create(agentId, role) {
        const sessionId = this.generateSessionId();
        const now = Date.now();
        const session = {
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
    get(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    /**
     * Get session by agent ID
     */
    getByAgent(agentId) {
        const sessionId = this.agentToSession.get(agentId);
        if (!sessionId)
            return null;
        return this.sessions.get(sessionId) || null;
    }
    /**
     * End a session
     */
    end(sessionId) {
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
    endByAgent(agentId) {
        const sessionId = this.agentToSession.get(agentId);
        if (!sessionId)
            return false;
        return this.end(sessionId);
    }
    /**
     * Update session status
     */
    setStatus(sessionId, status) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
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
    setCurrentFile(sessionId, file) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        session.currentFile = file;
        session.lastActive = Date.now();
        this.emit('session.updated', session);
        return true;
    }
    /**
     * Add owned file to session
     */
    addOwnedFile(sessionId, file) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
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
    removeOwnedFile(sessionId, file) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        session.ownedFiles = session.ownedFiles.filter(f => f !== file);
        session.lastActive = Date.now();
        this.emit('session.updated', session);
        return true;
    }
    /**
     * Check if session owns a file
     */
    ownsFile(sessionId, file) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        return session.ownedFiles.includes(file);
    }
    /**
     * Update session activity (refresh timeout)
     */
    touch(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        session.lastActive = Date.now();
        if (session.expiresAt) {
            session.expiresAt = Date.now() + this.defaultTimeout;
        }
        return true;
    }
    /**
     * List all active sessions
     */
    list() {
        return Array.from(this.sessions.values());
    }
    /**
     * Get active session count
     */
    getActiveCount() {
        return this.sessions.size;
    }
    /**
     * Get sessions by status
     */
    getByStatus(status) {
        return this.list().filter(s => s.status === status);
    }
    /**
     * Clean up expired sessions
     */
    cleanup() {
        const now = Date.now();
        const expired = [];
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
    getAgentStatus(agentId) {
        const session = this.getByAgent(agentId);
        if (!session)
            return null;
        return {
            id: agentId,
            status: session.status,
            lastUpdate: session.lastActive,
            currentTask: session.currentFile || undefined,
        };
    }
    /**
     * Get all agent statuses
     */
    getAllAgentStatuses() {
        return this.list().map(session => ({
            id: session.agentId,
            status: session.status,
            lastUpdate: session.lastActive,
            currentTask: session.currentFile || undefined,
        }));
    }
    /**
     * Set default timeout
     */
    setDefaultTimeout(timeout) {
        this.defaultTimeout = timeout;
    }
    /**
     * Get session count by role
     */
    getCountByRole(role) {
        return this.list().filter(s => s.role === role).length;
    }
}
exports.SessionStore = SessionStore;
/**
 * Create a new session store
 */
function createSessionStore(timeout) {
    return new SessionStore(timeout);
}
//# sourceMappingURL=session-store.js.map