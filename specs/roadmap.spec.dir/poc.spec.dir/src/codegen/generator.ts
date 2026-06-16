/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/code-generator.spec.md
 * Generated: 2026-03-03T05:25:00.000Z
 *
 * Edit the spec, not this file.
 */

import { TemplateRegistry } from './template-registry';
import { BlockData, GeneratedFile, SpecHeader, POCError } from '../types/poc';
import { slugifySpecId } from '../utils/path-utils';
import { mkdir, writeFile, symlink, unlink, readdir, copyFile, rename, rm, access, constants, realpath } from 'fs/promises';
import { dirname, join, relative, resolve } from 'path';
import { platform } from 'os';
import { randomBytes } from 'crypto';

/**
 * Code generator orchestrator
 * Coordinates templates, file I/O, and symlink creation
 */
export class CodeGenerator {
  private registry: TemplateRegistry;
  private outputDir: string;
  
  constructor(options: {
    registry: TemplateRegistry;
    outputDir?: string;
  }) {
    this.registry = options.registry;
    this.outputDir = options.outputDir || './src';
  }
  
  /**
   * Generate code for a single block
   * @param specId - Full spec ID (e.g., "@examples/greeting")
   * @param header - Parsed spec header
   * @param block - Parsed block data
   * @returns Generated file metadata
   */
  async generate(
    specId: string,
    header: SpecHeader,
    block: BlockData
  ): Promise<GeneratedFile> {
    // 1. Check if template exists for block kind
    if (!this.registry.has(block.kind)) {
      throw new POCError(
        'TEMPLATE_ERROR',
        `No template registered for block kind "${block.kind}". ` +
        `Available kinds: ${Array.from(this.registry.getAll().keys()).join(', ')}`,
        this.resolveOutputPath(specId, block.id)
      );
    }
    
    // 2. Get template for block kind
    const template = this.registry.get(block.kind);
    
    // 3. Render code
    const code = template(block);
    
    // 4. Add file header
    const fullCode = this.addFileHeader(code, specId, block, header);
    
    // 5. Determine output path
    const outputPath = this.resolveOutputPath(specId, block.id);
    
    // 6. Ensure directory exists
    await mkdir(dirname(outputPath), { recursive: true });
    
    // 7. Write file
    await writeFile(outputPath, fullCode, 'utf-8');
    
    // 8. Create/update symlink
    await this.createSymlink(specId);
    
    return {
      path: outputPath,
      content: fullCode,
      specId,
      blockId: block.id,
      generatedAt: Date.now()
    };
  }
  
  /**
   * Generate code for all blocks in a spec
   * @param specId - Full spec ID
   * @param header - Parsed spec header  
   * @param blocks - Array of parsed blocks
   * @returns Array of generated files
   */
  async generateAll(
    specId: string,
    header: SpecHeader,
    blocks: BlockData[]
  ): Promise<GeneratedFile[]> {
    const generated: GeneratedFile[] = [];
    
    for (const block of blocks) {
      try {
        const file = await this.generate(specId, header, block);
        generated.push(file);
      } catch (error) {
        console.error(`[CodeGenerator] Failed to generate ${block.id}:`, error);
        // Continue with other blocks
      }
    }
    
    // Generate barrel export after all blocks
    await this.generateBarrelExport(specId, blocks);
    
    return generated;
  }
  
  /**
   * Add SPECLANG-GENERATED header to code
   */
  private addFileHeader(
    code: string,
    specId: string,
    block: BlockData,
    header: SpecHeader
  ): string {
    return `// SPECLANG-GENERATED: ${block.kind}
// Source: ${specId}#${block.id}
// Version: ${header.version}
// DO NOT EDIT MANUALLY - Changes will be overwritten

${code}`;
  }
  
  /**
   * Resolve output file path
   * Pattern: specs/{slug}.spec.dir/src/{blockId}.ts
   */
  private resolveOutputPath(specId: string, blockId: string): string {
    const slug = slugifySpecId(specId);
    return join('specs', `${slug}.spec.dir`, 'src', `${blockId}.ts`);
  }
  
  /**
   * Create or update symlink
   * Source: specs/{slug}.spec.dir/src
   * Target: src/{slug}
   */
  private async createSymlink(specId: string): Promise<void> {
    const slug = slugifySpecId(specId);
    const linkPath = join(this.outputDir, slug);
    const sourceDir = join('specs', `${slug}.spec.dir`, 'src');
    
    // SECURITY: Validate symlink target before creation
    await this.validateSymlinkTarget(linkPath, sourceDir);
    
    // Calculate relative path from link location to source
    const targetPath = relative(dirname(linkPath), sourceDir);
    
    // Remove existing symlink if present
    try {
      await unlink(linkPath);
    } catch {
      // File might not exist
    }
    
    // Platform-specific symlink
    const isWindows = platform() === 'win32';
    
    if (isWindows) {
      try {
        await symlink(targetPath, linkPath, 'junction');
      } catch (error) {
        // Fallback: sync directory contents
        console.log(`[CodeGenerator] Symlink failed on Windows, using directory sync`);
        await this.syncDirectory(sourceDir, linkPath);
      }
    } else {
      await symlink(targetPath, linkPath);
    }
  }
  
  /**
   * Validate symlink target for security
   * - Ensures source directory exists and is within project
   * - Ensures link path is within output directory
   * - Prevents path traversal attacks
   */
  private async validateSymlinkTarget(linkPath: string, sourceDir: string): Promise<void> {
    // Resolve absolute paths
    const absLinkPath = resolve(linkPath);
    const absSourceDir = resolve(sourceDir);
    
    // SECURITY: Resolve symlinks to prevent symlink attacks
    const realSourceDir = await realpath(absSourceDir).catch(() => absSourceDir);
    
    // Project root: directory containing specs/ and src/
    const projectRoot = resolve(process.cwd());
    
    // Ensure source directory is within project
    const sourceRelative = relative(projectRoot, realSourceDir);
    if (sourceRelative.startsWith('..') || sourceRelative.includes(':')) {
      throw new POCError(
        'SYMLINK_ERROR',
        `Symlink source "${sourceDir}" is outside project directory`,
        linkPath
      );
    }
    
    // Ensure link path is within output directory (should be, but double-check)
    const linkRelative = relative(resolve(this.outputDir), absLinkPath);
    if (linkRelative.startsWith('..') || linkRelative.includes(':')) {
      throw new POCError(
        'SYMLINK_ERROR',
        `Symlink path "${linkPath}" is outside output directory`,
        linkPath
      );
    }
    
    // Verify source directory exists and is accessible
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
   * Handles incremental updates: adds new files, updates modified, removes deleted
   */
  private async syncDirectory(source: string, dest: string): Promise<void> {
    // Create temporary directory for atomic copy
    const tempDir = join(dirname(dest), `.tmp-${randomBytes(8).toString('hex')}`);
    
    try {
      // Copy all files from source to temp directory
      await mkdir(tempDir, { recursive: true });
      const sourceFiles = await readdir(source);
      
      for (const file of sourceFiles) {
        const srcPath = join(source, file);
        const destPath = join(tempDir, file);
        await copyFile(srcPath, destPath);
      }
      
      // Atomic swap: remove old dest, rename temp to dest
      try {
        await rm(dest, { recursive: true, force: true });
      } catch {
        // dest may not exist
      }
      
      await rename(tempDir, dest);
    } finally {
      // Clean up temp directory if rename failed
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }
  
  /**
   * Generate barrel export (index.ts)
   * Exports all generated blocks from the spec
   */
  private async generateBarrelExport(
    specId: string,
    blocks: BlockData[]
  ): Promise<void> {
    const slug = slugifySpecId(specId);
    const indexPath = join('specs', `${slug}.spec.dir`, 'src', 'index.ts');
    
    // Generate exports
    const exports = blocks
      .map(block => `export * from './${block.id}';`)
      .join('\n');
    
    const content = `// SPECLANG-GENERATED: barrel export
// Source: ${specId}
// DO NOT EDIT MANUALLY

${exports}
`;
    
    await writeFile(indexPath, content, 'utf-8');
  }
}