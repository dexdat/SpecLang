/**
 * SPECLANG-GENERATED: MCP Spec CRUD Tools
 * Source: @speclang/mcp
 */
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { GetSpecInput, CreateSpecInput, UpdateSpecInput, ListSpecsInput, MCPSpecMetadata, ValidationResult } from '../types.js';
/**
 * Spec CRUD tool handler
 */
export declare class SpecsToolHandler {
    private db;
    private specsDir;
    constructor(db: SpecLangDB, specsDir?: string);
    /**
     * Handle speclang_get_spec - Get full spec by ID or path
     */
    handleGetSpec(args: GetSpecInput): Promise<{
        metadata: MCPSpecMetadata | null;
        content?: string;
        blocks?: string[];
        dependencies?: string[];
        dependents?: string[];
    }>;
    /**
     * Extract @block: definitions from content
     */
    private extractBlocks;
    /**
     * Get dependents for a spec
     */
    private getDependents;
    /**
     * Handle speclang_create_spec - Create new spec
     */
    handleCreateSpec(args: CreateSpecInput): Promise<{
        success: boolean;
        file: string;
        validation?: ValidationResult;
    }>;
    /**
     * Handle speclang_update_spec - Update existing spec
     */
    handleUpdateSpec(args: UpdateSpecInput): Promise<{
        success: boolean;
        changed_blocks: string[];
        validation?: ValidationResult;
    }>;
    /**
     * Handle speclang_list_specs - List all specs
     */
    handleListSpecs(args: ListSpecsInput): Promise<{
        specs: MCPSpecMetadata[];
        total: number;
    }>;
    /**
     * Validate spec content
     */
    private validateSpecContent;
    /**
     * Index a spec in the database
     */
    private indexSpec;
    /**
     * Create version snapshot
     */
    private createVersion;
}
//# sourceMappingURL=specs.d.ts.map