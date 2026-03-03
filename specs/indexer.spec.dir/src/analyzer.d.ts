/**
 * SPECLANG-GENERATED: Analysis utilities for spec indexer
 * Source: phase-0.3-indexer.md
 */
import type { SpecIndex, SpecEntry, ImpactAnalysis, ValidationSummary } from './types';
/**
 * Analyze impact of changing a spec
 */
export declare function impactAnalysis(specId: string, index: SpecIndex): ImpactAnalysis;
/**
 * Show dependency tree for a spec
 */
export declare function showDependencyTree(specId: string, index: SpecIndex): DependencyTreeResult;
/** Tree node */
export interface TreeNode {
    specId: string;
    spec: SpecEntry | null;
    depth: number;
}
/** Dependency tree result */
export interface DependencyTreeResult {
    specId: string;
    dependsOn: TreeNode[];
    dependedOnBy: TreeNode[];
}
/**
 * Validate all references in the index
 */
export declare function validateReferences(index: SpecIndex): ValidationSummary;
/**
 * Validate index integrity
 */
export declare function validateIndex(index: SpecIndex): IndexValidation;
/** Index validation result */
export interface IndexValidation {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Check layer consistency
 * Higher layer specs should depend on lower layer specs
 */
export declare function checkLayerConsistency(index: SpecIndex): LayerConsistencyResult;
/** Layer violation */
export interface LayerViolation {
    spec: string;
    specLayer: number;
    dependsOn: string;
    dependsOnLayer: number;
    message: string;
}
/** Layer consistency result */
export interface LayerConsistencyResult {
    consistent: boolean;
    violations: LayerViolation[];
}
/**
 * Find specs by tag
 */
export declare function findByTag(index: SpecIndex, tag: string): SpecEntry[];
/**
 * Find specs by layer
 */
export declare function findByLayer(index: SpecIndex, layer: number): SpecEntry[];
/**
 * Find specs by status
 */
export declare function findByStatus(index: SpecIndex, status: string): SpecEntry[];
/**
 * Search specs by keyword in short description
 */
export declare function searchByKeyword(index: SpecIndex, keyword: string): SpecEntry[];
//# sourceMappingURL=analyzer.d.ts.map