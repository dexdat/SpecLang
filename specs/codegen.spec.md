# speclang-header lines:10
id: "@specs/codegen"
version: 1.0.0
layer: 2
project_level: Alpha
target: src/codegen/index.ts
agent_support: agent_assisted
tags: [codegen, core]
short: Code generation system for SpecLang
---

# Code Generation System

The code generation system transforms spec blocks into executable code for multiple target languages.

## Architecture

### @block::index @kind:code
Main entry point - exports all codegen functionality.

### @block::parser @kind:code
Parses code blocks from spec files.

### @block::mapper @kind:code  
Maps spec types to target language types.

### @block::writer @kind:code
Writes generated code to filesystem.

### @block::types @kind:code
Type definitions for codegen system.

### @block::templates @kind:code
Template rendering system.

## Targets

### @block::targets/index @kind:code
Target registry and generation orchestration.

### @block::targets/go @kind:code
Go language target generator.

### @block::targets/python @kind:code
Python target generator.

### @block::targets/typescript @kind:code
TypeScript target generator.

### @block::targets/rust @kind:code
Rust target generator.

### @block::generator-interface @kind:code
Defines the interface for code generators.

```typescript
interface TargetGenerator {
  language: string;
  extension: string;
  
  // Generate code from spec
  generate(spec: CodeSpec): GeneratedFile[];
  
  // Type mapping
  mapType(stdlibType: string): string;
  
  // Import handling
  formatImports(imports: string[]): string;
  
  // File header
  fileHeader(spec: CodeSpec): string;
  
  // File footer
  fileFooter(spec: CodeSpec): string;
}

interface GeneratedFile {
  path: string;
  content: string;
  source_block: string;
}

interface CodeSpec {
  header: SpecMetadata;
  target: {
    language: 'typescript' | 'go' | 'python' | 'rust';
    outputPath: string;
  };
  blocks: CodeBlock[];
  imports: string[];
}

interface CodeBlock {
  id: string;
  kind: 'code' | 'interface' | 'function' | 'class' | 'type';
  language: string;
  content: string;
  refs: string[];
  line: number;
}
```

### @block::template-system @kind:code
Template rendering system.

```typescript
interface Template {
  name: string;
  target: string;
  content: string;
  variables: string[];
}

const TEMPLATES = {
  typescript: {
    interface: `export interface {{name}} {\n{{fields}}\n}`,
    function: `export async function {{name}}({{params}}): Promise<{{return}}> {\n{{body}}\n}`,
    class: `export class {{name}} {\n{{body}}\n}`,
  },
  go: {
    struct: `type {{name}} struct {\n{{fields}}\n}`,
    func: `func {{name}}({{params}}) ({{return}}) {\n{{body}}\n}`,
  },
  python: {
    class: `class {{name}}:\n{{body}}`,
    function: `def {{name}}({{params}}):\n{{body}}`,
  },
  rust: {
    struct: `struct {{name}} {\n{{fields}}\n}`,
    impl: `impl {{name}} {\n{{body}}\n}`,
  },
};

function renderTemplate(template: string, vars: Record<string, string>): string;
```

### @block::template-conditionals @kind:code
Template conditionals - supported via ternary and helper functions.

```typescript
// Simple conditional using ternary
const conditionalTemplate = `{{#if isAsync}}async {{/if}}function {{name}}()`;

// Using helper function
function renderConditional(condition: boolean, ifTrue: string, ifFalse: string): string {
  return condition ? ifTrue : ifFalse;
}
```

### @block::template-loops @kind:code
Template loops - supported via helper functions and map.

```typescript
// Loop via map
const fieldsTemplate = (fields: Field[]) => fields.map(f => `  ${f.name}: ${f.type};`).join('\n');

// Loop inline via helper
function renderList<T>(items: T[], render: (item: T) => string): string {
  return items.map(render).join('');
}
```

### @block::output-format @kind:code
Output format for generated code.

```typescript
interface GeneratedFile {
  path: string;
  content: string;
  source_block: string;
}

const GENERATED_HEADER = `// SPECLANG-GENERATED: Do not edit directly
// Source: {{source}}
// Generated: {{timestamp}}
// Edit the spec, not this file.`;

function formatGeneratedFile(spec: CodeSpec, content: string): string;
```

### @block::examples @kind:note
Examples of code generation from specs.

**Example 1: Interface Generation**

Input spec:
```markdown
### @block:user-model @kind:interface
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

Generated TypeScript:
```typescript
// SPECLANG-GENERATED: Do not edit directly
// Source: specs/user.spec.md#user-model
// Generated: 2026-03-30T12:00:00Z
// Edit the spec, not this file.

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

Generated Go:
```go
// SPECLANG-GENERATED: Do not edit directly
// Source: specs/user.spec.md#user-model
// Generated: 2026-03-30T12:00:00Z
// Edit the spec, not this file.

type User struct {
  ID        string    `json:"id"`
  Name      string    `json:"name"`
  Email     string    `json:"email"`
  CreatedAt time.Time `json:"createdAt"`
}
```

**Example 2: Function Generation**

Input spec:
```markdown
### @block:create-user @kind:function
async function createUser(name: string, email: string): Promise<User>
```

Generated TypeScript:
```typescript
export async function createUser(name: string, email: string): Promise<User> {
  const user = await db.create({ name, email });
  return user;
}
```

**Example 3: Class Generation**

Input spec:
```markdown
### @block:user-service @kind:class
class UserService {
  async findById(id: string): Promise<User>
  async update(id: string, data: Partial<User>): Promise<User>
  async delete(id: string): Promise<void>
}
```

Generated TypeScript:
```typescript
export class UserService {
  async findById(id: string): Promise<User> {
    return this.db.findById('users', id);
  }
  
  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.update('users', id, data);
  }
  
  async delete(id: string): Promise<void> {
    return this.db.delete('users', id);
  }
}
```

