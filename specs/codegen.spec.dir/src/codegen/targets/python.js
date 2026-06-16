"use strict";
/**
 * SPECLANG-GENERATED: Python target generator
 * Source: @speclang/codegen @block:python-generator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonGenerator = void 0;
const mapper_1 = require("../mapper");
const templates_1 = require("../templates");
// ============================================================================
// PYTHON GENERATOR
// ============================================================================
class PythonGenerator {
    language = 'python';
    extension = '.py';
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
                language: 'python',
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
        const parts = [header, ''];
        // Add imports
        if (spec.imports.length > 0) {
            for (const imp of spec.imports) {
                parts.push(`from ${imp} import *`);
            }
            parts.push('');
        }
        // Add each block's content
        for (const block of blocks) {
            parts.push(`# Block: ${block.id}`);
            parts.push(this.convertToPython(block.content));
            parts.push('');
        }
        parts.push(this.fileFooter(spec));
        return parts.join('\n');
    }
    /** Convert TypeScript-like content to Python */
    convertToPython(content) {
        let result = content;
        // Convert interface to dataclass
        result = result.replace(/interface\s+(\w+)/g, '@dataclass\nclass $1:');
        // Convert class
        result = result.replace(/class\s+(\w+)(?:\s*extends\s+(\w+))?/g, 'class $1:');
        // Convert function
        result = result.replace(/(?:async\s+)?function\s+(\w+)/g, 'def $1:');
        result = result.replace(/async\s+def/g, 'async def');
        // Convert types in annotations
        result = result.replace(/:\s*string\b/g, ': str');
        result = result.replace(/:\s*number\b/g, ': int');
        result = result.replace(/:\s*boolean\b/g, ': bool');
        result = result.replace(/:\s*any\b/g, ': Any');
        result = result.replace(/:\s*Date\b/g, ': datetime');
        result = result.replace(/:\s*(\w+)\[\]/g, ': List[$1]');
        result = result.replace(/:\s*Record<(\w+),\s*(\w+)>/g, ': Dict[$1, $2]');
        // Convert arrow return type
        result = result.replace(/\)\s*:\s*(\w+)/g, ') -> $1:');
        // Convert export
        result = result.replace(/export\s+/g, '');
        return result;
    }
    /** Generate a single block */
    generateBlock(spec, block) {
        let content = '';
        const outputPath = this.getBlockOutputPath(spec, block);
        switch (block.kind) {
            case 'class':
                content = this.generateClass(spec, block);
                break;
            case 'function':
                content = this.generateFunction(spec, block);
                break;
            case 'type':
                content = this.generateTypeAlias(spec, block);
                break;
            case 'entity':
                content = this.generateDataclass(spec, block);
                break;
            case 'operation':
                content = this.generateFunction(spec, block);
                break;
            default:
                content = this.convertToPython(block.content);
        }
        return {
            path: outputPath,
            content,
            sourceBlock: block.id,
            language: 'python',
        };
    }
    /** Generate class from block */
    generateClass(_spec, block) {
        const template = (0, templates_1.getTemplate)('python', 'class');
        if (!template)
            return block.content;
        const classMatch = block.content.match(/class\s+(\w+)/);
        const name = classMatch ? classMatch[1] : block.id.split('/').pop() || 'Unknown';
        return (0, templates_1.renderTemplate)(template.content, {
            name,
            body: '    pass',
        });
    }
    /** Generate function from block */
    generateFunction(_spec, block) {
        const template = (0, templates_1.getTemplate)('python', 'function');
        if (!template)
            return block.content;
        const funcMatch = block.content.match(/def\s+(\w+)/);
        const name = funcMatch ? funcMatch[1] : block.id.split('/').pop() || 'unknown';
        return (0, templates_1.renderTemplate)(template.content, {
            name,
            params: '',
            return: 'None',
            body: '    pass',
        });
    }
    /** Generate dataclass from block */
    generateDataclass(_spec, block) {
        const template = (0, templates_1.getTemplate)('python', 'dataclass');
        if (!template)
            return this.convertToPython(block.content);
        const classMatch = block.content.match(/class\s+(\w+)/);
        const name = classMatch ? classMatch[1] : block.id.split('/').pop() || 'Unknown';
        return (0, templates_1.renderTemplate)(template.content, {
            name,
            fields: '    pass',
        });
    }
    /** Generate type alias */
    generateTypeAlias(_spec, block) {
        const typeMatch = block.content.match(/type\s+(\w+)\s*=\s*(.+)/);
        if (!typeMatch)
            return this.convertToPython(block.content);
        return `# Type alias: ${typeMatch[1]} = ${typeMatch[2]}`;
    }
    /** Generate placeholder file */
    generatePlaceholder(spec) {
        return {
            path: this.getOutputPath(spec),
            content: `${this.fileHeader(spec)}\n\n# No code blocks found in spec\n`,
            sourceBlock: 'placeholder',
            language: 'python',
        };
    }
    /** Get output file path */
    getOutputPath(spec) {
        const basePath = spec.target.outputPath || 'src/generated';
        const specId = spec.header.id.replace(/[@/]/g, '-');
        return `${basePath}/${specId}.py`;
    }
    /** Get output path for a block */
    getBlockOutputPath(spec, block) {
        const basePath = spec.target.outputPath || 'src/generated';
        const blockName = block.id.replace(/[@/]/g, '-');
        return `${basePath}/${blockName}.py`;
    }
    /** Map stdlib type to Python */
    mapType(stdlibType) {
        return (0, mapper_1.mapType)(stdlibType, 'python');
    }
    /** Format imports for Python */
    formatImports(imports) {
        return imports.map(i => `from ${i} import *`).join('\n');
    }
    /** Generate file header */
    fileHeader(spec) {
        return (0, templates_1.createFileHeader)(spec, 'speclang-python-generator');
    }
    /** Generate file footer */
    fileFooter(_spec) {
        return (0, templates_1.createFileFooter)(_spec);
    }
}
exports.PythonGenerator = PythonGenerator;
//# sourceMappingURL=python.js.map