"use strict";
/**
 * SPECLANG-GENERATED: Query Tools
 * Source: @speclang/tools
 *
 * Query operations for specs and dependencies
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSpecsTool = exports.getTreeTool = exports.findByLevelTool = exports.findByTagTool = exports.findDependenciesTool = exports.findDependentsTool = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Extract @ref references from content
 */
function extractRefs(content) {
    const refRegex = /@ref:([^\s\n]+)/g;
    const refs = [];
    let match;
    while ((match = refRegex.exec(content)) !== null) {
        refs.push(match[1]);
    }
    return refs;
}
/**
 * Resolve a reference to file path
 */
async function resolveRef(ref, basePath = 'specs') {
    // Handle various ref formats:
    // @ref:specs/auth -> specs/auth.spec.md
    // @ref:specs/auth#login -> specs/auth.spec.md
    // @ref:#login -> current file
    let filePath = ref.replace('@ref:', '');
    // Remove block reference
    const blockIndex = filePath.indexOf('#');
    if (blockIndex > 0) {
        filePath = filePath.substring(0, blockIndex);
    }
    // If no extension, add .spec.md
    if (!path.extname(filePath)) {
        filePath = path.join(filePath, 'index.spec.md');
    }
    // Try different extensions
    const candidates = [
        path.join(basePath, `${filePath}.spec.md`),
        path.join(basePath, `${filePath}.md`),
        path.join(basePath, filePath),
    ];
    for (const candidate of candidates) {
        if (await fs.pathExists(candidate)) {
            return candidate;
        }
    }
    return null;
}
// ============================================================================
// QUERY TOOLS
// ============================================================================
/**
 * Find dependents tool - find all specs that depend on this one
 */
exports.findDependentsTool = {
    name: 'speclang_find_dependents',
    description: 'Find all specs that depend on this one',
    category: 'query',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            id: { type: 'string', description: '@ref ID to search for' },
        },
        required: ['id'],
    },
    handler: async (input, context) => {
        const { id } = input;
        console.log(`[QueryTools] Finding dependents: ${id}`);
        try {
            let dependents = [];
            // Use index if available
            if (context.index?.graph?.dependents) {
                const found = context.index.graph.dependents[id] || [];
                dependents = found.map((depId) => ({
                    path: `specs/${depId}.spec.md`,
                    id: depId,
                    layer: context.index.specs?.[depId]?.layer || 0,
                }));
            }
            else if (context.db) {
                // Query database if available
                const rows = context.db.getDatabase().prepare(`
          SELECT file_path, id, layer FROM specs 
          WHERE content_raw LIKE ?
          ORDER BY layer
        `).all(`%${id}%`);
                dependents = rows.map((row) => ({
                    path: row.file_path,
                    id: row.id,
                    layer: row.layer,
                }));
            }
            else {
                // Fallback: search files
                const specsDir = 'specs';
                if (await fs.pathExists(specsDir)) {
                    const files = await fs.readdir(specsDir);
                    for (const file of files) {
                        if (!file.endsWith('.spec.md') && !file.endsWith('.md'))
                            continue;
                        const filePath = path.join(specsDir, file);
                        const content = await fs.readFile(filePath, 'utf-8');
                        if (content.includes(id)) {
                            dependents.push({
                                path: filePath,
                                id: file.replace('.spec.md', '').replace('.md', ''),
                                layer: 0,
                            });
                        }
                    }
                }
            }
            return { success: true, data: { dependents } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Find dependencies tool - find all specs this one depends on
 */
exports.findDependenciesTool = {
    name: 'speclang_find_dependencies',
    description: 'Find all specs this one depends on',
    category: 'query',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path to spec file' },
        },
        required: ['path'],
    },
    handler: async (input, context) => {
        const { path: filePath } = input;
        console.log(`[QueryTools] Finding dependencies: ${filePath}`);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const refs = extractRefs(content);
            const dependencies = await Promise.all(refs.map(async (ref) => {
                const resolvedPath = await resolveRef(ref);
                return {
                    path: resolvedPath,
                    id: ref,
                    resolved: resolvedPath !== null,
                };
            }));
            return { success: true, data: { dependencies } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Find by tag tool - find specs by tag
 */
exports.findByTagTool = {
    name: 'speclang_find_by_tag',
    description: 'Find specs by tag',
    category: 'query',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            tag: { type: 'string', description: 'Tag to search for' },
            layer: { type: 'number', description: 'Filter by layer' },
        },
        required: ['tag'],
    },
    handler: async (input, context) => {
        const { tag, layer } = input;
        console.log(`[QueryTools] Finding by tag: ${tag}`);
        try {
            let specs = [];
            if (context.db) {
                // Query database
                let query = `SELECT file_path, id, short_desc FROM specs WHERE tags LIKE ?`;
                const params = [`%"${tag}"%`];
                if (layer !== undefined) {
                    query += ` AND layer = ?`;
                    params.push(Number(layer));
                }
                const rows = context.db.getDatabase().prepare(query).all(...params);
                specs = rows.map((row) => ({
                    path: row.file_path,
                    id: row.id,
                    short: row.short_desc || '',
                }));
            }
            else if (context.index?.specs) {
                // Use index
                for (const [specId, spec] of Object.entries(context.index.specs)) {
                    const specAny = spec;
                    if (specAny.tags?.includes(tag)) {
                        if (layer === undefined || specAny.layer == layer) {
                            specs.push({
                                path: specAny.path || `specs/${specId}.spec.md`,
                                id: specId,
                                short: specAny.short || '',
                            });
                        }
                    }
                }
            }
            else {
                // Fallback: search files
                const specsDir = 'specs';
                if (await fs.pathExists(specsDir)) {
                    const files = await fs.readdir(specsDir);
                    for (const file of files) {
                        if (!file.endsWith('.spec.md'))
                            continue;
                        const filePath = path.join(specsDir, file);
                        const headerData = await parseHeaderSimple(filePath);
                        if (headerData?.tags?.includes(tag)) {
                            if (layer === undefined || headerData.layer === layer) {
                                specs.push({
                                    path: filePath,
                                    id: file.replace('.spec.md', ''),
                                    short: headerData.short || '',
                                });
                            }
                        }
                    }
                }
            }
            return { success: true, data: { specs } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Find by level tool - find specs at a specific level
 */
exports.findByLevelTool = {
    name: 'speclang_find_by_level',
    description: 'Find specs at a specific layer level',
    category: 'query',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            level: { type: 'number', description: 'Layer level (0-10)' },
            parent: { type: 'string', description: 'Filter by parent ID' },
        },
        required: ['level'],
    },
    handler: async (input, context) => {
        const { level, parent } = input;
        console.log(`[QueryTools] Finding by level: ${level}`);
        try {
            let specs = [];
            if (context.db) {
                // Query database
                let query = `SELECT file_path, id, short_desc FROM specs WHERE layer = ?`;
                const params = [level];
                if (parent) {
                    query += ` AND parent_id = ?`;
                    params.push(parent);
                }
                const rows = context.db.getDatabase().prepare(query).all(...params);
                specs = rows.map((row) => ({
                    path: row.file_path,
                    id: row.id,
                    short: row.short_desc || '',
                }));
            }
            else if (context.index?.specs) {
                // Use index
                for (const [specId, spec] of Object.entries(context.index.specs)) {
                    const specAny = spec;
                    if (specAny.layer === level) {
                        if (!parent || specAny.parent === parent) {
                            specs.push({
                                path: specAny.path || `specs/${specId}.spec.md`,
                                id: specId,
                                short: specAny.short || '',
                            });
                        }
                    }
                }
            }
            return { success: true, data: { specs } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Get tree tool - get parent and children of a spec
 */
exports.getTreeTool = {
    name: 'speclang_get_tree',
    description: 'Get parent and children of a spec',
    category: 'query',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path to spec file' },
            depth: { type: 'number', description: 'Depth to traverse', default: 1 },
        },
        required: ['path'],
    },
    handler: async (input, context) => {
        const { path: filePath, depth = 1 } = input;
        console.log(`[QueryTools] Getting tree: ${filePath}`);
        try {
            // Get current spec
            let spec = null;
            let parent = null;
            let children = [];
            if (context.db) {
                const row = context.db.getSpec(filePath);
                if (row) {
                    spec = {
                        path: row.file_path,
                        id: row.id,
                        parent: row.parent_id,
                        layer: 0,
                    };
                    // Get parent
                    if (row.parent_id) {
                        const parentRow = context.db.getDatabase().prepare('SELECT * FROM specs WHERE id = ?').get(row.parent_id);
                        if (parentRow) {
                            parent = {
                                path: parentRow.file_path,
                                id: parentRow.id,
                                short: parentRow.short_desc,
                            };
                        }
                    }
                    // Get children
                    const childrenRows = context.db.getDatabase().prepare('SELECT * FROM specs WHERE parent_id = ?').all(row.id);
                    children = childrenRows.slice(0, depth).map((child) => ({
                        path: child.file_path,
                        id: child.id,
                        short: child.short_desc,
                    }));
                }
            }
            else if (context.index?.specs) {
                // Use index
                const specId = filePath.replace('specs/', '').replace('.spec.md', '');
                spec = context.index.specs[specId];
                if (spec) {
                    if (spec.parent) {
                        parent = context.index.specs[spec.parent];
                    }
                    if (context.index.graph?.dependencies) {
                        const deps = context.index.graph.dependencies[specId] || [];
                        children = deps.slice(0, depth).map((depId) => ({
                            path: `specs/${depId}.spec.md`,
                            id: depId,
                        }));
                    }
                }
            }
            if (!spec) {
                return { success: false, error: 'Spec not found' };
            }
            return {
                success: true,
                data: { tree: { ...spec, parent, children } },
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Search specs tool - full-text search
 */
exports.searchSpecsTool = {
    name: 'speclang_search',
    description: 'Search specs by query',
    category: 'query',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
    },
    handler: async (input, context) => {
        const { query } = input;
        const queryLower = query.toLowerCase();
        console.log(`[QueryTools] Searching: ${query}`);
        try {
            let results = [];
            if (context.db?.fts) {
                // Use full-text search
                const rows = context.db.fts.search(query);
                results = rows.map((row) => ({
                    path: row.file_path,
                    id: row.id,
                    short: row.short_desc,
                    score: row.score,
                }));
            }
            else if (context.index?.specs) {
                // Use index
                for (const [specId, spec] of Object.entries(context.index.specs)) {
                    const specAny = spec;
                    const matchShort = specAny.short?.toLowerCase().includes(queryLower);
                    const matchTags = specAny.tags?.some((t) => t.toLowerCase().includes(queryLower));
                    if (matchShort || matchTags) {
                        results.push({
                            path: specAny.path || `specs/${specId}.spec.md`,
                            id: specId,
                            short: specAny.short,
                        });
                    }
                }
            }
            else {
                // Fallback: search files
                const specsDir = 'specs';
                if (await fs.pathExists(specsDir)) {
                    const files = await fs.readdir(specsDir);
                    for (const file of files) {
                        if (!file.endsWith('.spec.md'))
                            continue;
                        const filePath = path.join(specsDir, file);
                        const headerData = await parseHeaderSimple(filePath);
                        if (headerData?.short?.toLowerCase().includes(queryLower) ||
                            headerData?.tags?.some((t) => t.toLowerCase().includes(queryLower))) {
                            results.push({
                                path: filePath,
                                id: file.replace('.spec.md', ''),
                                short: headerData?.short || '',
                            });
                        }
                    }
                }
            }
            return { success: true, data: { results, count: results.length } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
// ============================================================================
// HELPER: SIMPLE HEADER PARSER
// ============================================================================
async function parseHeaderSimple(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        let headerStart = -1;
        let headerEnd = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                if (headerStart === -1) {
                    headerStart = i;
                }
                else {
                    headerEnd = i;
                    break;
                }
            }
        }
        if (headerStart === -1 || headerEnd === -1) {
            return null;
        }
        const headerLines = lines.slice(headerStart + 1, headerEnd);
        const header = {};
        for (const line of headerLines) {
            const trimmed = line.trim();
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0) {
                const key = trimmed.substring(0, colonIndex).trim();
                let value = trimmed.substring(colonIndex + 1).trim();
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1);
                    header[key] = value.split(',').map((s) => s.trim());
                }
                else {
                    header[key] = value;
                }
            }
        }
        return header;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=query-tools.js.map