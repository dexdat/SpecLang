/**
 * SPECLANG-GENERATED: Symlink verifier
 * Source: @speclang/symlinks/verification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SymlinkEntry, VerifyResult } from './types.js';

/**
 * Verify all symlinks are valid
 * 
 * @block:symlinks/verification @kind:operation
 */
export async function verifySymlinks(symlinks: SymlinkEntry[]): Promise<VerifyResult> {
  const result: VerifyResult = {
    valid: [],
    broken: [],
    missing: [],
  };
  
  for (const link of symlinks) {
    const verification = await verifySymlink(link.logicalPath, link.physicalPath);
    
    if (verification.isValid) {
      result.valid.push(link.logicalPath);
    } else if (verification.exists) {
      result.broken.push(link);
    } else {
      result.missing.push(link);
    }
  }
  
  return result;
}

/**
 * Verify a single symlink
 */
export async function verifySymlink(
  logicalPath: string,
  expectedPhysicalPath?: string
): Promise<{ isValid: boolean; exists: boolean; actualTarget?: string }> {
  try {
    const stats = await fs.lstat(logicalPath);
    
    if (!stats.isSymbolicLink()) {
      return { isValid: false, exists: true };
    }
    
    // Read the symlink target
    const actualTarget = await fs.readlink(logicalPath);
    
    // Resolve to absolute path for comparison
    const dir = path.dirname(logicalPath);
    const resolvedTarget = path.resolve(dir, actualTarget);
    const resolvedExpected = expectedPhysicalPath 
      ? path.resolve(expectedPhysicalPath)
      : null;
    
    // Check if it points to expected location
    if (resolvedExpected && resolvedTarget !== resolvedExpected) {
      return { isValid: false, exists: true, actualTarget: resolvedTarget };
    }
    
    // Check if target actually exists
    try {
      await fs.access(resolvedTarget);
      return { isValid: true, exists: true, actualTarget: resolvedTarget };
    } catch {
      return { isValid: false, exists: true, actualTarget: resolvedTarget };
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return { isValid: false, exists: false };
    }
    throw error;
  }
}

/**
 * Scan directory for symlinks
 */
export async function scanSymlinks(dirPath: string): Promise<SymlinkEntry[]> {
  const symlinks: SymlinkEntry[] = [];
  
  async function scan(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isSymbolicLink()) {
          const target = await fs.readlink(fullPath);
          const resolvedTarget = path.resolve(dir, target);
          
          symlinks.push({
            logicalPath: fullPath,
            physicalPath: resolvedTarget,
            isValid: false, // Will be verified separately
          });
        } else if (entry.isDirectory()) {
          await scan(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  await scan(dirPath);
  return symlinks;
}

/**
 * Repair broken symlinks
 */
export async function repairSymlinks(symlinks: SymlinkEntry[]): Promise<{
  repaired: string[];
  failed: string[];
}> {
  const result = {
    repaired: [],
    failed: [] as string[],
  };
  
  for (const link of symlinks) {
    try {
      const verification = await verifySymlink(link.logicalPath, link.physicalPath);
      
      if (!verification.isValid && verification.exists) {
        // Broken symlink - remove and recreate
        await fs.unlink(link.logicalPath);
        
        const dir = path.dirname(link.logicalPath);
        const relativePath = path.relative(dir, link.physicalPath);
        await fs.symlink(relativePath, link.logicalPath);
        
        result.repaired.push(link.logicalPath);
      }
    } catch (error) {
      result.failed.push(link.logicalPath);
    }
  }
  
  return result;
}
