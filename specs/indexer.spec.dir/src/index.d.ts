/**
 * SPECLANG-GENERATED: Spec indexer main module
 * Source: docs/prompts/phase-0.3-indexer.md
 *
 * This module provides the main indexer functionality for SpecLang.
 * It scans specs/ directory and generates _index.json with full graph analysis.
 */
import type { SpecIndex, IndexerOptions } from './types';
/** Parse speclang header from file or content */
export declare function parseHeader(filepathOrContent: string): {
    headerLines: number;
    metadata: Record<string, unknown>;
};
/** Extract @ref: references from spec content or file */
export declare function extractRefsFromContent(filepathOrContent: string): string[];
/** Extract @block: definitions from spec content or file */
export declare function extractBlocksFromContent(filepathOrContent: string): string[];
/** Get all spec files in directory */
export declare function getSpecFiles(rootDir: string): string[];
/** Generate complete spec index */
export declare function generateIndex(options?: Partial<IndexerOptions>): SpecIndex;
import type { SpecLangDB } from '../../sqlite.spec.dir/src/index.js';
/**
 * Populate SQLite database with spec index data
 */
export declare function populateDatabase(index: SpecIndex, db: SpecLangDB): void;
/**
 * Validate index
 */
export declare function validateIndexCmd(index: SpecIndex): boolean;
/**
 * Show dependency tree for a spec
 */
export declare function treeCmd(index: SpecIndex, specId: string): void;
/**
 * Show impact analysis
 */
export declare function impactCmd(index: SpecIndex, specId: string): void;
/**
 * Show graph statistics
 */
export declare function graphCmd(index: SpecIndex): void;
export * from './types';
export * from './graph';
export * from './analyzer';
//# sourceMappingURL=index.d.ts.map