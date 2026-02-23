# Bootstrap Phase 0.14: Lens System

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.14 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.13 complete (SQLite, Parser, Indexer, Config, Workflow, Stdlib, Skills, Tools, Test Specs)
- Core spec format parsing working
- Block extraction functional

## Your Task
Implement the Lens System - bidirectional parsers/renderers that convert between structured Block objects and various content formats (Mermaid, code, math, prose). Lenses enable specs to be written in the most natural format for each block type.

## Read These Specs First
1. `specs/lenses.spec.md` - Lens system overview
2. `specs/lenses.spec.dir/formats.spec.md` - Content format specifications
3. `specs/lenses.spec.dir/mermaid.spec.md` - Mermaid diagram lens
4. `specs/core.spec.md` - Block structure

## What to Build

### Files to Create
```
src/lenses/
├── index.ts              # Main exports
├── types.ts              # Lens types and interfaces
├── registry.ts           # Lens registry and detection
├── prose-lens.ts         # Default prose handler
├── code-lens.ts          # Code block lens
├── entity-lens.ts        # Entity/struct lens
├── operation-lens.ts     # Function/operation lens
├── math-lens.ts          # Math/equation lens
├── acceptance-lens.ts    # GIVEN/WHEN/THEN tests
├── diagram-lens.ts       # Mermaid diagram lens
└── converter.ts          # Lens-to-lens transformation

tests/
└── lenses.test.ts
```

### Requirements

#### 1. Lens Types (types.ts)

```typescript
interface Lens<TInput = any, TOutput = Block> {
  name: string;
  kind: string; // @kind marker this lens handles
  description: string;
  
  // Detection
  detect: (content: string) => boolean;
  priority: number; // Higher = checked first
  
  // Parsing
  parse: (content: string, context: LensContext) => Promise<Block>;
  
  // Rendering
  render: (block: Block, context: LensContext) => Promise<string>;
}

interface Block {
  id: string;
  kind: string;
  content: string;
  metadata: Record<string, any>;
  children?: Block[];
  source?: {
    lens: string;
    original: string;
    line: number;
  };
}

interface LensContext {
  filePath: string;
  blockId: string;
  options: LensOptions;
}

interface LensOptions {
  preserveSource: boolean;
  prettyPrint: boolean;
  indent: number;
}

type LensMatch = {
  lens: Lens;
  confidence: number;
};
```

#### 2. Lens Registry (registry.ts)

```typescript
export class LensRegistry {
  private lenses: Map<string, Lens> = new Map();
  private sortedLenses: Lens[] = [];
  
  register(lens: Lens): void {
    this.lenses.set(lens.name, lens);
    this.sortedLenses = Array.from(this.lenses.values())
      .sort((a, b) => b.priority - a.priority);
  }
  
  detect(content: string): LensMatch {
    for (const lens of this.sortedLenses) {
      const matches = lens.detect(content);
      if (matches) {
        return { lens, confidence: 1.0 };
      }
    }
    
    // Default to prose
    return { lens: this.lenses.get('prose')!, confidence: 0.5 };
  }
  
  async parse(content: string, context: LensContext): Promise<Block> {
    const { lens } = this.detect(content);
    return lens.parse(content, context);
  }
  
  async render(block: Block, context: LensContext): Promise<string> {
    const lensName = block.source?.lens || this.detect(block.content).lens.name;
    const lens = this.lenses.get(lensName);
    
    if (!lens) {
      throw new Error(`Unknown lens: ${lensName}`);
    }
    
    return lens.render(block, context);
  }
  
  getByKind(kind: string): Lens | undefined {
    return this.sortedLenses.find(l => l.kind === kind);
  }
  
  list(): Lens[] {
    return this.sortedLenses;
  }
}
```

#### 3. Prose Lens (prose-lens.ts)

```typescript
export const proseLens: Lens = {
  name: 'prose',
  kind: 'note',
  description: 'Default prose/markdown content',
  priority: 0, // Lowest priority - fallback
  
  detect: (content: string): boolean => {
    // Always matches as fallback
    return true;
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    return {
      id: context.blockId,
      kind: 'note',
      content: content.trim(),
      metadata: {},
      source: {
        lens: 'prose',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    return block.content;
  }
};
```

#### 4. Code Lens (code-lens.ts)

```typescript
export const codeLens: Lens = {
  name: 'code',
  kind: 'code',
  description: 'Code blocks with language annotation',
  priority: 50,
  
  detect: (content: string): boolean => {
    return /^```[\w]+\n/.test(content.trim());
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    const match = content.match(/^```(\w+)?\n([\s\S]*?)\n?```$/);
    
    if (!match) {
      throw new Error('Invalid code block format');
    }
    
    const [, language = 'text', code] = match;
    
    return {
      id: context.blockId,
      kind: 'code',
      content: code,
      metadata: {
        language
      },
      source: {
        lens: 'code',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const lang = block.metadata.language || 'text';
    const indent = ' '.repeat(context.options.indent || 0);
    const code = block.content.split('\n').join(`\n${indent}`);
    
    return `${indent}\`\`\`${lang}\n${indent}${code}\n${indent}\`\`\``;
  }
};
```

#### 5. Entity Lens (entity-lens.ts)

```typescript
export const entityLens: Lens = {
  name: 'entity',
  kind: 'entity',
  description: 'Entity/struct definitions with typed fields',
  priority: 60,
  
  detect: (content: string): boolean => {
    const lines = content.trim().split('\n');
    const firstLine = lines[0] || '';
    
    // Check for EntityName: pattern followed by field:type
    if (!/^\w+:$/.test(firstLine)) return false;
    
    // Check remaining lines have field: type pattern
    const fieldLines = lines.slice(1).filter(l => l.trim());
    return fieldLines.some(line => /^\s+\w+:\s*\w+/.test(line));
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    const lines = content.trim().split('\n');
    const nameMatch = lines[0].match(/^(\w+):$/);
    
    if (!nameMatch) {
      throw new Error('Invalid entity format');
    }
    
    const name = nameMatch[1];
    const fields: FieldDef[] = [];
    
    for (const line of lines.slice(1)) {
      const fieldMatch = line.match(/^\s+(\w+):\s*(.+)$/);
      if (fieldMatch) {
        const [, fieldName, typeOrDesc] = fieldMatch;
        
        // Check if it's type: description or just type
        const typeMatch = typeOrDesc.match(/^(\w+)(?:\s+(.+))?$/);
        
        fields.push({
          name: fieldName,
          type: typeMatch ? typeMatch[1] : 'string',
          description: typeMatch?.[2] || undefined
        });
      }
    }
    
    return {
      id: context.blockId,
      kind: 'entity',
      content: name,
      metadata: {
        name,
        fields
      },
      source: {
        lens: 'entity',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const { name, fields } = block.metadata;
    const lines = [`${name}:`];
    
    for (const field of fields) {
      if (field.description) {
        lines.push(`  ${field.name}: ${field.type} ${field.description}`);
      } else {
        lines.push(`  ${field.name}: ${field.type}`);
      }
    }
    
    return lines.join('\n');
  }
};

interface FieldDef {
  name: string;
  type: string;
  description?: string;
}
```

#### 6. Operation Lens (operation-lens.ts)

```typescript
export const operationLens: Lens = {
  name: 'operation',
  kind: 'operation',
  description: 'Function/operation signatures with steps',
  priority: 55,
  
  detect: (content: string): boolean => {
    const lines = content.trim().split('\n');
    
    // Check for signature pattern: name(args) -> return
    const signaturePattern = /^\w+\([^)]*\)\s*(?:->|:)\s*\w+/;
    if (signaturePattern.test(lines[0])) return true;
    
    // Check for numbered steps
    return lines.some(line => /^\d+\.\s/.test(line.trim()));
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    const lines = content.trim().split('\n');
    
    // Parse signature
    const sigMatch = lines[0].match(/^(\w+)\(([^)]*)\)\s*(?:->|:)\s*(.+)$/);
    
    if (!sigMatch) {
      throw new Error('Invalid operation format');
    }
    
    const [, name, paramsStr, returnType] = sigMatch;
    const params = paramsStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p)
      .map(p => {
        const [paramName, paramType] = p.split(':').map(s => s.trim());
        return { name: paramName, type: paramType || 'any' };
      });
    
    // Parse steps (numbered or bulleted)
    const steps: string[] = [];
    for (const line of lines.slice(1)) {
      const stepMatch = line.match(/^\s*(?:\d+\.\s|[-*]\s)(.+)$/);
      if (stepMatch) {
        steps.push(stepMatch[1]);
      }
    }
    
    return {
      id: context.blockId,
      kind: 'operation',
      content: name,
      metadata: {
        name,
        params,
        returnType: returnType.trim(),
        steps
      },
      source: {
        lens: 'operation',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const { name, params, returnType, steps } = block.metadata;
    
    const paramsStr = params.map(p => `${p.name}: ${p.type}`).join(', ');
    const lines = [`${name}(${paramsStr}) -> ${returnType}`];
    
    if (steps && steps.length > 0) {
      lines.push('');
      steps.forEach((step, i) => {
        lines.push(`${i + 1}. ${step}`);
      });
    }
    
    return lines.join('\n');
  }
};
```

#### 7. Acceptance Lens (acceptance-lens.ts)

```typescript
export const acceptanceLens: Lens = {
  name: 'acceptance',
  kind: 'acceptance',
  description: 'GIVEN/WHEN/THEN acceptance criteria',
  priority: 65,
  
  detect: (content: string): boolean => {
    return /\bGIVEN\b.*\bWHEN\b.*\bTHEN\b/s.test(content.toUpperCase());
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    const sections = {
      given: [] as string[],
      when: [] as string[],
      then: [] as string[]
    };
    
    let currentSection: keyof typeof sections | null = null;
    
    for (const line of content.split('\n')) {
      const upperLine = line.trim().toUpperCase();
      
      if (upperLine.startsWith('GIVEN')) {
        currentSection = 'given';
        sections.given.push(line.trim().replace(/^GIVEN\s*/i, ''));
      } else if (upperLine.startsWith('WHEN')) {
        currentSection = 'when';
        sections.when.push(line.trim().replace(/^WHEN\s*/i, ''));
      } else if (upperLine.startsWith('THEN')) {
        currentSection = 'then';
        sections.then.push(line.trim().replace(/^THEN\s*/i, ''));
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim());
      }
    }
    
    return {
      id: context.blockId,
      kind: 'acceptance',
      content: '',
      metadata: sections,
      source: {
        lens: 'acceptance',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const { given, when, then } = block.metadata;
    const lines: string[] = [];
    
    given.forEach((g, i) => {
      lines.push(i === 0 ? `GIVEN ${g}` : `  AND ${g}`);
    });
    
    when.forEach((w, i) => {
      lines.push(i === 0 ? `WHEN ${w}` : `  AND ${w}`);
    });
    
    then.forEach((t, i) => {
      lines.push(i === 0 ? `THEN ${t}` : `  AND ${t}`);
    });
    
    return lines.join('\n');
  }
};
```

#### 8. Diagram Lens (diagram-lens.ts)

```typescript
export const diagramLens: Lens = {
  name: 'diagram',
  kind: 'diagram',
  description: 'Mermaid diagram blocks',
  priority: 70,
  
  detect: (content: string): boolean => {
    const trimmed = content.trim();
    return /^```mermaid\n/.test(trimmed) || 
           /^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|pie|gitGraph)/m.test(trimmed);
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    let mermaidCode = content;
    
    // Extract from code fence if present
    const fenceMatch = content.match(/^```mermaid\n([\s\S]*?)\n?```$/);
    if (fenceMatch) {
      mermaidCode = fenceMatch[1];
    }
    
    // Detect diagram type
    const diagramType = this.detectDiagramType(mermaidCode);
    
    return {
      id: context.blockId,
      kind: 'diagram',
      content: mermaidCode.trim(),
      metadata: {
        format: 'mermaid',
        diagramType
      },
      source: {
        lens: 'diagram',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    if (context.options.preserveSource && block.source?.original) {
      return block.source.original;
    }
    
    const code = block.content;
    return `\`\`\`mermaid\n${code}\n\`\`\``;
  },
  
  detectDiagramType: (code: string): string => {
    if (/^(graph|flowchart)/m.test(code)) return 'flowchart';
    if (/^sequenceDiagram/m.test(code)) return 'sequence';
    if (/^classDiagram/m.test(code)) return 'class';
    if (/^erDiagram/m.test(code)) return 'er';
    if (/^gantt/m.test(code)) return 'gantt';
    if (/^pie/m.test(code)) return 'pie';
    if (/^gitGraph/m.test(code)) return 'git';
    return 'unknown';
  }
};
```

#### 9. Lens Converter (converter.ts)

```typescript
export class LensConverter {
  private registry: LensRegistry;
  
  constructor(registry: LensRegistry) {
    this.registry = registry;
  }
  
  async convert(
    content: string,
    fromLens: string,
    toLens: string,
    context: LensContext
  ): Promise<string> {
    // Parse with source lens
    const source = this.registry.lenses.get(fromLens);
    if (!source) throw new Error(`Unknown source lens: ${fromLens}`);
    
    const block = await source.parse(content, context);
    
    // Render with target lens
    const target = this.registry.lenses.get(toLens);
    if (!target) throw new Error(`Unknown target lens: ${toLens}`);
    
    // Update block kind for target
    block.kind = target.kind;
    block.source!.lens = toLens;
    
    return target.render(block, context);
  }
  
  async autoConvert(
    content: string,
    targetKind: string,
    context: LensContext
  ): Promise<string> {
    const { lens: source } = this.registry.detect(content);
    const target = this.registry.getByKind(targetKind);
    
    if (!target) {
      throw new Error(`No lens for kind: ${targetKind}`);
    }
    
    return this.convert(content, source.name, target.name, context);
  }
}
```

#### 10. Initialize All Lenses

```typescript
// src/lenses/index.ts
import { LensRegistry } from './registry';
import { LensConverter } from './converter';
import { proseLens } from './prose-lens';
import { codeLens } from './code-lens';
import { entityLens } from './entity-lens';
import { operationLens } from './operation-lens';
import { acceptanceLens } from './acceptance-lens';
import { diagramLens } from './diagram-lens';

export function initializeLenses(): { registry: LensRegistry; converter: LensConverter } {
  const registry = new LensRegistry();
  
  // Register in priority order (highest first)
  registry.register(diagramLens);      // 70
  registry.register(acceptanceLens);   // 65
  registry.register(entityLens);       // 60
  registry.register(operationLens);    // 55
  registry.register(codeLens);         // 50
  registry.register(proseLens);        // 0 (fallback)
  
  const converter = new LensConverter(registry);
  
  return { registry, converter };
}

export { LensRegistry, LensConverter };
export type { Lens, Block, LensContext, LensOptions };
```

## Test Cases
1. Prose lens parses and renders plain text
2. Code lens handles multiple languages
3. Entity lens parses typed fields
4. Operation lens parses signatures and steps
5. Acceptance lens handles GIVEN/WHEN/THEN
6. Diagram lens detects Mermaid diagrams
7. Registry detects correct lens by content
8. Converter transforms between lenses
9. Round-trip: parse → render → parse yields same block
10. Priority ordering works correctly

## Validation
```bash
bun test tests/lenses.test.ts

# Test lens detection
speclang lens detect "# @block:test\nUser:\n  name: string"

# Test conversion
speclang lens convert input.spec --from entity --to code

# List available lenses
speclang lens list
```

## Output Format
After completing, output:
1. Files created
2. Lenses implemented
3. Detection rules summary
4. Test results
