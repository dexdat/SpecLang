/**
 * SPECLANG-GENERATED: MCP Search Tool
 * Source: @speclang/mcp
 */
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { SearchInput, SearchResult } from '../types.js';
/**
 * Search tool handler
 */
export declare class SearchToolHandler {
    private db;
    constructor(db: SpecLangDB);
    /**
     * Handle speclang_search - Full-text search using FTS5
     */
    handleSearch(args: SearchInput): Promise<{
        results: SearchResult[];
    }>;
    /**
     * Fallback search using LIKE when FTS is not available
     */
    private handleSearchFallback;
    /**
     * Handle speclang_semantic_search - Vector similarity search
     */
    handleSemanticSearch(args: {
        query_embedding: number[];
        limit?: number;
    }): Promise<{
        results: SearchResult[];
    }>;
    private bufferToEmbedding;
    private cosineSimilarity;
}
//# sourceMappingURL=search.d.ts.map