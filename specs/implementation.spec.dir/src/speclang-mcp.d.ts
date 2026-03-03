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
export { SpeclangMCPServer };
//# sourceMappingURL=speclang-mcp.d.ts.map