"use strict";
/**
 * SPECLANG-GENERATED: Python target generator
 * Source: @speclang/compiler.spec.dir/python
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonGenerator = void 0;
exports.createPythonGenerator = createPythonGenerator;
const types_1 = require("../python/types");
const templates_1 = require("../python/templates");
const builtins_1 = require("../python/builtins");
class PythonGenerator {
    language = 'python';
    extension = '.py';
    imports = new Set();
    fromImports = new Map();
    config;
    constructor(config = {}) {
        this.config = {
            useDataclass: true,
            usePydantic: false,
            addTypeHints: true,
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
    generateFromBlocks(spec, blocks) {
        const header = this.fileHeader(spec.header.id);
        const parts = [header];
        const imports = this.formatImports();
        if (imports) {
            parts.push(imports);
            parts.push('');
        }
        for (const block of blocks) {
            parts.push(`# Block: ${block.id}`);
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
                content = this.generateDataclassFromBlock(block);
                break;
            case 'interface':
                content = this.generateProtocolFromBlock(block);
                break;
            case 'function':
            case 'operation':
                content = this.generateFunctionFromBlock(block);
                break;
            case 'class':
                content = this.generateClassFromBlock(block);
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
            language: 'python',
        };
    }
    generateDataclassFromBlock(block) {
        this.imports.clear();
        this.fromImports.clear();
        this.fromImports.set('dataclasses', ['dataclass']);
        const nameMatch = block.content.match(/type\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `@dataclass
class ${name}:
    pass
`;
    }
    generateProtocolFromBlock(block) {
        this.imports.clear();
        this.fromImports.set('typing', ['Protocol']);
        const nameMatch = block.content.match(/interface\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `class ${name}(Protocol):
    pass
`;
    }
    generateFunctionFromBlock(block) {
        this.imports.clear();
        const nameMatch = block.content.match(/(?:async\s+)?function\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `def ${name}():
    pass
`;
    }
    generateClassFromBlock(block) {
        this.imports.clear();
        const nameMatch = block.content.match(/class\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `class ${name}:
    pass
`;
    }
    generateEnumFromBlock(block) {
        this.imports.clear();
        this.fromImports.set('enum', ['Enum']);
        const nameMatch = block.content.match(/enum\s+(\w+)/);
        const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
        return `class ${name}(Enum):
    UNKNOWN = "unknown"
`;
    }
    generatePlaceholder(spec) {
        return {
            path: this.getOutputPath(spec),
            content: `${this.fileHeader(spec.header.id)}\n\n# No code blocks found in spec\n`,
            sourceBlock: 'placeholder',
            language: 'python',
        };
    }
    getOutputPath(spec) {
        const basePath = spec.target.outputPath || 'src/generated';
        const specId = spec.header.id.replace(/[@/]/g, '-');
        return `${basePath}/${specId}.py`;
    }
    getBlockOutputPath(spec, block) {
        const basePath = spec.target.outputPath || 'src/generated';
        const blockName = block.id.replace(/[@/]/g, '-');
        return `${basePath}/${blockName}.py`;
    }
    generateDataclass(name, fields) {
        this.imports.clear();
        this.fromImports.clear();
        this.fromImports.set('dataclasses', ['dataclass']);
        const fieldLines = fields.map((f) => {
            const { type, imports } = (0, types_1.mapPythonType)(f.type);
            imports.forEach((i) => {
                if (!this.fromImports.has(i)) {
                    this.fromImports.set(i, []);
                }
            });
            let defaultVal = 'None';
            if (f.optional) {
                defaultVal = 'None';
            }
            else if (f.default) {
                defaultVal = f.default;
            }
            else {
                defaultVal = (0, types_1.getPythonZeroValue)(f.type);
            }
            return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.dataclassField, {
                name: this.toSnakeCase(f.name),
                type,
                default: defaultVal,
            });
        });
        return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.dataclass, {
            name: this.toPascalCase(name),
            fields: fieldLines.join('\n'),
        });
    }
    generatePydanticModel(name, fields) {
        this.imports.clear();
        this.fromImports.clear();
        this.fromImports.set('pydantic', ['BaseModel', 'Field']);
        const fieldLines = fields.map((f) => {
            const { type, imports } = (0, types_1.mapPythonType)(f.type);
            imports.forEach((i) => {
                if (!this.fromImports.has(i)) {
                    this.fromImports.set(i, []);
                }
            });
            let fieldArgs = '';
            if (f.optional) {
                fieldArgs = 'default=None';
            }
            else if (f.default) {
                fieldArgs = `default=${f.default}`;
            }
            return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.pydanticField, {
                name: this.toSnakeCase(f.name),
                type,
                fieldArgs,
            });
        });
        return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.pydanticModel, {
            name: this.toPascalCase(name),
            fields: fieldLines.join('\n'),
        });
    }
    generateFunction(name, params, returns, body, isAsync = false) {
        this.imports.clear();
        const { type: returnType, imports } = (0, types_1.mapPythonType)(returns);
        imports.forEach((i) => {
            if (!this.fromImports.has(i)) {
                this.fromImports.set(i, []);
            }
        });
        const template = isAsync ? templates_1.PYTHON_TEMPLATES.asyncFunction : templates_1.PYTHON_TEMPLATES.function;
        return (0, templates_1.renderPythonTemplate)(template, {
            name: this.toSnakeCase(name),
            params,
            returnType,
            docstring: '',
            body: body || '    pass',
        });
    }
    generateEnum(name, values) {
        this.imports.clear();
        this.fromImports.clear();
        this.fromImports.set('enum', ['Enum']);
        const valueLines = values.map((v) => {
            return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.enumValue, {
                name: this.toUpperSnakeCase(v),
                value: v,
            });
        });
        return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.enum, {
            name: this.toPascalCase(name),
            values: valueLines.join('\n'),
        });
    }
    generateProtocol(name, methods) {
        this.imports.clear();
        this.fromImports.clear();
        this.fromImports.set('typing', ['Protocol']);
        const methodLines = methods.map((m) => {
            const { type: returnType, imports } = (0, types_1.mapPythonType)(m.returns);
            imports.forEach((i) => {
                if (!this.fromImports.has(i)) {
                    this.fromImports.set(i, []);
                }
            });
            return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.protocolMethod, {
                name: this.toSnakeCase(m.name),
                params: m.params,
                returnType,
            });
        });
        return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.protocol, {
            name: this.toPascalCase(name),
            methods: methodLines.join('\n'),
        });
    }
    formatImports() {
        const lines = [];
        for (const [module, names] of this.fromImports) {
            if (names.length > 0) {
                lines.push(`from ${module} import ${names.join(', ')}`);
            }
        }
        for (const module of this.imports) {
            if ((0, builtins_1.isBuiltinType)(module))
                continue;
            lines.push(`import ${module}`);
        }
        if (lines.length === 0)
            return '';
        return lines.sort().join('\n');
    }
    fileHeader(source) {
        return (0, templates_1.renderPythonTemplate)(templates_1.PYTHON_TEMPLATES.fileHeader, {
            source,
            timestamp: new Date().toISOString(),
            docstring: 'Generated module',
        });
    }
    fileFooter() {
        return '\n';
    }
    mapType(stdlibType) {
        return (0, types_1.mapPythonType)(stdlibType).type;
    }
    toPascalCase(str) {
        return str.replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase());
    }
    toSnakeCase(str) {
        return str
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .toLowerCase()
            .replace(/[-\s]+/g, '_');
    }
    toUpperSnakeCase(str) {
        return this.toSnakeCase(str).toUpperCase();
    }
}
exports.PythonGenerator = PythonGenerator;
function createPythonGenerator(config) {
    return new PythonGenerator(config);
}
//# sourceMappingURL=python.js.map