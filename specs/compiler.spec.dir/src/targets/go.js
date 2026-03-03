"use strict";
/**
 * SPECLANG-GENERATED: Go target generator
 * Source: @speclang/compiler.spec.dir/go
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoGenerator = void 0;
exports.createGoGenerator = createGoGenerator;
const types_1 = require("../go/types");
const templates_1 = require("../go/templates");
const builtins_1 = require("../go/builtins");
class GoGenerator {
    language = 'go';
    extension = '.go';
    imports = new Set();
    config;
    constructor(config = {}) {
        this.config = {
            addJsonTags: true,
            addGormTags: false,
            ...config,
        };
    }
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
    generateFromBlocks(spec, blocks) {
        const header = this.fileHeader(spec.header.id, spec.target.outputPath || 'main');
        const parts = [header];
        const imports = this.formatImports();
        if (imports) {
            parts.push(imports);
            parts.push('');
        }
        for (const block of blocks) {
            parts.push(`// Block: ${block.id}`);
            parts.push(block.content);
            parts.push('');
        }
        parts.push(this.fileFooter());
        return parts.join('\n');
    }
    generateBlock(spec, block) {
        let content = '';
        const outputPath = this.getBlockOutputPath(spec, block);
        switch (block.kind) {
            case 'struct':
            case 'entity':
                content = this.generateStructFromBlock(block);
                break;
            case 'interface':
                content = this.generateInterfaceFromBlock(block);
                break;
            case 'function':
            case 'operation':
                content = this.generateFunctionFromBlock(block);
                break;
            case 'enum':
                content = this.generateEnumFromBlock(block);
                break;
            default:
                content = block.content;
        }
        return {
            path: outputPath,
            content,
            sourceBlock: block.id,
            language: 'go',
        };
    }
    generateStructFromBlock(block) {
        const nameMatch = block.content.match(/type\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `type ${name} struct {\n  // TODO: add fields\n}\n`;
    }
    generateInterfaceFromBlock(block) {
        const nameMatch = block.content.match(/type\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `type ${name} interface {\n  // TODO: add methods\n}\n`;
    }
    generateFunctionFromBlock(block) {
        const nameMatch = block.content.match(/func(?:tion)?\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `func ${name}() {\n  // TODO: implement\n}\n`;
    }
    generateEnumFromBlock(block) {
        const nameMatch = block.content.match(/type\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `type ${name} int\n\nconst (\n  ${name}Unknown ${name} = iota\n)\n`;
    }
    generatePlaceholder(spec) {
        return {
            path: this.getOutputPath(spec),
            content: `${this.fileHeader(spec.header.id, spec.target.outputPath || 'main')}\n\n// No code blocks found in spec\n`,
            sourceBlock: 'placeholder',
            language: 'go',
        };
    }
    getOutputPath(spec) {
        const basePath = spec.target.outputPath || 'src/generated';
        const specId = spec.header.id.replace(/[@/]/g, '-');
        return `${basePath}/${specId}.go`;
    }
    getBlockOutputPath(spec, block) {
        const basePath = spec.target.outputPath || 'src/generated';
        const blockName = block.id.replace(/[@/]/g, '-');
        return `${basePath}/${blockName}.go`;
    }
    generateStruct(name, fields) {
        this.imports.clear();
        const fieldLines = fields.map((f) => {
            const { type, imports } = (0, types_1.mapGoType)(f.type);
            imports.forEach((i) => this.imports.add(i));
            let tag = '';
            if (this.config.addJsonTags) {
                const jsonName = f.jsonName || this.toSnakeCase(f.name);
                tag = templates_1.GO_TEMPLATES.jsonTag
                    .replace('{{name}}', jsonName)
                    .replace('{{omitempty}}', f.optional ? ',omitempty' : '');
            }
            const fieldName = this.toPascalCase(f.name);
            return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.field, {
                name: fieldName,
                type,
                tag,
            });
        });
        return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.struct, {
            name: this.toPascalCase(name),
            fields: fieldLines.join('\n'),
        });
    }
    generateInterface(name, methods) {
        this.imports.clear();
        const methodLines = methods.map((m) => {
            return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.interfaceMethod, {
                name: this.toPascalCase(m.name),
                params: m.params,
                returns: m.returns,
            });
        });
        return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.interface, {
            name: this.toPascalCase(name),
            methods: methodLines.join('\n'),
        });
    }
    generateFunction(name, params, returns, body, receiver) {
        this.imports.clear();
        const funcName = this.toCamelCase(name);
        const receiverStr = receiver
            ? (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.receiver, {
                type: receiver,
            })
            : '';
        return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.function, {
            receiver: receiverStr,
            name: funcName,
            params,
            returns,
            body,
        });
    }
    generateEnum(name, values) {
        this.imports.clear();
        const firstValue = this.toUpperSnakeCase(values[0]);
        const otherValues = values
            .slice(1)
            .map((v) => `    ${this.toUpperSnakeCase(v)}`)
            .join('\n');
        return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.enum, {
            name: this.toPascalCase(name),
            firstValue,
            otherValues,
        });
    }
    formatImports() {
        if (this.imports.size === 0)
            return '';
        const stdlib = [];
        const thirdParty = [];
        for (const imp of this.imports) {
            if ((0, builtins_1.isBuiltinType)(imp))
                continue;
            if ((0, builtins_1.isStdlibPackage)(imp)) {
                stdlib.push(imp);
            }
            else {
                thirdParty.push(imp);
            }
        }
        const allImports = [...stdlib.sort(), ...thirdParty.sort()];
        if (allImports.length === 0)
            return '';
        if (allImports.length === 1) {
            return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.importSingle, {
                package: allImports[0],
            });
        }
        return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.importBlock, {
            imports: allImports.map((i) => `  "${i}"`).join('\n'),
        });
    }
    fileHeader(source, packageName) {
        return (0, templates_1.renderGoTemplate)(templates_1.GO_TEMPLATES.fileHeader, {
            source,
            timestamp: new Date().toISOString(),
            package: packageName || 'main',
        });
    }
    fileFooter() {
        return '\n';
    }
    mapType(stdlibType) {
        return (0, types_1.mapGoType)(stdlibType).type;
    }
    toPascalCase(str) {
        return str.replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase());
    }
    toCamelCase(str) {
        const pascal = this.toPascalCase(str);
        return pascal[0].toLowerCase() + pascal.slice(1);
    }
    toSnakeCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    }
    toUpperSnakeCase(str) {
        return this.toSnakeCase(str).toUpperCase();
    }
}
exports.GoGenerator = GoGenerator;
function createGoGenerator(config) {
    return new GoGenerator(config);
}
//# sourceMappingURL=go.js.map