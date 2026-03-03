/**
 * SPECLANG-GENERATED: Server command
 * Source: @speclang/mcp.cli
 */
export interface ServerOptions {
    port?: number;
    daemon?: boolean;
    http?: boolean;
    json?: boolean;
}
/**
 * Server command implementation
 */
export declare function serverCommand(options: ServerOptions): Promise<void>;
export default serverCommand;
//# sourceMappingURL=server.d.ts.map