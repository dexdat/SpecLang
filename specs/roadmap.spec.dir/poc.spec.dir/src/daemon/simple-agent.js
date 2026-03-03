"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/simple-agent.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAgent = void 0;
const block_parser_1 = require("../parser/block-parser");
const generator_1 = require("../codegen/generator");
const path_utils_1 = require("../utils/path-utils");
const promises_1 = require("fs/promises");
const os_1 = require("os");
const template_registry_1 = require("../codegen/template-registry");
/**
 * Simple Agent for POC
 * Single agent that converts spec changes to code
 * Simplified for POC - no multi-agent coordination needed
 */
class SimpleAgent {
    parser;
    generator;
    constructor() {
        this.parser = new block_parser_1.BlockParser();
        // Initialize code generator with default registry
        const registry = new template_registry_1.TemplateRegistry();
        this.generator = new generator_1.CodeGenerator({ registry });
    }
    /**
     * Handle file change event
     * Processes spec file and generates code
     * @param event - File change event
     */
    async onFileChanged(event) {
        console.log(`[SimpleAgent] Processing: ${event.path}`);
        // 1. Parse spec to get ID
        let spec;
        try {
            spec = await this.parser.parseFile(event.path);
        }
        catch (error) {
            console.error(`[SimpleAgent] Failed to parse ${event.path}:`, error);
            throw error;
        }
        const specSlug = (0, path_utils_1.slugifySpecId)(spec.id);
        try {
            await this.processSpec(spec, specSlug, event.path);
        }
        catch (error) {
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
    async processSpec(spec, specSlug, filePath) {
        try {
            // 1. Generate code for each block
            const generatedFiles = [];
            const errors = [];
            // Build header from spec
            const header = {
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
                    const blockData = {
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
                }
                catch (error) {
                    console.error(`[SimpleAgent] Failed to generate ${block.id}:`, error);
                    errors.push({ blockId: block.id, error: error });
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
            }
            else {
                console.log(`✅ Generated ${generatedFiles.length} files for ${spec.id}`);
            }
        }
        catch (error) {
            console.error(`[SimpleAgent] Error processing ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Create or update symlinks
     * Falls back to copy on Windows if symlinks fail
     * @param specSlug - Filesystem-safe slug
     */
    async updateSymlinks(specSlug) {
        const srcPath = `src/${specSlug}`;
        const targetPath = `../specs/${specSlug}.spec.dir/src`;
        // Remove existing if present
        try {
            await (0, promises_1.unlink)(srcPath);
        }
        catch {
            // File might not exist, ignore
        }
        // Check platform for Windows
        const isWindows = (0, os_1.platform)() === 'win32';
        if (isWindows) {
            // On Windows, try symlink but fallback to copy if needed
            try {
                await (0, promises_1.symlink)(targetPath, srcPath, 'junction');
            }
            catch (error) {
                console.log(`[SimpleAgent] Symlink failed on Windows, using copy instead`);
                // Windows fallback: copy files instead of symlink
                await this.copyDirectory(`specs/${specSlug}.spec.dir/src`, srcPath);
            }
        }
        else {
            // Unix/Mac: standard symlink
            await (0, promises_1.symlink)(targetPath, srcPath);
        }
    }
    /**
     * Copy directory contents recursively (Windows fallback)
     * @param source - Source directory path
     * @param destination - Destination directory path
     */
    async copyDirectory(source, destination) {
        // Use recursive copy (Node 16+)
        await (0, promises_1.cp)(source, destination, { recursive: true, force: true });
    }
}
exports.SimpleAgent = SimpleAgent;
//# sourceMappingURL=simple-agent.js.map