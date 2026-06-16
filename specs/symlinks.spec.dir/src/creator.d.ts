/**
 * SPECLANG-GENERATED: Symlink creator
 * Source: @speclang/symlinks/creation
 */
import { SymlinkEntry, SymlinkResult, SpecWithTarget } from './types.js';
/**
 * Create all symlinks from specs with target headers
 *
 * @block:symlinks/creation @kind:operation
 */
export declare function createSymlinks(specs: SpecWithTarget[]): Promise<SymlinkResult>;
/**
 * Create a single symlink
 */
export declare function createSymlink(logicalPath: string, physicalPath: string): Promise<SymlinkEntry>;
/**
 * Remove a symlink
 */
export declare function removeSymlink(logicalPath: string): Promise<boolean>;
//# sourceMappingURL=creator.d.ts.map