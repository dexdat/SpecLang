"use strict";
/**
 * SPECLANG-GENERATED: Analysis utilities for spec indexer
 * Source: phase-0.3-indexer.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.impactAnalysis = impactAnalysis;
exports.showDependencyTree = showDependencyTree;
exports.validateReferences = validateReferences;
exports.validateIndex = validateIndex;
exports.checkLayerConsistency = checkLayerConsistency;
exports.findByTag = findByTag;
exports.findByLayer = findByLayer;
exports.findByStatus = findByStatus;
exports.searchByKeyword = searchByKeyword;
const graph_1 = require("./graph");
// ============================================================================
// IMPACT ANALYSIS
// ============================================================================
/**
 * Analyze impact of changing a spec
 */
function impactAnalysis(specId, index) {
    const graph = index.graph;
    const specs = index.specs;
    // Direct dependents
    const direct = [...(graph.dependents[specId] || [])];
    // All transitive dependents
    const transitive = (0, graph_1.getTransitiveDependents)(specId, graph.dependents);
    // Find actual file paths
    const files = transitive
        .map(s => specs[s]?.file)
        .filter((f) => !!f);
    return {
        direct,
        transitive,
        files,
    };
}
/**
 * Show dependency tree for a spec
 */
function showDependencyTree(specId, index) {
    const graph = index.graph;
    const specs = index.specs;
    // What this spec depends on
    const dependsOn = getSpecTree(specId, graph.dependencies, specs);
    // What depends on this spec
    const dependedOnBy = getSpecTree(specId, graph.dependents, specs);
    return {
        specId,
        dependsOn,
        dependedOnBy,
    };
}
/**
 * Get spec tree recursively
 */
function getSpecTree(specId, graph, specs) {
    const result = [];
    const visited = new Set();
    function buildTree(id, depth) {
        if (depth > 10 || visited.has(id))
            return;
        visited.add(id);
        const deps = graph[id] || [];
        for (const dep of deps) {
            const spec = specs[dep];
            result.push({
                specId: dep,
                spec: spec || null,
                depth,
            });
            buildTree(dep, depth + 1);
        }
    }
    buildTree(specId, 1);
    return result;
}
// ============================================================================
// VALIDATION
// ============================================================================
/**
 * Validate all references in the index
 */
function validateReferences(index) {
    const specs = index.specs;
    const allIds = new Set(Object.keys(specs));
    const missingRefs = [];
    const validRefs = [];
    for (const [specId, entry] of Object.entries(specs)) {
        // Check depends_on
        for (const dep of entry.depends_on || []) {
            const cleanDep = cleanRef(dep);
            if (cleanDep && !allIds.has(cleanDep)) {
                missingRefs.push(`${specId} -> ${cleanDep} (depends_on)`);
            }
            else if (cleanDep) {
                validRefs.push(`${specId} -> ${cleanDep}`);
            }
        }
        // Check content refs
        for (const ref of entry.content_refs || []) {
            const cleanedRef = cleanRef(ref);
            if (cleanedRef && !cleanedRef.startsWith('#')) {
                if (!allIds.has(cleanedRef)) {
                    missingRefs.push(`${specId} -> ${cleanedRef} (content)`);
                }
                else {
                    validRefs.push(`${specId} -> ${cleanedRef}`);
                }
            }
        }
    }
    return {
        missing_refs: missingRefs,
        valid_refs: validRefs,
        total_specs: Object.keys(specs).length,
        total_refs: validRefs.length,
        missing_ref_count: missingRefs.length,
    };
}
/**
 * Clean reference string
 */
function cleanRef(ref) {
    let cleaned = ref.replace(/^@ref:/, '').replace(/^@/, '');
    if (cleaned.includes('#')) {
        cleaned = cleaned.split('#')[0];
    }
    return cleaned;
}
/**
 * Validate index integrity
 */
function validateIndex(index) {
    const errors = [];
    const warnings = [];
    // Check for cycles
    const cycles = index.cycles || [];
    if (cycles.length > 0) {
        errors.push(`${cycles.length} circular dependencies detected`);
    }
    // Check for orphans
    const orphans = index.orphans || [];
    if (orphans.length > 0) {
        warnings.push(`${orphans.length} orphan specs with no connections`);
    }
    // Check for missing reference targets
    const validation = index.validation;
    if (validation && validation.missing_ref_count > 0) {
        errors.push(`${validation.missing_ref_count} missing reference targets`);
    }
    // Check for specs without IDs
    for (const [id, entry] of Object.entries(index.specs)) {
        if (!id || id.startsWith('@unknown/')) {
            errors.push(`Spec with invalid ID: ${entry.file}`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
// ============================================================================
// LAYER ANALYSIS
// ============================================================================
/**
 * Check layer consistency
 * Higher layer specs should depend on lower layer specs
 */
function checkLayerConsistency(index) {
    const violations = [];
    const graph = index.graph;
    for (const [specId, entry] of Object.entries(index.specs)) {
        const currentLayer = entry.layer || 0;
        for (const depId of entry.depends_on || []) {
            const dep = index.specs[depId];
            if (dep) {
                const depLayer = dep.layer || 0;
                if (currentLayer <= depLayer) {
                    violations.push({
                        spec: specId,
                        specLayer: currentLayer,
                        dependsOn: depId,
                        dependsOnLayer: depLayer,
                        message: `Spec ${specId} (layer ${currentLayer}) depends on ${depId} (layer ${depLayer})`,
                    });
                }
            }
        }
    }
    return {
        consistent: violations.length === 0,
        violations,
    };
}
// ============================================================================
// SEARCH AND QUERY
// ============================================================================
/**
 * Find specs by tag
 */
function findByTag(index, tag) {
    const results = [];
    for (const entry of Object.values(index.specs)) {
        if (entry.tags?.includes(tag)) {
            results.push(entry);
        }
    }
    return results;
}
/**
 * Find specs by layer
 */
function findByLayer(index, layer) {
    const results = [];
    for (const entry of Object.values(index.specs)) {
        if (entry.layer === layer) {
            results.push(entry);
        }
    }
    return results;
}
/**
 * Find specs by status
 */
function findByStatus(index, status) {
    const results = [];
    for (const entry of Object.values(index.specs)) {
        if (entry.status === status) {
            results.push(entry);
        }
    }
    return results;
}
/**
 * Search specs by keyword in short description
 */
function searchByKeyword(index, keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();
    for (const entry of Object.values(index.specs)) {
        if (entry.short?.toLowerCase().includes(lowerKeyword)) {
            results.push(entry);
        }
    }
    return results;
}
