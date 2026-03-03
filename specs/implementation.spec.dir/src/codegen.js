"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerator = exports.PythonCodeGenerator = exports.TypeScriptCodeGenerator = exports.GoCodeGenerator = exports.SpecParser = void 0;
#;
speclang - header;
lines: 3;
#;
target: src / codegen.ts;
// speclang-header lines:20
// id: @generated/codegen-tools
// target: typescript
// produces: codegen.ts
// layer: 10
// refs: [@ref:specs/compiler]
// ---
// @block:codegen/main @kind:code
/**
 * Code Generation Tools
 *
 * Generate code from spec files (.go.spec, .ts.spec, etc.)
 *
 * Location: codegen.ts
 * Version: 0.1.0
 *
 * Generated from @ref:specs/compiler
 */
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
// ============================================================================
// Spec Parser
// ============================================================================
class SpecParser {
    static async parseSpec(filePath) {
        const content = await promises_1.default.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        // Parse header
        // Find speclang-header line (could be at index 0 or 1)
        let headerLineIndex = -1;
        for (let i = 0; i < Math.min(lines.length, 3); i++) {
            if (lines[i].includes('speclang-header')) {
                headerLineIndex = i;
                break;
            }
        }
        if (headerLineIndex === -1) {
            throw new Error('Invalid spec header');
        }
        const headerMatch = lines[headerLineIndex].match(/speclang-header lines:(\d+)/);
        if (!headerMatch) {
            throw new Error('Missing line count in header');
        }
        const headerLines = parseInt(headerMatch[1], 10);
        const headerContent = lines.slice(headerLineIndex, headerLines).join('\n');
        const yamlEnd = headerContent.indexOf('---');
        if (yamlEnd === -1) {
            throw new Error('Missing YAML separator');
        }
        const yamlText = headerContent.substring(0, yamlEnd);
        const metadata = yaml_1.default.parse(yamlText);
        // Parse blocks
        const blocks = [];
        let currentBlock = null;
        let inCodeBlock = false;
        let codeBlockContent = [];
        for (let i = headerLines; i < lines.length; i++) {
            const line = lines[i];
            // Look for block start
            const blockMatch = line.match(/^# @block:([^\s]+) @kind:([^\s]+)/);
            if (blockMatch) {
                // Save previous block
                if (currentBlock) {
                    blocks.push({
                        id: currentBlock.id,
                        kind: currentBlock.kind,
                        language: currentBlock.language,
                        content: codeBlockContent.join('\n'),
                    });
                }
                currentBlock = {
                    id: blockMatch[1],
                    kind: blockMatch[2],
                };
                codeBlockContent = [];
                inCodeBlock = false;
                continue;
            }
            // Look for code block start ```
            if (line.trim().startsWith('```')) {
                if (!inCodeBlock) {
                    const language = line.trim().slice(3).trim() || undefined;
                    currentBlock.language = language;
                    inCodeBlock = true;
                }
                else {
                    inCodeBlock = false;
                }
                continue;
            }
            // Collect content
            if (currentBlock && inCodeBlock) {
                codeBlockContent.push(line);
            }
        }
        // Add last block
        if (currentBlock && codeBlockContent.length > 0) {
            blocks.push({
                id: currentBlock.id,
                kind: currentBlock.kind,
                language: currentBlock.language,
                content: codeBlockContent.join('\n'),
            });
        }
        return {
            id: metadata.id,
            target: metadata.target,
            produces: metadata.produces,
            layer: metadata.layer,
            refs: metadata.refs || [],
            blocks,
        };
    }
}
exports.SpecParser = SpecParser;
// ============================================================================
// Code Generators
// ============================================================================
class GoCodeGenerator {
    static generate(block) {
        if (block.kind !== 'code') {
            return `// ${block.id} - ${block.kind}\n`;
        }
        // Add SPECLANG-ID comment if reference exists
        const specLangId = block.id.startsWith('@') ? block.id : `@ref:${block.id}`;
        return `// SPECLANG-ID: ${specLangId}\n${block.content}\n`;
    }
}
exports.GoCodeGenerator = GoCodeGenerator;
class TypeScriptCodeGenerator {
    static generate(block) {
        if (block.kind !== 'code') {
            return `// ${block.id} - ${block.kind}\n`;
        }
        const specLangId = block.id.startsWith('@') ? block.id : `@ref:${block.id}`;
        return `// SPECLANG-ID: ${specLangId}\n${block.content}\n`;
    }
}
exports.TypeScriptCodeGenerator = TypeScriptCodeGenerator;
class PythonCodeGenerator {
    static generate(block) {
        if (block.kind !== 'code') {
            return `# ${block.id} - ${block.kind}\n`;
        }
        const specLangId = block.id.startsWith('@') ? block.id : `@ref:${block.id}`;
        return `# SPECLANG-ID: ${specLangId}\n${block.content}\n`;
    }
}
exports.PythonCodeGenerator = PythonCodeGenerator;
// ============================================================================
// Main Code Generator
// ============================================================================
class CodeGenerator {
    static async generateFromSpec(specFilePath) {
        console.log(`Generating from spec: ${specFilePath}`);
        const errors = [];
        const warnings = [];
        try {
            const spec = await SpecParser.parseSpec(specFilePath);
            console.log(`Parsed spec: target=${spec.target}, produces=${spec.produces}`);
            // Select generator based on target
            let generator;
            switch (spec.target) {
                case 'go':
                    generator = GoCodeGenerator.generate;
                    break;
                case 'typescript':
                case 'javascript':
                    generator = TypeScriptCodeGenerator.generate;
                    break;
                case 'python':
                    generator = PythonCodeGenerator.generate;
                    break;
                default:
                    throw new Error(`Unsupported target language: ${spec.target}`);
            }
            // Generate code from blocks
            const generatedCode = spec.blocks
                .map(block => generator(block))
                .join('\n');
            // Ensure output directory exists
            const outputDir = path_1.default.dirname(spec.produces);
            await promises_1.default.mkdir(outputDir, { recursive: true });
            // Write generated code
            await promises_1.default.writeFile(spec.produces, generatedCode, 'utf-8');
            return {
                success: true,
                outputPath: spec.produces,
                generatedCode,
                errors,
                warnings,
            };
        }
        catch (error) {
            errors.push(error.message);
            return {
                success: false,
                outputPath: '',
                generatedCode: '',
                errors,
                warnings,
            };
        }
    }
    static async generateAll(specDir = 'specs') {
        const results = [];
        // Find all .spec files with target extensions
        const specFiles = await this.findSpecFiles(specDir);
        for (const file of specFiles) {
            const result = await this.generateFromSpec(file);
            results.push(result);
        }
        return results;
    }
    static async findSpecFiles(dir) {
        const files = [];
        async function walk(currentPath) {
            const entries = await promises_1.default.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    await walk(fullPath);
                }
                else if (entry.name.match(/\.(go|ts|py|rs|js)\.spec$/)) {
                    files.push(fullPath);
                }
            }
        }
        await walk(dir);
        return files;
    }
}
exports.CodeGenerator = CodeGenerator;
// ============================================================================
// CLI Interface (optional)
// ============================================================================
if (require.main === module) {
    const args = process.argv.slice(2);
    async function main() {
        if (args.length === 0) {
            console.log('Usage: ts-node codegen.ts <spec-file>');
            console.log('       ts-node codegen.ts --all');
            process.exit(1);
        }
        if (args[0] === '--all') {
            const results = await CodeGenerator.generateAll();
            let success = 0;
            let failure = 0;
            for (const result of results) {
                if (result.success) {
                    success++;
                    console.log(`✓ Generated: ${result.outputPath}`);
                }
                else {
                    failure++;
                    console.log(`✗ Failed: ${result.errors.join(', ')}`);
                }
            }
            console.log(`\nSummary: ${success} succeeded, ${failure} failed`);
            process.exit(failure > 0 ? 1 : 0);
        }
        else {
            const result = await CodeGenerator.generateFromSpec(args[0]);
            if (result.success) {
                console.log(`✓ Generated: ${result.outputPath}`);
                process.exit(0);
            }
            else {
                console.log(`✗ Failed: ${result.errors.join(', ')}`);
                process.exit(1);
            }
        }
    }
    main().catch(console.error);
}
//# sourceMappingURL=codegen.js.map