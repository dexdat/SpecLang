/**
 * SPECLANG-GENERATED: MCP Index Tools
 * Source: @speclang/mcp
 */
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { IndexRefreshResult } from '../types.js';
/**
 * Index tool handler
 */
export declare class IndexToolHandler {
    private db;
    private specsDir;
    constructor(db: SpecLangDB, specsDir?: string);
    /**
     * Handle speclang_index_refresh - Rebuild spec index
     */
    handleIndexRefresh(args?: {
        specsDir?: string;
    }): Promise<IndexRefreshResult>;
    /**
     * Handle speclang_index_stats - Get index statistics
     */
    handleIndexStats(): Promise<{
        total_specs: number;
        total_refs: number;
        total_tags: number;
        layers: Record<number, number>;
    }>;
    /**
     * Handle speclang_index_validate - Validate index
     */
    handleIndexValidate(): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
}
//# sourceMappingURL=index-tools.d.ts.map