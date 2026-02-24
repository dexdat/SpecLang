/**
 * SPECLANG-GENERATED: Resolve Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/resolve
 */

import type { SpecGraph, ResolvedGraph } from './types';

export function resolve(graph: SpecGraph): ResolvedGraph {
  const orderedBlocks = topologicalSort(graph);
  const resolvedTypes = inferTypes(graph);
  const dependencyMap = buildDependencyMap(graph);

  return {
    graph,
    orderedBlocks,
    resolvedTypes,
    dependencyMap,
  };
}

function topologicalSort(graph: SpecGraph): import('../../parser/types').Block[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const blockMap = new Map<string, import('../../parser/types').Block>();

  for (const block of graph.nodes) {
    inDegree.set(block.id, 0);
    blockMap.set(block.id, block);
  }

  for (const ref of graph.edges) {
    const target = ref.ref.includes('#') ? ref.ref.split('#')[1] : ref.ref;
    
    if (blockMap.has(target)) {
      if (!adj.has(ref.sourceFile || '')) adj.set(ref.sourceFile || '', []);
      adj.get(ref.sourceFile || '')!.push(target);
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const sorted: import('../../parser/types').Block[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const block = blockMap.get(current);
    if (block) sorted.push(block);

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

function inferTypes(graph: SpecGraph): Map<string, string> {
  const types = new Map<string, string>();

  for (const block of graph.nodes) {
    if (block.kind === 'entity') {
      types.set(block.id, 'Entity');
    } else if (block.kind === 'operation') {
      types.set(block.id, 'Operation');
    } else if (block.kind === 'policy') {
      types.set(block.id, 'Policy');
    } else {
      types.set(block.id, 'unknown');
    }
  }

  return types;
}

function buildDependencyMap(graph: SpecGraph): Map<string, string[]> {
  const deps = new Map<string, string[]>();

  for (const block of graph.nodes) {
    const blockDeps: string[] = [];
    for (const ref of graph.edges) {
      const target = ref.ref.includes('#') ? ref.ref.split('#')[1] : ref.ref;
      if (graph.nodes.some((b) => b.id === target)) {
        blockDeps.push(target);
      }
    }
    deps.set(block.id, blockDeps);
  }

  return deps;
}
