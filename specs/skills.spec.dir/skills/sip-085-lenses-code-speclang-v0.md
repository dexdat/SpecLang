---
name: sip-085-lenses-code-speclang-v0
title: "SIP 85: Code Lens"
version: 0.1.0
description: Code block parsing and rendering for spec blocks
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 85: Code Lens

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the Code Lens—parsing and rendering of code blocks within spec blocks.

### Quick Start

```markdown
### @block:login-fn @kind:code

```typescript
function login(email: string, password: string): Token {
  const user = db.findUser(email);
  if (!user) throw new Error("User not found");
  return generateToken(user);
}
```
```

### When to Read This

- **Implementation specs**: Function and class definitions
- **Code generation**: Extracting code for generators
- **Language features**: Type signatures, imports

### Related SIPs

- SIP 35: Lenses System
- SIP 12: Code Generation
- SIP 71: Stdlib Types

## Abstract

This SIP defines the Code Lens—a specialized lens for parsing and rendering code blocks within SpecLang blocks. The lens supports multiple programming languages with syntax-aware parsing.

## Motivation

Specs often contain code:
- Function signatures
- Type definitions
- Algorithm pseudocode
- Example implementations

Code lens extracts structured code data.

## Rationale

**Why dedicated code lens:**
- Syntax-aware parsing
- Language-specific handling
- Type extraction
- Import analysis

## Specification

### Lens Definition

**@lens/definition:**

```yaml
CodeLens:
  name: "code"
  kind_marker: "@kind:code"
  detector: "content.includes('```') && hasLanguageId"
  priority: 20
```

### Supported Languages

**@lens/languages:**

```yaml
Languages:
  compiled:
    - typescript
    - javascript
    - python
    - go
    - rust
    - java
    - csharp
    - cpp
    - c
    
  scripting:
    - python
    - ruby
    - php
    - perl
    
  markup:
    - html
    - css
    - scss
    - json
    - yaml
    - xml
    - sql
    
  other:
    - bash
    - shell
    - dockerfile
    - graphql
```

### Block Format

**@lens/format:**

```yaml
block:
  id: "@block:example"
  kind: "code"
  
  code_lens:
    language: typescript
    content: |
      function login(email: string, password: string): Token {
        // implementation
      }
```

### Parsing

**@lens/parsing:**

```typescript
interface CodeBlock {
  kind: 'code';
  language: string;
  content: string;
  imports: Import[];
  exports: Export[];
  functions: FunctionDef[];
  classes: ClassDef[];
  types: TypeDef[];
}
```

### Import Extraction

**@lens/imports:**

```typescript
function extractImports(content: string, language: string): Import[] {
  const patterns: Record<string, RegExp> = {
    typescript: /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
    javascript: /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
    python: /(?:from\s+([\w.]+)\s+import\s+([\w,]+)|import\s+([\w.]+))/g,
    go: /import\s+(?:\(\s*)?['"]([^'"]+)['"]/g,
    rust: /use\s+([\w:]+)/g,
  };
  
  const imports: Import[] = [];
  const pattern = patterns[language] || patterns.typescript;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    imports.push({
      source: match[1] || match[3],
      names: match[2]?.split(',').map(s => s.trim()) || ['default'],
      isDefault: match[2] === undefined,
    });
  }
  
  return imports;
}
```

### Function Extraction

**@lens/functions:**

```typescript
interface FunctionDef {
  name: string;
  params: Param[];
  returnType?: string;
  visibility: 'public' | 'private' | 'protected';
  isAsync: boolean;
  isStatic: boolean;
}

function extractFunctions(content: string, language: string): FunctionDef[] {
  const patterns: Record<string, RegExp> = {
    typescript: /(?:async\s+)?(?:(\w+)\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*(\w+))?\s*\{/g,
    python: /def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*(\w+))?:/g,
    go: /func\s+(?:\((\w+)\s+\*?(\w+)\)\s+)?(\w+)\s*\(([^)]*)\)\s*(?:\((\w+(?:\s+\w+)?)\))?/g,
    rust: /fn\s+(\w+)\s*<[^>]*>?\s*\(([^)]*)\)\s*(?:->\s*(\w+))?/g,
  };
  
  const functions: FunctionDef[] = [];
  const pattern = patterns[language] || patterns.typescript;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    functions.push(parseFunctionMatch(match, language));
  }
  
  return functions;
}

function parseFunctionMatch(match: RegExpMatchArray, language: string): FunctionDef {
  if (language === 'typescript') {
    return {
      visibility: match[1] as any || 'public',
      name: match[2],
      params: parseParams(match[3], language),
      returnType: match[4],
      isAsync: match[0].startsWith('async'),
      isStatic: false,
    };
  }
  // Handle other languages...
  return { name: match[1], params: [], visibility: 'public', isAsync: false, isStatic: false };
}
```

### Type Extraction

**@lens/types:**

```typescript
function extractTypes(content: string, language: string): TypeDef[] {
  const patterns: Record<string, RegExp> = {
    typescript: /(?:export\s+)?(?:interface|type)\s+(\w+)\s*(?:<[^>]+>)?\s*\{([^}]+)\}/g,
    go: /type\s+(\w+)\s+(?:struct|interface)\s*\{([^}]+)\}/g,
    rust: /(?:pub\s+)?(?:struct|enum|trait)\s+(\w+)[^{]*\{/g,
    python: /class\s+(\w+)(?:\(([^)]+)\))?:/g,
  };
  
  const types: TypeDef[] = [];
  const pattern = patterns[language] || patterns.typescript;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    types.push({
      name: match[1],
      kind: match[0].includes('interface') ? 'interface' :
            match[0].includes('enum') ? 'enum' : 'struct',
      body: match[2] || '',
    });
  }
  
  return types;
}
```

### Parameter Parsing

**@lens/params:**

```typescript
interface Param {
  name: string;
  type?: string;
  optional: boolean;
  defaultValue?: string;
}

function parseParams(paramsStr: string, language: string): Param[] {
  if (!paramsStr.trim()) return [];
  
  const params: Param[] = [];
  const parts = paramsStr.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    if (language === 'typescript' || language === 'javascript') {
      const [nameWithOptional, type] = trimmed.split(/\s*:\s*/);
      const [name, defaultValue] = nameWithOptional.split(/\s*=\s*/);
      params.push({
        name,
        type,
        optional: nameWithOptional.includes('?'),
        defaultValue,
      });
    } else if (language === 'python') {
      const [name, defaultValue] = trimmed.split(/\s*=\s*/);
      params.push({
        name,
        optional: defaultValue !== undefined,
        defaultValue,
      });
    } else {
      params.push({ name: trimmed, optional: false });
    }
  }
  
  return params;
}
```

### Rendering

**@lens/rendering:**

```typescript
function renderCode(block: CodeBlock): string {
  const lines: string[] = [`\`\`\`${block.language}`];
  
  for (const imp of block.imports) {
    if (imp.isDefault) {
      lines.push(`import ${imp.names[0]} from '${imp.source}';`);
    } else {
      lines.push(`import { ${imp.names.join(', ')} } from '${imp.source}';`);
    }
  }
  
  for (const type of block.types) {
    lines.push(renderType(type, block.language));
  }
  
  for (const cls of block.classes) {
    lines.push(renderClass(cls, block.language));
  }
  
  for (const fn of block.functions) {
    lines.push(renderFunction(fn, block.language));
  }
  
  lines.push('```');
  return lines.join('\n');
}
```

### Language Detection

**@lens/detection:**

```yaml
DetectionRules:
  - priority: code_fence
    check: "```language"
    confidence: high
    
  - priority: shebang
    check: "#!/bin/bash, #!/usr/bin/env python"
    confidence: high
    
  - priority: file_extension
    check: "inferred from block id or filename"
    confidence: medium
    
  - priority: content_heuristics
    check: "keywords, syntax patterns"
    confidence: low
```

### Validation Rules

**@lens/validation:**

```yaml
ValidationRules:
  - name: valid_language
    description: "Language must be supported"
    check: language in supportedLanguages
    
  - name: balanced_braces
    description: "Code must have balanced braces"
    check: count('{') === count('}')
    
  - name: balanced_parens
    description: "Parentheses must be balanced"
    check: count('(') === count(')')
    
  - name: no_syntax_errors
    description: "Basic syntax validation"
    check: "language-specific syntax check"
```

### AI Behavior

**@lens/ai:**

```yaml
AIBehavior:
  auto_detection:
    - "Detects language from code fence"
    - "Extracts function signatures"
    - "Identifies types and imports"
    
  generation:
    - "Generates implementations"
    - "Adds type annotations"
    - "Fills in boilerplate"
    
  transformation:
    - "Converts between languages"
    - "Adds error handling"
    - "Refactors code"
```

## Examples

### Example 1: TypeScript Function

**@example/typescript:**

```markdown
### @block:user-service @kind:code

```typescript
import { User, Token } from './auth';

interface LoginRequest {
  email: string;
  password: string;
}

export async function login(request: LoginRequest): Promise<Token> {
  const user = await db.users.findOne({ email: request.email });
  if (!user) throw new AuthError('User not found');
  
  const valid = await bcrypt.compare(request.password, user.hash);
  if (!valid) throw new AuthError('Invalid password');
  
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
}
```
```

**Parsed:**
```yaml
block:
  id: "@block:user-service"
  kind: "code"
  language: "typescript"
  imports:
    - { source: "./auth", names: ["User", "Token"], isDefault: false }
  types:
    - { name: "LoginRequest", kind: "interface", body: "email: string; password: string;" }
  functions:
    - { name: "login", params: [{ name: "request", type: "LoginRequest" }], returnType: "Promise<Token>", isAsync: true, visibility: "export" }
```

### Example 2: Python Class

**@example/python:**

```markdown
### @block:data-model @kind:code

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: str
    email: str
    name: str
    role: str = "user"
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
        }
```
```

### Example 3: Go Struct

**@example/go:**

```markdown
### @block:handler @kind:code

```go
package handler

import (
    "context"
    "net/http"
)

type Handler struct {
    db *Database
}

func NewHandler(db *Database) *Handler {
    return &Handler{db: db}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // implementation
}
```
```

### Example 4: Pseudocode

**@example/pseudocode:**

```markdown
### @block:algorithm @kind:code

```pseudocode
function findPath(graph, start, end):
    queue = [[start]]
    visited = {start}
    
    while queue is not empty:
        path = queue.dequeue()
        node = path.last
        
        if node == end:
            return path
            
        for neighbor in graph.getNeighbors(node):
            if neighbor not in visited:
                visited.add(neighbor)
                newPath = path + [neighbor]
                queue.enqueue(newPath)
                
    return null
```
```

## Implementation

### Code Lens Implementation

```typescript
export class CodeLens implements Lens {
  name = 'code';
  
  detect(content: string): boolean {
    return /^```(\w+)/m.test(content);
  }
  
  parse(content: string): CodeBlock {
    const match = content.match(/^```(\w+)\s*\n([\s\S]*?)```/m);
    if (!match) {
      throw new Error('No code block found');
    }
    
    const language = match[1];
    const codeContent = match[2].trim();
    
    return {
      kind: 'code',
      language,
      content: codeContent,
      imports: extractImports(codeContent, language),
      exports: extractExports(codeContent, language),
      functions: extractFunctions(codeContent, language),
      classes: extractClasses(codeContent, language),
      types: extractTypes(codeContent, language),
    };
  }
  
  render(block: CodeBlock): string {
    return renderCode(block);
  }
  
  validate(block: CodeBlock): ValidationResult {
    const errors: string[] = [];
    
    if (!supportedLanguages.includes(block.language)) {
      errors.push(`Unsupported language: ${block.language}`);
    }
    
    if (!isBalanced(block.content, '{', '}')) {
      errors.push('Unbalanced braces');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### Language Registry

```typescript
const languageRegistry: Map<string, LanguageSpec> = new Map([
  ['typescript', {
    extensions: ['.ts', '.tsx'],
    parser: parseTypeScript,
    formatter: formatTypeScript,
  }],
  ['python', {
    extensions: ['.py'],
    parser: parsePython,
    formatter: formatPython,
  }],
  ['go', {
    extensions: ['.go'],
    parser: parseGo,
    formatter: formatGo,
  }],
]);

export function registerLanguage(spec: LanguageSpec): void {
  languageRegistry.set(spec.name, spec);
}
```

## References

- @ref:sip-035-lenses
- @ref:sip-012-codegen
- @ref:speclang/lenses/code

## Copyright

This document is in the public domain.
