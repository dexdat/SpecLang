# speclang-header lines:7
id: "@speclang/roadmap/poc/template-registry"
parent: "@ref:specs/roadmap/poc"version: 0.1.0
layer: 2
short: "Template registry with loading mechanism"
tags: [poc, templates, registry, loading, codegen]
---

# POC: Template Registry

Template loading, registration, and management system.

## Purpose

Manage code generation templates:
- Register built-in templates
- Load custom templates from files
- Select templates by block kind
- Cache compiled templates

## Template Structure

### @poc/template-registry/structure

```typescript
import { BlockData, BlockKind } from './types';

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
export interface RegisteredTemplate {
  /** Template function */
  template: Template;
  
  /** Template metadata */
  metadata: TemplateMetadata;
}
```

## Registry Implementation

### @poc/template-registry/impl

```typescript
import { readFile } from 'fs/promises';
import { BlockData, BlockKind, POCError } from './types';

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
    const { readdir } = await import('fs/promises');
    const { extname, basename } = await import('path');
    
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
    const result = new Map();
    
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
```

## Built-In Templates

### @poc/template-registry/builtins

```typescript
/**
 * Function template
 */
const functionTemplate: Template = (data) => {
  const params = data.parameters
    .map(p => `${p.name}: ${p.type}`)
    .join(', ');
  
  const paramDocs = data.parameters
    .map(p => ` * @param ${p.name} - ${p.description}`)
    .join('\n');
  
  return `/**
 * ${data.description}
${paramDocs ? paramDocs + '\n' : ''} * @returns ${data.returns?.description || 'void'}
 */
export function ${data.id}(${params}): ${data.returns?.type || 'void'} {
  // TODO: Implement
  throw new Error('Not implemented: ${data.id}');
}`;
};

/**
 * Class template
 */
const classTemplate: Template = (data) => {
  const properties = data.properties
    ?.map(p => `  ${p.name}: ${p.type};  // ${p.description}`)
    .join('\n') || '';
  
  return `/**
 * ${data.description}
 */
export class ${data.id} {
${properties}
  constructor() {
    // TODO: Implement
    throw new Error('Not implemented: ${data.id}');
  }
}`;
};

/**
 * Interface template
 */
const interfaceTemplate: Template = (data) => {
  const properties = data.properties
    ?.map(p => `  /** ${p.description} */\n  ${p.name}: ${p.type};`)
    .join('\n\n') || '';
  
  return `/**
 * ${data.description}
 */
export interface ${data.id} {
${properties}
}`;
};

/**
 * Type alias template
 */
const typeTemplate: Template = (data) => {
  return `/**
 * ${data.description}
 */
export type ${data.id} = {
  // TODO: Define type structure
};`;
};

/**
 * Enum template
 */
const enumTemplate: Template = (data) => {
  return `/**
 * ${data.description}
 */
export enum ${data.id} {
  // TODO: Define enum values
}`;
};

/**
 * Constant template
 */
const constantTemplate: Template = (data) => {
  const type = data.properties?.[0]?.type || 'any';
  
  return `/**
 * ${data.description}
 */
export const ${data.id}: ${type} = {
  // TODO: Define constant value
};`;
};
```

## Custom Templates

### @poc/template-registry/custom

**Loading Custom Templates:**
```typescript
// Load from file
await registry.loadFromFile('./templates/custom-function.template.ts', 'function');

// Load from directory
await registry.loadFromDirectory('./templates');

// Register programmatically
registry.register('custom', (data) => {
  return `// Custom: ${data.id}`;
}, {
  name: 'my-custom-template',
  description: 'Custom template for special cases'
});
```

**Template File Format:**
```typescript
// templates/custom-function.template.ts
/**
 * Custom function template
 */
export default (data: BlockData): string => {
  const params = data.parameters
    .map(p => `${p.name}: ${p.type}`)
    .join(', ');
  
  return `// CUSTOM TEMPLATE
export async function ${data.id}(${params}) {
  // Custom implementation
}`;
};
```

**Template with Placeholders:**
```typescript
// Template with placeholder syntax
export const myTemplate = (data: BlockData) => {
  return `
// Generated from: {{specRef}}
// Block: {{id}}
// Kind: {{kind}}

export function {{id}}({{params}}): {{returnType}} {
  // {{description}}
  {{paramDocs}}
  throw new Error('Not implemented');
}
`.replace(/\{\{id\}\}/g, data.id)
 .replace(/\{\{description\}\}/g, data.description)
 // ... etc
};
```

## Caching

### @poc/template-registry/caching

**Template Caching Strategy:**
- Built-in templates: Loaded once at startup
- Custom templates: Cached after first load
- Hot reload: Watch template files for changes

```typescript
export class TemplateRegistry {
  private cache: Map<string, { template: Template; mtime: number }> = new Map();
  
  /**
   * Load with caching
   */
  async loadFromFileWithCache(filePath: string, kind: BlockKind): Promise<void> {
    const { stat } = await import('fs/promises');
    
    const stats = await stat(filePath);
    const cached = this.cache.get(filePath);
    
    if (cached && cached.mtime >= stats.mtimeMs) {
      // Use cached version
      this.register(kind, cached.template);
      return;
    }
    
    // Load and cache
    const content = await readFile(filePath, 'utf-8');
    const template = this.compileTemplate(content);
    
    this.cache.set(filePath, {
      template,
      mtime: stats.mtimeMs
    });
    
    this.register(kind, template);
  }
}
```

## Testing

### @poc/template-registry/testing

```typescript
describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;
  
  beforeEach(() => {
    registry = new TemplateRegistry();
  });
  
  it('should register built-in templates on init', () => {
    expect(registry.has('function')).toBe(true);
    expect(registry.has('class')).toBe(true);
    expect(registry.has('interface')).toBe(true);
  });
  
  it('should generate function code', () => {
    const template = registry.get('function');
    const code = template({
      id: 'greet',
      kind: 'function',
      description: 'Greets user',
      parameters: [{ name: 'name', type: 'string', description: 'User name' }],
      returns: { type: 'string', description: 'Greeting' },
      rawContent: ''
    });
    
    expect(code).toContain('export function greet');
    expect(code).toContain('name: string');
    expect(code).toContain('@param name');
  });
  
  it('should use generic template for unknown kinds', () => {
    const template = registry.get('unknown' as BlockKind);
    const code = template({
      id: 'test',
      kind: 'unknown' as BlockKind,
      description: 'Test',
      parameters: [],
      rawContent: ''
    });
    
    expect(code).toContain('export const test');
  });
  
  it('should track template metadata', () => {
    const metadata = registry.getMetadata('function');
    
    expect(metadata).toBeDefined();
    expect(metadata?.name).toBe('builtin-function');
    expect(metadata?.kind).toBe('function');
  });
});
```

## Usage Example

### @poc/template-registry/usage

```typescript
import { TemplateRegistry } from './template-registry';
import { BlockParser } from './block-parser';

async function generateCode() {
  const registry = new TemplateRegistry();
  const parser = new BlockParser();
  
  // Load custom templates
  await registry.loadFromDirectory('./templates');
  
  // Parse spec
  const spec = await parser.parseFile('./specs/hello.spec.md');
  
  // Generate code for each block
  for (const block of spec.blocks) {
    const template = registry.get(block.kind);
    const code = template(block);
    
    console.log(`Generated code:\n${code}`);
  }
}
```
