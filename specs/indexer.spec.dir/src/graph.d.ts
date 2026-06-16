/**
 * SPECLANG-GENERATED: Reference graph builder
 * Source: phase-0.3-indexer.md
 */
import type { DependencyGraph, SpecEntry } from './types';
/**
 * Build dependency graph from indexed specs
 */
export declare function buildDependencyGraph(entries: SpecEntry[]): DependencyGraph;
/**
 * Get all transitive dependencies (what X depends on, recursively)
 */
export declare function getTransitiveDependencies(specId: string, dependencies: Record<string, string[]>, visited?: Set<string>): string[];
/**
 * Get all transitive dependents (what depends on X, recursively)
 */
export declare function getTransitiveDependents(specId: string, dependents: Record<string, string[]>, visited?: Set<string>): string[];
/**
 * Find shortest path between two specs using BFS
 */
export declare function findPath(fromId: string, toId: string, dependencies: Record<string, string[]>): string[] | null;
/**
 * Detect circular dependencies using DFS
 */
export declare function detectCycles(dependencies: Record<string, string[]>): string[][];
/**
 * Find specs with no references to/from other specs
 */
export declare function findOrphans(dependencies: Record<string, string[]>, dependents: Record<string, string[]>, allSpecIds: Set<string>): string[];
/**
 * Get graph statistics
 */
export declare function getGraphStats(specs: Record<string, SpecEntry>, graph: DependencyGraph): GraphStats;
/** Graph statistics */
export interface GraphStats {
    nodeCount: number;
    dependencyEdges: number;
    dependentEdges: number;
    mostDependencies: {
        specId: string;
        count: number;
    } | null;
    mostDependents: {
        specId: string;
        count: number;
    } | null;
}
//# sourceMappingURL=graph.d.ts.map