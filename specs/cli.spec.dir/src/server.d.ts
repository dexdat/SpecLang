/**
 * SPECLANG-GENERATED: Server command
 * Source: @speclang/mcp.cli
 */
export interface ServerOptions {
    port?: number;
    daemon?: boolean;
    http?: boolean;
    remote?: boolean;
    auth?: 'none' | 'basic' | 'token';
    user?: string;
    pass?: string;
    token?: string;
    config?: string;
    json?: boolean;
}
/**
 * Server command implementation
 */
export declare function serverCommand(options: ServerOptions): Promise<void>;
export default serverCommand;
//# sourceMappingURL=server.d.ts.map