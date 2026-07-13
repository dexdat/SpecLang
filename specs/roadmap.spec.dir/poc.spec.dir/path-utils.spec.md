# speclang-header lines:7
id: "@speclang/roadmap/poc/path-utils"
parent: ""@ref:specs/roadmap/pocversion: 0.1.0
layer: 2
short: "Path resolution utilities - spec ID to filesystem mapping"
tags: [poc, paths, utils, filesystem, mapping]
---

# POC: Path Utilities

Centralized path resolution for spec ID to filesystem mapping.

## Purpose

Provides consistent path resolution across all POC components:
- Spec ID → Directory slug
- Spec ID → Output paths
- Reverse lookups (path → spec ID)

## Path Mapping Rules

### @poc/paths/mapping

**Rule 1: Spec ID Slugification**
```typescript
// Input: "@examples/greeting"
// Output: "examples-greeting"

// Steps:
// 1. Remove leading @
// 2. Replace / with -
// 3. Replace special chars with -
// 4. Lowercase
```

**Rule 2: Directory Structure**
```
specs/{slug}.spec.md          # User spec file
specs/{slug}.spec.dir/        # Generated files directory
specs/{slug}.spec.dir/src/    # Generated source files
src/{slug}                    # Symlink to generated source
```

**Rule 3: Block Output**
```
specs/{slug}.spec.dir/src/{blockId}.ts   # Generated block file
specs/{slug}.spec.dir/src/index.ts       # Barrel export
```

## Implementation

### @poc/paths/impl

```typescript
import { join, dirname, basename, extname } from 'path';

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
 * @returns Filesystem-safe slug (e.g., "examples--greeting")
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
```

## Examples

### @poc/paths/examples

**Basic slugification:**
```typescript
slugifySpecId('@examples/greeting');      // 'examples-SLASH-greeting'
slugifySpecId('@speclang/core/types');    // 'speclang-SLASH-core-SLASH-types'
slugifySpecId('@my-spec_file');           // 'my-spec-file'
slugifySpecId('@test.nested/deep');       // 'test-nested-SLASH-deep'
```

**Path resolution:**
```typescript
resolveSpecPaths('@examples/greeting');
// Returns:
// {
//   slug: 'examples-greeting',
//   specPath: 'specs/examples-greeting.spec.md',
//   specDir: 'specs/examples-greeting.spec.dir',
//   srcDir: 'specs/examples-greeting.spec.dir/src',
//   symlinkPath: 'src/examples-greeting'
// }
```

**Block output path:**
```typescript
resolveBlockOutputPath('@examples/greeting', 'greet');
// → 'specs/examples-greeting.spec.dir/src/greet.ts'
```

**Complete block paths:**
```typescript
resolveBlockPaths('@examples/greeting', 'greet');
// Returns all paths needed to work with this block
```

**Reverse lookup:**
```typescript
getSpecIdFromPath('specs/examples-greeting.spec.md');
// → '@examples-greeting' (best effort)

getSpecIdFromPath('specs/examples-greeting.spec.dir/src/greet.ts');
// → '@examples-greeting'
```

## Usage in Components

### @poc/paths/usage

**SimpleAgent:**
```typescript
import { resolveSpecPaths, ensureSpecDirectories } from './path-utils';

export class SimpleAgent {
  async onFileChanged(event: FileEvent): Promise<void> {
    const specId = '@examples/greeting'; // from parsed header
    
    // Ensure directories exist
    await ensureSpecDirectories(specId);
    
    // Get paths
    const paths = resolveSpecPaths(specId);
    
    // Write to correct location
    await writeFile(
      join(paths.srcDir, 'greet.ts'),
      generatedCode
    );
    
    // Create symlink
    await symlink(paths.symlinkTarget, paths.symlinkPath);
  }
}
```

**CodeGenerator:**
```typescript
import { resolveBlockPaths } from './path-utils';

export class CodeGenerator {
  async generate(specId: string, block: BlockData): Promise<void> {
    const paths = resolveBlockPaths(specId, block.id);
    
    // Write to block path
    await writeFile(paths.blockPath, code);
    
    // Update barrel export at paths.indexPath
    await this.updateBarrel(paths.indexPath, block.id);
  }
}
```

**FileWatcher:**
```typescript
import { getSpecIdFromPath } from './path-utils';

export class FileWatcher {
  private onChange(filePath: string): void {
    const specId = getSpecIdFromPath(filePath);
    if (specId) {
      this.emit('change', { specId, path: filePath });
    }
  }
}
```

## Testing

### @poc/paths/testing

```typescript
describe('Path Utilities', () => {
  describe('slugifySpecId', () => {
    it('should remove leading @', () => {
      expect(slugifySpecId('@test')).toBe('test');
    });
    
    it('should replace / with -SLASH-', () => {
      expect(slugifySpecId('@a/b/c')).toBe('a-SLASH-b-SLASH-c');
    });
    
    it('should lowercase', () => {
      expect(slugifySpecId('@TEST')).toBe('test');
    });
    
    it('should replace special chars', () => {
      expect(slugifySpecId('@test.file')).toBe('test-file');
    });
  });
  
  describe('resolveSpecPaths', () => {
    it('should resolve all paths', () => {
      const paths = resolveSpecPaths('@examples/greeting');
      
      expect(paths.slug).toBe('examples-greeting');
      expect(paths.specPath).toBe('specs/examples-greeting.spec.md');
      expect(paths.specDir).toBe('specs/examples-greeting.spec.dir');
      expect(paths.srcDir).toBe('specs/examples-greeting.spec.dir/src');
      expect(paths.symlinkPath).toBe('src/examples-greeting');
    });
  });
  
  describe('getSpecIdFromPath', () => {
    it('should extract from spec file', () => {
      expect(getSpecIdFromPath('specs/test.spec.md')).toBe('@test');
    });
    
    it('should extract from generated file', () => {
      expect(getSpecIdFromPath('specs/test.spec.dir/src/greet.ts')).toBe('@test');
    });
    
    it('should return null for non-spec paths', () => {
      expect(getSpecIdFromPath('src/utils.ts')).toBeNull();
    });
  });
  
  describe('resolveBlockOutputPath', () => {
    it('should resolve block output path', () => {
      const path = resolveBlockOutputPath('@test', 'greet');
      expect(path).toBe('specs/test.spec.dir/src/greet.ts');
    });
  });
});
```

## Edge Cases

### @poc/paths/edge-cases

**Deeply nested specs:**
```typescript
slugifySpecId('@org/project/module/subcomponent');
// → 'org-SLASH-project-SLASH-module-SLASH-subcomponent'
```

**Specs with dashes in name:**
```typescript
slugifySpecId('@my-feature/auth');
// → 'my-feature-SLASH-auth'
// Note: Cannot distinguish between 'my-feature/auth' and 'my/feature-auth'
```

**Windows paths:**
```typescript
// Paths are normalized by Node.js path module
// Always use / internally, let Node handle platform differences
resolveSpecPaths('@test');
// Windows: 'specs\\test.spec.dir\\src'
// Unix: 'specs/test.spec.dir/src'
```

**Reserved filenames (Windows):**
```typescript
// These would cause issues on Windows but are unlikely spec IDs
// CON, PRN, AUX, NUL, COM1-9, LPT1-9
slugifySpecId('@CON'); // → 'con' (problematic on Windows)
```
