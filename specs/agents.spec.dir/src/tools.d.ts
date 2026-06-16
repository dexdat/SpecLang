/**
 * Agent tools implementation
 *
 * Generated from: @speclang/agent-protocol
 */
import { Tool, ToolRegistry, ToolHandler } from './types';
/**
 * Simple tool registry implementation
 */
export declare class SimpleToolRegistry implements ToolRegistry {
    private tools;
    constructor();
    get(name: string): Tool | undefined;
    list(): Tool[];
    register(tool: Tool): void;
}
/**
 * Read a spec file by ID
 */
export declare const readSpecHandler: ToolHandler;
/**
 * Write a spec file
 */
export declare const writeSpecHandler: ToolHandler;
/**
 * Search specs using FTS
 */
export declare const searchSpecsHandler: ToolHandler;
/**
 * Read a file
 */
export declare const readFileHandler: ToolHandler;
/**
 * Write a file
 */
export declare const writeFileHandler: ToolHandler;
/**
 * List files in a directory
 */
export declare const listFilesHandler: ToolHandler;
/**
 * Get dependencies for a spec
 */
export declare const getDependenciesHandler: ToolHandler;
/**
 * Get dependents for a spec
 */
export declare const getDependentsHandler: ToolHandler;
/**
 * Get impact analysis for a spec
 */
export declare const impactAnalysisHandler: ToolHandler;
/**
 * Trigger cascade (placeholder - would integrate with daemon)
 */
export declare const triggerCascadeHandler: ToolHandler;
/**
 * Get cascade status
 */
export declare const cascadeStatusHandler: ToolHandler;
export declare const createSpecFileHandler: ToolHandler;
export declare const commitHandler: ToolHandler;
/**
 * Get all standard agent tools
 */
export declare function getStandardTools(): Tool[];
/**
 * Create a tool registry with all standard tools
 */
export declare function createToolRegistry(): ToolRegistry;
//# sourceMappingURL=tools.d.ts.map