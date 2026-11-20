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
    /**
     * Call an MCP tool by name with arguments
     */
    callTool(toolName: string, args: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Handle dashboard/tool queries
     */
    private handleDashboardTool;
}
//# sourceMappingURL=server.d.ts.map