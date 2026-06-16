/**
 * SPECLANG-GENERATED: MCP Server Main
 * Source: @speclang/mcp
 */
import type { MCPServerConfig } from './types.js';
/**
 * SpecLang MCP Server
 */
export declare class MCPServer {
    private config;
    private db;
    private server;
    private auth;
    private sseManager;
    private toolRegistry;
    constructor(config?: Partial<MCPServerConfig>);
    /**
     * Initialize database connection
     */
    private initDatabase;
    /**
     * Start server in stdio mode (default)
     */
    startStdio(): Promise<void>;
    /**
     * Start server in HTTP mode
     */
    startHTTP(port?: number): Promise<void>;
    /**
     * Create MCP server instance
     */
    private createServer;
    /**
     * Stop server
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map