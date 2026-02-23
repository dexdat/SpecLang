# Bootstrap Phase 3.2: Code Generation Templates

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 3.2 of the bootstrap process.

**Prerequisites**: 
- Phase 0-2 complete
- Phase 3.1 (Codegen) in progress

## Your Task
Implement the template engine and language-specific templates for code generation. Templates convert spec blocks into idiomatic code with proper markers for sync.

## Read These Specs First
1. `specs/compiler.spec.dir/templates.spec.md` - Template specification

## What to Build

### Files to Create
```
src/templates/
├── index.ts              # Main exports
├── engine.ts             # Template engine
├── markers.ts            # Marker generation
├── registry.ts           # Template registry
└── languages/
    ├── typescript.ts     # TypeScript templates
    ├── go.ts             # Go templates
    ├── python.ts         # Python templates
    ├── rust.ts           # Rust templates
    └── sql.ts            # SQL templates

tests/
└── templates.test.ts
```

### Requirements

#### 1. Template Engine (engine.ts)

```typescript
interface TemplateContext {
  name: string;
  blockId: string;
  version: string;
  layer: number;
  fields?: FieldDefinition[];
  methods?: MethodDefinition[];
  [key: string]: any;
}

interface TemplateResult {
  code: string;
  markers: CodeMarker[];
  imports: string[];
}

export class TemplateEngine {
  private registry: TemplateRegistry;
  
  constructor() {
    this.registry = new TemplateRegistry();
  }
  
  render(templateName: string, context: TemplateContext): TemplateResult {
    const template = this.registry.get(templateName);
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    const code = template.render(context);
    const markers = this.generateMarkers(context);
    const imports = this.extractImports(code);
    
    return { code, markers, imports };
  }
  
  private generateMarkers(context: TemplateContext): CodeMarker[] {
    return [
      { key: '@speclang-id', value: context.blockId },
      { key: '@speclang-version', value: context.version },
      { key: '@speclang-layer', value: context.layer.toString() },
      { key: '@speclang-generated', value: 'DO NOT EDIT BY HAND' }
    ];
  }
  
  private extractImports(code: string): string[] {
    // Extract import statements from generated code
    const importRegex = /^import\s+.+$/gm;
    return code.match(importRegex) || [];
  }
}
```

#### 2. Code Markers (markers.ts)

```typescript
interface CodeMarker {
  key: string;
  value: string;
}

export class MarkerGenerator {
  generateBlock(blockId: string, version: string, layer: number): string[] {
    return [
      `// @speclang-id: ${blockId}`,
      `// @speclang-version: ${version}`,
      `// @speclang-layer: ${layer}`,
      `// @speclang-generated: DO NOT EDIT BY HAND`
    ];
  }
  
  generateBlockStart(blockId: string): string {
    return `// @speclang-start: ${blockId}`;
  }
  
  generateBlockEnd(blockId: string): string {
    return `// @speclang-end: ${blockId}`;
  }
  
  parseMarkers(code: string): Map<string, string> {
    const markers = new Map<string, string>();
    const regex = /\/\/\s*@speclang-(\w+):\s*(.+)$/gm;
    
    let match;
    while ((match = regex.exec(code)) !== null) {
      markers.set(match[1], match[2]);
    }
    
    return markers;
  }
  
  extractBlockId(code: string): string | null {
    const match = code.match(/\/\/\s*@speclang-id:\s*(.+)$/m);
    return match ? match[1].trim() : null;
  }
}
```

#### 3. Template Registry (registry.ts)

```typescript
type TemplateHandler = (context: TemplateContext) => string;

interface TemplateDefinition {
  name: string;
  language: string;
  kind: 'entity' | 'operation' | 'interface' | 'enum' | 'type';
  handler: TemplateHandler;
}

export class TemplateRegistry {
  private templates: Map<string, TemplateDefinition> = new Map();
  
  register(definition: TemplateDefinition): void {
    const key = `${definition.language}/${definition.kind}`;
    this.templates.set(key, definition);
  }
  
  get(name: string): TemplateDefinition | undefined {
    return this.templates.get(name);
  }
  
  getByLanguage(language: string): TemplateDefinition[] {
    return Array.from(this.templates.values())
      .filter(t => t.language === language);
  }
  
  getByKind(kind: string): TemplateDefinition[] {
    return Array.from(this.templates.values())
      .filter(t => t.kind === kind);
  }
}
```

#### 4. TypeScript Templates (languages/typescript.ts)

```typescript
import { TemplateDefinition, TemplateContext } from '../engine';

export const typescriptTemplates: TemplateDefinition[] = [
  // Entity -> Interface
  {
    name: 'typescript/entity',
    language: 'typescript',
    kind: 'entity',
    handler: (ctx: TemplateContext) => {
      const fields = ctx.fields || [];
      const fieldLines = fields.map(f => 
        `  ${f.name}: ${mapTsType(f.type)};`
      ).join('\n');
      
      return `// @speclang-id: ${ctx.blockId}
// @speclang-version: ${ctx.version}
// @speclang-layer: ${ctx.layer}
// @speclang-generated: DO NOT EDIT BY HAND

export interface ${ctx.name} {
${fieldLines}
}
`;
    }
  },
  
  // Entity -> Type Alias
  {
    name: 'typescript/type',
    language: 'typescript',
    kind: 'type',
    handler: (ctx: TemplateContext) => {
      return `// @speclang-id: ${ctx.blockId}
// @speclang-generated: DO NOT EDIT BY HAND

export type ${ctx.name} = ${ctx.definition};
`;
    }
  },
  
  // Operation -> Function
  {
    name: 'typescript/operation',
    language: 'typescript',
    kind: 'operation',
    handler: (ctx: TemplateContext) => {
      const params = (ctx.params || [])
        .map(p => `${p.name}: ${mapTsType(p.type)}`)
        .join(', ');
      const returnType = mapTsType(ctx.returnType || 'void');
      
      return `// @speclang-id: ${ctx.blockId}
// @speclang-generated: DO NOT EDIT BY HAND

export async function ${ctx.name}(${params}): Promise<${returnType}> {
  // @speclang-start: implementation
  // Implementation generated from spec
  // @speclang-end: implementation
}
`;
    }
  },
  
  // Enum
  {
    name: 'typescript/enum',
    language: 'typescript',
    kind: 'enum',
    handler: (ctx: TemplateContext) => {
      const values = (ctx.values || [])
        .map(v => `  ${v.name} = "${v.value}",`)
        .join('\n');
      
      return `// @speclang-id: ${ctx.blockId}
// @speclang-generated: DO NOT EDIT BY HAND

export enum ${ctx.name} {
${values}
}
`;
    }
  }
];

function mapTsType(specType: string): string {
  const typeMap: Record<string, string> = {
    'String': 'string',
    'Integer': 'number',
    'Float': 'number',
    'Boolean': 'boolean',
    'DateTime': 'Date',
    'UUID': 'string',
    'List': 'Array',
    'Map': 'Record',
  };
  
  return typeMap[specType] || specType;
}
```

#### 5. Go Templates (languages/go.ts)

```typescript
export const goTemplates: TemplateDefinition[] = [
  // Entity -> Struct
  {
    name: 'go/entity',
    language: 'go',
    kind: 'entity',
    handler: (ctx: TemplateContext) => {
      const fields = (ctx.fields || []).map(f => {
        const jsonTag = `\`json:"${f.name}"\``;
        return `\t${capitalize(f.name)} ${mapGoType(f.type)} ${jsonTag}`;
      }).join('\n');
      
      return `// @speclang-id: ${ctx.blockId}
// @speclang-version: ${ctx.version}
// @speclang-generated: DO NOT EDIT BY HAND

type ${ctx.name} struct {
${fields}
}
`;
    }
  },
  
  // Operation -> Function
  {
    name: 'go/operation',
    language: 'go',
    kind: 'operation',
    handler: (ctx: TemplateContext) => {
      const params = (ctx.params || [])
        .map(p => `${p.name} ${mapGoType(p.type)}`)
        .join(', ');
      const returnType = ctx.returnType ? mapGoType(ctx.returnType) : '';
      const returnDecl = returnType ? `(${returnType}, error)` : 'error';
      
      return `// @speclang-id: ${ctx.blockId}
// @speclang-generated: DO NOT EDIT BY HAND

func ${ctx.name}(${params}) ${returnDecl} {
\t// @speclang-start: implementation
\t// Implementation generated from spec
\t// @speclang-end: implementation
}
`;
    }
  }
];

function mapGoType(specType: string): string {
  const typeMap: Record<string, string> = {
    'String': 'string',
    'Integer': 'int',
    'Float': 'float64',
    'Boolean': 'bool',
    'DateTime': 'time.Time',
    'UUID': 'uuid.UUID',
  };
  
  return typeMap[specType] || specType;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

#### 6. Python Templates (languages/python.ts)

```typescript
export const pythonTemplates: TemplateDefinition[] = [
  // Entity -> dataclass
  {
    name: 'python/entity',
    language: 'python',
    kind: 'entity',
    handler: (ctx: TemplateContext) => {
      const fields = (ctx.fields || [])
        .map(f => `    ${f.name}: ${mapPythonType(f.type)}`)
        .join('\n');
      
      return `# @speclang-id: ${ctx.blockId}
# @speclang-version: ${ctx.version}
# @speclang-generated: DO NOT EDIT BY HAND

from dataclasses import dataclass
from typing import Optional

@dataclass
class ${ctx.name}:
${fields}
`;
    }
  },
  
  // Operation -> Function
  {
    name: 'python/operation',
    language: 'python',
    kind: 'operation',
    handler: (ctx: TemplateContext) => {
      const params = (ctx.params || [])
        .map(p => `${p.name}: ${mapPythonType(p.type)}`)
        .join(', ');
      const returnType = mapPythonType(ctx.returnType || 'None');
      
      return `# @speclang-id: ${ctx.blockId}
# @speclang-generated: DO NOT EDIT BY HAND

async def ${ctx.name}(${params}) -> ${returnType}:
    # @speclang-start: implementation
    # Implementation generated from spec
    # @speclang-end: implementation
    pass
`;
    }
  }
];

function mapPythonType(specType: string): string {
  const typeMap: Record<string, string> = {
    'String': 'str',
    'Integer': 'int',
    'Float': 'float',
    'Boolean': 'bool',
    'DateTime': 'datetime',
    'UUID': 'UUID',
    'List': 'List',
    'Map': 'Dict',
  };
  
  return typeMap[specType] || specType;
}
```

#### 7. SQL Templates (languages/sql.ts)

```typescript
export const sqlTemplates: TemplateDefinition[] = [
  // Entity -> Table
  {
    name: 'sql/table',
    language: 'sql',
    kind: 'entity',
    handler: (ctx: TemplateContext) => {
      const columns = (ctx.fields || [])
        .map(f => {
          const sqlType = mapSqlType(f.type);
          const nullable = f.nullable ? '' : ' NOT NULL';
          const primary = f.primary ? ' PRIMARY KEY' : '';
          return `    ${f.name} ${sqlType}${nullable}${primary}`;
        })
        .join(',\n');
      
      return `-- @speclang-id: ${ctx.blockId}
-- @speclang-version: ${ctx.version}
-- @speclang-generated: DO NOT EDIT BY HAND

CREATE TABLE IF NOT EXISTS ${ctx.name} (
${columns}
);
`;
    }
  },
  
  // Operation -> Stored Procedure
  {
    name: 'sql/procedure',
    language: 'sql',
    kind: 'operation',
    handler: (ctx: TemplateContext) => {
      const params = (ctx.params || [])
        .map(p => `    IN ${p.name} ${mapSqlType(p.type)}`)
        .join(',\n');
      
      return `-- @speclang-id: ${ctx.blockId}
-- @speclang-generated: DO NOT EDIT BY HAND

DELIMITER //
CREATE PROCEDURE ${ctx.name}(
${params}
)
BEGIN
    -- @speclang-start: implementation
    -- Implementation generated from spec
    -- @speclang-end: implementation
END //
DELIMITER ;
`;
    }
  }
];

function mapSqlType(specType: string): string {
  const typeMap: Record<string, string> = {
    'String': 'VARCHAR(255)',
    'Integer': 'INTEGER',
    'Float': 'DOUBLE',
    'Boolean': 'BOOLEAN',
    'DateTime': 'TIMESTAMP',
    'UUID': 'UUID',
    'Text': 'TEXT',
  };
  
  return typeMap[specType] || 'VARCHAR(255)';
}
```

#### 8. Template Initialization

```typescript
// src/templates/index.ts
import { TemplateRegistry } from './registry';
import { typescriptTemplates } from './languages/typescript';
import { goTemplates } from './languages/go';
import { pythonTemplates } from './languages/python';
import { sqlTemplates } from './languages/sql';

export function initializeTemplates(): TemplateRegistry {
  const registry = new TemplateRegistry();
  
  // Register all templates
  for (const template of [...typescriptTemplates, ...goTemplates, ...pythonTemplates, ...sqlTemplates]) {
    registry.register(template);
  }
  
  return registry;
}

export { TemplateEngine } from './engine';
export { MarkerGenerator } from './markers';
```

## Test Cases
1. TypeScript entity generates interface
2. TypeScript operation generates function
3. Go entity generates struct
4. Python entity generates dataclass
5. SQL entity generates table
6. Markers are correctly inserted
7. Block IDs preserved in output
8. Type mapping works correctly

## Validation
```bash
bun test tests/templates.test.ts

# Test specific template
bun run src/templates/test.ts typescript/entity
```

## Output Format
After completing, output:
1. Files created
2. Templates per language
3. Marker format
4. Test results
