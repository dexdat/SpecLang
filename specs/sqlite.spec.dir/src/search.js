"use strict";
/**
 * SPECLANG-GENERATED: FTS5 and Vector search implementation
 * Source: @speclang/sqlite @block:sqlite/fts @block:sqlite/vector
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONQueries = exports.GraphQueries = exports.VectorSearch = exports.FullTextSearch = void 0;
/**
 * Full-text search on specs
 */
class FullTextSearch {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Search specs by text content
     * @param options.search - Search query
     * @param options.limit - Max results (default 10)
     * @param options.tags - Optional tag filter
     */
    search(options) {
        const { query, limit = 10, tags } = options;
        // Build the query
        let sql = `
      SELECT 
        s.file_path,
        s.id,
        s.short_desc,
        bm25(specs_fts) as score,
        rank
      FROM specs_fts f
      JOIN specs s ON s.file_path = f.file_path
      WHERE specs_fts MATCH ?
    `;
        const params = [query];
        // Add tag filter if provided
        if (tags && tags.length > 0) {
            const tagConditions = tags.map(() => `s.tags LIKE ?`).join(' OR ');
            sql += ` AND (${tagConditions})`;
            tags.forEach(tag => params.push(`%"${tag}"%`));
        }
        sql += ` ORDER BY score LIMIT ?`;
        params.push(limit);
        const stmt = this.db.prepare(sql);
        return stmt.all(...params);
    }
    /**
     * Search with exact ID match
     */
    searchById(id, limit = 10) {
        const stmt = this.db.prepare(`
      SELECT 
        s.file_path,
        s.id,
        s.short_desc,
        bm25(specs_fts) as score,
        rank
      FROM specs_fts f
      JOIN specs s ON s.file_path = f.file_path
      WHERE specs_fts MATCH 'id:${id}'
      ORDER BY score
      LIMIT ?
    `);
        return stmt.all(limit);
    }
    /**
     * Get search suggestions based on prefix
     */
    suggest(prefix, limit = 5) {
        // Use prefix search in FTS5
        const stmt = this.db.prepare(`
      SELECT id FROM specs_fts
      WHERE id MATCH ?
      LIMIT ?
    `);
        const results = stmt.all(`${prefix}*`, limit);
        return results.map(r => r.id);
    }
}
exports.FullTextSearch = FullTextSearch;
/**
 * Vector search (stub implementation)
 * This is a placeholder for future embedding-based search
 */
class VectorSearch {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Search for similar specs using embeddings
     * Currently returns empty results - stub for future implementation
     *
     * TODO: Implement when sqlite-vss or similar extension is available
     */
    findSimilar(options) {
        const { embedding, limit = 5 } = options;
        // Stub implementation - returns empty results
        // In production, this would use:
        // - sqlite-vss extension
        // - or cosine similarity calculation
        // - or libsql vector support
        console.warn('Vector search is not yet implemented. Embedding dimensions:', embedding.length);
        return [];
    }
    /**
     * Check if vector search is available
     */
    isAvailable() {
        // Check if vector table exists
        try {
            const result = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name LIKE '%vec%'
      `).get();
            return result !== undefined;
        }
        catch {
            return false;
        }
    }
    /**
     * Generate embedding (stub)
     * TODO: Implement with OpenAI or local model
     */
    async generateEmbedding(text) {
        // Stub - returns random embedding
        // In production, this would call OpenAI API or local model
        console.warn('Embedding generation is not yet implemented');
        // Return a dummy 1536-dimensional embedding
        const dimensions = 1536;
        const embedding = new Array(dimensions);
        for (let i = 0; i < dimensions; i++) {
            embedding[i] = Math.random() * 2 - 1;
        }
        return embedding;
    }
}
exports.VectorSearch = VectorSearch;
/**
 * Graph queries for dependency tracking
 */
class GraphQueries {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Find all specs that depend on a given spec
     */
    findDependents(id) {
        const stmt = this.db.prepare(`
      SELECT file_path, id, short_desc
      FROM specs
      WHERE depends_on LIKE ?
      ORDER BY id
    `);
        return stmt.all(`%"${id}"%`);
    }
    /**
     * Find all specs that a given spec depends on
     */
    findDependencies(id) {
        // First get the spec's depends_on field
        const stmt = this.db.prepare(`
      SELECT depends_on FROM specs WHERE id = ?
    `);
        const row = stmt.get(id);
        if (!row || !row.depends_on)
            return [];
        const dependsOn = JSON.parse(row.depends_on);
        if (dependsOn.length === 0)
            return [];
        const placeholders = dependsOn.map(() => '?').join(',');
        const stmt2 = this.db.prepare(`
      SELECT file_path, id, short_desc
      FROM specs
      WHERE id IN (${placeholders})
    `);
        return stmt2.all(...dependsOn);
    }
    /**
     * Get the full tree starting from a spec
     */
    getTree(filePath, maxDepth = 10) {
        const stmt = this.db.prepare(`
      WITH RECURSIVE tree AS (
        SELECT file_path, id, 0 as depth
        FROM specs
        WHERE file_path = ?
        
        UNION ALL
        
        SELECT s.file_path, s.id, t.depth + 1
        FROM specs s, tree t
        WHERE s.parent_id = t.id AND t.depth < ?
      )
      SELECT * FROM tree ORDER BY depth
    `);
        return stmt.all(filePath, maxDepth);
    }
    /**
     * Find ancestors up to root (north star)
     */
    findAncestors(filePath) {
        const stmt = this.db.prepare(`
      WITH RECURSIVE ancestors AS (
        SELECT file_path, id, parent_id, 0 as depth
        FROM specs WHERE file_path = ?
        
        UNION ALL
        
        SELECT s.file_path, s.id, s.parent_id, a.depth + 1
        FROM specs s, ancestors a
        WHERE s.id = a.parent_id
      )
      SELECT * FROM ancestors
    `);
        return stmt.all(filePath);
    }
    /**
     * Detect circular dependencies
     */
    detectCycles() {
        // Find specs that depend on themselves indirectly
        const specs = this.db.prepare('SELECT file_path, id, depends_on FROM specs').all();
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (id, path) => {
            if (recursionStack.has(id))
                return true;
            if (visited.has(id))
                return false;
            visited.add(id);
            recursionStack.add(id);
            const spec = specs.find(s => s.id === id);
            if (spec) {
                const deps = JSON.parse(spec.depends_on || '[]');
                for (const dep of deps) {
                    if (hasCycle(dep, [...path, id])) {
                        return true;
                    }
                }
            }
            recursionStack.delete(id);
            return false;
        };
        for (const spec of specs) {
            if (spec.id && !visited.has(spec.id)) {
                visited.clear();
                if (hasCycle(spec.id, [])) {
                    cycles.push({ file_path: spec.file_path, id: spec.id });
                }
            }
        }
        return cycles;
    }
}
exports.GraphQueries = GraphQueries;
/**
 * JSON query helpers
 */
class JSONQueries {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Find specs with specific tag
     */
    findByTag(tag) {
        const stmt = this.db.prepare(`
      SELECT file_path, id FROM specs
      WHERE tags LIKE ?
    `);
        return stmt.all(`%"${tag}"%`);
    }
    /**
     parsed JSON field
   * Find specs by   */
    findByField(field, value) {
        const stmt = this.db.prepare(`
      SELECT file_path, id, short_desc
      FROM specs
      WHERE parsed_json IS NOT NULL AND json_extract(parsed_json, ?) = ?
    `);
        // For strings, don't stringify as JSON adds quotes; for other types, stringify
        const dbValue = typeof value === 'string' ? value : JSON.stringify(value);
        return stmt.all(`$.${field}`, dbValue);
    }
    /**
     * Count specs by a field
     */
    countByField(field) {
        const stmt = this.db.prepare(`
      SELECT 
        json_extract(parsed_json, ?) as value,
        COUNT(*) as count
      FROM specs
      GROUP BY value
      ORDER BY count DESC
    `);
        return stmt.all(`$.${field}`);
    }
}
exports.JSONQueries = JSONQueries;
//# sourceMappingURL=search.js.map