/**
 * SPECLANG-GENERATED: MCP Server Authentication
 * Source: @speclang/mcp
 */
import type { MCPAuthConfig } from './types.js';
import type { Request, Response, NextFunction } from 'express';
/**
 * Authentication middleware for MCP server
 */
export declare class MCPAuth {
    private config;
    private apiKeys;
    constructor(config: MCPAuthConfig);
    /**
     * Create Express middleware for authentication
     */
    middleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Basic authentication middleware
     */
    private basicAuthMiddleware;
    /**
     * Token/Bearer authentication middleware
     */
    private tokenAuthMiddleware;
    /**
     * Config file based authentication middleware
     */
    private configFileAuthMiddleware;
    /**
     * TLS client certificate authentication middleware
     */
    private tlsClientCertAuthMiddleware;
    /**
     * Validate API key (for MCP protocol)
     */
    validateApiKey(key: string): boolean;
    /**
     * Check if auth is enabled
     */
    isEnabled(): boolean;
    /**
     * Get auth type
     */
    getType(): string;
}
/**
 * Create auth instance from config
 */
export declare function createAuth(config: MCPAuthConfig): MCPAuth;
//# sourceMappingURL=auth.d.ts.map