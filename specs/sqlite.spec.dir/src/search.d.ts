/**
 * SPECLANG-GENERATED: FTS5 and Vector search implementation
 * Source: @speclang/sqlite @block:sqlite/fts @block:sqlite/vector
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import type { SearchResult, SearchOptions, VectorSearchOptions } from './types.js';
/**
 * Full-text search on specs
 */
export declare class FullTextSearch {
    private db;
    constructor(db: DatabaseType);
    /**
     * Search specs by text content
     * @param options.search - Search query
     * @param options.limit - Max results (default 10)
     * @param options.tags - Optional tag filter
     */
    search(options: SearchOptions): SearchResult[];
    /**
     * Search with exact ID match
     */
    searchById(id: string, limit?: number): SearchResult[];
    /**
     * Get search suggestions based on prefix
     */
    suggest(prefix: string, limit?: number): string[];
}
/**
 * Vector search (stub implementation)
 * This is a placeholder for future embedding-based search
 */
export declare class VectorSearch {
    private db;
    constructor(db: DatabaseType);
    /**
     * Search for similar specs using embeddings
     * Currently returns empty results - stub for future implementation
     *
     * TODO: Implement when sqlite-vss or similar extension is available
     */
    findSimilar(options: VectorSearchOptions): SearchResult[];
    /**
     * Check if vector search is available
     */
    isAvailable(): boolean;
    /**
     * Generate embedding (stub)
     * TODO: Implement with OpenAI or local model
     */
    generateEmbedding(text: string): Promise<number[]>;
}
/**
 * Graph queries for dependency tracking
 */
export declare class GraphQueries {
    private db;
    constructor(db: DatabaseType);
    /**
     * Find all specs that depend on a given spec
     */
    findDependents(id: string): {
        file_path: string;
        id: string | null;
        short_desc: string | null;
    }[];
    /**
     * Find all specs that a given spec depends on
     */
    findDependencies(id: string): {
        file_path: string;
        id: string | null;
        short_desc: string | null;
    }[];
    /**
     * Get the full tree starting from a spec
     */
    getTree(filePath: string, maxDepth?: number): {
        file_path: string;
        id: string | null;
        depth: number;
    }[];
    /**
     * Find ancestors up to root (north star)
     */
    findAncestors(filePath: string): {
        file_path: string;
        id: string | null;
        parent_id: string | null;
        depth: number;
    }[];
    /**
     * Detect circular dependencies
     */
    detectCycles(): {
        file_path: string;
        id: string;
    }[];
}
/**
 * JSON query helpers
 */
export declare class JSONQueries {
    private db;
    constructor(db: DatabaseType);
    /**
     * Find specs with specific tag
     */
    findByTag(tag: string): {
        file_path: string;
        id: string | null;
    }[];
    /**
     parsed JSON field
   * Find specs by   */
    findByField(field: string, value: unknown): {
        file_path: string;
        id: string | null;
        short_desc: string | null;
    }[];
    /**
     * Count specs by a field
     */
    countByField(field: string): {
        value: string;
        count: number;
    }[];
}
//# sourceMappingURL=search.d.ts.map