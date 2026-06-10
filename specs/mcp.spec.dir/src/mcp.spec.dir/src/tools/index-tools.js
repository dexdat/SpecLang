"use strict";
/**
 * SPECLANG-GENERATED: MCP Index Tools
 * Source: @speclang/mcp
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexToolHandler = void 0;
const index_js_1 = require("../../../indexer.spec.dir/src/index.js");
/**
 * Index tool handler
 */
class IndexToolHandler {
    constructor(db, specsDir = 'specs') {
        this.db = db;
        this.specsDir = specsDir;
    }
    /**
     * Handle speclang_index_refresh - Rebuild spec index
     */
    async handleIndexRefresh(args) {
        const dir = args?.specsDir || this.specsDir;
        const errors = [];
        try {
            // Get all spec files
            const specFiles = (0, index_js_1.getSpecFiles)(dir);
            let refsFound = 0;
            // Index each spec
            for (const filepath of specFiles) {
                try {
                    const content = require('fs').readFileSync(filepath, 'utf-8');
                    const { headerLines, metadata } = (0, index_js_1.parseHeader)(filepath);
                    const refs = (0, index_js_1.extractRefsFromContent)(content);
                    const blocks = (0, index_js_1.extractBlocksFromContent)(content);
                    refsFound += refs.length;
                    // Upsert to database
                    this.db.upsertSpec({
                        file_path: filepath,
                        id: metadata.id || `@unknown/${require('path').basename(filepath)}`,
                        tags: metadata.tags || [],
                        short_desc: metadata.short || '',
                        header_raw: content.slice(0, headerLines * 100),
                        header_lines: headerLines,
                        content_raw: content,
                        depends_on: refs,
                        children: blocks,
                        part: metadata.part || 1,
                        total_parts: metadata.total_parts || 1
                    });
                }
                catch (e) {
                    errors.push(`Error indexing ${filepath}: ${e}`);
                }
            }
            return {
                specs_indexed: specFiles.length - errors.length,
                refs_found: refsFound,
                errors
            };
        }
        catch (error) {
            return {
                specs_indexed: 0,
                refs_found: 0,
                errors: [`Failed to refresh index: ${error}`]
            };
        }
    }
    /**
     * Handle speclang_index_stats - Get index statistics
     */
    async handleIndexStats() {
        const db = this.db.getDatabase();
        // Get total specs
        const specCount = db.prepare('SELECT COUNT(*) as count FROM specs').get();
        // Get total refs (sum of depends_on arrays)
        const specs = db.prepare('SELECT depends_on FROM specs').all();
        let totalRefs = 0;
        const tagSet = new Set();
        const layerCounts = {};
        for (const spec of specs) {
            const deps = JSON.parse(spec.depends_on || '[]');
            totalRefs += deps.length;
            // Get tags
            const specWithTags = db.prepare('SELECT tags, layer FROM specs WHERE depends_on = ?').get(spec.depends_on);
            if (specWithTags) {
                const tags = JSON.parse(specWithTags.tags || '[]');
                for (const tag of tags) {
                    tagSet.add(tag);
                }
                layerCounts[specWithTags.layer] = (layerCounts[specWithTags.layer] || 0) + 1;
            }
        }
        return {
            total_specs: specCount.count,
            total_refs: totalRefs,
            total_tags: tagSet.size,
            layers: layerCounts
        };
    }
    /**
     * Handle speclang_index_validate - Validate index
     */
    async handleIndexValidate() {
        const db = this.db.getDatabase();
        const errors = [];
        const warnings = [];
        // Check for missing dependencies
        const specs = db.prepare('SELECT id, depends_on FROM specs').all();
        const knownIds = new Set(specs.map(s => s.id).filter(Boolean));
        for (const spec of specs) {
            const deps = JSON.parse(spec.depends_on || '[]');
            for (const dep of deps) {
                // Normalize dep ID
                const depId = dep.startsWith('@') ? dep.slice(1) : dep;
                if (!knownIds.has(depId) && !knownIds.has('@' + depId)) {
                    warnings.push(`${spec.id} depends on unknown: ${dep}`);
                }
            }
        }
        // Check for orphans
        const dependents = new Set();
        for (const spec of specs) {
            const deps = JSON.parse(spec.depends_on || '[]');
            for (const dep of deps) {
                dependents.add(dep);
            }
        }
        for (const spec of specs) {
            if (!dependents.has(spec.id) && specs.length > 1) {
                warnings.push(`Orphan spec (no dependents): ${spec.id}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.IndexToolHandler = IndexToolHandler;
