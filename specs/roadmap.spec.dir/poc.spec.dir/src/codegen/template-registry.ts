/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:20:00.000Z
 *
 * Edit the spec, not this file.
 */

import { readFile, readdir, stat } from 'fs/promises';
import { extname, basename } from 'path';
import { BlockData, BlockKind, POCError } from '../types/poc';
import { functionTemplate } from './templates/function';
import { classTemplate } from './templates/class';
import { interfaceTemplate } from './templates/interface';
import { typeTemplate } from './templates/type';
import { enumTemplate } from './templates/enum';
import { constantTemplate } from './templates/constant';

/**
 * Template function signature
 */
export type Template = (data: BlockData) => string;

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /** Template name/ID */
  name: string;
  
  /** Supported block kind */
  kind: BlockKind;
  
  /** Template description */
  description: string;
  
  /** Language (typescript, javascript) */
  language: string;
  
  /** Template version */
  version: string;
  
  /** Source path (for custom templates) */
  sourcePath?: string;
  
  /** When template was registered */
  registeredAt: number;
}

/**
 * Registered template entry
 */
interface RegisteredTemplate {
  /** Template function */
  template: Template;
  
  /** Template metadata */
  metadata: TemplateMetadata;
}

/**
 * Template registry with loading and caching
 */
export class TemplateRegistry {
  private templates: Map<BlockKind, RegisteredTemplate> = new Map();
  private customTemplates: Map<string, RegisteredTemplate> = new Map();
  
  constructor() {
    // Register built-in templates on initialization
    this.registerBuiltInTemplates();
  }
  
  /**
   * Get template for block kind
   * Falls back to generic template if not found
   */
  get(kind: BlockKind): Template {
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
  has(kind: BlockKind): boolean {
    return this.templates.has(kind);
  }
  
  /**
   * Register a template
   */
  register(kind: BlockKind, template: Template, metadata: Partial<TemplateMetadata> = {}): void {
    const fullMetadata: TemplateMetadata = {
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
  unregister(kind: BlockKind): boolean {
    const existed = this.templates.delete(kind);
    if (existed) {
      console.log(`[TemplateRegistry] Unregistered template for '${kind}'`);
    }
    return existed;
  }
  
  /**
   * Load template from file
   */
  async loadFromFile(filePath: string, kind: BlockKind): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const template = this.compileTemplate(content);
      
      this.register(kind, template, {
        name: `custom-${kind}`,
        sourcePath: filePath
      });
      
      console.log(`[TemplateRegistry] Loaded template from ${filePath}`);
    } catch (error) {
      throw new POCError(
        'TEMPLATE_ERROR',
        `Failed to load template from ${filePath}: ${error}`,
        filePath
      );
    }
  }
  
  /**
   * Load all templates from directory
   */
  async loadFromDirectory(dirPath: string): Promise<number> {
    let loaded = 0;
    const files = await readdir(dirPath);
    
    for (const file of files) {
      if (extname(file) === '.template.ts') {
        const kind = basename(file, '.template.ts') as BlockKind;
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
  getAll(): Map<BlockKind, TemplateMetadata> {
    const result = new Map<BlockKind, TemplateMetadata>();
    
    for (const [kind, entry] of this.templates) {
      result.set(kind, entry.metadata);
    }
    
    return result;
  }
  
  /**
   * Get template metadata
   */
  getMetadata(kind: BlockKind): TemplateMetadata | undefined {
    return this.templates.get(kind)?.metadata;
  }
  
  /**
   * Clear all templates (except built-ins)
   */
  clear(): void {
    this.customTemplates.clear();
    // Re-register built-ins
    this.registerBuiltInTemplates();
  }
  
  /**
   * Register built-in templates
   */
  private registerBuiltInTemplates(): void {
    this.register('function', functionTemplate, {
      name: 'builtin-function',
      description: 'TypeScript function template'
    });
    
    this.register('class', classTemplate, {
      name: 'builtin-class',
      description: 'TypeScript class template'
    });
    
    this.register('interface', interfaceTemplate, {
      name: 'builtin-interface',
      description: 'TypeScript interface template'
    });
    
    this.register('type', typeTemplate, {
      name: 'builtin-type',
      description: 'TypeScript type alias template'
    });
    
    this.register('enum', enumTemplate, {
      name: 'builtin-enum',
      description: 'TypeScript enum template'
    });
    
    this.register('constant', constantTemplate, {
      name: 'builtin-constant',
      description: 'Constant declaration template'
    });
  }
  
  /**
   * Compile template string to function
   * Simple placeholder replacement
   */
  private compileTemplate(content: string): Template {
    return (data: BlockData) => {
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
  private formatParams(parameters: BlockData['parameters']): string {
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
  private formatParamDocs(parameters: BlockData['parameters']): string {
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
  private getGenericTemplate(): Template {
    return (data: BlockData) => {
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