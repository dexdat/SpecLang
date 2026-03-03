import { Command } from 'commander';
/**
 * Generate MCP server from OpenAPI spec
 */
export declare function generateOpenApiMCP(options: {
    input: string;
    output: string;
    transport?: 'stdio' | 'web' | 'streamable-http';
    port?: number;
    serverName?: string;
    baseUrl?: string;
    force?: boolean;
    register?: boolean;
}): Promise<void>;
/**
 * Add command to CLI program
 */
export declare function addGenerateOpenApiCommand(program: Command): void;
export declare function createCLI(): Command;
//# sourceMappingURL=mcp-generate-openapi.d.ts.map