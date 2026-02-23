/**
 * SPECLANG-GENERATED: Template system for codegen
 * Source: @speclang/codegen @block:templates
 */

import type { Template, TargetLanguage, CodeSpec, GeneratedFile } from './types';
import type { SpecMetadata } from '../parser/types';

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/** Built-in templates for each target language */
export const TEMPLATES: Record<TargetLanguage, Record<string, Template>> = {
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
export function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  
  return result;
}

/** Get template by name and target */
export function getTemplate(target: TargetLanguage, name: string): Template | undefined {
  return TEMPLATES[target]?.[name];
}

/** Get all template names for a target */
export function getTemplateNames(target: TargetLanguage): string[] {
  return Object.keys(TEMPLATES[target] || {});
}

/** List all available templates */
export function listTemplates(): Array<{ target: TargetLanguage; name: string }> {
  const result: Array<{ target: TargetLanguage; name: string }> = [];
  
  for (const [target, templates] of Object.entries(TEMPLATES)) {
    for (const name of Object.keys(templates)) {
      result.push({ target: target as TargetLanguage, name });
    }
  }
  
  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Convert fields array to string */
export function formatFields(fields: Array<{ name: string; type: string; optional?: boolean }>, indent: number = 2): string {
  const spaces = ' '.repeat(indent);
  return fields
    .map(f => `${spaces}${f.name}${f.optional ? '?' : ''}: ${f.type};`)
    .join('\n');
}

/** Convert params array to string */
export function formatParams(params: Array<{ name: string; type: string; optional?: boolean }>): string {
  return params.map(p => `${p.name}: ${p.type}`).join(', ');
}

/** Convert method array to string */
export function formatMethods(methods: Array<{ name: string; params: string; return: string; body: string }>, indent: number = 2): string {
  const spaces = ' '.repeat(indent);
  return methods
    .map(m => `${spaces}${m.name}(${m.params}): ${m.return} {\n${spaces}  ${m.body}\n${spaces}}`)
    .join('\n');
}

/** Create a simple file header */
export function createFileHeader(spec: CodeSpec, generatorName?: string): string {
  const timestamp = new Date().toISOString();
  const generator = generatorName || 'speclang-codegen';
  const version = spec.header?.version || '0.0.0';
  const layer = spec.header?.layer ?? 'N/A';
  
  return `/**
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
export function createFileFooter(_spec: CodeSpec): string {
  return '';
}

/** Create block-level markers for generated code */
export function createBlockMarker(blockId: string, header: SpecMetadata | undefined, language: TargetLanguage = 'typescript'): string {
  const version = header?.version || '0.0.0';
  const layer = header?.layer ?? 'N/A';
  const commentChar = getCommentChar(language);
  
  return `${commentChar} @speclang-id: ${blockId}
${commentChar} @speclang-version: ${version}
${commentChar} @speclang-layer: ${layer}
${commentChar} @speclang-generated: DO NOT EDIT BY HAND`;
}

/** Get comment character for target language */
function getCommentChar(language: TargetLanguage): string {
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

import * as fs from 'fs';
import * as path from 'path';

interface ExternalTemplate {
  name: string;
  target: TargetLanguage;
  content: string;
  variables: string[];
  sourcePath: string;
}

const externalTemplates: Map<string, ExternalTemplate> = new Map();

/** Load external .hbs template from filesystem */
export function loadExternalTemplate(templatePath: string): ExternalTemplate | null {
  try {
    const normalizedPath = path.normalize(templatePath);
    
    if (externalTemplates.has(normalizedPath)) {
      return externalTemplates.get(normalizedPath)!;
    }
    
    if (!fs.existsSync(templatePath)) {
      return null;
    }
    
    const content = fs.readFileSync(templatePath, 'utf-8');
    const basename = path.basename(templatePath, '.hbs');
    const target = detectTargetFromPath(templatePath);
    const variables = extractVariables(content);
    
    const template: ExternalTemplate = {
      name: basename,
      target,
      content,
      variables,
      sourcePath: templatePath,
    };
    
    externalTemplates.set(normalizedPath, template);
    return template;
  } catch (error) {
    return null;
  }
}

/** Detect target language from template path */
function detectTargetFromPath(templatePath: string): TargetLanguage {
  const dirname = path.dirname(templatePath);
  const targetName = path.basename(dirname);
  
  if (targetName === 'typescript' || targetName === 'ts') return 'typescript';
  if (targetName === 'go' || targetName === 'golang') return 'go';
  if (targetName === 'python' || targetName === 'py') return 'python';
  if (targetName === 'rust' || targetName === 'rs') return 'rust';
  
  return 'typescript';
}

/** Extract variable names from template content */
function extractVariables(content: string): string[] {
  const variablePattern = /\{\{([^#\/}][^}]*)\}\}/g;
  const variables = new Set<string>();
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
export function getExternalTemplates(): ExternalTemplate[] {
  return Array.from(externalTemplates.values());
}

/** Clear external template cache */
export function clearExternalTemplates(): void {
  externalTemplates.clear();
}
