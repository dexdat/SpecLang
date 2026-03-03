/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/path-utils.spec.md
 * Generated: 2026-03-03T04:00:00.000Z
 *
 * Edit the spec, not this file.
 */
/**
 * Slugify a spec ID for filesystem use with reversible encoding
 * @param specId - Full spec ID (e.g., "@examples/greeting")
 * @returns Filesystem-safe slug (e.g., "examples-SLASH-greeting")
 */
export declare function slugifySpecId(specId: string): string;
/**
 * Reverse slugification (recover original spec ID)
 * @param slug - Filesystem slug
 * @returns Original spec ID (e.g., "@examples/greeting")
 */
export declare function unslugifySpecId(slug: string): string;
/**
 * Resolve paths for a spec ID
 * @param specId - Full spec ID
 * @returns Resolved path information
 */
export declare function resolveSpecPaths(specId: string): {
    slug: string;
    specPath: string;
    specDir: string;
    srcDir: string;
    symlinkPath: string;
};
/**
 * Resolve output path for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Full output file path
 */
export declare function resolveBlockOutputPath(specId: string, blockId: string): string;
/**
 * Get spec ID from file path (reverse lookup)
 * @param filePath - Absolute or relative file path
 * @returns Spec ID or null if not a spec file
 */
export declare function getSpecIdFromPath(filePath: string): string | null;
/**
 * Check if a path is within the specs directory
 * @param filePath - File path to check
 * @returns True if path is in specs/
 */
export declare function isSpecPath(filePath: string): boolean;
/**
 * Check if a path is a generated source file
 * @param filePath - File path to check
 * @returns True if path is in a .spec.dir/src/
 */
export declare function isGeneratedPath(filePath: string): boolean;
/**
 * Get relative path from symlink to source
 * @param specId - Full spec ID
 * @returns Relative path for symlink target
 */
export declare function getSymlinkTarget(specId: string): string;
/**
 * Resolve all paths for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Complete path information
 */
export declare function resolveBlockPaths(specId: string, blockId: string): {
    specId: string;
    blockId: string;
    slug: string;
    specPath: string;
    specDir: string;
    srcDir: string;
    blockPath: string;
    indexPath: string;
    symlinkPath: string;
    symlinkTarget: string;
};
/**
 * Ensure all directories exist for a spec
 * @param specId - Full spec ID
 * @returns Promise that resolves when directories are created
 */
export declare function ensureSpecDirectories(specId: string): Promise<void>;
//# sourceMappingURL=path-utils.d.ts.map