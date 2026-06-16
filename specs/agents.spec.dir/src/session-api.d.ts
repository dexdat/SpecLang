/**
 * Session API Server
 *
 * HTTP endpoints for session management
 * Generated from: @speclang/agent-protocol/sessions
 */
import { SessionManager } from './session';
export interface SessionApiConfig {
    port: number;
    sessionManager: SessionManager;
}
export declare class SessionApiServer {
    private app;
    private port;
    private sessionManager;
    private server;
    constructor(config: SessionApiConfig);
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createSessionApiServer(sessionManager: SessionManager, port?: number): SessionApiServer;
//# sourceMappingURL=session-api.d.ts.map