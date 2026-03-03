"use strict";
/**
 * SPECLANG-GENERATED: Template system for codegen
 * Source: @speclang/codegen @block:templates
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATES = void 0;
exports.renderTemplate = renderTemplate;
exports.getTemplate = getTemplate;
exports.getTemplateNames = getTemplateNames;
exports.listTemplates = listTemplates;
exports.formatFields = formatFields;
exports.formatParams = formatParams;
exports.formatMethods = formatMethods;
exports.createFileHeader = createFileHeader;
exports.createFileFooter = createFileFooter;
exports.createBlockMarker = createBlockMarker;
exports.loadExternalTemplate = loadExternalTemplate;
exports.getExternalTemplates = getExternalTemplates;
exports.clearExternalTemplates = clearExternalTemplates;
// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================
/** Built-in templates for each target language */
exports.TEMPLATES = {
    typescript: {
        interface: {
            name: 'interface',
            target: 'typescript',
            content: `export interface {{name}} {
{{fields}}
}`,
            variables: ['name', 'fields'],
        },
        function: {
            name: 'function',
            target: 'typescript',
            content: `export async function {{name}}({{params}}): Promise<{{return}}> {
{{body}}
}`,
            variables: ['name', 'params', 'return', 'body'],
        },
        class: {
            name: 'class',
            target: 'typescript',
            content: `export class {{name}} {
{{fields}}
{{methods}}
}`,
            variables: ['name', 'fields', 'methods'],
        },
        type: {
            name: 'type',
            target: 'typescript',
            content: `export type {{name}} = {{type}};`,
            variables: ['name', 'type'],
        },
    },
    go: {
        struct: {
            name: 'struct',
            target: 'go',
            content: `type {{name}} struct {
{{fields}}
}`,
            variables: ['name', 'fields'],
        },
        func: {
            name: 'func',
            target: 'go',
            content: `func {{name}}({{params}}) {{return}} {
{{body}}
}`,
            variables: ['name', 'params', 'return', 'body'],
        },
        interface: {
            name: 'interface',
            target: 'go',
            content: `type {{name}} interface {
{{methods}}
}`,
            variables: ['name', 'methods'],
        },
    },
    python: {
        class: {
            name: 'class',
            target: 'python',
            content: `class {{name}}:
{{body}}
`,
            variables: ['name', 'body'],
        },
        function: {
            name: 'function',
            target: 'python',
            content: `def {{name}}({{params}}) -> {{return}}:
{{body}}
`,
            variables: ['name', 'params', 'return', 'body'],
        },
        dataclass: {
            name: 'dataclass',
            target: 'python',
            content: `@dataclass
class {{name}}:
{{fields}}
`,
            variables: ['name', 'fields'],
        },
    },
    rust: {
        struct: {
            name: 'struct',
            target: 'rust',
            content: `pub struct {{name}} {
{{fields}}
}`,
            variables: ['name', 'fields'],
        },
        impl: {
            name: 'impl',
            target: 'rust',
            content: `impl {{name}} {
{{methods}}
}`,
            variables: ['name', 'methods'],
        },
        function: {
            name: 'function',
            target: 'rust',
            content: `pub fn {{name}}({{params}}) -> {{return}} {
{{body}}
}`,
            variables: ['name', 'params', 'return', 'body'],
        },
        enum: {
            name: 'enum',
            target: 'rust',
            content: `pub enum {{name}} {
{{variants}}
}`,
            variables: ['name', 'variants'],
        },
    },
};
// ============================================================================
// TEMPLATE RENDERING
// ============================================================================
/** Render a template with variables */
function renderTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(pattern, value);
    }
    return result;
}
/** Get template by name and target */
function getTemplate(target, name) {
    return exports.TEMPLATES[target]?.[name];
}
/** Get all template names for a target */
function getTemplateNames(target) {
    return Object.keys(exports.TEMPLATES[target] || {});
}
/** List all available templates */
function listTemplates() {
    const result = [];
    for (const [target, templates] of Object.entries(exports.TEMPLATES)) {
        for (const name of Object.keys(templates)) {
            result.push({ target: target, name });
        }
    }
    return result;
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/** Convert fields array to string */
function formatFields(fields, indent = 2) {
    const spaces = ' '.repeat(indent);
    return fields
        .map(f => `${spaces}${f.name}${f.optional ? '?' : ''}: ${f.type};`)
        .join('\n');
}
/** Convert params array to string */
function formatParams(params) {
    return params.map(p => `${p.name}: ${p.type}`).join(', ');
}
/** Convert method array to string */
function formatMethods(methods, indent = 2) {
    const spaces = ' '.repeat(indent);
    return methods
        .map(m => `${spaces}${m.name}(${m.params}): ${m.return} {\n${spaces}  ${m.body}\n${spaces}}`)
        .join('\n');
}
/** Create a simple file header */
function createFileHeader(spec, generatorName) {
    const timestamp = new Date().toISOString();
    const generator = generatorName || 'speclang-codegen';
    const version = spec.header?.version || '0.0.0';
    const layer = spec.header?.layer ?? 'N/A';
    return `/**
 * SPECLANG-GENERATED
 * @speclang-id: ${spec.header?.id || 'unknown'}
 * @speclang-version: ${version}
 * @speclang-layer: ${layer}
 * @speclang-generated: DO NOT EDIT BY HAND
 * Source: ${spec.sourceFile}
 * Generated: ${timestamp}
 * Generator: ${generator}
 */`;
}
/** Create file footer */
function createFileFooter(_spec) {
    return '';
}
/** Create block-level markers for generated code */
function createBlockMarker(blockId, header, language = 'typescript') {
    const version = header?.version || '0.0.0';
    const layer = header?.layer ?? 'N/A';
    const commentChar = getCommentChar(language);
    return `${commentChar} @speclang-id: ${blockId}
${commentChar} @speclang-version: ${version}
${commentChar} @speclang-layer: ${layer}
${commentChar} @speclang-generated: DO NOT EDIT BY HAND`;
}
/** Get comment character for target language */
function getCommentChar(language) {
    switch (language) {
        case 'python':
            return '#';
        case 'rust':
            return '//';
        case 'go':
            return '//';
        case 'typescript':
        default:
            return '//';
    }
}
// ============================================================================
// EXTERNAL TEMPLATE LOADING
// ============================================================================
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const externalTemplates = new Map();
/** Load external .hbs template from filesystem */
function loadExternalTemplate(templatePath) {
    try {
        const normalizedPath = path.normalize(templatePath);
        if (externalTemplates.has(normalizedPath)) {
            return externalTemplates.get(normalizedPath);
        }
        if (!fs.existsSync(templatePath)) {
            return null;
        }
        const content = fs.readFileSync(templatePath, 'utf-8');
        const basename = path.basename(templatePath, '.hbs');
        const target = detectTargetFromPath(templatePath);
        const variables = extractVariables(content);
        const template = {
            name: basename,
            target,
            content,
            variables,
            sourcePath: templatePath,
        };
        externalTemplates.set(normalizedPath, template);
        return template;
    }
    catch (error) {
        return null;
    }
}
/** Detect target language from template path */
function detectTargetFromPath(templatePath) {
    const dirname = path.dirname(templatePath);
    const targetName = path.basename(dirname);
    if (targetName === 'typescript' || targetName === 'ts')
        return 'typescript';
    if (targetName === 'go' || targetName === 'golang')
        return 'go';
    if (targetName === 'python' || targetName === 'py')
        return 'python';
    if (targetName === 'rust' || targetName === 'rs')
        return 'rust';
    return 'typescript';
}
/** Extract variable names from template content */
function extractVariables(content) {
    const variablePattern = /\{\{([^#\/}][^}]*)\}\}/g;
    const variables = new Set();
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
        const varName = match[1].trim();
        if (!varName.startsWith('else') && !varName.startsWith('/')) {
            variables.add(varName);
        }
    }
    return Array.from(variables);
}
/** Get all loaded external templates */
function getExternalTemplates() {
    return Array.from(externalTemplates.values());
}
/** Clear external template cache */
function clearExternalTemplates() {
    externalTemplates.clear();
}
//# sourceMappingURL=templates.js.map