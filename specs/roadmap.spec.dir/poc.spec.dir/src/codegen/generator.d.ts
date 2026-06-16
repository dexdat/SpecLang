/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/code-generator.spec.md
 * Generated: 2026-03-03T05:25:00.000Z
 *
 * Edit the spec, not this file.
 */
import { TemplateRegistry } from './template-registry';
import { BlockData, GeneratedFile, SpecHeader } from '../types/poc';
/**
 * Code generator orchestrator
 * Coordinates templates, file I/O, and symlink creation
 */
export declare class CodeGenerator {
    private registry;
    private outputDir;
    constructor(options: {
        registry: TemplateRegistry;
        outputDir?: string;
    });
    /**
     * Generate code for a single block
     * @param specId - Full spec ID (e.g., "@examples/greeting")
     * @param header - Parsed spec header
     * @param block - Parsed block data
     * @returns Generated file metadata
     */
    generate(specId: string, header: SpecHeader, block: BlockData): Promise<GeneratedFile>;
    /**
     * Generate code for all blocks in a spec
     * @param specId - Full spec ID
     * @param header - Parsed spec header
     * @param blocks - Array of parsed blocks
     * @returns Array of generated files
     */
    generateAll(specId: string, header: SpecHeader, blocks: BlockData[]): Promise<GeneratedFile[]>;
    /**
     * Add SPECLANG-GENERATED header to code
     */
    private addFileHeader;
    /**
     * Resolve output file path
     * Pattern: specs/{slug}.spec.dir/src/{blockId}.ts
     */
    private resolveOutputPath;
    /**
     * Create or update symlink
     * Source: specs/{slug}.spec.dir/src
     * Target: src/{slug}
     */
    private createSymlink;
    /**
     * Validate symlink target for security
     * - Ensures source directory exists and is within project
     * - Ensures link path is within output directory
     * - Prevents path traversal attacks
     */
    private validateSymlinkTarget;
    /**
     * Sync directory contents (Windows fallback)
     * Handles incremental updates: adds new files, updates modified, removes deleted
     */
    private syncDirectory;
    /**
     * Generate barrel export (index.ts)
     * Exports all generated blocks from the spec
     */
    private generateBarrelExport;
}
//# sourceMappingURL=generator.d.ts.map