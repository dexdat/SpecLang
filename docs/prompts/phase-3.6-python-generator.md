# Bootstrap Phase 3.6: Python Code Generator

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 3.6 of the bootstrap process.

**Prerequisites**: 
- Phase 3.1 (Codegen Framework) complete
- Phase 3.4 (Compiler Phases) complete
- Phase 3.5 (Go Generator) complete (pattern reference)

## Your Task
Implement the Python target generator that transforms spec files into idiomatic Python code with type hints.

## Read These Specs First
1. `specs/compiler.spec.md` - Codegen pipeline
2. `specs/stdlib.spec.md` - Built-in types
3. `specs/implementation/codegen/ts.spec` - TypeScript generator (pattern reference)
4. `specs/scripts.spec.dir/*.py.spec` - Python script specs

## What to Build

### Files to Create
```
src/codegen/targets/
├── python.ts             # Python generator implementation
└── python/
    ├── types.ts          # Python type mappings
    ├── templates.ts      # Python code templates
    ├── naming.ts         # Python naming conventions
    └── imports.ts        # Python import handling

tests/codegen/targets/
├── python.test.ts
└── fixtures/
    └── sample.py.spec
```

### Requirements

#### 1. Python Type Mapping (python/types.ts)
```typescript
interface PythonTypeMapping {
  stdlib: string;
  python: string;
  import?: string;        // From import syntax
  fromImport?: string;    // e.g., from datetime import datetime
  default?: string;       // Default value
}

const PYTHON_TYPE_MAPPINGS: PythonTypeMapping[] = [
  // Primitives
  { stdlib: 'String', python: 'str', default: '""' },
  { stdlib: 'Int', python: 'int', default: '0' },
  { stdlib: 'Float', python: 'float', default: '0.0' },
  { stdlib: 'Bool', python: 'bool', default: 'False' },
  
  // Time
  { stdlib: 'Date', python: 'date', fromImport: 'datetime', default: 'date.today()' },
  { stdlib: 'DateTime', python: 'datetime', fromImport: 'datetime', default: 'datetime.now()' },
  
  // Identifiers
  { stdlib: 'UUID', python: 'UUID', fromImport: 'uuid', default: 'uuid4()' },
  
  // Collections
  { stdlib: 'Array<T>', python: 'list[T]', import: 'typing', default: '[]' },
  { stdlib: 'Map<K,V>', python: 'dict[K, V]', import: 'typing', default: '{}' },
  { stdlib: 'Set<T>', python: 'set[T]', import: 'typing', default: 'set()' },
  
  // Optional
  { stdlib: 'Optional<T>', python: 'T | None', default: 'None' },
  
  // Bytes
  { stdlib: 'Bytes', python: 'bytes', default: 'b""' },
  
  // Any
  { stdlib: 'Any', python: 'Any', import: 'typing' },
];

function mapPythonType(stdlibType: string): { type: string; imports: Set<string> } {
  const imports = new Set<string>();
  
  // Handle generics: Array<User> -> list[User]
  const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    const inner = mapPythonType(arrayMatch[1]);
    return { type: `list[${inner.type}]`, imports: new Set([...inner.imports]) };
  }
  
  // Handle maps: Map<string, User> -> dict[str, User]
  const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
  if (mapMatch) {
    const key = mapPythonType(mapMatch[1]);
    const value = mapPythonType(mapMatch[2]);
    return { 
      type: `dict[${key.type}, ${value.type}]`, 
      imports: new Set([...key.imports, ...value.imports]) 
    };
  }
  
  // Handle optional: Optional<User> -> User | None
  const optMatch = stdlibType.match(/^Optional<(.+)>$/);
  if (optMatch) {
    const inner = mapPythonType(optMatch[1]);
    return { type: `${inner.type} | None`, imports: inner.imports };
  }
  
  // Lookup base type
  const mapping = PYTHON_TYPE_MAPPINGS.find(m => m.stdlib === stdlibType);
  if (mapping) {
    if (mapping.import) imports.add(mapping.import);
    if (mapping.fromImport) imports.add(mapping.fromImport);
    return { type: mapping.python, imports };
  }
  
  // Unknown type - pass through
  return { type: stdlibType, imports };
}
```

#### 2. Python Naming Conventions (python/naming.ts)
```typescript
class PythonNaming {
  // Convert to PascalCase for classes
  toClassName(name: string): string {
    return this.toPascalCase(name);
  }
  
  // Convert to snake_case for functions/variables
  toFuncName(name: string): string {
    return this.toSnakeCase(name);
  }
  
  // Convert to UPPER_SNAKE_CASE for constants
  toConstName(name: string): string {
    return this.toSnakeCase(name).toUpperCase();
  }
  
  // Module name (lowercase, underscores allowed)
  toModuleName(path: string): string {
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    return last.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }
  
  private toPascalCase(s: string): string {
    return s.replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase());
  }
  
  private toSnakeCase(s: string): string {
    return s
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/[-\s]+/g, '_');
  }
}
```

#### 3. Python Templates (python/templates.ts)
```typescript
const PYTHON_TEMPLATES = {
  // File header
  fileHeader: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Code generated by SpecLang. DO NOT EDIT.
# Source: {{source}}
# Generated: {{timestamp}}
"""
{{docstring}}
"""
`,
  
  // Dataclass (Python 3.10+ style)
  dataclass: `@dataclass
class {{name}}:
{{fields}}
`,
  
  // Dataclass field
  dataclassField: `    {{name}}: {{type}}{{default}}`,
  
  // Pydantic model
  pydanticModel: `class {{name}}(BaseModel):
{{fields}}
`,
  
  // Pydantic field with validator
  pydanticField: `    {{name}}: {{type}} = Field({{fieldArgs}})`,
  
  // Function
  function: `def {{name}}({{params}}) -> {{returnType}}:
{{docstring}}
{{body}}
`,
  
  // Async function
  asyncFunction: `async def {{name}}({{params}}) -> {{returnType}}:
{{docstring}}
{{body}}
`,
  
  // Class
  class: `class {{name}}:
{{docstring}}
{{body}}
`,
  
  // Class with inheritance
  classWithBase: `class {{name}}({{bases}}):
{{docstring}}
{{body}}
`,
  
  // Method
  method: `    def {{name}}(self, {{params}}) -> {{returnType}}:
{{docstring}}
{{body}}
`,
  
  // Property
  property: `    @property
    def {{name}}(self) -> {{returnType}}:
{{body}}
`,
  
  // Enum
  enum: `class {{name}}(str, Enum):
{{values}}
`,
  
  // Protocol (structural typing)
  protocol: `class {{name}}(Protocol):
{{methods}}
`,
  
  // Exception
  exception: `class {{name}}Error(Exception):
    def __init__(self, message: str, code: str | None = None):
        self.message = message
        self.code = code
        super().__init__(self.message)
`,
  
  // HTTP route (FastAPI style)
  fastapiRoute: `@router.{{method}}("{{path}}")
async def {{handlerName}}({{params}}) -> {{returnType}}:
{{body}}
`
};
```

#### 4. Python Import Handling (python/imports.ts)
```typescript
interface PythonImport {
  module: string;
  names?: string[];       // from X import a, b
  alias?: string;         // import X as Y
}

class PythonImportManager {
  private imports: Map<string, PythonImport> = new Map();
  
  add(module: string, alias?: string): void {
    if (!this.imports.has(module)) {
      this.imports.set(module, { module, alias });
    }
  }
  
  addFrom(module: string, names: string[]): void {
    const existing = this.imports.get(module);
    if (existing) {
      existing.names = [...new Set([...(existing.names || []), ...names])];
    } else {
      this.imports.set(module, { module, names });
    }
  }
  
  addTyping(names: string[]): void {
    this.addFrom('typing', names);
  }
  
  render(): string {
    const stdlib: string[] = [];
    const thirdParty: string[] = [];
    const local: string[] = [];
    
    for (const [, imp] of this.imports) {
      const rendered = this.formatImport(imp);
      const group = this.categorize(imp.module);
      
      if (group === 'stdlib') stdlib.push(rendered);
      else if (group === 'thirdParty') thirdParty.push(rendered);
      else local.push(rendered);
    }
    
    const groups: string[] = [];
    if (stdlib.length > 0) groups.push(stdlib.sort().join('\n'));
    if (thirdParty.length > 0) groups.push(thirdParty.sort().join('\n'));
    if (local.length > 0) groups.push(local.join('\n'));
    
    return groups.join('\n\n') + '\n';
  }
  
  private formatImport(imp: PythonImport): string {
    if (imp.names && imp.names.length > 0) {
      return `from ${imp.module} import ${imp.names.join(', ')}`;
    }
    if (imp.alias) {
      return `import ${imp.module} as ${imp.alias}`;
    }
    return `import ${imp.module}`;
  }
  
  private categorize(module: string): 'stdlib' | 'thirdParty' | 'local' {
    const stdlibModules = [
      'abc', 'argparse', 'asyncio', 'collections', 'contextlib',
      'dataclasses', 'datetime', 'decimal', 'enum', 'functools',
      'gc', 'glob', 'gzip', 'hashlib', 'heapq', 'hmac', 'html',
      'http', 'io', 'itertools', 'json', 'logging', 'math',
      'mmap', 'multiprocessing', 'numbers', 'operator', 'os',
      'pathlib', 'pickle', 'platform', 'pprint', 'queue', 'random',
      're', 'secrets', 'shutil', 'signal', 'socket', 'sqlite3',
      'ssl', 'stat', 'statistics', 'string', 'struct', 'subprocess',
      'sys', 'tempfile', 'textwrap', 'threading', 'time', 'timeit',
      'token', 'tokenize', 'traceback', 'types', 'typing', 'unicodedata',
      'unittest', 'urllib', 'uuid', 'warnings', 'weakref', 'xml', 'zipfile'
    ];
    
    // Local imports start with .
    if (module.startsWith('.')) return 'local';
    
    // Check stdlib
    const topLevel = module.split('.')[0];
    if (stdlibModules.includes(topLevel)) return 'stdlib';
    
    return 'thirdParty';
  }
}
```

#### 5. Python Generator (targets/python.ts)
```typescript
class PythonGenerator implements TargetGenerator {
  language = 'python';
  extension = '.py';
  
  private naming = new PythonNaming();
  private importManager: PythonImportManager;
  
  generate(spec: CodeSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    for (const block of spec.blocks) {
      switch (block.kind) {
        case 'entity':
          files.push(this.generateDataclass(spec, block));
          break;
        case 'pydantic':
          files.push(this.generatePydanticModel(spec, block));
          break;
        case 'function':
        case 'operation':
          files.push(this.generateFunction(spec, block));
          break;
        case 'class':
          files.push(this.generateClass(spec, block));
          break;
        case 'enum':
          files.push(this.generateEnum(spec, block));
          break;
        case 'protocol':
          files.push(this.generateProtocol(spec, block));
          break;
      }
    }
    
    return this.combineFiles(files, spec.target.outputPath);
  }
  
  private generateDataclass(spec: CodeSpec, block: CodeBlock): GeneratedFile {
    this.importManager = new PythonImportManager();
    this.importManager.addFrom('dataclasses', ['dataclass']);
    
    const className = this.naming.toClassName(block.name);
    const fields = this.parseEntityFields(block.content);
    
    const fieldLines = fields.map(f => {
      const { type, imports } = mapPythonType(f.type);
      imports.forEach(i => this.importManager.add(i));
      
      const defaultVal = f.optional ? ' = None' : 
                         f.default ? ` = ${f.default}` : '';
      
      return `    ${this.naming.toFuncName(f.name)}: ${type}${defaultVal}`;
    }).join('\n');
    
    const classCode = `@dataclass
class ${className}:
${fieldLines}
`;
    
    return {
      path: spec.target.outputPath,
      content: this.wrapInFile(classCode, spec),
      source_block: block.id
    };
  }
  
  private generateFunction(spec: CodeSpec, block: CodeBlock): GeneratedFile {
    this.importManager = new PythonImportManager();
    
    const funcDef = this.parseFunctionDef(block.content);
    const funcName = this.naming.toFuncName(funcDef.name);
    
    // Map parameter types
    const params = funcDef.params.map(p => {
      const { type, imports } = mapPythonType(p.type);
      imports.forEach(i => this.importManager.add(i));
      return `${p.name}: ${type}`;
    }).join(', ');
    
    // Map return type
    const { type: returnType, imports: retImports } = mapPythonType(funcDef.returnType || 'None');
    retImports.forEach(i => this.importManager.add(i));
    
    const asyncKeyword = funcDef.async ? 'async ' : '';
    
    const funcCode = `${asyncKeyword}def ${funcName}(${params}) -> ${returnType}:
    """${funcDef.description || 'TODO: Add docstring'}"""
${this.generateFunctionBody(funcDef, block)}
`;
    
    return {
      path: spec.target.outputPath,
      content: this.wrapInFile(funcCode, spec),
      source_block: block.id
    };
  }
  
  private generateEnum(spec: CodeSpec, block: CodeBlock): GeneratedFile {
    this.importManager = new PythonImportManager();
    this.importManager.addFrom('enum', ['Enum']);
    
    const className = this.naming.toClassName(block.name);
    const values = this.parseEnumValues(block.content);
    
    const valueLines = values.map(v => 
      `    ${this.naming.toConstName(v)} = "${v}"`
    ).join('\n');
    
    const enumCode = `class ${className}(str, Enum):
${valueLines}
`;
    
    return {
      path: spec.target.outputPath,
      content: this.wrapInFile(enumCode, spec),
      source_block: block.id
    };
  }
  
  private wrapInFile(content: string, spec: CodeSpec): string {
    const header = PYTHON_TEMPLATES.fileHeader
      .replace('{{source}}', spec.sourceFile)
      .replace('{{timestamp}}', new Date().toISOString())
      .replace('{{docstring}}', spec.metadata.short || 'Generated module');
    
    const imports = this.importManager.render();
    
    return `${header}
${imports}
${content}
`;
  }
  
  mapType(stdlibType: string): string {
    return mapPythonType(stdlibType).type;
  }
  
  formatImports(imports: string[]): string {
    return this.importManager.render();
  }
  
  fileHeader(spec: CodeSpec): string {
    return PYTHON_TEMPLATES.fileHeader;
  }
  
  fileFooter(spec: CodeSpec): string {
    return '\n';  // Python files end with newline
  }
}
```

### Input Spec Example
```yaml
# speclang-header lines:10
id: @specs/auth.py
version: 1.0.0
target: python
output_path: src/auth/user.py
---
# User Entity

## @block:auth/user @kind:entity
User:
  id: UUID
  email: String
  name: String
  created_at: DateTime
  role: UserRole

## @block:auth/role @kind:enum
UserRole:
  - Admin
  - User
  - Guest

## @block:auth/create_user @kind:function
create_user(email: String, name: String) -> User:
  async: true
  description: Create a new user
```

### Expected Output
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Code generated by SpecLang. DO NOT EDIT.
# Source: specs/auth.py.spec
# Generated: 2024-01-15T10:30:00Z
"""
User authentication models
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from uuid import UUID


@dataclass
class User:
    id: UUID
    email: str
    name: str
    created_at: datetime
    role: UserRole


class UserRole(str, Enum):
    ADMIN = "Admin"
    USER = "User"
    GUEST = "Guest"


async def create_user(email: str, name: str) -> User:
    """Create a new user"""
    # SPECLANG-IMPLEMENT: @ref:speclang/auth/entities#mcp-auth
    raise NotImplementedError()
```

## Test Cases
1. Map basic types (String -> str)
2. Map datetime with imports
3. Map generic types (Array<T> -> list[T])
4. Generate dataclass with fields
5. Generate enum class
6. Generate async function
7. Generate protocol
8. Handle snake_case conversion
9. Group imports (stdlib, third-party, local)
10. Generate Pydantic model

## Validation
```bash
bun test tests/codegen/targets/python.test.ts
```

## Output Format
After completing, output:
1. Type mappings covered
2. Templates implemented
3. Generated sample code
4. Test results
