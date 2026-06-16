/**
 * SPECLANG-GENERATED: Symlink verifier
 * Source: @speclang/symlinks/verification
 */
import { SymlinkEntry, VerifyResult } from './types.js';
/**
 * Verify all symlinks are valid
 *
 * @block:symlinks/verification @kind:operation
 */
export declare function verifySymlinks(symlinks: SymlinkEntry[]): Promise<VerifyResult>;
/**
 * Verify a single symlink
 */
export declare function verifySymlink(logicalPath: string, expectedPhysicalPath?: string): Promise<{
    isValid: boolean;
    exists: boolean;
    actualTarget?: string;
}>;
/**
 * Scan directory for symlinks
 */
export declare function scanSymlinks(dirPath: string): Promise<SymlinkEntry[]>;
/**
 * Repair broken symlinks
 */
export declare function repairSymlinks(symlinks: SymlinkEntry[]): Promise<{
    repaired: string[];
    failed: string[];
}>;
//# sourceMappingURL=verifier.d.ts.map