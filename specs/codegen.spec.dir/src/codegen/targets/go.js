"use strict";
/**
 * SPECLANG-GENERATED: Go target generator
 * Source: @speclang/codegen @block:go-generator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoGenerator = void 0;
const mapper_1 = require("../mapper");
const templates_1 = require("../templates");
// ============================================================================
// GO GENERATOR
// ============================================================================
class GoGenerator {
    language = 'go';
    extension = '.go';
    /** Generate code from spec */
    generate(spec) {
        const files = [];
        const codeBlocks = spec.blocks.filter(b => b.kind === 'code' || b.content);
        if (codeBlocks.length > 0) {
            const content = this.generateFromBlocks(spec, codeBlocks);
            const outputPath = this.getOutputPath(spec);
            files.push({
                path: outputPath,
                content,
                sourceBlock: codeBlocks.map(b => b.id).join(', '),
                language: 'go',
            });
        }
        else {
            for (const block of spec.blocks) {
                const file = this.generateBlock(spec, block);
                if (file) {
                    files.push(file);
                }
            }
        }
        if (files.length === 0) {
            files.push(this.generatePlaceholder(spec));
        }
        return files;
    }
    /** Generate from code blocks */
    generateFromBlocks(spec, blocks) {
        const header = this.fileHeader(spec);
        const parts = [header, '', 'package main', ''];
        // Add imports
        if (spec.imports.length > 0) {
            parts.push('import (');
            for (const imp of spec.imports) {
                parts.push(`  "${imp}"`);
            }
            parts.push(')', '');
        }
        // Add each block's content
        for (const block of blocks) {
            parts.push(`// Block: ${block.id}`);
            parts.push(this.convertToGo(block.content));
            parts.push('');
        }
        parts.push(this.fileFooter(spec));
        return parts.join('\n');
    }
    /** Convert TypeScript-like content to Go */
    convertToGo(content) {
        let result = content;
        // Convert interface to struct
        result = result.replace(/interface\s+(\w+)/g, 'type $1 struct');
        result = result.replace(/(\w+)(\??):\s*(\w+)/g, this.goFieldMapper.bind(this));
        // Convert function to func
        result = result.replace(/function\s+(\w+)/g, 'func $1');
        result = result.replace(/async\s+/g, '');
        // Convert types
        result = result.replace(/\bstring\b/g, 'string');
        result = result.replace(/\bnumber\b/g, 'int');
        result = result.replace(/\bboolean\b/g, 'bool');
        result = result.replace(/\bany\b/g, 'interface{}');
        result = result.replace(/\bDate\b/g, 'time.Time');
        result = result.replace(/\bArray<(\w+)>/g, '[]$1');
        result = result.replace(/\bRecord<(\w+),\s*(\w+)>/g, 'map[$1]$2');
        return result;
    }
    /** Map field to Go format */
    goFieldMapper(_match, _p1, _p2, _p3) {
        // Simplified field mapping
        return 'Field string `json:"field"`';
    }
    /** Generate a single block */
    generateBlock(spec, block) {
        let content = '';
        const outputPath = this.getBlockOutputPath(spec, block);
        switch (block.kind) {
            case 'struct':
                content = this.generateStruct(spec, block);
                break;
            case 'function':
                content = this.generateFunc(spec, block);
                break;
            case 'interface':
                content = this.generateInterface(spec, block);
                break;
            case 'entity':
                content = this.generateStruct(spec, block);
                break;
            case 'operation':
                content = this.generateFunc(spec, block);
                break;
            default:
                content = this.convertToGo(block.content);
        }
        return {
            path: outputPath,
            content,
            sourceBlock: block.id,
            language: 'go',
        };
    }
    /** Generate struct from block */
    generateStruct(_spec, block) {
        const template = (0, templates_1.getTemplate)('go', 'struct');
        if (!template)
            return block.content;
        const nameMatch = block.content.match(/struct\s+(\w+)|type\s+(\w+)\s+struct/);
        const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : block.id.split('/').pop() || 'Unknown';
        return (0, templates_1.renderTemplate)(template.content, {
            name,
            fields: '  // fields',
        });
    }
    /** Generate function from block */
    generateFunc(_spec, block) {
        const template = (0, templates_1.getTemplate)('go', 'func');
        if (!template)
            return block.content;
        const funcMatch = block.content.match(/func(?:tion)?\s+(\w+)/);
        const name = funcMatch ? funcMatch[1] : block.id.split('/').pop() || 'unknown';
        return (0, templates_1.renderTemplate)(template.content, {
            name,
            params: '',
            return: '',
            body: '  // TODO: implement',
        });
    }
    /** Generate interface from block */
    generateInterface(_spec, block) {
        const template = (0, templates_1.getTemplate)('go', 'interface');
        if (!template)
            return block.content;
        const nameMatch = block.content.match(/interface\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return (0, templates_1.renderTemplate)(template.content, {
            name,
            methods: '  // methods',
        });
    }
    /** Generate placeholder file */
    generatePlaceholder(spec) {
        return {
            path: this.getOutputPath(spec),
            content: `${this.fileHeader(spec)}\n\npackage main\n\n// No code blocks found in spec\n`,
            sourceBlock: 'placeholder',
            language: 'go',
        };
    }
    /** Get output file path */
    getOutputPath(spec) {
        const basePath = spec.target.outputPath || 'src/generated';
        const specId = spec.header.id.replace(/[@/]/g, '-');
        return `${basePath}/${specId}.go`;
    }
    /** Get output path for a block */
    getBlockOutputPath(spec, block) {
        const basePath = spec.target.outputPath || 'src/generated';
        const blockName = block.id.replace(/[@/]/g, '-');
        return `${basePath}/${blockName}.go`;
    }
    /** Map stdlib type to Go */
    mapType(stdlibType) {
        return (0, mapper_1.mapType)(stdlibType, 'go');
    }
    /** Format imports for Go */
    formatImports(imports) {
        if (imports.length === 0)
            return '';
        if (imports.length === 1) {
            return `import "${imports[0]}"`;
        }
        const lines = ['import ('];
        for (const imp of imports) {
            lines.push(`  "${imp}"`);
        }
        lines.push(')');
        return lines.join('\n');
    }
    /** Generate file header */
    fileHeader(spec) {
        return (0, templates_1.createFileHeader)(spec, 'speclang-go-generator');
    }
    /** Generate file footer */
    fileFooter(_spec) {
        return (0, templates_1.createFileFooter)(_spec);
    }
}
exports.GoGenerator = GoGenerator;
//# sourceMappingURL=go.js.map