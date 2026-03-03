"use strict";
/**
 * SPECLANG-GENERATED: Search command
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const utils_js_1 = require("../utils.js");
/**
 * Search command implementation
 */
async function searchCommand(query, options) {
    const index = (0, utils_js_1.loadIndex)();
    const specsDir = (0, utils_js_1.getSpecsDir)();
    // Search in index
    let results = Object.values(index.specs);
    // Filter by query
    if (query) {
        const q = query.toLowerCase();
        results = results.filter(spec => spec.id.toLowerCase().includes(q) ||
            spec.short?.toLowerCase().includes(q) ||
            spec.file.toLowerCase().includes(q) ||
            spec.tags?.some(t => t.toLowerCase().includes(q)));
    }
    // Filter by tags
    if (options.tags && options.tags.length > 0) {
        results = results.filter(spec => options.tags.some(tag => spec.tags?.includes(tag)));
    }
    // Filter by layer
    if (options.layer !== undefined) {
        results = results.filter(spec => spec.layer === options.layer);
    }
    // Apply limit
    const limit = options.limit || 10;
    results = results.slice(0, limit);
    // Output results
    if (options.json) {
        console.log(JSON.stringify(results.map(r => ({
            id: r.id,
            layer: r.layer,
            version: r.version,
            short: r.short,
            file: r.file,
            tags: r.tags
        })), null, 2));
    }
    else if (options.quiet) {
        results.forEach(r => console.log(r.id));
    }
    else {
        console.log(`Found ${results.length} specs:\n`);
        results.forEach(r => {
            console.log(`  ${r.id} (layer ${r.layer}) - ${r.short || ''}`);
        });
    }
}
exports.default = searchCommand;
//# sourceMappingURL=search.js.map