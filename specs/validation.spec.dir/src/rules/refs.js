"use strict";
/**
 * SPECLANG-GENERATED: Reference validation rule
 * Source: @speclang/validation/rules#@validation/refs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.refsRule = void 0;
exports.buildDependencyGraph = buildDependencyGraph;
const types_1 = require("../types");
/**
 * Reference Validation Rule
 *
 * Validates references in specs:
 * - Target file must exist
 * - Target block must exist (if specified)
 * - No circular references
 */
exports.refsRule = {
    id: '@validation/refs',
    name: 'Reference Validation',
    level: 'error',
    check(spec, context) {
        const results = [];
        // If no context, we can't validate references fully
        if (!context) {
            // Just validate reference format
            return validateRefFormats(spec);
        }
        // Validate each reference
        for (const ref of spec.references || []) {
            const refResults = validateReference(ref, spec, context);
            results.push(...refResults);
        }
        // Check for circular dependencies
        const cycles = detectCycles(spec, context);
        for (const cycle of cycles) {
            results.push((0, types_1.createError)('@validation/refs', { file: spec.filepath, line: 'content' }, `Circular dependency detected: ${cycle.join(' -> ')}`, 'Remove the circular reference'));
        }
        return results;
    },
};
/**
 * Validate reference format (without file existence check)
 */
function validateRefFormats(spec) {
    const results = [];
    const refRegex = /^@ref:([a-zA-Z0-9_\-\/.]+)(?:#([a-zA-Z0-9_\-\/]+))?$/;
    for (const ref of spec.references || []) {
        const refStr = ref.ref || ref.toString();
        if (!refRegex.test(refStr)) {
            results.push((0, types_1.createError)('@validation/refs', { file: spec.filepath, line: ref.line || 'content' }, `Invalid reference format: ${refStr}`, 'Use format: @ref:path/to/spec or @ref:path/to/spec#block-id'));
        }
    }
    return results;
}
/**
 * Validate a single reference
 */
function validateReference(ref, spec, context) {
    const results = [];
    const refStr = ref.ref || '';
    // Parse reference
    const match = refStr.match(/^@ref:([a-zA-Z0-9_\-\/.]+)(?:#([a-zA-Z0-9_\-\/]+))?$/);
    if (!match) {
        results.push((0, types_1.createError)('@validation/refs', { file: spec.filepath, line: ref.line || 'content' }, `Invalid reference format: ${refStr}`, 'Use format: @ref:path/to/spec or @ref:path/to/spec#block-id'));
        return results;
    }
    const [_full, targetPath, targetBlock] = match;
    const targetFile = ref.targetFile || targetPath;
    // Check if target spec exists
    const targetSpec = context.allSpecs.get(targetFile) || context.allSpecs.get(`${targetFile}.spec`);
    if (!targetSpec) {
        // Check via file system
        if (context.fs) {
            const exists = context.fs.exists(`${context.baseDir}/${targetFile}.spec`)
                .catch(() => false);
            if (!exists) {
                results.push((0, types_1.createError)('@validation/refs', { file: spec.filepath, line: ref.line || 'content' }, `Reference target not found: ${targetFile}`, `Create spec file: ${targetFile}.spec`));
            }
        }
        else {
            results.push((0, types_1.createWarning)('@validation/refs', { file: spec.filepath, line: ref.line || 'content' }, `Cannot verify reference target: ${targetFile}`, 'Ensure target spec exists'));
        }
        return results;
    }
    // Check if target block exists (if specified)
    if (targetBlock) {
        const hasBlock = targetSpec.blocks?.some(b => b.id === targetBlock || b.id === `@block:${targetBlock}`);
        if (!hasBlock) {
            results.push((0, types_1.createError)('@validation/refs', { file: spec.filepath, line: ref.line || 'content' }, `Block not found in target: ${targetBlock}`, `Available blocks in ${targetFile}: ${targetSpec.blocks?.map(b => b.id).join(', ') || 'none'}`));
        }
    }
    return results;
}
/**
 * Detect circular dependencies in references
 */
function detectCycles(spec, context) {
    const cycles = [];
    const visited = new Set();
    const path = [];
    function dfs(currentId, currentPath) {
        if (currentPath.includes(currentId)) {
            // Found a cycle
            const cycleStart = currentPath.indexOf(currentId);
            cycles.push([...currentPath.slice(cycleStart), currentId]);
            return;
        }
        if (visited.has(currentId)) {
            return;
        }
        visited.add(currentId);
        path.push(currentId);
        // Get dependencies
        const currentSpec = context.allSpecs.get(currentId);
        if (currentSpec?.metadata?.depends_on) {
            for (const dep of currentSpec.metadata.depends_on) {
                const depId = typeof dep === 'string' ? dep : dep.ref || dep.toString();
                dfs(depId, path);
            }
        }
        path.pop();
    }
    if (spec.metadata.id) {
        dfs(spec.metadata.id, []);
    }
    return cycles;
}
/**
 * Build dependency graph from specs
 */
function buildDependencyGraph(specs) {
    const graph = new Map();
    for (const spec of specs) {
        const id = spec.metadata.id;
        if (!id)
            continue;
        const deps = [];
        if (spec.metadata.depends_on) {
            for (const dep of spec.metadata.depends_on) {
                const depId = typeof dep === 'string' ? dep : dep.ref || dep.toString();
                deps.push(depId);
            }
        }
        graph.set(id, deps);
    }
    return graph;
}
exports.default = exports.refsRule;
//# sourceMappingURL=refs.js.map