"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/code-generator.spec.md
 * Generated: 2026-03-03T05:25:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerator = void 0;
const poc_1 = require("../types/poc");
const path_utils_1 = require("../utils/path-utils");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
const crypto_1 = require("crypto");
/**
 * Code generator orchestrator
 * Coordinates templates, file I/O, and symlink creation
 */
class CodeGenerator {
    registry;
    outputDir;
    constructor(options) {
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
    async generate(specId, header, block) {
        // 1. Check if template exists for block kind
        if (!this.registry.has(block.kind)) {
            throw new poc_1.POCError('TEMPLATE_ERROR', `No template registered for block kind "${block.kind}". ` +
                `Available kinds: ${Array.from(this.registry.getAll().keys()).join(', ')}`, this.resolveOutputPath(specId, block.id));
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
        await (0, promises_1.mkdir)((0, path_1.dirname)(outputPath), { recursive: true });
        // 7. Write file
        await (0, promises_1.writeFile)(outputPath, fullCode, 'utf-8');
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
    async generateAll(specId, header, blocks) {
        const generated = [];
        for (const block of blocks) {
            try {
                const file = await this.generate(specId, header, block);
                generated.push(file);
            }
            catch (error) {
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
    addFileHeader(code, specId, block, header) {
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
    resolveOutputPath(specId, blockId) {
        const slug = (0, path_utils_1.slugifySpecId)(specId);
        return (0, path_1.join)('specs', `${slug}.spec.dir`, 'src', `${blockId}.ts`);
    }
    /**
     * Create or update symlink
     * Source: specs/{slug}.spec.dir/src
     * Target: src/{slug}
     */
    async createSymlink(specId) {
        const slug = (0, path_utils_1.slugifySpecId)(specId);
        const linkPath = (0, path_1.join)(this.outputDir, slug);
        const sourceDir = (0, path_1.join)('specs', `${slug}.spec.dir`, 'src');
        // SECURITY: Validate symlink target before creation
        await this.validateSymlinkTarget(linkPath, sourceDir);
        // Calculate relative path from link location to source
        const targetPath = (0, path_1.relative)((0, path_1.dirname)(linkPath), sourceDir);
        // Remove existing symlink if present
        try {
            await (0, promises_1.unlink)(linkPath);
        }
        catch {
            // File might not exist
        }
        // Platform-specific symlink
        const isWindows = (0, os_1.platform)() === 'win32';
        if (isWindows) {
            try {
                await (0, promises_1.symlink)(targetPath, linkPath, 'junction');
            }
            catch (error) {
                // Fallback: sync directory contents
                console.log(`[CodeGenerator] Symlink failed on Windows, using directory sync`);
                await this.syncDirectory(sourceDir, linkPath);
            }
        }
        else {
            await (0, promises_1.symlink)(targetPath, linkPath);
        }
    }
    /**
     * Validate symlink target for security
     * - Ensures source directory exists and is within project
     * - Ensures link path is within output directory
     * - Prevents path traversal attacks
     */
    async validateSymlinkTarget(linkPath, sourceDir) {
        // Resolve absolute paths
        const absLinkPath = (0, path_1.resolve)(linkPath);
        const absSourceDir = (0, path_1.resolve)(sourceDir);
        // SECURITY: Resolve symlinks to prevent symlink attacks
        const realSourceDir = await (0, promises_1.realpath)(absSourceDir).catch(() => absSourceDir);
        // Project root: directory containing specs/ and src/
        const projectRoot = (0, path_1.resolve)(process.cwd());
        // Ensure source directory is within project
        const sourceRelative = (0, path_1.relative)(projectRoot, realSourceDir);
        if (sourceRelative.startsWith('..') || sourceRelative.includes(':')) {
            throw new poc_1.POCError('SYMLINK_ERROR', `Symlink source "${sourceDir}" is outside project directory`, linkPath);
        }
        // Ensure link path is within output directory (should be, but double-check)
        const linkRelative = (0, path_1.relative)((0, path_1.resolve)(this.outputDir), absLinkPath);
        if (linkRelative.startsWith('..') || linkRelative.includes(':')) {
            throw new poc_1.POCError('SYMLINK_ERROR', `Symlink path "${linkPath}" is outside output directory`, linkPath);
        }
        // Verify source directory exists and is accessible
        try {
            await (0, promises_1.access)(realSourceDir, promises_1.constants.R_OK);
        }
        catch {
            throw new poc_1.POCError('SYMLINK_ERROR', `Source directory "${sourceDir}" does not exist or is not readable`, linkPath);
        }
    }
    /**
     * Sync directory contents (Windows fallback)
     * Handles incremental updates: adds new files, updates modified, removes deleted
     */
    async syncDirectory(source, dest) {
        // Create temporary directory for atomic copy
        const tempDir = (0, path_1.join)((0, path_1.dirname)(dest), `.tmp-${(0, crypto_1.randomBytes)(8).toString('hex')}`);
        try {
            // Copy all files from source to temp directory
            await (0, promises_1.mkdir)(tempDir, { recursive: true });
            const sourceFiles = await (0, promises_1.readdir)(source);
            for (const file of sourceFiles) {
                const srcPath = (0, path_1.join)(source, file);
                const destPath = (0, path_1.join)(tempDir, file);
                await (0, promises_1.copyFile)(srcPath, destPath);
            }
            // Atomic swap: remove old dest, rename temp to dest
            try {
                await (0, promises_1.rm)(dest, { recursive: true, force: true });
            }
            catch {
                // dest may not exist
            }
            await (0, promises_1.rename)(tempDir, dest);
        }
        finally {
            // Clean up temp directory if rename failed
            try {
                await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
            }
            catch {
                // ignore cleanup errors
            }
        }
    }
    /**
     * Generate barrel export (index.ts)
     * Exports all generated blocks from the spec
     */
    async generateBarrelExport(specId, blocks) {
        const slug = (0, path_utils_1.slugifySpecId)(specId);
        const indexPath = (0, path_1.join)('specs', `${slug}.spec.dir`, 'src', 'index.ts');
        // Generate exports
        const exports = blocks
            .map(block => `export * from './${block.id}';`)
            .join('\n');
        const content = `// SPECLANG-GENERATED: barrel export
// Source: ${specId}
// DO NOT EDIT MANUALLY

${exports}
`;
        await (0, promises_1.writeFile)(indexPath, content, 'utf-8');
    }
}
exports.CodeGenerator = CodeGenerator;
//# sourceMappingURL=generator.js.map