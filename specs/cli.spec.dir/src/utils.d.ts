/**
 * SPECLANG-GENERATED: CLI utilities
 * Source: @speclang/mcp.cli
 *
 * Common utilities for CLI commands
 */
import { SpecLangDB } from '../../sqlite.spec.dir/src/index.js';
import { SpecIndex } from '../../indexer.spec.dir/src/index.js';
/**
 * Set suppress output mode
 */
export declare function setSuppressOutput(suppress: boolean): void;
/**
 * Get suppress output state
 */
export declare function isSuppressOutput(): boolean;
/**
 * Console.log wrapper that respects suppress mode
 */
export declare function log(...args: unknown[]): void;
/**
 * Console.error wrapper that respects suppress mode
 */
export declare function error(...args: unknown[]): void;
/**
 * Get database instance
 */
export declare function getDatabase(config?: {
    path?: string;
}): SpecLangDB;
/**
 * Close database connection
 */
export declare function closeDatabase(): void;
/**
 * Get specs directory
 */
export declare function getSpecsDir(): string;
/**
 * Load spec index
 */
export declare function loadIndex(): SpecIndex;
/**
 * Refresh spec index
 */
export declare function refreshIndex(): SpecIndex;
/**
 * Find spec file by ID
 */
export declare function findSpecFile(specId: string): string | null;
/**
 * Read spec content from file
 */
export declare function readSpecContent(filePath: string): string;
/**
 * Output result in various formats
 */
export interface OutputOptions {
    json?: boolean;
    quiet?: boolean;
}
export declare function outputResults<T>(results: T[], options: OutputOptions, formatFn?: (item: T) => string): void;
/**
 * Format spec for display
 */
export declare function formatSpec(item: {
    id?: string;
    short?: string;
    layer?: number;
    version?: string;
}): string;
/**
 * Get database path
 */
export declare function getDbPath(): string;
/**
 * Ensure .speclang directory exists
 */
export declare function ensureSpeclangDir(): void;
//# sourceMappingURL=utils.d.ts.map