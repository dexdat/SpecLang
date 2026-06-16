/**
 * SPECLANG-GENERATED: Symlink creator
 * Source: @speclang/symlinks/creation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SymlinkEntry,
  SymlinkResult,
  SymlinkError,
  SymlinkErrorCode,
  SpecWithTarget,
  getPlatformConfig,
  DEFAULT_FALLBACK_CONFIG,
} from './types.js';

/**
 * Create all symlinks from specs with target headers
 * 
 * @block:symlinks/creation @kind:operation
 */
export async function createSymlinks(specs: SpecWithTarget[]): Promise<SymlinkResult> {
  const result: SymlinkResult = {
    created: [],
    skipped: [],
    errors: [],
  };
  
  const platform = getPlatformConfig();
  
  for (const spec of specs) {
    try {
      // Check if target file exists in specs/
      const physicalPath = spec.filePath;
      const targetPath = spec.target;
      
      // Check if source exists
      await fs.access(physicalPath);
      
      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });
      
      // Check if target already exists
      try {
        const stats = await fs.lstat(targetPath);
        
        if (stats.isSymbolicLink()) {
          // Check if symlink already points to correct location
          const existingTarget = await fs.readlink(targetPath);
          if (existingTarget === physicalPath || 
              existingTarget === path.relative(targetDir, physicalPath)) {
            result.skipped.push(targetPath);
            continue;
          }
          // Remove old symlink
          await fs.unlink(targetPath);
        } else if (stats.isFile()) {
          // Real file exists - skip or error
          result.errors.push({
            path: targetPath,
            code: 'ALREADY_EXISTS',
            message: 'Real file exists at target path, cannot create symlink',
          });
          continue;
        }
      } catch {
        // Target doesn't exist, which is fine
      }
      
      // Create symlink
      const relativePath = path.relative(targetDir, physicalPath);
      await fs.symlink(relativePath, targetPath);
      
      result.created.push(targetPath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      let code: SymlinkErrorCode = 'INVALID_PATH';
      
      if (err.code === 'ENOENT') {
        code = 'TARGET_NOT_FOUND';
      } else if (err.code === 'EACCES' || err.code === 'EPERM') {
        code = 'PERMISSION_DENIED';
      } else if (err.code === 'EEXIST') {
        code = 'ALREADY_EXISTS';
      }
      
      result.errors.push({
        path: spec.target,
        code,
        message: err.message,
      });
    }
  }
  
  return result;
}

/**
 * Create a single symlink
 */
export async function createSymlink(
  logicalPath: string,
  physicalPath: string
): Promise<SymlinkEntry> {
  const entry: SymlinkEntry = {
    logicalPath,
    physicalPath,
    isValid: false,
  };
  
  try {
    // Ensure parent directory exists
    const dir = path.dirname(logicalPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Create relative symlink
    const relativePath = path.relative(dir, physicalPath);
    
    // Remove existing if present
    try {
      await fs.unlink(logicalPath);
    } catch {
      // Ignore if doesn't exist
    }
    
    await fs.symlink(relativePath, logicalPath);
    entry.isValid = true;
  } catch (error) {
    entry.isValid = false;
  }
  
  return entry;
}

/**
 * Remove a symlink
 */
export async function removeSymlink(logicalPath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(logicalPath);
    if (stats.isSymbolicLink()) {
      await fs.unlink(logicalPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
