"use strict";
/**
 * SPECLANG-GENERATED: Graph Tools
 * Source: @speclang/tools
 *
 * Dependency graph operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.topologicalSortTool = exports.impactAnalysisTool = exports.graphAncestorsTool = exports.graphDependentsTool = void 0;
// ============================================================================
// GRAPH TOOLS
// ============================================================================
/**
 * Graph dependents tool - get full dependency graph from a spec
 */
exports.graphDependentsTool = {
    name: 'speclang_graph_dependents',
    description: 'Get full dependency graph from a spec',
    category: 'graph',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'Spec ID to graph from' },
            max_depth: { type: 'number', description: 'Maximum depth to traverse', default: 10 },
        },
        required: ['id'],
    },
    handler: async (input, context) => {
        const { id, max_depth = 10 } = input;
        console.log(`[GraphTools] Building dependents graph: ${id}`);
        try {
            const nodes = [];
            const edges = [];
            const visited = new Set();
            // Recursive function to build graph
            const buildGraph = async (specId, depth) => {
                if (depth > max_depth || visited.has(specId)) {
                    return;
                }
                visited.add(specId);
                // Get spec info
                let specInfo = null;
                if (context.index?.specs?.[specId]) {
                    specInfo = context.index.specs[specId];
                }
                else if (context.db) {
                    const row = context.db.getDatabase().prepare('SELECT * FROM specs WHERE id = ?').get(specId);
                    if (row) {
                        specInfo = row;
                    }
                }
                // Add node
                if (!nodes.find((n) => n.id === specId)) {
                    nodes.push({
                        id: specId,
                        path: specInfo?.file_path || `specs/${specId}.spec.md`,
                        layer: specInfo?.layer || 0,
                    });
                }
                // Get dependents
                let dependents = [];
                if (context.index?.graph?.dependents) {
                    dependents = context.index.graph.dependents[specId] || [];
                }
                else if (context.db) {
                    const rows = context.db.getDatabase().prepare('SELECT target_id FROM dependencies WHERE source_id = ?').all(specId);
                    dependents = rows.map((r) => r.target_id);
                }
                // Process dependents
                for (const dep of dependents) {
                    // Add edge
                    if (!edges.find((e) => e.from === specId && e.to === dep)) {
                        edges.push({ from: specId, to: dep });
                    }
                    // Recurse
                    await buildGraph(dep, depth + 1);
                }
            };
            await buildGraph(id, 0);
            return { success: true, data: { graph: { nodes, edges } } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Graph ancestors tool - get all ancestors back to north star
 */
exports.graphAncestorsTool = {
    name: 'speclang_graph_ancestors',
    description: 'Get all ancestors back to north star',
    category: 'graph',
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
        console.log(`[GraphTools] Building ancestors graph: ${filePath}`);
        try {
            const ancestors = [];
            const visited = new Set();
            let currentId = null;
            let currentPath = filePath;
            // Find starting spec ID
            if (context.index?.specs) {
                for (const [specId, spec] of Object.entries(context.index.specs)) {
                    const specAny = spec;
                    if (specAny.path === filePath) {
                        currentId = specId;
                        break;
                    }
                }
            }
            if (!currentId && context.db) {
                const row = context.db.getDatabase().prepare('SELECT * FROM specs WHERE file_path = ?').get(filePath);
                if (row) {
                    currentId = row.id;
                }
            }
            // Walk up the tree
            while (currentId && !visited.has(currentId)) {
                visited.add(currentId);
                let specInfo = null;
                if (context.index?.specs?.[currentId]) {
                    specInfo = context.index.specs[currentId];
                }
                else if (context.db) {
                    const row = context.db.getDatabase().prepare('SELECT * FROM specs WHERE id = ?').get(currentId);
                    if (row) {
                        specInfo = row;
                    }
                }
                if (!specInfo)
                    break;
                ancestors.push({
                    path: specInfo.file_path || currentPath,
                    id: currentId,
                    level: specInfo.layer || 0,
                });
                // Get parent
                const parentId = specInfo.parent_id || specInfo.parent;
                if (!parentId)
                    break;
                currentId = parentId;
                currentPath = specInfo.parent?.path;
            }
            return { success: true, data: { ancestors } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Impact analysis tool - analyze impact of changing a spec
 */
exports.impactAnalysisTool = {
    name: 'speclang_impact_analysis',
    description: 'Analyze impact of changing a spec',
    category: 'graph',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'Spec ID to analyze' },
            depth: { type: 'number', description: 'Depth of analysis', default: 2 },
        },
        required: ['id'],
    },
    handler: async (input, context) => {
        const { id, depth = 2 } = input;
        console.log(`[GraphTools] Impact analysis: ${id}`);
        try {
            const direct = [];
            const transitive = [];
            const visited = new Set();
            // Get direct dependents
            if (context.index?.graph?.dependents) {
                direct.push(...(context.index.graph.dependents[id] || []));
            }
            else if (context.db) {
                const rows = context.db.getDatabase().prepare('SELECT target_id FROM dependencies WHERE source_id = ?').all(id);
                direct.push(...rows.map((r) => r.target_id));
            }
            // Get transitive dependents (depth levels)
            const getTransitive = async (specId, currentDepth) => {
                if (currentDepth > depth || visited.has(specId)) {
                    return;
                }
                visited.add(specId);
                let dependents = [];
                if (context.index?.graph?.dependents) {
                    dependents = context.index.graph.dependents[specId] || [];
                }
                else if (context.db) {
                    const rows = context.db.getDatabase().prepare('SELECT target_id FROM dependencies WHERE source_id = ?').all(specId);
                    dependents = rows.map((r) => r.target_id);
                }
                for (const dep of dependents) {
                    if (!transitive.includes(dep)) {
                        transitive.push(dep);
                    }
                    await getTransitive(dep, currentDepth + 1);
                }
            };
            await getTransitive(id, 1);
            return { success: true, data: { direct, transitive } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Topological sort tool - get specs in dependency order
 */
exports.topologicalSortTool = {
    name: 'speclang_topological_sort',
    description: 'Get specs in topological order',
    category: 'graph',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            root: { type: 'string', description: 'Root spec ID (optional)' },
        },
    },
    handler: async (input, context) => {
        const { root } = input;
        console.log(`[GraphTools] Topological sort`);
        try {
            const order = [];
            const visited = new Set();
            const dependencies = context.index?.graph?.dependencies || {};
            // Topological sort using DFS
            const visit = (specId) => {
                if (visited.has(specId)) {
                    return;
                }
                visited.add(specId);
                const deps = dependencies[specId] || [];
                for (const dep of deps) {
                    visit(dep);
                }
                order.push(specId);
            };
            // Visit all specs or just from root
            if (root) {
                visit(root);
            }
            else {
                const allSpecs = new Set();
                for (const deps of Object.values(dependencies)) {
                    for (const dep of deps) {
                        allSpecs.add(dep);
                    }
                }
                for (const specId of Array.from(allSpecs)) {
                    visit(specId);
                }
            }
            return { success: true, data: { order } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
//# sourceMappingURL=graph-tools.js.map