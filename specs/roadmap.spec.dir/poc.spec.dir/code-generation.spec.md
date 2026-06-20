# speclang-header lines:10
id: "@speclang/roadmap/poc/code-generation"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Generate code from spec blocks"
tags: [poc, codegen, generation, typescript]
project_level: Alpha
agent_support: agent_autonomous
---

# POC: Code Generation

Generate TypeScript code from spec blocks.

## Requirements

### @poc/codegen/parser

**Parse Spec Blocks:**
```markdown
### @block::greet @kind:function
Greets a user by name.

**Parameters:**
- name: string - User's name

**Returns:** string - Greeting message
```

**Extract:**
- Block ID: `greet`
- Kind: `function`
- Description
- Parameters
- Return type

### @poc/codegen/templates

**TypeScript Function Template:**
```typescript
/**
 * {{description}}
 * Generated from: {{specId}}#{{blockId}}
 * Version: {{version}}
 */
export function {{name}}({{params}}): {{returnType}} {
  // TODO: Implement
  throw new Error('Not implemented');
}
```

## Implementation

### @poc/codegen/impl

```typescript
export class CodeGenerator {
  generate(specPath: string, block: SpecBlock): string {
    const template = this.loadTemplate(block.kind);
    const code = template.fill({
      name: block.id,
      description: block.description,
      params: this.formatParams(block.parameters),
      returnType: block.returns?.type || 'void'
    });
    
    return this.addHeader(code, specPath, block);
  }
  
  private addHeader(code: string, specPath: string, block: SpecBlock): string {
    return `// SPECLANG-GENERATED: ${block.kind}
// Source: ${specPath}#${block.id}
// DO NOT EDIT MANUALLY

${code}`;
  }
}
```

## Output

### @poc/codegen/output

**Generated File Location:**
- Path: `specs/{slugified-spec-id}.spec.dir/src/{blockId}.ts`
- Symlink: `src/{slugified-spec-id}` → `specs/{slugified-spec-id}.spec.dir/src`

**Slugification:**
```typescript
// Spec ID → Directory slug
'@examples/greeting' → 'examples-greeting'
'@speclang/core/types' → 'speclang-core-types'
```

**Example:**
```
specs/greeting.spec.md (user spec)
  → specs/examples-greeting.spec.dir/src/greet.ts (generated)
  → src/examples-greeting (symlink to generated dir)
```

**Full Path Resolution:**
```typescript
import { slugifySpecId } from './path-utils';

const specId = '@examples/greeting';
const blockId = 'greet';

const specSlug = slugifySpecId(specId);  // 'examples-greeting'
const outputPath = `specs/${specSlug}.spec.dir/src/${blockId}.ts`;
// → 'specs/examples-greeting.spec.dir/src/greet.ts'
```
