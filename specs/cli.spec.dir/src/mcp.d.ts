/**
 * SPECLANG-GENERATED: MCP subcommands
 * Source: @speclang/mcp.cli
 */
export interface McpStartOptions {
    remote?: boolean;
    port?: number;
    auth?: string;
    user?: string;
    pass?: string;
    token?: string;
    config?: string;
    json?: boolean;
}
export interface McpServeOptions {
    config?: string;
    json?: boolean;
}
export interface McpStatusOptions {
    json?: boolean;
}
export interface McpStopOptions {
    json?: boolean;
}
export interface McpGenerateOpenapiOptions {
    input?: string;
    output?: string;
    transport?: string;
    port?: number;
    serverName?: string;
    baseUrl?: string;
    force?: boolean;
    register?: boolean;
    dryRun?: boolean;
    json?: boolean;
}
/**
 * MCP start command - start MCP server
 */
export declare function mcpStartCommand(options: McpStartOptions): Promise<void>;
/**
 * MCP serve command - daemon mode
 */
export declare function mcpServeCommand(options: McpServeOptions): Promise<void>;
/**
 * MCP status command - show server status
 */
export declare function mcpStatusCommand(options: McpStatusOptions): Promise<void>;
/**
 * MCP stop command - stop daemon
 */
export declare function mcpStopCommand(options: McpStopOptions): Promise<void>;
/**
 * MCP generate-openapi command - generate MCP server from OpenAPI spec
 */
export declare function mcpGenerateOpenapiCommand(options: McpGenerateOpenapiOptions): Promise<void>;
export interface McpGenerateAllOptions {
    config?: string;
    force?: boolean;
    json?: boolean;
}
export declare function mcpGenerateAllCommand(options: McpGenerateAllOptions): Promise<void>;
declare const _default: {
    mcpStartCommand: typeof mcpStartCommand;
    mcpServeCommand: typeof mcpServeCommand;
    mcpStatusCommand: typeof mcpStatusCommand;
    mcpStopCommand: typeof mcpStopCommand;
    mcpGenerateOpenapiCommand: typeof mcpGenerateOpenapiCommand;
    mcpGenerateAllCommand: typeof mcpGenerateAllCommand;
};
export default _default;
//# sourceMappingURL=mcp.d.ts.map