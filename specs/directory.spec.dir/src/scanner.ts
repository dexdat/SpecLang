/**
speclang-header lines:5
id: @specs/directory
version: 1.0.0
layer: 5
 */

// Generated from specs/directory-structure.spec.md
// DO NOT EDIT MANUALLY
// Source: @block:dir/* @kind:entity

import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

export interface SpecFileInfo {
  path: string;
  name: string;
  type: 'spec' | 'dir' | 'subspec' | 'code';
  depth: number;
  parent?: string;
}

export interface DirectoryScanResult {
  specFiles: SpecFileInfo[];
  specDirs: SpecFileInfo[];
  nestingDepth: number;
  maxDepth: number;
}

/**
 * Scan a directory for spec files and directories
 */
export async function scanDirectory(rootPath: string, maxDepth: number = 10): Promise<DirectoryScanResult> {
  const result: DirectoryScanResult = {
    specFiles: [],
    specDirs: [],
    nestingDepth: 0,
    maxDepth: 0,
  };
  
  await scanRecursive(rootPath, 0, result, maxDepth);
  result.maxDepth = result.nestingDepth;
  return result;
}

async function scanRecursive(
  currentPath: string,
  depth: number,
  result: DirectoryScanResult,
  maxDepth: number
): Promise<void> {
  if (depth > maxDepth) {
    return;
  }
  
  try {
    const entries = await readdir(currentPath);
    
    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        if (entry.endsWith('.dir')) {
          // Found a spec directory
          const info: SpecFileInfo = {
            path: fullPath,
            name: entry,
            type: 'dir',
            depth,
            parent: currentPath,
          };
          result.specDirs.push(info);
          result.nestingDepth = Math.max(result.nestingDepth, depth + 1);
          
          // Recursively scan the directory
          await scanRecursive(fullPath, depth + 1, result, maxDepth);
        } else {
          // Regular directory, scan it too
          await scanRecursive(fullPath, depth + 1, result, maxDepth);
        }
      } else if (stats.isFile()) {
        // Check if it's a spec file
        if (isSpecFile(entry)) {
          const info: SpecFileInfo = {
            path: fullPath,
            name: entry,
            type: getFileType(entry),
            depth,
            parent: currentPath,
          };
          result.specFiles.push(info);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.warn(`Could not scan directory ${currentPath}:`, error);
  }
}

function isSpecFile(filename: string): boolean {
  const specPatterns = [
    /\.spec\.md$/,
    /\.spec\.yaml$/,
    /\.spec\.yml$/,
    /\.scl$/,
    /\.go\.spec$/,
    /\.ts\.spec$/,
    /\.py\.spec$/,
    /\.rs\.spec$/,
    /\.js\.spec$/,
  ];
  
  return specPatterns.some(pattern => pattern.test(filename));
}

function getFileType(filename: string): 'spec' | 'dir' | 'subspec' | 'code' {
  if (filename.endsWith('.dir')) {
    return 'dir';
  } else if (filename.includes('.dir/')) {
    return 'subspec';
  } else if (filename.endsWith('.go.spec') || filename.endsWith('.ts.spec') || 
             filename.endsWith('.py.spec') || filename.endsWith('.rs.spec')) {
    return 'code';
  } else {
    return 'spec';
  }
}

/**
 * Get all spec files in a tree structure
 */
export async function getSpecTree(rootPath: string): Promise<Map<string, SpecFileInfo[]>> {
  const result = await scanDirectory(rootPath);
  const tree = new Map<string, SpecFileInfo[]>();
  
  // Group by parent
  for (const file of [...result.specFiles, ...result.specDirs]) {
    const parent = file.parent || 'root';
    if (!tree.has(parent)) {
      tree.set(parent, []);
    }
    tree.get(parent)!.push(file);
  }
  
  return tree;
}

/**
 * Check if a path follows spec directory conventions
 */
export function validateSpecPath(path: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for correct extensions
  if (!isSpecFile(path) && !path.endsWith('.dir/') && !path.endsWith('.dir')) {
    issues.push('Path does not match spec file or directory pattern');
  }
  
  // Check naming conventions (lowercase with hyphens)
  const filename = path.split('/').pop() || '';
  if (filename.includes('_')) {
    issues.push('Filename should use hyphens instead of underscores');
  }
  
  if (/[A-Z]/.test(filename)) {
    issues.push('Filename should be lowercase');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}