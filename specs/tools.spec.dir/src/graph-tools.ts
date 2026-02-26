/**
 * SPECLANG-GENERATED: Graph Tools
 * Source: @speclang/tools
 * 
 * Dependency graph operations
 */

import {
  Tool,
  ToolContext,
  ToolResult,
  GraphDependentsInput,
  GraphDependentsOutput,
  GraphAncestorsInput,
  GraphAncestorsOutput,
} from './types.js';

// ============================================================================
// GRAPH TOOLS
// ============================================================================

/**
 * Graph dependents tool - get full dependency graph from a spec
 */
export const graphDependentsTool: Tool<GraphDependentsInput, GraphDependentsOutput> = {
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
  handler: async (
    input: GraphDependentsInput,
    context: ToolContext
  ): Promise<ToolResult<GraphDependentsOutput>> => {
    const { id, max_depth = 10 } = input;

    console.log(`[GraphTools] Building dependents graph: ${id}`);

    try {
      const nodes: Array<{ id: string; path: string; layer: number }> = [];
      const edges: Array<{ from: string; to: string }> = [];
      const visited = new Set<string>();

      // Recursive function to build graph
      const buildGraph = async (specId: string, depth: number): Promise<void> => {
        if (depth > max_depth || visited.has(specId)) {
          return;
        }

        visited.add(specId);

        // Get spec info
        let specInfo: any = null;

        if (context.index?.specs?.[specId]) {
          specInfo = context.index.specs[specId];
        } else if (context.db) {
          const row = context.db.getDatabase().prepare(
            'SELECT * FROM specs WHERE id = ?'
          ).get(specId) as any;
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
        let dependents: string[] = [];

        if (context.index?.graph?.dependents) {
          dependents = context.index.graph.dependents[specId] || [];
        } else if (context.db) {
          const rows = context.db.getDatabase().prepare(
            'SELECT target_id FROM dependencies WHERE source_id = ?'
          ).all(specId) as any[];
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Graph ancestors tool - get all ancestors back to north star
 */
export const graphAncestorsTool: Tool<GraphAncestorsInput, GraphAncestorsOutput> = {
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
  handler: async (
    input: GraphAncestorsInput,
    context: ToolContext
  ): Promise<ToolResult<GraphAncestorsOutput>> => {
    const { path: filePath } = input;

    console.log(`[GraphTools] Building ancestors graph: ${filePath}`);

    try {
      const ancestors: Array<{ path: string; id: string; level: number }> = [];
      const visited = new Set<string>();

      let currentId: string | null = null;
      let currentPath: string | null = filePath;

      // Find starting spec ID
      if (context.index?.specs) {
        for (const [specId, spec] of Object.entries(context.index.specs)) {
          const specAny = spec as any;
          if (specAny.path === filePath) {
            currentId = specId;
            break;
          }
        }
      }

      if (!currentId && context.db) {
        const row = context.db.getDatabase().prepare(
          'SELECT * FROM specs WHERE file_path = ?'
        ).get(filePath) as any;
        if (row) {
          currentId = row.id;
        }
      }

      // Walk up the tree
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);

        let specInfo: any = null;

        if (context.index?.specs?.[currentId]) {
          specInfo = context.index.specs[currentId];
        } else if (context.db) {
          const row = context.db.getDatabase().prepare(
            'SELECT * FROM specs WHERE id = ?'
          ).get(currentId) as any;
          if (row) {
            specInfo = row;
          }
        }

        if (!specInfo) break;

        ancestors.push({
          path: specInfo.file_path || currentPath!,
          id: currentId,
          level: specInfo.layer || 0,
        });

        // Get parent
        const parentId = specInfo.parent_id || specInfo.parent;
        if (!parentId) break;

        currentId = parentId;
        currentPath = specInfo.parent?.path;
      }

      return { success: true, data: { ancestors } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Impact analysis tool - analyze impact of changing a spec
 */
export const impactAnalysisTool: Tool<{ id: string; depth?: number }, { direct: string[]; transitive: string[] }> = {
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
  handler: async (
    input: { id: string; depth?: number },
    context: ToolContext
  ): Promise<ToolResult<{ direct: string[]; transitive: string[] }>> => {
    const { id, depth = 2 } = input;

    console.log(`[GraphTools] Impact analysis: ${id}`);

    try {
      const direct: string[] = [];
      const transitive: string[] = [];
      const visited = new Set<string>();

      // Get direct dependents
      if (context.index?.graph?.dependents) {
        direct.push(...(context.index.graph.dependents[id] || []));
      } else if (context.db) {
        const rows = context.db.getDatabase().prepare(
          'SELECT target_id FROM dependencies WHERE source_id = ?'
        ).all(id) as any[];
        direct.push(...rows.map((r) => r.target_id));
      }

      // Get transitive dependents (depth levels)
      const getTransitive = async (specId: string, currentDepth: number): Promise<void> => {
        if (currentDepth > depth || visited.has(specId)) {
          return;
        }

        visited.add(specId);

        let dependents: string[] = [];

        if (context.index?.graph?.dependents) {
          dependents = context.index.graph.dependents[specId] || [];
        } else if (context.db) {
          const rows = context.db.getDatabase().prepare(
            'SELECT target_id FROM dependencies WHERE source_id = ?'
          ).all(specId) as any[];
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Topological sort tool - get specs in dependency order
 */
export const topologicalSortTool: Tool<{ root?: string }, { order: string[] }> = {
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
  handler: async (
    input: { root?: string },
    context: ToolContext
  ): Promise<ToolResult<{ order: string[] }>> => {
    const { root } = input;

    console.log(`[GraphTools] Topological sort`);

    try {
      const order: string[] = [];
      const visited = new Set<string>();
      const dependencies = context.index?.graph?.dependencies || {};

      // Topological sort using DFS
      const visit = (specId: string): void => {
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
      } else {
        const allSpecs = new Set<string>();
        for (const deps of Object.values(dependencies)) {
          for (const dep of deps as string[]) {
            allSpecs.add(dep);
          }
        }
        for (const specId of Array.from(allSpecs)) {
          visit(specId);
        }
      }

      return { success: true, data: { order } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
