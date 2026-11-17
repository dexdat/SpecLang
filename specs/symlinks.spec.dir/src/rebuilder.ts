/**
 * SPECLANG-GENERATED: Symlink rebuilder
 * Source: @speclang/symlinks/creation @speclang/symlinks/verification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { RebuildOptions, RebuildResult, SpecWithTarget, SymlinkError } from './types.js';
import { createSymlinks } from './creator.js';
import { verifySymlinks, scanSymlinks } from './verifier.js';

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
export async function rebuild(
  specs: SpecWithTarget[],
  options: RebuildOptions = {}
): Promise<RebuildResult> {
  const result: RebuildResult = {
    generated: [],
    symlinked: [],
    errors: [],
  };
  
  const {
    clean = false,
    regenerate = true,
    verify = true,
  } = options;
  
  // Step 1: Clean if requested
  if (clean) {
    const logicalDirs = ['src/', 'tests/', 'generated/', 'docs/'];
    for (const dir of logicalDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore errors during clean
      }
    }
  }
  
  // Step 2 & 3: Generate code (placeholder - actual generation would happen here)
  if (regenerate) {
    // In a real implementation, this would call the code generator
    // For now, we just track which specs would be regenerated
    result.generated = specs.map(s => s.filePath);
  }
  
  // Step 4: Create symlinks
  const symlinkResult = await createSymlinks(specs);
  result.symlinked = symlinkResult.created;
  result.errors.push(...symlinkResult.errors.map(err => ({
    path: err.path,
    code: err.code,
    message: err.message,
  })));
  
  // Step 5: Verify symlinks
  //
  // Scope the scan to the target roots named by `specs`, never process.cwd():
  // a whole-checkout scan of process.cwd() made rebuild()'s cost and its error list depend
  // on ambient state — every directory of the working tree, including the
  // .tmp/ scratch trees other processes are writing at the same moment — which
  // is what turned quickRebuild into a load-dependent 5s timeout in-suite.
  if (verify) {
    const targetRoots = getTargetRoots(specs);
    const scanned = await Promise.all(
      targetRoots.map((root) => scanSymlinks(root))
    );
    const symlinkEntries = scanned.flat();
    const verification = await verifySymlinks(symlinkEntries);
    
    // Log broken symlinks as warnings
    for (const broken of verification.broken) {
      result.errors.push({
        path: broken.logicalPath,
        code: 'BROKEN_SYMLINK',
        message: `Broken symlink: ${broken.logicalPath}`,
      });
    }
  }
  
  return result;
}

/**
 * Logical target directories named by the specs (deduped, ordered).
 * rebuild() derives every path it touches from its inputs, so verification is
 * scoped to these roots instead of the process working directory.
 */
function getTargetRoots(specs: SpecWithTarget[]): string[] {
  const roots = new Set<string>();
  for (const spec of specs) {
    if (!spec.target) {
      continue;
    }
    roots.add(path.dirname(path.resolve(spec.target)));
  }
  return [...roots].sort();
}

/**
 * Quick rebuild - just recreate symlinks without regeneration
 */
export async function quickRebuild(specs: SpecWithTarget[]): Promise<RebuildResult> {
  return rebuild(specs, { clean: false, regenerate: false, verify: true });
}

/**
 * Full rebuild - clean, regenerate, recreate symlinks
 */
export async function fullRebuild(specs: SpecWithTarget[]): Promise<RebuildResult> {
  return rebuild(specs, { clean: true, regenerate: true, verify: true });
}

/**
 * Get physical path from logical path (resolve symlink)
 * 
 * Tool: speclang_get_physical_path
 */
export async function getPhysicalPath(logicalPath: string): Promise<string | null> {
  try {
    const stats = await fs.lstat(logicalPath);
    
    if (stats.isSymbolicLink()) {
      const target = await fs.readlink(logicalPath);
      const dir = path.dirname(logicalPath);
      return path.resolve(dir, target);
    }
    
    // Not a symlink, return the path itself
    return path.resolve(logicalPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
