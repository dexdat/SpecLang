/**
 * SPECLANG-GENERATED: Graph Tools
 * Source: @speclang/tools
 *
 * Dependency graph operations
 */
import { Tool, GraphDependentsInput, GraphDependentsOutput, GraphAncestorsInput, GraphAncestorsOutput } from './types.js';
/**
 * Graph dependents tool - get full dependency graph from a spec
 */
export declare const graphDependentsTool: Tool<GraphDependentsInput, GraphDependentsOutput>;
/**
 * Graph ancestors tool - get all ancestors back to north star
 */
export declare const graphAncestorsTool: Tool<GraphAncestorsInput, GraphAncestorsOutput>;
/**
 * Impact analysis tool - analyze impact of changing a spec
 */
export declare const impactAnalysisTool: Tool<{
    id: string;
    depth?: number;
}, {
    direct: string[];
    transitive: string[];
}>;
/**
 * Topological sort tool - get specs in dependency order
 */
export declare const topologicalSortTool: Tool<{
    root?: string;
}, {
    order: string[];
}>;
//# sourceMappingURL=graph-tools.d.ts.map