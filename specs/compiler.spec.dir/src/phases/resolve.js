"use strict";
/**
 * SPECLANG-GENERATED: Resolve Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/resolve
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
function resolve(graph) {
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
function topologicalSort(graph) {
    const inDegree = new Map();
    const adj = new Map();
    const blockMap = new Map();
    for (const block of graph.nodes) {
        inDegree.set(block.id, 0);
        blockMap.set(block.id, block);
    }
    for (const ref of graph.edges) {
        const target = ref.ref.includes('#') ? ref.ref.split('#')[1] : ref.ref;
        if (blockMap.has(target)) {
            if (!adj.has(ref.sourceFile || ''))
                adj.set(ref.sourceFile || '', []);
            adj.get(ref.sourceFile || '').push(target);
            inDegree.set(target, (inDegree.get(target) || 0) + 1);
        }
    }
    const queue = [];
    for (const [id, degree] of inDegree.entries()) {
        if (degree === 0)
            queue.push(id);
    }
    const sorted = [];
    while (queue.length > 0) {
        const current = queue.shift();
        const block = blockMap.get(current);
        if (block)
            sorted.push(block);
        const neighbors = adj.get(current) || [];
        for (const neighbor of neighbors) {
            const newDegree = (inDegree.get(neighbor) || 1) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0)
                queue.push(neighbor);
        }
    }
    return sorted;
}
function inferTypes(graph) {
    const types = new Map();
    for (const block of graph.nodes) {
        if (block.kind === 'entity') {
            types.set(block.id, 'Entity');
        }
        else if (block.kind === 'operation') {
            types.set(block.id, 'Operation');
        }
        else if (block.kind === 'policy') {
            types.set(block.id, 'Policy');
        }
        else {
            types.set(block.id, 'unknown');
        }
    }
    return types;
}
function buildDependencyMap(graph) {
    const deps = new Map();
    for (const block of graph.nodes) {
        const blockDeps = [];
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
//# sourceMappingURL=resolve.js.map