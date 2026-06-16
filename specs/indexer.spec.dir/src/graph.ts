/**
 * SPECLANG-GENERATED: Reference graph builder
 * Source: phase-0.3-indexer.md
 */

import type { DependencyGraph, SpecEntry, IndexedSpec } from './types';

// ============================================================================
// GRAPH BUILDING
// ============================================================================

/**
 * Build dependency graph from indexed specs
 */
export function buildDependencyGraph(entries: SpecEntry[]): DependencyGraph {
  const dependencies: Record<string, string[]> = {};
  const dependents: Record<string, string[]> = {};

  for (const entry of entries) {
    const specId = entry.id;

    // From depends_on field
    for (const dep of entry.depends_on || []) {
      const cleanDep = cleanReference(dep);
      if (cleanDep) {
        addEdge(dependencies, dependents, specId, cleanDep);
      }
    }

    // From content refs (if available)
    for (const ref of entry.content_refs || []) {
      const cleanRef = cleanReference(ref);
      // Only add if it looks like a spec reference (not a block)
      if (cleanRef && !cleanRef.startsWith('#')) {
        addEdge(dependencies, dependents, specId, cleanRef);
      }
    }
  }

  return {
    dependencies: deduplicateGraph(dependencies),
    dependents: deduplicateGraph(dependents),
  };
}

/**
 * Add directed edge to graph
 */
function addEdge(
  dependencies: Record<string, string[]>,
  dependents: Record<string, string[]>,
  from: string,
  to: string
): void {
  if (!dependencies[from]) {
    dependencies[from] = [];
  }
  if (!dependents[to]) {
    dependents[to] = [];
  }
  
  dependencies[from].push(to);
  dependents[to].push(from);
}

/**
 * Remove duplicates from graph
 */
function deduplicateGraph(graph: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(graph)) {
    result[key] = [...new Set(values)];
  }
  return result;
}

/**
 * Clean a reference string
 */
function cleanReference(ref: string): string {
  // Remove @ref: prefix
  let cleaned = ref.replace(/^@ref:/, '');
  // Remove leading @
  cleaned = cleaned.replace(/^@/, '');
  // Remove block reference part for dependency purposes
  if (cleaned.includes('#')) {
    cleaned = cleaned.split('#')[0];
  }
  return cleaned || '';
}

// ============================================================================
// GRAPH TRAVERSAL
// ============================================================================

/**
 * Get all transitive dependencies (what X depends on, recursively)
 */
export function getTransitiveDependencies(
  specId: string,
  dependencies: Record<string, string[]>,
  visited?: Set<string>
): string[] {
  if (!visited) {
    visited = new Set();
  }

  if (visited.has(specId)) {
    return [];
  }

  visited.add(specId);
  const result: string[] = [];

  for (const dep of dependencies[specId] || []) {
    result.push(dep);
    result.push(...getTransitiveDependencies(dep, dependencies, visited));
  }

  return [...new Set(result)];
}

/**
 * Get all transitive dependents (what depends on X, recursively)
 */
export function getTransitiveDependents(
  specId: string,
  dependents: Record<string, string[]>,
  visited?: Set<string>
): string[] {
  if (!visited) {
    visited = new Set();
  }

  if (visited.has(specId)) {
    return [];
  }

  visited.add(specId);
  const result: string[] = [];

  for (const dep of dependents[specId] || []) {
    result.push(dep);
    result.push(...getTransitiveDependents(dep, dependents, visited));
  }

  return [...new Set(result)];
}

/**
 * Find shortest path between two specs using BFS
 */
export function findPath(
  fromId: string,
  toId: string,
  dependencies: Record<string, string[]>
): string[] | null {
  if (fromId === toId) {
    return [fromId];
  }

  const queue: [string, string[]][] = [[fromId, [fromId]]];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;

    for (const neighbor of dependencies[current] || []) {
      if (neighbor === toId) {
        return [...path, neighbor];
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return null;
}

// ============================================================================
// CYCLE DETECTION
// ============================================================================

/**
 * Detect circular dependencies using DFS
 */
export function detectCycles(dependencies: Record<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    for (const neighbor of dependencies[node] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = [...path.slice(cycleStart), neighbor];
        cycles.push(cycle);
        return true;
      }
    }

    path.pop();
    recStack.delete(node);
    return false;
  }

  for (const node of Object.keys(dependencies)) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

// ============================================================================
// ORPHAN DETECTION
// ============================================================================

/**
 * Find specs with no references to/from other specs
 */
export function findOrphans(
  dependencies: Record<string, string[]>,
  dependents: Record<string, string[]>,
  allSpecIds: Set<string>
): string[] {
  const orphans: string[] = [];

  for (const specId of allSpecIds) {
    const deps = dependencies[specId] || [];
    const dens = dependents[specId] || [];

    if (deps.length === 0 && dens.length === 0) {
      orphans.push(specId);
    }
  }

  return orphans;
}

// ============================================================================
// GRAPH STATISTICS
// ============================================================================

/**
 * Get graph statistics
 */
export function getGraphStats(
  specs: Record<string, SpecEntry>,
  graph: DependencyGraph
): GraphStats {
  const deps = graph.dependencies;
  const dents = graph.dependents;

  let maxDeps = 0;
  let maxDepsSpec = '';
  let maxDents = 0;
  let maxDentsSpec = '';

  for (const [specId, depList] of Object.entries(deps)) {
    if (depList.length > maxDeps) {
      maxDeps = depList.length;
      maxDepsSpec = specId;
    }
  }

  for (const [specId, dentList] of Object.entries(dents)) {
    if (dentList.length > maxDents) {
      maxDents = dentList.length;
      maxDentsSpec = specId;
    }
  }

  return {
    nodeCount: Object.keys(specs).length,
    dependencyEdges: Object.values(deps).reduce((sum, arr) => sum + arr.length, 0),
    dependentEdges: Object.values(dents).reduce((sum, arr) => sum + arr.length, 0),
    mostDependencies: maxDepsSpec ? { specId: maxDepsSpec, count: maxDeps } : null,
    mostDependents: maxDentsSpec ? { specId: maxDentsSpec, count: maxDents } : null,
  };
}

/** Graph statistics */
export interface GraphStats {
  nodeCount: number;
  dependencyEdges: number;
  dependentEdges: number;
  mostDependencies: { specId: string; count: number } | null;
  mostDependents: { specId: string; count: number } | null;
}
