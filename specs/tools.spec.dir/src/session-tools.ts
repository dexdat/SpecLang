/**
 * SPECLANG-GENERATED: Session Tools
 * Source: @speclang/tools
 * 
 * Session management tools
 */

import {
  Tool,
  ToolContext,
  ToolResult,
  SessionInfoInput,
  SessionInfoOutput,
  SessionsListInput,
  SessionsListOutput,
} from './types.js';

// ============================================================================
// SESSION STATE (in-memory)
// ============================================================================

interface SessionInfo {
  id: string;
  agent: string;
  owns: string[];
  status: string;
  currentFile: string | null;
  created: number;
  lastActivity: number;
}

const sessions: Map<string, SessionInfo> = new Map();

// ============================================================================
// SESSION TOOLS
// ============================================================================

/**
 * Session info tool - get current session info
 */
export const sessionInfoTool: Tool<SessionInfoInput, SessionInfoOutput> = {
  name: 'speclang_session_info',
  description: 'Get current session info',
  category: 'session',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: SessionInfoInput,
    context: ToolContext
  ): Promise<ToolResult<SessionInfoOutput>> => {
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Sessions list tool - list all active sessions
 */
export const sessionsListTool: Tool<SessionsListInput, SessionsListOutput> = {
  name: 'speclang_sessions_list',
  description: 'List all active sessions',
  category: 'session',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: SessionsListInput,
    context: ToolContext
  ): Promise<ToolResult<SessionsListOutput>> => {
    console.log(`[SessionTools] Listing sessions`);

    try {
      let sessionList: SessionInfo[] = [];

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
      } else {
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Register session tool - register a session in the tracker
 */
export const registerSessionTool: Tool<{ sessionId: string; agent: string; owns?: string[] }, { registered: boolean }> = {
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
  handler: async (
    input: { sessionId: string; agent: string; owns?: string[] },
    _context: ToolContext
  ): Promise<ToolResult<{ registered: boolean }>> => {
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Update session tool - update session status
 */
export const updateSessionTool: Tool<{ sessionId: string; status?: string; currentFile?: string }, { updated: boolean }> = {
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
  handler: async (
    input: { sessionId: string; status?: string; currentFile?: string },
    _context: ToolContext
  ): Promise<ToolResult<{ updated: boolean }>> => {
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Unregister session tool - remove session from tracker
 */
export const unregisterSessionTool: Tool<{ sessionId: string }, { unregistered: boolean }> = {
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
  handler: async (
    input: { sessionId: string },
    _context: ToolContext
  ): Promise<ToolResult<{ unregistered: boolean }>> => {
    console.log(`[SessionTools] Unregistering session: ${input.sessionId}`);

    try {
      const existed = sessions.has(input.sessionId);
      sessions.delete(input.sessionId);

      return { success: true, data: { unregistered: existed } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Session activity tool - record session activity
 */
export const sessionActivityTool: Tool<{ sessionId: string }, { recorded: boolean }> = {
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
  handler: async (
    input: { sessionId: string },
    _context: ToolContext
  ): Promise<ToolResult<{ recorded: boolean }>> => {
    console.log(`[SessionTools] Recording activity: ${input.sessionId}`);

    try {
      const session = sessions.get(input.sessionId);

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      session.lastActivity = Date.now();

      return { success: true, data: { recorded: true } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
