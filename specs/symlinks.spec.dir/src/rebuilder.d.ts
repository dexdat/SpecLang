/**
 * SPECLANG-GENERATED: Symlink rebuilder
 * Source: @speclang/symlinks/creation @speclang/symlinks/verification
 */
import { RebuildOptions, RebuildResult, SpecWithTarget } from './types.js';
/**
 * Rebuild entire project from specs/
 *
 * @block:symlinks/rebuild @kind:operation
 *
 * Scenario: rm -rf src/ tests/ generated/
 *
 * Steps:
 * 1. Scan specs/ for all files
 * 2. Parse headers, find targets
 * 3. Regenerate code if needed
 * 4. Create all symlinks
 * 5. Verify symlinks valid
 * 6. Done
 */
export declare function rebuild(specs: SpecWithTarget[], options?: RebuildOptions): Promise<RebuildResult>;
/**
 * Quick rebuild - just recreate symlinks without regeneration
 */
export declare function quickRebuild(specs: SpecWithTarget[]): Promise<RebuildResult>;
/**
 * Full rebuild - clean, regenerate, recreate symlinks
 */
export declare function fullRebuild(specs: SpecWithTarget[]): Promise<RebuildResult>;
/**
 * Get physical path from logical path (resolve symlink)
 *
 * Tool: speclang_get_physical_path
 */
export declare function getPhysicalPath(logicalPath: string): Promise<string | null>;
//# sourceMappingURL=rebuilder.d.ts.map