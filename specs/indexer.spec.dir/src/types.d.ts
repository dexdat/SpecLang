/**
 * SPECLANG-GENERATED: TypeScript types for spec indexer
 * Source: phase-0.3-indexer.md
 */
import type { SpecMetadata, Block, Reference } from '../parser/types';
/** Complete spec index */
export interface SpecIndex {
    /** Index version */
    version: string;
    /** Generation timestamp */
    generated: string;
    /** All spec entries by ID */
    specs: Record<string, SpecEntry>;
    /** Dependency graph */
    graph: DependencyGraph;
    /** Specs with no connections */
    orphans: string[];
    /** Circular dependency chains */
    cycles: string[][];
    /** Validation results */
    validation?: ValidationSummary;
}
/** A single spec in the index */
export interface SpecEntry {
    /** Unique spec ID */
    id: string;
    /** File path */
    file: string;
    /** Semantic version */
    version: string;
    /** Abstraction layer (0-10) */
    layer: number;
    /** Project maturity level */
    project_level?: string;
    /** Agent support level */
    agent_support?: string;
    /** Tags */
    tags: string[];
    /** Short description */
    short: string;
    /** Direct dependencies */
    depends_on: string[];
    /** Blocks defined in this spec */
    blocks: string[];
    /** Last modified timestamp */
    lastModified: string;
    /** Total lines */
    lines: number;
    /** Header lines */
    header_lines: number;
    /** Spec status */
    status?: string;
    /** Output target */
    target?: string;
    /** Content references */
    content_refs?: string[];
}
/** Dependency graph structure */
export interface DependencyGraph {
    /** What each spec depends on (forward) */
    dependencies: Record<string, string[]>;
    /** What depends on each spec (reverse) */
    dependents: Record<string, string[]>;
}
/** Validation summary */
export interface ValidationSummary {
    /** Missing reference targets */
    missing_refs: string[];
    /** Valid reference connections */
    valid_refs: string[];
    /** Total specs */
    total_specs: number;
    /** Total references */
    total_refs: number;
    /** Missing reference count */
    missing_ref_count: number;
}
/** Impact analysis result */
export interface ImpactAnalysis {
    /** Direct dependents */
    direct: string[];
    /** All transitive dependents */
    transitive: string[];
    /** File paths affected */
    files: string[];
}
/** Path finding result */
export interface PathResult {
    /** Whether path exists */
    exists: boolean;
    /** Path as array of spec IDs */
    path: string[];
    /** Number of hops */
    hops: number;
}
/** Cycle detection result */
export interface CycleResult {
    /** Whether cycles exist */
    hasCycles: boolean;
    /** All detected cycles */
    cycles: string[][];
}
/** Indexer configuration */
export interface IndexerOptions {
    /** Root directory to scan */
    rootDir?: string;
    /** Output file path */
    outputPath?: string;
    /** Whether to validate references */
    validateRefs?: boolean;
    /** Whether to detect cycles */
    detectCycles?: boolean;
    /** Whether to find orphans */
    findOrphans?: boolean;
    /** Whether to integrate with SQLite */
    useDatabase?: boolean;
    /** Database path */
    dbPath?: string;
}
/** Default indexer options */
export declare const DEFAULT_INDEXER_OPTIONS: IndexerOptions;
/** Result of parsing a spec for indexing */
export interface IndexedSpec {
    /** File path */
    filepath: string;
    /** Relative path */
    relpath: string;
    /** Parsed metadata */
    metadata: SpecMetadata;
    /** Header lines count */
    headerLines: number;
    /** Content lines count */
    lines: number;
    /** Blocks found */
    blocks: Block[];
    /** References found */
    references: Reference[];
    /** Last modified timestamp */
    lastModified: string;
}
/** Spec record for database insertion */
export interface IndexSpecRecord {
    id: string;
    file_path: string;
    version: string;
    layer: number;
    project_level?: string;
    agent_support?: string;
    tags: string[];
    short_desc: string;
    depends_on: string[];
    blocks: string[];
    last_edited: number;
}
/** Block record for database insertion */
export interface IndexBlockRecord {
    spec_id: string;
    block_id: string;
    kind: string;
    line: number;
    content: string;
}
/** Reference record for database insertion */
export interface IndexRefRecord {
    source_id: string;
    target_id: string;
    source_file: string;
    target_file?: string;
    line?: number;
}
//# sourceMappingURL=types.d.ts.map