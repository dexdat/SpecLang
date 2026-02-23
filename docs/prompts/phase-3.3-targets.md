# Bootstrap Phase 3.3: Compiler Target Languages

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 3.3 of the bootstrap process.

**Prerequisites**: 
- Phase 0-3.2 complete
- Core compiler infrastructure
- Code generation framework
- Template system working

## Your Task
Implement target language generators that convert SpecLang blocks into idiomatic code for TypeScript, Go, Rust, and Python. Each target handles type mappings, naming conventions, and language-specific patterns.

## Read These Specs First
1. `specs/compiler.spec.dir/targets.spec.md` - Target language specifications
2. `specs/compiler.spec.dir/templates.spec.md` - Template system
3. `specs/stdlib.spec.md` - Standard library types

## What to Build

### Files to Create
```
src/compiler/
├── targets/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Target types and interfaces
│   ├── registry.ts           # Target registry
│   ├── typescript.ts         # TypeScript generator
│   ├── go.ts                 # Go generator
│   ├── rust.ts               # Rust generator
│   ├── python.ts             # Python generator
│   └── type-mappings.ts      # Type mapping utilities
│
tests/
└── targets.test.ts
```

### Requirements

#### 1. Target Types (types.ts)

```typescript
interface Target {
  name: string;
  extension: string;
  description: string;
  
  // Core generation
  generateEntity: (entity: EntityBlock) => string;
  generateOperation: (operation: OperationBlock) => string;
  generateEnum: (enum_: EnumBlock) => string;
  generatePolicy: (policy: PolicyBlock) => string;
  
  // Type mapping
  mapType: (speclangType: string) => string;
  
  // Naming conventions
  formatName: (name: string, kind: 'type' | 'function' | 'variable' | 'constant') => string;
  
  // Imports/dependencies
  generateImports: (dependencies: string[]) => string;
  generateFile: (blocks: Block[], options: TargetOptions) => string;
}

interface TargetOptions {
  moduleName?: string;
  packageName?: string;
  namespace?: string;
  generateComments: boolean;
  strictTypes: boolean;
}

interface EntityBlock {
  id: string;
  name: string;
  fields: Field[];
  annotations?: Record<string, any>;
}

interface Field {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
  description?: string;
}

interface OperationBlock {
  id: string;
  name: string;
  params: Param[];
  returnType: string;
  isAsync: boolean;
  throws?: string[];
  description?: string;
}

interface Param {
  name: string;
  type: string;
  optional: boolean;
}

interface EnumBlock {
  id: string;
  name: string;
  values: EnumValue[];
  backingType?: string;
}

interface EnumValue {
  name: string;
  value?: string | number;
  description?: string;
}

interface PolicyBlock {
  id: string;
  name: string;
  rules: PolicyRule[];
}

interface PolicyRule {
  condition: string;
  action: 'allow' | 'deny';
  message?: string;
}
```

#### 2. Target Registry (registry.ts)

```typescript
export class TargetRegistry {
  private targets: Map<string, Target> = new Map();
  
  register(target: Target): void {
    this.targets.set(target.name, target);
  }
  
  get(name: string): Target | undefined {
    return this.targets.get(name);
  }
  
  getByExtension(ext: string): Target | undefined {
    return Array.from(this.targets.values())
      .find(t => t.extension === ext);
  }
  
  list(): string[] {
    return Array.from(this.targets.keys());
  }
  
  async generate(
    targetName: string,
    blocks: Block[],
    options: TargetOptions
  ): Promise<string> {
    const target = this.targets.get(targetName);
    
    if (!target) {
      throw new Error(`Unknown target: ${targetName}`);
    }
    
    return target.generateFile(blocks, options);
  }
}
```

#### 3. Type Mappings (type-mappings.ts)

```typescript
const SPECLANG_TYPES = {
  // Primitives
  'String': 'string',
  'Integer': 'integer',
  'Float': 'float',
  'Boolean': 'boolean',
  'Void': 'void',
  
  // Collections
  'Array': 'array',
  'Map': 'map',
  'Set': 'set',
  
  // Optional
  'Option': 'option',
  'Result': 'result',
  
  // Special
  'Date': 'date',
  'DateTime': 'datetime',
  'UUID': 'uuid',
  'Bytes': 'bytes',
  'JSON': 'json',
  'Any': 'any'
};

// Type mapping functions per target
export const typeMappings = {
  typescript: (type: string): string => {
    const base = type.replace(/[?\[\]]/g, '');
    const isOptional = type.includes('?');
    const isArray = type.includes('[]') || type.startsWith('Array<');
    
    const mapping: Record<string, string> = {
      'String': 'string',
      'Integer': 'number',
      'Float': 'number',
      'Boolean': 'boolean',
      'Void': 'void',
      'Date': 'Date',
      'DateTime': 'Date',
      'UUID': 'string',
      'Bytes': 'Uint8Array',
      'JSON': 'Record<string, any>',
      'Any': 'any',
      'Map': 'Record',
      'Set': 'Set'
    };
    
    let result = mapping[base] || base;
    
    if (isArray) {
      result = `${result}[]`;
    }
    
    if (isOptional) {
      result = `${result} | undefined`;
    }
    
    return result;
  },
  
  go: (type: string): string => {
    const base = type.replace(/[?\[\]]/g, '');
    const isArray = type.includes('[]') || type.startsWith('Array<');
    
    const mapping: Record<string, string> = {
      'String': 'string',
      'Integer': 'int',
      'Float': 'float64',
      'Boolean': 'bool',
      'Void': '',
      'Date': 'time.Time',
      'DateTime': 'time.Time',
      'UUID': 'uuid.UUID',
      'Bytes': '[]byte',
      'JSON': 'interface{}',
      'Any': 'interface{}',
      'Map': 'map[string]',
      'Set': 'map[struct]'
    };
    
    let result = mapping[base] || base;
    
    if (isArray) {
      result = `[]${result}`;
    }
    
    return result;
  },
  
  rust: (type: string): string => {
    const base = type.replace(/[?\[\]]/g, '');
    const isOptional = type.includes('?') || type.startsWith('Option<');
    const isArray = type.includes('[]') || type.startsWith('Array<');
    
    const mapping: Record<string, string> = {
      'String': 'String',
      'Integer': 'i32',
      'Float': 'f64',
      'Boolean': 'bool',
      'Void': '()',
      'Date': 'chrono::NaiveDate',
      'DateTime': 'chrono::DateTime<chrono::Utc>',
      'UUID': 'uuid::Uuid',
      'Bytes': 'Vec<u8>',
      'JSON': 'serde_json::Value',
      'Any': 'Box<dyn std::any::Any>',
      'Map': 'std::collections::HashMap<String, ',
      'Set': 'std::collections::HashSet<'
    };
    
    let result = mapping[base] || base;
    
    if (isArray) {
      result = `Vec<${result}>`;
    }
    
    if (isOptional) {
      result = `Option<${result}>`;
    }
    
    return result;
  },
  
  python: (type: string): string => {
    const base = type.replace(/[?\[\]]/g, '');
    const isArray = type.includes('[]') || type.startsWith('Array<');
    const isMap = type.startsWith('Map<');
    
    const mapping: Record<string, string> = {
      'String': 'str',
      'Integer': 'int',
      'Float': 'float',
      'Boolean': 'bool',
      'Void': 'None',
      'Date': 'datetime.date',
      'DateTime': 'datetime.datetime',
      'UUID': 'uuid.UUID',
      'Bytes': 'bytes',
      'JSON': 'dict[str, Any]',
      'Any': 'Any',
      'Map': 'dict[str, ',
      'Set': 'set['
    };
    
    let result = mapping[base] || base;
    
    if (isArray) {
      result = `list[${result}]`;
    }
    
    if (isMap) {
      result = `dict[str, ${result}]`;
    }
    
    return result;
  }
};
```

#### 4. TypeScript Target (typescript.ts)

```typescript
import { Target, EntityBlock, OperationBlock, EnumBlock, PolicyBlock, TargetOptions } from './types';
import { typeMappings } from './type-mappings';

export const typescriptTarget: Target = {
  name: 'typescript',
  extension: '.ts',
  description: 'TypeScript output with type inference and decorators',
  
  formatName: (name, kind) => {
    switch (kind) {
      case 'type': return name; // PascalCase
      case 'function': return name; // camelCase
      case 'variable': return name; // camelCase
      case 'constant': return name.toUpperCase(); // SCREAMING_SNAKE_CASE
    }
  },
  
  mapType: typeMappings.typescript,
  
  generateImports: (dependencies) => {
    if (dependencies.length === 0) return '';
    return dependencies.map(d => `import { ${d} } from './${d.toLowerCase()}';`).join('\n');
  },
  
  generateEntity: (entity: EntityBlock): string => {
    const lines: string[] = [];
    
    // Interface definition
    lines.push(`export interface ${entity.name} {`);
    
    for (const field of entity.fields) {
      const type = typeMappings.typescript(field.type);
      const optional = field.optional ? '?' : '';
      const comment = field.description ? `  /** ${field.description} */\n` : '';
      
      lines.push(`${comment}  ${field.name}${optional}: ${type};`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateOperation: (operation: OperationBlock): string => {
    const lines: string[] = [];
    
    // Function signature
    const params = operation.params
      .map(p => `${p.name}${p.optional ? '?' : ''}: ${typeMappings.typescript(p.type)}`)
      .join(', ');
    
    const returnType = typeMappings.typescript(operation.returnType);
    const asyncKeyword = operation.isAsync ? 'async ' : '';
    
    lines.push(`export ${asyncKeyword}function ${operation.name}(${params}): Promise<${returnType}> {`);
    
    if (operation.description) {
      lines.unshift(`/** ${operation.description} */`);
    }
    
    // Implementation stub
    lines.push('  // TODO: Implement');
    lines.push(`  throw new Error('Not implemented');`);
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateEnum: (enum_: EnumBlock): string => {
    const lines: string[] = [];
    
    lines.push(`export enum ${enum_.name} {`);
    
    for (const value of enum_.values) {
      const enumValue = value.value !== undefined ? ` = ${typeof value.value === 'string' ? `'${value.value}'` : value.value}` : '';
      const comment = value.description ? `  /** ${value.description} */\n` : '';
      lines.push(`${comment}  ${value.name}${enumValue},`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generatePolicy: (policy: PolicyBlock): string => {
    const lines: string[] = [];
    
    lines.push(`export function ${policy.name}Check(input: any): boolean {`);
    
    for (const rule of policy.rules) {
      if (rule.action === 'allow') {
        lines.push(`  if (${rule.condition}) return true;`);
      } else {
        lines.push(`  if (${rule.condition}) throw new Error('${rule.message || 'Access denied'}');`);
      }
    }
    
    lines.push('  return false;');
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateFile: (blocks: any[], options: TargetOptions): string => {
    const sections: string[] = [];
    
    // Header comment
    if (options.generateComments) {
      sections.push('// Auto-generated by SpecLang');
      sections.push(`// Generated at: ${new Date().toISOString()}`);
      sections.push('');
    }
    
    // Imports
    const imports = this.generateImports([]);
    if (imports) {
      sections.push(imports);
      sections.push('');
    }
    
    // Generate each block
    for (const block of blocks) {
      switch (block.kind) {
        case 'entity':
          sections.push(this.generateEntity(block));
          break;
        case 'operation':
          sections.push(this.generateOperation(block));
          break;
        case 'enum':
          sections.push(this.generateEnum(block));
          break;
        case 'policy':
          sections.push(this.generatePolicy(block));
          break;
      }
      sections.push('');
    }
    
    return sections.join('\n');
  }
};
```

#### 5. Go Target (go.ts)

```typescript
export const goTarget: Target = {
  name: 'go',
  extension: '.go',
  description: 'Go output with structs and explicit error handling',
  
  formatName: (name, kind) => {
    switch (kind) {
      case 'type': return name; // PascalCase
      case 'function': return name; // PascalCase (exported)
      case 'variable': return name[0].toLowerCase() + name.slice(1); // camelCase
      case 'constant': return name; // PascalCase
    }
  },
  
  mapType: typeMappings.go,
  
  generateImports: (dependencies) => {
    const stdImports: string[] = [];
    
    // Detect required imports from type usage
    if (dependencies.some(d => d.includes('time.Time'))) {
      stdImports.push('"time"');
    }
    if (dependencies.some(d => d.includes('uuid.UUID'))) {
      stdImports.push('"github.com/google/uuid"');
    }
    
    if (stdImports.length === 0) return '';
    
    return `import (\n${stdImports.map(i => `  ${i}`).join('\n')}\n)`;
  },
  
  generateEntity: (entity: EntityBlock): string => {
    const lines: string[] = [];
    
    lines.push(`type ${entity.name} struct {`);
    
    for (const field of entity.fields) {
      const type = typeMappings.go(field.type);
      const jsonTag = `\`json:"${field.name}${field.optional ? ',omitempty' : ''}"\``;
      const comment = field.description ? ` // ${field.description}` : '';
      
      lines.push(`  ${field.name} ${type} ${jsonTag}${comment}`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateOperation: (operation: OperationBlock): string => {
    const lines: string[] = [];
    
    const params = operation.params
      .map(p => `${p.name} ${typeMappings.go(p.type)}`)
      .join(', ');
    
    const returnType = typeMappings.go(operation.returnType);
    const errorReturn = 'error';
    
    lines.push(`func ${operation.name}(${params}) (${returnType}, ${errorReturn}) {`);
    lines.push('  // TODO: Implement');
    lines.push('  return nil, errors.New("not implemented")');
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateEnum: (enum_: EnumBlock): string => {
    const lines: string[] = [];
    
    lines.push(`type ${enum_.name} string`);
    lines.push('');
    lines.push('const (');
    
    for (const value of enum_.values) {
      const enumValue = value.value || value.name;
      lines.push(`  ${enum_.name}${value.name} ${enum_.name} = "${enumValue}"`);
    }
    
    lines.push(')');
    
    return lines.join('\n');
  },
  
  generatePolicy: (policy: PolicyBlock): string => {
    const lines: string[] = [];
    
    lines.push(`func ${policy.name}Check(input interface{}) error {`);
    
    for (const rule of policy.rules) {
      if (rule.action === 'deny') {
        lines.push(`  if ${rule.condition} {`);
        lines.push(`    return errors.New("${rule.message || 'Access denied'}")`);
        lines.push('  }');
      }
    }
    
    lines.push('  return nil');
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateFile: (blocks: any[], options: TargetOptions): string => {
    const sections: string[] = [];
    
    // Package declaration
    sections.push(`package ${options.packageName || 'main'}`);
    sections.push('');
    
    // Imports
    const imports = this.generateImports([]);
    if (imports) {
      sections.push(imports);
      sections.push('');
    }
    
    // Generate blocks
    for (const block of blocks) {
      switch (block.kind) {
        case 'entity':
          sections.push(this.generateEntity(block));
          break;
        case 'operation':
          sections.push(this.generateOperation(block));
          break;
        case 'enum':
          sections.push(this.generateEnum(block));
          break;
        case 'policy':
          sections.push(this.generatePolicy(block));
          break;
      }
      sections.push('');
    }
    
    return sections.join('\n');
  }
};
```

#### 6. Rust Target (rust.ts)

```typescript
export const rustTarget: Target = {
  name: 'rust',
  extension: '.rs',
  description: 'Rust output with ownership, lifetimes, and derive macros',
  
  formatName: (name, kind) => {
    switch (kind) {
      case 'type': return name; // PascalCase
      case 'function': return name[0].toLowerCase() + name.slice(1) + '_fn'; // snake_case
      case 'variable': return name[0].toLowerCase() + name.slice(1); // snake_case
      case 'constant': return name.toUpperCase(); // SCREAMING_SNAKE_CASE
    }
  },
  
  mapType: typeMappings.rust,
  
  generateImports: (dependencies) => {
    return `use serde::{Deserialize, Serialize};`;
  },
  
  generateEntity: (entity: EntityBlock): string => {
    const lines: string[] = [];
    
    lines.push('#[derive(Debug, Clone, Serialize, Deserialize)]');
    lines.push(`pub struct ${entity.name} {`);
    
    for (const field of entity.fields) {
      const type = typeMappings.rust(field.type);
      const optional = field.optional ? `Option<${type}>` : type;
      const comment = field.description ? `  /// ${field.description}\n` : '';
      
      lines.push(`${comment}  pub ${field.name[0].toLowerCase() + field.name.slice(1)}: ${optional},`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateOperation: (operation: OperationBlock): string => {
    const lines: string[] = [];
    
    const params = operation.params
      .map(p => `${p.name}: ${typeMappings.rust(p.type)}`)
      .join(', ');
    
    const returnType = typeMappings.rust(operation.returnType);
    const asyncKeyword = operation.isAsync ? 'async ' : '';
    
    lines.push(`pub ${asyncKeyword}fn ${operation.name}(${params}) -> Result<${returnType}, Box<dyn std::error::Error>> {`);
    lines.push('    // TODO: Implement');
    lines.push('    Err("not implemented".into())');
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateEnum: (enum_: EnumBlock): string => {
    const lines: string[] = [];
    
    lines.push('#[derive(Debug, Clone, Serialize, Deserialize)]');
    lines.push(`pub enum ${enum_.name} {`);
    
    for (const value of enum_.values) {
      const comment = value.description ? `    /// ${value.description}\n` : '';
      lines.push(`${comment}    ${value.name},`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generatePolicy: (policy: PolicyBlock): string => {
    const lines: string[] = [];
    
    lines.push(`pub fn ${policy.name}_check(input: &dyn std::any::Any) -> Result<(), String> {`);
    
    for (const rule of policy.rules) {
      if (rule.action === 'deny') {
        lines.push(`    if ${rule.condition} {`);
        lines.push(`        return Err("${rule.message || 'Access denied'}".to_string());`);
        lines.push('    }');
      }
    }
    
    lines.push('    Ok(())');
    lines.push('}');
    
    return lines.join('\n');
  },
  
  generateFile: (blocks: any[], options: TargetOptions): string => {
    const sections: string[] = [];
    
    // Module doc
    if (options.generateComments) {
      sections.push('//! Auto-generated by SpecLang');
    }
    
    // Imports
    sections.push(this.generateImports([]));
    sections.push('');
    
    // Generate blocks
    for (const block of blocks) {
      switch (block.kind) {
        case 'entity':
          sections.push(this.generateEntity(block));
          break;
        case 'operation':
          sections.push(this.generateOperation(block));
          break;
        case 'enum':
          sections.push(this.generateEnum(block));
          break;
        case 'policy':
          sections.push(this.generatePolicy(block));
          break;
      }
      sections.push('');
    }
    
    return sections.join('\n');
  }
};
```

#### 7. Python Target (python.ts)

```typescript
export const pythonTarget: Target = {
  name: 'python',
  extension: '.py',
  description: 'Python output with type hints and Pydantic models',
  
  formatName: (name, kind) => {
    switch (kind) {
      case 'type': return name; // PascalCase
      case 'function': return name[0].toLowerCase() + name.slice(1); // snake_case
      case 'variable': return name[0].toLowerCase() + name.slice(1); // snake_case
      case 'constant': return name.toUpperCase(); // SCREAMING_SNAKE_CASE
    }
  },
  
  mapType: typeMappings.python,
  
  generateImports: (dependencies) => {
    const imports = [
      'from typing import Optional, List, Dict, Any',
      'from datetime import datetime, date',
      'from pydantic import BaseModel',
      'import uuid'
    ];
    return imports.join('\n');
  },
  
  generateEntity: (entity: EntityBlock): string => {
    const lines: string[] = [];
    
    lines.push(`class ${entity.name}(BaseModel):`);
    
    if (entity.fields.length === 0) {
      lines.push('    pass');
    } else {
      for (const field of entity.fields) {
        const type = typeMappings.python(field.type);
        const optional = field.optional ? `Optional[${type}] = None` : type;
        const comment = field.description ? `  # ${field.description}` : '';
        
        lines.push(`    ${field.name}: ${optional}${comment}`);
      }
    }
    
    return lines.join('\n');
  },
  
  generateOperation: (operation: OperationBlock): string => {
    const lines: string[] = [];
    
    const params = operation.params
      .map(p => `${p.name}: ${typeMappings.python(p.type)}${p.optional ? ' = None' : ''}`)
      .join(', ');
    
    const returnType = typeMappings.python(operation.returnType);
    const asyncKeyword = operation.isAsync ? 'async ' : '';
    
    if (operation.description) {
      lines.push(`    """${operation.description}"""`);
    }
    
    lines.push(`${asyncKeyword}def ${operation.name}(${params}) -> ${returnType}:`);
    lines.push('    raise NotImplementedError("Not implemented")');
    
    return lines.join('\n');
  },
  
  generateEnum: (enum_: EnumBlock): string => {
    const lines: string[] = [];
    
    lines.push('from enum import Enum');
    lines.push('');
    lines.push(`class ${enum_.name}(str, Enum):`);
    
    for (const value of enum_.values) {
      const enumValue = value.value || value.name;
      const comment = value.description ? `  # ${value.description}` : '';
      lines.push(`    ${value.name} = "${enumValue}"${comment}`);
    }
    
    return lines.join('\n');
  },
  
  generatePolicy: (policy: PolicyBlock): string => {
    const lines: string[] = [];
    
    lines.push(`def ${policy.name}_check(input: Any) -> bool:`);
    
    for (const rule of policy.rules) {
      if (rule.action === 'deny') {
        lines.push(`    if ${rule.condition}:`);
        lines.push(`        raise ValueError("${rule.message || 'Access denied'}")`);
      }
    }
    
    lines.push('    return True');
    
    return lines.join('\n');
  },
  
  generateFile: (blocks: any[], options: TargetOptions): string => {
    const sections: string[] = [];
    
    // Module docstring
    if (options.generateComments) {
      sections.push('"""Auto-generated by SpecLang"""');
      sections.push('');
    }
    
    // Imports
    sections.push(this.generateImports([]));
    sections.push('');
    
    // Generate blocks
    for (const block of blocks) {
      switch (block.kind) {
        case 'entity':
          sections.push(this.generateEntity(block));
          break;
        case 'operation':
          sections.push(this.generateOperation(block));
          break;
        case 'enum':
          sections.push(this.generateEnum(block));
          break;
        case 'policy':
          sections.push(this.generatePolicy(block));
          break;
      }
      sections.push('');
    }
    
    return sections.join('\n');
  }
};
```

#### 8. Register All Targets

```typescript
// src/compiler/targets/index.ts
import { TargetRegistry } from './registry';
import { typescriptTarget } from './typescript';
import { goTarget } from './go';
import { rustTarget } from './rust';
import { pythonTarget } from './python';

export { TargetRegistry };
export type { Target, TargetOptions, EntityBlock, OperationBlock, EnumBlock, PolicyBlock };

export function initializeTargets(): TargetRegistry {
  const registry = new TargetRegistry();
  
  registry.register(typescriptTarget);
  registry.register(goTarget);
  registry.register(rustTarget);
  registry.register(pythonTarget);
  
  return registry;
}
```

## Test Cases
1. TypeScript entity generates interface
2. TypeScript operation generates function
3. TypeScript enum generates union/enum
4. Go entity generates struct with tags
5. Go operation generates func with error
6. Rust entity generates struct with derives
7. Rust operation generates Result
8. Python entity generates Pydantic model
9. Python operation generates async def
10. Type mappings handle all primitives

## Validation
```bash
# Test generation
speclang compile input.spec --target typescript
speclang compile input.spec --target go
speclang compile input.spec --target rust
speclang compile input.spec --target python

# Run tests
bun test tests/targets.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Targets implemented
3. Type mappings supported
4. Test results
