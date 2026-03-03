/**
 * SPECLANG-GENERATED: Validation logic for spec files
 * Source: @speclang/headers @block:headers/validation
 */
import type { SpecMetadata, ValidationResult, ValidationError, ValidationWarning, ValidationReport, Reference, ReferenceCheck, Layer } from './types';
/** Check if version is valid semver */
export declare function isValidSemver(version: string): boolean;
/** Check if layer is valid (0-10) */
export declare function isValidLayer(layer: number): layer is Layer;
/** Check if ID matches file path convention */
export declare function validateIdFormat(id: string, filepath: string): boolean;
interface IndexEntry {
    path: string;
    id: string;
    version: string;
    layer?: number;
    project_level?: string;
    agent_support?: string;
    tags?: string[];
    short?: string;
    refs?: string[];
    lines?: number;
    header_lines?: number;
    status?: string;
    target?: string | null;
    depends_on?: string[];
    children?: string[];
}
interface SpecIndex {
    [id: string]: IndexEntry;
}
export declare function loadSpecIndex(indexPath?: string): SpecIndex;
/** Clear index cache (for testing) */
export declare function clearIndexCache(): void;
/** Check if a reference target exists in the index */
export declare function checkReference(ref: Reference, indexPath?: string): ReferenceCheck;
/** Check all references in a spec */
export declare function checkReferences(filepath: string, indexPath?: string): ReferenceCheck[];
/** Validate spec metadata */
export declare function validateMetadata(metadata: SpecMetadata, filepath: string): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
};
/** Validate header line count matches declared lines */
export declare function validateHeaderLines(content: string, declaredLines: number | undefined, filepath: string): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
};
/**
 * Validate a single spec file
 */
export declare function validateSpec(filepath: string, indexPath?: string): ValidationResult;
/**
 * Validate all specs in a directory
 */
export declare function validateAllSpecs(specsDir?: string, indexPath?: string): ValidationReport;
/**
 * Find all spec files in a directory
 */
export declare function findSpecFiles(dir: string): string[];
export {};
//# sourceMappingURL=validator.d.ts.map