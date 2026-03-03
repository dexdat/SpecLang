"use strict";
/**
 * SPECLANG-GENERATED: Session Tools
 * Source: @speclang/tools
 *
 * Session management tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionActivityTool = exports.unregisterSessionTool = exports.updateSessionTool = exports.registerSessionTool = exports.sessionsListTool = exports.sessionInfoTool = void 0;
const sessions = new Map();
// ============================================================================
// SESSION TOOLS
// ============================================================================
/**
 * Session info tool - get current session info
 */
exports.sessionInfoTool = {
    name: 'speclang_session_info',
    description: 'Get current session info',
    category: 'session',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {},
    },
    handler: async (_input, context) => {
        console.log(`[SessionTools] Getting session info: ${context.sessionId}`);
        try {
            // Use session manager if available
            if (context.sessionManager) {
                const session = context.sessionManager.get(context.sessionId);
                if (session) {
                    return {
                        success: true,
                        data: {
                            session_id: session.id,
                            agent: session.agent.role,
                            owns: session.agent.owns,
                            status: session.agent.status,
                        },
                    };
                }
            }
            // Fallback to context
            return {
                success: true,
                data: {
                    session_id: context.sessionId,
                    agent: context.agentRole,
                    owns: context.owns,
                    status: 'active',
                },
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Sessions list tool - list all active sessions
 */
exports.sessionsListTool = {
    name: 'speclang_sessions_list',
    description: 'List all active sessions',
    category: 'session',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {},
    },
    handler: async (_input, context) => {
        console.log(`[SessionTools] Listing sessions`);
        try {
            let sessionList = [];
            // Use session manager if available
            if (context.sessionManager) {
                const allSessions = context.sessionManager.list();
                sessionList = allSessions.map((s) => ({
                    id: s.id,
                    agent: s.agent.role,
                    owns: s.agent.owns,
                    status: s.agent.status,
                    currentFile: s.state.workingOn,
                    created: s.created.getTime(),
                    lastActivity: s.agent.last_activity.getTime(),
                }));
            }
            else {
                // Use in-memory sessions
                sessionList = Array.from(sessions.values());
            }
            return {
                success: true,
                data: {
                    sessions: sessionList.map((s) => ({
                        id: s.id,
                        agent: s.agent,
                        status: s.status,
                        current_file: s.currentFile,
                    })),
                },
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Register session tool - register a session in the tracker
 */
exports.registerSessionTool = {
    name: 'speclang_register_session',
    description: 'Register a session in the tracker',
    category: 'session',
    requiresOwnership: false,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            agent: { type: 'string', description: 'Agent role' },
            owns: { type: 'array', items: { type: 'string' }, description: 'Owned file patterns' },
        },
        required: ['sessionId', 'agent'],
    },
    handler: async (input, _context) => {
        console.log(`[SessionTools] Registering session: ${input.sessionId}`);
        try {
            sessions.set(input.sessionId, {
                id: input.sessionId,
                agent: input.agent,
                owns: input.owns || [],
                status: 'active',
                currentFile: null,
                created: Date.now(),
                lastActivity: Date.now(),
            });
            return { success: true, data: { registered: true } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Update session tool - update session status
 */
exports.updateSessionTool = {
    name: 'speclang_update_session',
    description: 'Update session status',
    category: 'session',
    requiresOwnership: false,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            status: { type: 'string', description: 'New status' },
            currentFile: { type: 'string', description: 'Current file being worked on' },
        },
        required: ['sessionId'],
    },
    handler: async (input, _context) => {
        console.log(`[SessionTools] Updating session: ${input.sessionId}`);
        try {
            const session = sessions.get(input.sessionId);
            if (!session) {
                return { success: false, error: 'Session not found' };
            }
            if (input.status) {
                session.status = input.status;
            }
            if (input.currentFile !== undefined) {
                session.currentFile = input.currentFile;
            }
            session.lastActivity = Date.now();
            return { success: true, data: { updated: true } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Unregister session tool - remove session from tracker
 */
exports.unregisterSessionTool = {
    name: 'speclang_unregister_session',
    description: 'Unregister a session',
    category: 'session',
    requiresOwnership: false,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID' },
        },
        required: ['sessionId'],
    },
    handler: async (input, _context) => {
        console.log(`[SessionTools] Unregistering session: ${input.sessionId}`);
        try {
            const existed = sessions.has(input.sessionId);
            sessions.delete(input.sessionId);
            return { success: true, data: { unregistered: existed } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Session activity tool - record session activity
 */
exports.sessionActivityTool = {
    name: 'speclang_session_activity',
    description: 'Record session activity',
    category: 'session',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID' },
        },
        required: ['sessionId'],
    },
    handler: async (input, _context) => {
        console.log(`[SessionTools] Recording activity: ${input.sessionId}`);
        try {
            const session = sessions.get(input.sessionId);
            if (!session) {
                return { success: false, error: 'Session not found' };
            }
            session.lastActivity = Date.now();
            return { success: true, data: { recorded: true } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
//# sourceMappingURL=session-tools.js.map