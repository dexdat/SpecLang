/**
 * SPECLANG-GENERATED: Session Tools
 * Source: @speclang/tools
 *
 * Session management tools
 */
import { Tool, SessionInfoInput, SessionInfoOutput, SessionsListInput, SessionsListOutput } from './types.js';
/**
 * Session info tool - get current session info
 */
export declare const sessionInfoTool: Tool<SessionInfoInput, SessionInfoOutput>;
/**
 * Sessions list tool - list all active sessions
 */
export declare const sessionsListTool: Tool<SessionsListInput, SessionsListOutput>;
/**
 * Register session tool - register a session in the tracker
 */
export declare const registerSessionTool: Tool<{
    sessionId: string;
    agent: string;
    owns?: string[];
}, {
    registered: boolean;
}>;
/**
 * Update session tool - update session status
 */
export declare const updateSessionTool: Tool<{
    sessionId: string;
    status?: string;
    currentFile?: string;
}, {
    updated: boolean;
}>;
/**
 * Unregister session tool - remove session from tracker
 */
export declare const unregisterSessionTool: Tool<{
    sessionId: string;
}, {
    unregistered: boolean;
}>;
/**
 * Session activity tool - record session activity
 */
export declare const sessionActivityTool: Tool<{
    sessionId: string;
}, {
    recorded: boolean;
}>;
//# sourceMappingURL=session-tools.d.ts.map