/**
 * SPECLANG-GENERATED: MCP Server Configuration
 * Source: @speclang/mcp
 */
import type { MCPServerConfig } from './types.js';
/**
 * Load MCP server configuration from file or environment
 */
export declare function loadConfig(options?: Partial<MCPServerConfig>): MCPServerConfig;
/**
 * Load config from file
 */
export declare function loadConfigFromFile(configPath: string): MCPServerConfig;
/**
 * Validate configuration
 */
export declare function validateConfig(config: MCPServerConfig): {
    valid: boolean;
    errors: string[];
};
/**
 * Get CLI argument parser
 */
export declare function getArg(args: string[], name: string, defaultValue?: string): string;
export declare function getArgInt(args: string[], name: string, defaultValue: number): number;
export declare function getArgBool(args: string[], name: string): boolean;
//# sourceMappingURL=config.d.ts.map