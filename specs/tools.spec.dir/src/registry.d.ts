/**
 * SPECLANG-GENERATED: Tool Registry
 * Source: @speclang/tools
 *
 * Tool registry with ownership enforcement and audit logging
 */
import { Tool, ToolContext, ToolResult, ToolMetadata, OwnershipChecker } from './types.js';
/**
 * Tool registry with ownership enforcement and audit logging
 */
export declare class ToolRegistry {
    private tools;
    private ownershipChecker;
    private auditLog;
    constructor(ownershipChecker?: OwnershipChecker);
    /**
     * Register a tool
     */
    register(tool: Tool): void;
    /**
     * Execute a tool by name
     */
    execute(name: string, input: any, context: ToolContext): Promise<ToolResult>;
    /**
     * Get a tool by name
     */
    get(name: string): Tool | undefined;
    /**
     * List all registered tools
     */
    list(): ToolMetadata[];
    /**
     * Get tools by category
     */
    listByCategory(category: string): ToolMetadata[];
    /**
     * Validate input against tool's schema
     */
    private validateInput;
    /**
     * Log tool call for audit
     */
    private logToolCall;
    /**
     * Get audit log
     */
    getAuditLog(limit?: number): typeof this.auditLog;
    /**
     * Clear audit log
     */
    clearAuditLog(): void;
    /**
     * Get count of registered tools
     */
    size(): number;
    /**
     * Check if tool exists
     */
    has(name: string): boolean;
    /**
     * Unregister a tool
     */
    unregister(name: string): boolean;
    /**
     * Clear all tools
     */
    clear(): void;
}
/**
 * Create a tool registry with optional ownership checker
 */
export declare function createToolRegistry(ownershipChecker?: OwnershipChecker): ToolRegistry;
//# sourceMappingURL=registry.d.ts.map