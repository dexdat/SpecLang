/**
 * Speclang MCP Server
 *
 * Standalone TypeScript MCP server providing SQLite access to any editor.
 *
 * Location: speclang-mcp.ts
 * Version: 0.3.0
 *
 * Generated from @ref:specs/mcp
 */
import Database from "better-sqlite3";
declare class SpeclangDatabase {
    private db;
    constructor(dbPath?: string);
    private setupTables;
    query(sql: string, params?: any[]): any[];
    execute(sql: string, params?: any[]): number;
    prepare(sql: string): Database.Statement;
}
declare class SpeclangMCPServer {
    private db;
    private mode;
    private transports;
    private toolHandlers;
    private authMiddleware;
    private sseManager;
    constructor();
    start(args: string[]): Promise<void>;
    startStdio(): Promise<void>;
    startHTTP(args: string[]): Promise<void>;
    startSocket(args: string[]): Promise<void>;
    private registerTools;
    private getArg;
}
export { SpeclangMCPServer, SpeclangDatabase };
//# sourceMappingURL=speclang-mcp.d.ts.map