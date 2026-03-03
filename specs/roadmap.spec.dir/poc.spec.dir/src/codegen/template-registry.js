"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:20:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRegistry = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const poc_1 = require("../types/poc");
const function_1 = require("./templates/function");
const class_1 = require("./templates/class");
const interface_1 = require("./templates/interface");
const type_1 = require("./templates/type");
const enum_1 = require("./templates/enum");
const constant_1 = require("./templates/constant");
/**
 * Template registry with loading and caching
 */
class TemplateRegistry {
    templates = new Map();
    customTemplates = new Map();
    constructor() {
        // Register built-in templates on initialization
        this.registerBuiltInTemplates();
    }
    /**
     * Get template for block kind
     * Falls back to generic template if not found
     */
    get(kind) {
        const entry = this.templates.get(kind);
        if (!entry) {
            console.warn(`[TemplateRegistry] No template for kind '${kind}', using generic`);
            return this.getGenericTemplate();
        }
        return entry.template;
    }
    /**
     * Check if template exists for kind
     */
    has(kind) {
        return this.templates.has(kind);
    }
    /**
     * Register a template
     */
    register(kind, template, metadata = {}) {
        const fullMetadata = {
            name: metadata.name || `${kind}-template`,
            kind,
            description: metadata.description || `${kind} template`,
            language: metadata.language || 'typescript',
            version: metadata.version || '1.0.0',
            sourcePath: metadata.sourcePath,
            registeredAt: Date.now()
        };
        this.templates.set(kind, {
            template,
            metadata: fullMetadata
        });
        console.log(`[TemplateRegistry] Registered template for '${kind}'`);
    }
    /**
     * Unregister a template
     */
    unregister(kind) {
        const existed = this.templates.delete(kind);
        if (existed) {
            console.log(`[TemplateRegistry] Unregistered template for '${kind}'`);
        }
        return existed;
    }
    /**
     * Load template from file
     */
    async loadFromFile(filePath, kind) {
        try {
            const content = await (0, promises_1.readFile)(filePath, 'utf-8');
            const template = this.compileTemplate(content);
            this.register(kind, template, {
                name: `custom-${kind}`,
                sourcePath: filePath
            });
            console.log(`[TemplateRegistry] Loaded template from ${filePath}`);
        }
        catch (error) {
            throw new poc_1.POCError('TEMPLATE_ERROR', `Failed to load template from ${filePath}: ${error}`, filePath);
        }
    }
    /**
     * Load all templates from directory
     */
    async loadFromDirectory(dirPath) {
        let loaded = 0;
        const files = await (0, promises_1.readdir)(dirPath);
        for (const file of files) {
            if ((0, path_1.extname)(file) === '.template.ts') {
                const kind = (0, path_1.basename)(file, '.template.ts');
                await this.loadFromFile(`${dirPath}/${file}`, kind);
                loaded++;
            }
        }
        console.log(`[TemplateRegistry] Loaded ${loaded} templates from ${dirPath}`);
        return loaded;
    }
    /**
     * Get all registered templates
     */
    getAll() {
        const result = new Map();
        for (const [kind, entry] of this.templates) {
            result.set(kind, entry.metadata);
        }
        return result;
    }
    /**
     * Get template metadata
     */
    getMetadata(kind) {
        return this.templates.get(kind)?.metadata;
    }
    /**
     * Clear all templates (except built-ins)
     */
    clear() {
        this.customTemplates.clear();
        // Re-register built-ins
        this.registerBuiltInTemplates();
    }
    /**
     * Register built-in templates
     */
    registerBuiltInTemplates() {
        this.register('function', function_1.functionTemplate, {
            name: 'builtin-function',
            description: 'TypeScript function template'
        });
        this.register('class', class_1.classTemplate, {
            name: 'builtin-class',
            description: 'TypeScript class template'
        });
        this.register('interface', interface_1.interfaceTemplate, {
            name: 'builtin-interface',
            description: 'TypeScript interface template'
        });
        this.register('type', type_1.typeTemplate, {
            name: 'builtin-type',
            description: 'TypeScript type alias template'
        });
        this.register('enum', enum_1.enumTemplate, {
            name: 'builtin-enum',
            description: 'TypeScript enum template'
        });
        this.register('constant', constant_1.constantTemplate, {
            name: 'builtin-constant',
            description: 'Constant declaration template'
        });
    }
    /**
     * Compile template string to function
     * Simple placeholder replacement
     */
    compileTemplate(content) {
        return (data) => {
            return content
                .replace(/\{\{id\}\}/g, data.id)
                .replace(/\{\{description\}\}/g, data.description)
                .replace(/\{\{kind\}\}/g, data.kind)
                .replace(/\{\{params\}\}/g, this.formatParams(data.parameters))
                .replace(/\{\{paramDocs\}\}/g, this.formatParamDocs(data.parameters))
                .replace(/\{\{returnType\}\}/g, data.returns?.type || 'void')
                .replace(/\{\{returnDoc\}\}/g, data.returns?.description || '')
                .replace(/\{\{specRef\}\}/g, data.id); // Could be spec ID
        };
    }
    /**
     * Format parameters for signature
     */
    formatParams(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }
        return parameters
            .map(p => `${p.name}: ${p.type}`)
            .join(', ');
    }
    /**
     * Format parameter docs
     */
    formatParamDocs(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }
        return parameters
            .map(p => ` * @param ${p.name} - ${p.description}`)
            .join('\n');
    }
    /**
     * Generic fallback template
     */
    getGenericTemplate() {
        return (data) => {
            return `/**
 * ${data.description}
 * @kind ${data.kind}
 */
// TODO: Implement ${data.id}
export const ${data.id} = {};
`;
        };
    }
}
exports.TemplateRegistry = TemplateRegistry;
//# sourceMappingURL=template-registry.js.map