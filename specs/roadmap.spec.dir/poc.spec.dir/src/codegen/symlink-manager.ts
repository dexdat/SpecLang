/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/code-generation.spec.md
 * Generated: 2026-03-03T05:30:00.000Z
 *
 * Edit the spec, not this file.
 */

import { symlink, unlink, readdir, copyFile, rename, rm, access, constants, realpath } from 'fs/promises';
import { dirname, join, relative, resolve } from 'path';
import { platform } from 'os';
import { randomBytes } from 'crypto';
import { POCError } from '../types/poc';
import { slugifySpecId } from '../utils/path-utils';

/**
 * Create or update symlink for a spec
 * @param specId - Full spec ID
 * @param outputDir - Output directory (default './src')
 */
export async function createSpecSymlink(specId: string, outputDir: string = './src'): Promise<void> {
  const slug = slugifySpecId(specId);
  const linkPath = join(outputDir, slug);
  const sourceDir = join('specs', `${slug}.spec.dir`, 'src');
  
  await validateSymlinkTarget(linkPath, sourceDir, outputDir);
  
  const targetPath = relative(dirname(linkPath), sourceDir);
  
  // Remove existing symlink if present
  try {
    await unlink(linkPath);
  } catch {
    // File might not exist
  }
  
  const isWindows = platform() === 'win32';
  
  if (isWindows) {
    try {
      await symlink(targetPath, linkPath, 'junction');
    } catch (error) {
      console.log(`[SymlinkManager] Symlink failed on Windows, using directory sync`);
      await syncDirectory(sourceDir, linkPath);
    }
  } else {
    await symlink(targetPath, linkPath);
  }
}

/**
 * Validate symlink target for security
 */
async function validateSymlinkTarget(linkPath: string, sourceDir: string, outputDir: string): Promise<void> {
  const absLinkPath = resolve(linkPath);
  const absSourceDir = resolve(sourceDir);
  
  const realSourceDir = await realpath(absSourceDir).catch(() => absSourceDir);
  
  const projectRoot = resolve(process.cwd());
  
  const sourceRelative = relative(projectRoot, realSourceDir);
  if (sourceRelative.startsWith('..') || sourceRelative.includes(':')) {
    throw new POCError(
      'SYMLINK_ERROR',
      `Symlink source "${sourceDir}" is outside project directory`,
      linkPath
    );
  }
  
  const linkRelative = relative(resolve(outputDir), absLinkPath);
  if (linkRelative.startsWith('..') || linkRelative.includes(':')) {
    throw new POCError(
      'SYMLINK_ERROR',
      `Symlink path "${linkPath}" is outside output directory`,
      linkPath
    );
  }
  
  try {
    await access(realSourceDir, constants.R_OK);
  } catch {
    throw new POCError(
      'SYMLINK_ERROR',
      `Source directory "${sourceDir}" does not exist or is not readable`,
      linkPath
    );
  }
}

/**
 * Sync directory contents (Windows fallback)
 */
async function syncDirectory(source: string, dest: string): Promise<void> {
  const tempDir = join(dirname(dest), `.tmp-${randomBytes(8).toString('hex')}`);
  
  try {
    await mkdir(tempDir, { recursive: true });
    const sourceFiles = await readdir(source);
    
    for (const file of sourceFiles) {
      const srcPath = join(source, file);
      const destPath = join(tempDir, file);
      await copyFile(srcPath, destPath);
    }
    
    try {
      await rm(dest, { recursive: true, force: true });
    } catch {
      // dest may not exist
    }
    
    await rename(tempDir, dest);
  } finally {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

// Re-export mkdir for use
import { mkdir } from 'fs/promises';
export { mkdir };