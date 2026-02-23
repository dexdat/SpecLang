# Bootstrap Phase 3.1: Code Generator Framework

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 3.1 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1 (Core Runtime) complete
- Phase 2 (MCP Interface) complete

## Your Task
Implement the code generator that transforms spec files into working code. This is where specs become reality.

## Read These Specs First
1. `specs/compiler.spec.md` - Codegen pipeline
2. `specs/stdlib.spec.md` - Built-in types and mappings
3. `specs/lenses.spec.md` - Content formats
4. `specs/implementation/codegen/ts.spec` - TypeScript target
5. `specs/implementation/codegen/go.spec` - Go target

## What to Build

### Files to Create
```
src/codegen/
├── index.ts            # Main generator
├── parser.ts           # Spec parser for codegen
├── types.ts            # Codegen types
├── mapper.ts           # Type mapper
├── templates.ts        # Template system
├── targets/
│   ├── index.ts        # Target registry
│   ├── typescript.ts   # TypeScript generator
│   ├── go.ts           # Go generator
│   ├── python.ts       # Python generator
│   └── rust.ts         # Rust generator
└── writer.ts           # File writer

tests/codegen/
├── parser.test.ts
├── typescript.test.ts
└── fixtures/
    └── sample.ts.spec
```

### Requirements

#### 1. Spec Parser for Codegen (parser.ts)
```typescript
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
  id: string;            // @block:auth/login
  kind: 'code' | 'interface' | 'function' | 'class' | 'type';
  language: string;
  content: string;
  refs: string[];        // @ref: markers
  line: number;
}

function parseCodeSpec(filepath: string): CodeSpec;
```

#### 2. Type Mapper (mapper.ts)
```typescript
// From stdlib.spec.md
type StdlibType = 
  | 'String' | 'Int' | 'Float' | 'Bool'
  | 'Date' | 'DateTime' | 'UUID'
  | 'Array<T>' | 'Map<K,V>'
  | 'Optional<T>';

interface TypeMapping {
  stdlib: StdlibType;
  typescript: string;
  go: string;
  python: string;
  rust: string;
}

const TYPE_MAPPINGS: TypeMapping[] = [
  { stdlib: 'String', typescript: 'string', go: 'string', python: 'str', rust: 'String' },
  { stdlib: 'Int', typescript: 'number', go: 'int', python: 'int', rust: 'i32' },
  { stdlib: 'Bool', typescript: 'boolean', go: 'bool', python: 'bool', rust: 'bool' },
  { stdlib: 'Date', typescript: 'Date', go: 'time.Time', python: 'datetime.date', rust: 'chrono::NaiveDate' },
  // ... etc
];

function mapType(stdlibType: string, target: string): string;
```

#### 3. Template System (templates.ts)
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
  // ... etc
};

function renderTemplate(template: string, vars: Record<string, string>): string;
```

#### 4. Target Generator Interface (targets/index.ts)
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
```

#### 5. TypeScript Generator (targets/typescript.ts)
```typescript
class TypeScriptGenerator implements TargetGenerator {
  language = 'typescript';
  extension = '.ts';
  
  generate(spec: CodeSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Parse each block
    for (const block of spec.blocks) {
      if (block.kind === 'interface') {
        files.push(this.generateInterface(spec, block));
      } else if (block.kind === 'function') {
        files.push(this.generateFunction(spec, block));
      }
      // ... etc
    }
    
    // Combine into single file or split
    return this.combineOrSplit(files, spec.target.outputPath);
  }
  
  private generateInterface(spec: CodeSpec, block: CodeBlock): GeneratedFile {
    // Extract interface definition from block
    // Apply type mappings
    // Generate clean TypeScript
  }
}
```

#### 6. File Writer (writer.ts)
```typescript
class CodeWriter {
  // Write generated files
  write(files: GeneratedFile[]): WriteResult;
  
  // Respect SPECLANG-ID markers for incremental updates
  updateWithMarkers(filepath: string, blocks: CodeBlock[]): void;
  
  // Backup before overwriting
  backup(filepath: string): string;
}

interface WriteResult {
  written: string[];
  skipped: string[];    // Unchanged files
  errors: { file: string, error: string }[];
}
```

### Input Spec Format
```yaml
# speclang-header lines:10
id: @specs/auth.ts
version: 1.0.0
target: src/auth/index.ts
depends_on:
  - @ref:speclang/auth/entities
  - @ref:speclang/auth/flows
---

## @block:auth/types
```typescript
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}
```

## @block:auth/login @ref:speclang/auth/flows#middleware-flow
```typescript
export async function login(
  email: string,
  password: string
): Promise<User> {
  // SPECLANG-IMPLEMENT: @ref:speclang/auth/flows#middleware-flow
}
```
```

### Output Format
```typescript
// src/auth/index.ts
// SPECLANG-GENERATED: Do not edit directly
// Source: specs/auth.ts.spec
// Generated: 2024-01-15T10:30:00Z

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export async function login(
  email: string,
  password: string
): Promise<User> {
  // SPECLANG-IMPLEMENT: @ref:speclang/auth/flows#middleware-flow
  throw new Error('Not implemented');
}
```

### CLI Commands
```bash
# Generate all code
speclang generate

# Generate for specific target
speclang generate --target typescript

# Generate specific spec
speclang generate specs/auth.ts.spec

# Dry run (show what would be generated)
speclang generate --dry-run
```

## Test Cases
1. Parse code spec correctly
2. Map stdlib types to TypeScript
3. Map stdlib types to Go
4. Generate interface block
5. Generate function block
6. Handle @ref: markers
7. Preserve SPECLANG-IDs for updates
8. Skip unchanged files

## Validation
```bash
bun test tests/codegen/
```

## Output Format
After completing, output:
1. Supported targets
2. Type mapping coverage
3. Template coverage
4. Test results
