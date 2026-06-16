/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/simple-agent.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */

import { FileEvent, ParsedSpec, SpecHeader, BlockData, GeneratedFile, POCError } from '../types/poc';
import { BlockParser } from '../parser/block-parser';
import { CodeGenerator } from '../codegen/generator';
import { slugifySpecId } from '../utils/path-utils';
import { symlink, unlink, mkdir, cp } from 'fs/promises';
import { platform } from 'os';
import { TemplateRegistry } from '../codegen/template-registry';

/**
 * Simple Agent for POC
 * Single agent that converts spec changes to code
 * Simplified for POC - no multi-agent coordination needed
 */
export class SimpleAgent {
  private parser: BlockParser;
  private generator: CodeGenerator;
  
  constructor() {
    this.parser = new BlockParser();
    // Initialize code generator with default registry
    const registry = new TemplateRegistry();
    this.generator = new CodeGenerator({ registry });
  }
  
  /**
   * Handle file change event
   * Processes spec file and generates code
   * @param event - File change event
   */
  async onFileChanged(event: FileEvent): Promise<void> {
    console.log(`[SimpleAgent] Processing: ${event.path}`);
    
    // 1. Parse spec to get ID
    let spec: ParsedSpec;
    try {
      spec = await this.parser.parseFile(event.path);
    } catch (error) {
      console.error(`[SimpleAgent] Failed to parse ${event.path}:`, error);
      throw error;
    }

    const specSlug = slugifySpecId(spec.id);
    
    try {
      await this.processSpec(spec, specSlug, event.path);
    } catch (error) {
      console.error(`[SimpleAgent] Error processing ${event.path}:`, error);
      throw error;
    }
  }
  
  /**
   * Process a spec
   * @param spec - Parsed spec
   * @param specSlug - Filesystem-safe slug
   * @param filePath - Original file path
   */
  private async processSpec(spec: ParsedSpec, specSlug: string, filePath: string): Promise<void> {
    try {
      // 1. Generate code for each block
      const generatedFiles: string[] = [];
      const errors: Array<{ blockId: string; error: Error }> = [];
      
      // Build header from spec
      const header: SpecHeader = {
        id: spec.id,
        version: spec.version,
        layer: 0, // Default layer
        short: spec.short || '',
        tags: [],
        lineCount: spec.headerLines.length,
        rawHeader: spec.headerLines.join('\n')
      };

      for (const block of spec.blocks) {
        try {
          const blockData: BlockData = {
            id: block.id,
            kind: block.kind,
            description: block.description,
            parameters: block.parameters,
            properties: block.properties,
            returns: block.returns,
            examples: block.examples,
            rawContent: block.rawContent
          };
          const generatedFile = await this.generator.generate(spec.id, header, blockData);
          generatedFiles.push(generatedFile.path);
        } catch (error) {
          console.error(`[SimpleAgent] Failed to generate ${block.id}:`, error);
          errors.push({ blockId: block.id, error: error as Error });
        }
      }
      
      // 2. Create/update symlinks
      await this.updateSymlinks(specSlug);
      
      // 3. Report results
      if (errors.length > 0) {
        console.warn(`⚠️  Generated ${generatedFiles.length} files, ${errors.length} failed for ${spec.id}`);
        // Throw combined error
        const errorMessages = errors.map(e => `${e.blockId}: ${e.error.message}`).join(', ');
        throw new Error(`Failed to generate ${errors.length} blocks: ${errorMessages}`);
      } else {
        console.log(`✅ Generated ${generatedFiles.length} files for ${spec.id}`);
      }
    } catch (error) {
      console.error(`[SimpleAgent] Error processing ${filePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Create or update symlinks
   * Falls back to copy on Windows if symlinks fail
   * @param specSlug - Filesystem-safe slug
   */
  private async updateSymlinks(specSlug: string): Promise<void> {
    const srcPath = `src/${specSlug}`;
    const targetPath = `../specs/${specSlug}.spec.dir/src`;
    
    // Remove existing if present
    try { 
      await unlink(srcPath); 
    } catch { 
      // File might not exist, ignore
    }
    
    // Check platform for Windows
    const isWindows = platform() === 'win32';
    
    if (isWindows) {
      // On Windows, try symlink but fallback to copy if needed
      try {
        await symlink(targetPath, srcPath, 'junction');
      } catch (error) {
        console.log(`[SimpleAgent] Symlink failed on Windows, using copy instead`);
        // Windows fallback: copy files instead of symlink
        await this.copyDirectory(`specs/${specSlug}.spec.dir/src`, srcPath);
      }
    } else {
      // Unix/Mac: standard symlink
      await symlink(targetPath, srcPath);
    }
  }
  
  /**
   * Copy directory contents recursively (Windows fallback)
   * @param source - Source directory path
   * @param destination - Destination directory path
   */
  private async copyDirectory(source: string, destination: string): Promise<void> {
    // Use recursive copy (Node 16+)
    await cp(source, destination, { recursive: true, force: true });
  }
}
