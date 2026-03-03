/**
 * SPECLANG-GENERATED: MCP Error Handler
 * Source: @speclang/mcp.error-handling
 */
import { MCPErrors, type ErrorConfig, type MCPToolError } from './types.js';
export declare const DATABASE_ERROR_CONFIG: Record<string, ErrorConfig>;
export declare const TOOL_ERROR_CONFIG: Record<string, ErrorConfig>;
export declare const TRANSPORT_ERROR_CONFIG: Record<string, ErrorConfig>;
export declare class MCPErrorHandler {
    private adminNotify;
    constructor(options?: {
        adminNotify?: boolean;
    });
    handleDatabaseError(error: Error & {
        code?: string;
    }): void;
    handleToolError(errorType: MCPErrors): MCPToolError;
    handleTransportError(error: Error, reconnectFn?: () => Promise<void>): Promise<boolean>;
    withDatabaseRetry<T>(operation: () => Promise<T>): Promise<{
        success: boolean;
        result?: T;
        error?: Error;
    }>;
    private notifyAdmin;
}
export declare function getDefaultHandler(): MCPErrorHandler;
export declare function createErrorHandler(options?: {
    adminNotify?: boolean;
}): MCPErrorHandler;
//# sourceMappingURL=handler.d.ts.map