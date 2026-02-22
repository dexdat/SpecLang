/**
 * SPECLANG-GENERATED: Template system for codegen
 * Source: @speclang/codegen @block:templates
 */

import type { Template, TargetLanguage, CodeSpec, GeneratedFile } from './types';

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
  
  return `/**
 * SPECLANG-GENERATED: Do not edit directly
 * Source: ${spec.sourceFile}
 * Generated: ${timestamp}
 * Generator: ${generator}
 */`;
}

/** Create file footer */
export function createFileFooter(_spec: CodeSpec): string {
  return '';
}
