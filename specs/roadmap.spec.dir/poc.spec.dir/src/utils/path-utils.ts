/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/path-utils.spec.md
 * Generated: 2026-03-03T04:00:00.000Z
 *
 * Edit the spec, not this file.
 */

import { join, basename } from 'path';

/**
 * Windows reserved filenames that cannot be used
 */
const WINDOWS_RESERVED_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
]);

/**
 * Slugify a spec ID for filesystem use with reversible encoding
 * @param specId - Full spec ID (e.g., "@examples/greeting")
 * @returns Filesystem-safe slug (e.g., "examples-SLASH-greeting")
 */
export function slugifySpecId(specId: string): string {
  // Use '-SLASH-' to encode / for unambiguous reversibility
  // @examples/greeting → examples-SLASH-greeting
  // @my-spec/auth → my-spec-SLASH-auth
  let slug = specId
    .replace(/^@/, '')                    // Remove leading @
    .replace(/\//g, '-SLASH-')            // Replace / with -SLASH- (reversible, unique)
    .replace(/[^a-zA-Z0-9-_]/g, '-')      // Replace other special chars
    .toLowerCase();
  
  // Handle Windows reserved names by prefixing with underscore
  const baseName = slug.split('-SLASH-').pop() || slug;
  if (WINDOWS_RESERVED_NAMES.has(baseName)) {
    slug = slug.replace(baseName, '_' + baseName);
  }
  
  return slug;
}

/**
 * Reverse slugification (recover original spec ID)
 * @param slug - Filesystem slug
 * @returns Original spec ID (e.g., "@examples/greeting")
 */
export function unslugifySpecId(slug: string): string {
  // Remove Windows reserved name prefix if present
  let cleaned = slug;
  for (const reserved of WINDOWS_RESERVED_NAMES) {
    if (slug.includes('_' + reserved)) {
      cleaned = slug.replace('_' + reserved, reserved);
      break;
    }
  }
  
  // Reverse: replace -SLASH- with /
  return '@' + cleaned.replace(/-SLASH-/g, '/');
}

/**
 * Resolve paths for a spec ID
 * @param specId - Full spec ID
 * @returns Resolved path information
 */
export function resolveSpecPaths(specId: string): {
  slug: string;
  specPath: string;
  specDir: string;
  srcDir: string;
  symlinkPath: string;
} {
  const slug = slugifySpecId(specId);
  
  return {
    slug,
    specPath: join('specs', `${slug}.spec.md`),
    specDir: join('specs', `${slug}.spec.dir`),
    srcDir: join('specs', `${slug}.spec.dir`, 'src'),
    symlinkPath: join('src', slug)
  };
}

/**
 * Resolve output path for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Full output file path
 */
export function resolveBlockOutputPath(specId: string, blockId: string): string {
  const { srcDir } = resolveSpecPaths(specId);
  return join(srcDir, `${blockId}.ts`);
}

/**
 * Get spec ID from file path (reverse lookup)
 * @param filePath - Absolute or relative file path
 * @returns Spec ID or null if not a spec file
 */
export function getSpecIdFromPath(filePath: string): string | null {
  // Check if it's a spec file
  if (filePath.endsWith('.spec.md')) {
    const slug = basename(filePath, '.spec.md');
    return unslugifySpecId(slug);
  }
  
  // Check if it's in a spec.dir
  const specDirMatch = filePath.match(/specs\/([^/]+)\.spec\.dir/);
  if (specDirMatch) {
    return unslugifySpecId(specDirMatch[1]);
  }
  
  return null;
}

/**
 * Check if a path is within the specs directory
 * @param filePath - File path to check
 * @returns True if path is in specs/
 */
export function isSpecPath(filePath: string): boolean {
  return filePath.includes('/specs/') || filePath.startsWith('specs/');
}

/**
 * Check if a path is a generated source file
 * @param filePath - File path to check
 * @returns True if path is in a .spec.dir/src/
 */
export function isGeneratedPath(filePath: string): boolean {
  return filePath.includes('.spec.dir/src/');
}

/**
 * Get relative path from symlink to source
 * @param specId - Full spec ID
 * @returns Relative path for symlink target
 */
export function getSymlinkTarget(specId: string): string {
  const slug = slugifySpecId(specId);
  return join('..', 'specs', `${slug}.spec.dir`, 'src');
}

/**
 * Resolve all paths for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Complete path information
 */
export function resolveBlockPaths(specId: string, blockId: string): {
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
} {
  const base = resolveSpecPaths(specId);
  
  return {
    specId,
    blockId,
    slug: base.slug,
    specPath: base.specPath,
    specDir: base.specDir,
    srcDir: base.srcDir,
    blockPath: join(base.srcDir, `${blockId}.ts`),
    indexPath: join(base.srcDir, 'index.ts'),
    symlinkPath: base.symlinkPath,
    symlinkTarget: getSymlinkTarget(specId)
  };
}

/**
 * Ensure all directories exist for a spec
 * @param specId - Full spec ID
 * @returns Promise that resolves when directories are created
 */
export async function ensureSpecDirectories(specId: string): Promise<void> {
  const { mkdir } = await import('fs/promises');
  const paths = resolveSpecPaths(specId);
  
  await mkdir(paths.specDir, { recursive: true });
  await mkdir(paths.srcDir, { recursive: true });
}
