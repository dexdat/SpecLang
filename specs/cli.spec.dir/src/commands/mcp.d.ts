/**
 * SPECLANG-GENERATED: MCP command
 * Source: @speclang/mcp.cli
 */
export interface MCPOptions {
    json?: boolean;
}
export interface MCPStartOptions extends MCPOptions {
    port?: number;
    remote?: boolean;
    auth?: string;
    user?: string;
    pass?: string;
    token?: string;
    config?: string;
}
export interface MCPServeOptions extends MCPOptions {
    config?: string;
}
export interface MCPStatusOptions extends MCPOptions {
}
export interface MCPStopOptions extends MCPOptions {
}
export interface MCPGenerateOpenApiOptions extends MCPOptions {
    input: string;
    output: string;
    transport?: string;
    port?: number;
    serverName?: string;
    baseUrl?: string;
    force?: boolean;
    register?: boolean;
}
/**
 * MCP command implementation
 */
export declare function mcpCommand(action: 'start' | 'serve' | 'status' | 'stop' | 'generate-openapi', options: MCPStartOptions | MCPServeOptions | MCPStatusOptions | MCPStopOptions | MCPGenerateOpenApiOptions): Promise<void>;
export default mcpCommand;
//# sourceMappingURL=mcp.d.ts.map