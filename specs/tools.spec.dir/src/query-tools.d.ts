/**
 * SPECLANG-GENERATED: Query Tools
 * Source: @speclang/tools
 *
 * Query operations for specs and dependencies
 */
import { Tool, FindDependentsInput, FindDependentsOutput, FindDependenciesInput, FindDependenciesOutput, FindByTagInput, FindByTagOutput, FindByLevelInput, FindByLevelOutput, GetTreeInput, GetTreeOutput } from './types.js';
/**
 * Find dependents tool - find all specs that depend on this one
 */
export declare const findDependentsTool: Tool<FindDependentsInput, FindDependentsOutput>;
/**
 * Find dependencies tool - find all specs this one depends on
 */
export declare const findDependenciesTool: Tool<FindDependenciesInput, FindDependenciesOutput>;
/**
 * Find by tag tool - find specs by tag
 */
export declare const findByTagTool: Tool<FindByTagInput, FindByTagOutput>;
/**
 * Find by level tool - find specs at a specific level
 */
export declare const findByLevelTool: Tool<FindByLevelInput, FindByLevelOutput>;
/**
 * Get tree tool - get parent and children of a spec
 */
export declare const getTreeTool: Tool<GetTreeInput, GetTreeOutput>;
/**
 * Search specs tool - full-text search
 */
export declare const searchSpecsTool: Tool<{
    query: string;
}, {
    results: any[];
    count: number;
}>;
//# sourceMappingURL=query-tools.d.ts.map