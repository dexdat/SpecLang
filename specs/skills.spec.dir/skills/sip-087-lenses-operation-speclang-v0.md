---
name: sip-087-lenses-operation-speclang-v0
title: "SIP 87: Operation Lens"
version: 0.1.0
description: Operation and function signature parsing for spec blocks
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 87: Operation Lens

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the Operation Lens—parsing and rendering of operation and function signatures within spec blocks.

### Quick Start

```markdown
### @block::auth/login @kind:operation

```signature
login(email: string, password: string) -> Token | Error
  requires: validEmail(email), nonEmpty(password)
  ensures: result.isOk() -> tokenValid(result.value)
  throws: AuthError, DatabaseError
```
```

### When to Read This

- **API specs**: Endpoint definitions
- **Function contracts**: Input/output contracts
- **Service definitions**: Operations and actions

### Related SIPs

- SIP 35: Lenses System
- SIP 11: MCP Tools
- SIP 73: Agent Tools

## Abstract

This SIP defines the Operation Lens—a specialized lens for parsing and rendering operation and function signatures within SpecLang blocks. The lens supports parameters, return types, pre/post conditions, and error specifications.

## Motivation

Operations define behavior:
- API endpoints
- Function contracts
- Service actions
- System interactions

Operation lens extracts structured behavior data.

## Rationale

**Why operation lens:**
- Signature parsing
- Contract specification
- Error handling
- Pre/post conditions

## Specification

### Lens Definition

**@lens/definition:**

```yaml
OperationLens:
  name: "operation"
  kind_marker: "@kind:operation"
  detector: "function signature pattern"
  priority: 25
```

### Signature Syntax

**@lens/syntax:**

```yaml
SignatureFormat:
  basic: "name(param1: type1, param2: type2) -> ReturnType"
  
  optional_params: "name(param?: type) -> ReturnType"
  
  default_params: "name(param: type = default) -> ReturnType"
  
  varargs: "name(...params: type[]) -> ReturnType"
  
  union_return: "name() -> TypeA | TypeB"
  
  generic: "name<T>(items: T[]) -> T"
  
  async: "async name() -> Promise<Result>"
  
  throws: "name() -> Result throws Error"
```

### Block Format

**@lens/format:**

```yaml
block:
  id: "@block:login"
  kind: "operation"
  
  operation_lens:
    name: "login"
    params:
      - name: "email"
        type: "string"
      - name: "password"  
        type: "string"
    return_type: "Token | Error"
    requires:
      - "validEmail(email)"
      - "nonEmpty(password)"
    ensures:
      - "result.isOk() -> tokenValid(result.value)"
    throws:
      - "AuthError"
      - "DatabaseError"
```

### Parsing

**@lens/parsing:**

```typescript
interface OperationBlock {
  kind: 'operation';
  name: string;
  visibility: 'public' | 'private' | 'protected';
  isAsync: boolean;
  isStatic: boolean;
  params: Param[];
  returnType: string;
  genericParams?: string[];
  requires: string[];
  ensures: string[];
  throws: string[];
  sideEffects: string[];
}
```

### Signature Parsing

**@lens/signature:**

```typescript
function parseSignature(line: string): Partial<OperationBlock> {
  const trimmed = line.trim();
  
  const asyncMatch = trimmed.match(/^async\s+/);
  const visibilityMatch = trimmed.match(/\b(public|private|protected)\s+/);
  const staticMatch = trimmed.match(/\bstatic\s+/);
  
  let remaining = trimmed
    .replace(/^async\s+/, '')
    .replace(/\b(public|private|protected)\s+/, '')
    .replace(/\bstatic\s+/, '');
  
  const genericMatch = remaining.match(/^(\w+)<([^>]+)>/);
  let name: string;
  let genericParams: string[] | undefined;
  
  if (genericMatch) {
    name = genericMatch[1];
    genericParams = genericMatch[2].split(',').map(p => p.trim());
    remaining = remaining.slice(genericMatch[0].length);
  } else {
    const nameMatch = remaining.match(/^(\w+)/);
    name = nameMatch ? nameMatch[1] : '';
  }
  
  const paramsMatch = remaining.match(/\(([^)]*)\)/);
  const params = paramsMatch ? parseParams(paramsMatch[1]) : [];
  
  const returnMatch = remaining.match(/\)\s*(?:->|=>)\s*(.+)$/);
  const returnType = returnMatch ? returnMatch[1].trim() : 'void';
  
  return {
    name,
    visibility: (visibilityMatch?.[1] as any) || 'public',
    isAsync: !!asyncMatch,
    isStatic: !!staticMatch,
    params,
    returnType,
    genericParams,
  };
}
```

### Parameter Parsing

**@lens/params:**

```typescript
function parseParams(paramsStr: string): Param[] {
  if (!paramsStr.trim()) return [];
  
  const params: Param[] = [];
  const parts = splitParams(paramsStr);
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    const pattern = /^(\??)(?:(\w+)\s+)?(\w+)\s*(?::\s*(.+?))?(?:\s*=\s*(.+))?$/;
    const match = trimmed.match(pattern);
    
    if (match) {
      const [, optional, , name, type, defaultValue] = match;
      params.push({
        name,
        type: type || 'any',
        optional: optional === '?',
        defaultValue,
        varArgs: name.startsWith('...'),
      });
    }
  }
  
  return params;
}

function splitParams(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  
  for (const char of str) {
    if (char === '(' || char === '<' || char === '[') depth++;
    if (char === ')' || char === '>' || char === ']') depth--;
    
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) parts.push(current);
  return parts;
}
```

### Condition Parsing

**@lens/conditions:**

```typescript
function parseConditions(lines: string[]): { requires: string[]; ensures: string[]; throws: string[] } {
  const requires: string[] = [];
  const ensures: string[] = [];
  const throws: string[] = [];
  
  let currentSection: 'requires' | 'ensures' | 'throws' | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('requires:')) {
      currentSection = 'requires';
      const condition = trimmed.slice(9).trim();
      if (condition) requires.push(condition);
    } else if (trimmed.startsWith('ensures:')) {
      currentSection = 'ensures';
      const condition = trimmed.slice(8).trim();
      if (condition) ensures.push(condition);
    } else if (trimmed.startsWith('throws:')) {
      currentSection = 'throws';
      const condition = trimmed.slice(7).trim();
      if (condition) throws.push(condition);
    } else if (currentSection && trimmed) {
      if (currentSection === 'requires') requires.push(trimmed);
      if (currentSection === 'ensures') ensures.push(trimmed);
      if (currentSection === 'throws') throws.push(trimmed);
    }
  }
  
  return { requires, ensures, throws };
}
```

### Return Type Parsing

**@lens/return_type:**

```typescript
interface ReturnType {
  type: string;
  nullable: boolean;
  optional: boolean;
  union?: string[];
  promise?: boolean;
}

function parseReturnType(typeStr: string): ReturnType {
  const trimmed = typeStr.trim();
  
  const promiseMatch = trimmed.match(/^Promise<(.+)>$/);
  if (promiseMatch) {
    const inner = parseReturnType(promiseMatch[1]);
    return { ...inner, promise: true };
  }
  
  const unionTypes = trimmed.split(/\s*\|\s*/);
  if (unionTypes.length > 1) {
    return {
      type: 'union',
      nullable: unionTypes.includes('null'),
      optional: unionTypes.includes('undefined'),
      union: unionTypes.filter(t => t !== 'null' && t !== 'undefined'),
    };
  }
  
  return {
    type: trimmed.replace(/\?$/, ''),
    nullable: trimmed.includes('?'),
    optional: trimmed.endsWith('?'),
  };
}
```

### Rendering

**@lens/rendering:**

```typescript
function renderOperation(block: OperationBlock): string {
  const lines: string[] = ['```signature'];
  
  let signature = '';
  
  if (block.visibility !== 'public') {
    signature += `${block.visibility} `;
  }
  if (block.isStatic) {
    signature += 'static ';
  }
  if (block.isAsync) {
    signature += 'async ';
  }
  
  if (block.genericParams) {
    signature += `${block.name}<${block.genericParams.join(', ')}>`;
  } else {
    signature += block.name;
  }
  
  const params = block.params.map(p => {
    let param = '';
    if (p.varArgs) param += '...';
    param += p.name;
    if (p.type) param += `: ${p.type}`;
    if (p.defaultValue) param += ` = ${p.defaultValue}`;
    return param;
  }).join(', ');
  
  signature += `(${params})`;
  
  if (block.returnType) {
    signature += ` -> ${block.returnType}`;
  }
  
  lines.push(signature);
  
  if (block.requires.length) {
    lines.push(`  requires:`);
    for (const req of block.requires) {
      lines.push(`    ${req}`);
    }
  }
  
  if (block.ensures.length) {
    lines.push(`  ensures:`);
    for (const ens of block.ensures) {
      lines.push(`    ${ens}`);
    }
  }
  
  if (block.throws.length) {
    lines.push(`  throws:`);
    for (const err of block.throws) {
      lines.push(`    ${err}`);
    }
  }
  
  lines.push('```');
  return lines.join('\n');
}
```

### Validation Rules

**@lens/validation:**

```yaml
ValidationRules:
  - name: valid_name
    description: "Operation name must be valid identifier"
    check: /^[a-zA-Z_]\w*$/.test(name)
    
  - name: unique_params
    description: "Parameter names must be unique"
    check: params.length == unique(params.name).length
    
  - name: valid_return_type
    description: "Return type must be specified"
    check: returnType !== undefined
    
  - name: requires_preconditions
    description: "Requires must have valid expressions"
    check: all parse as expressions
    
  - name: ensures_postconditions
    description: "Ensures must reference result"
    check: result variable used
```

### AI Behavior

**@lens/ai:**

```yaml
AIBehavior:
  auto_detection:
    - "Detects signature patterns"
    - "Extracts parameters"
    - "Identifies conditions"
    
  generation:
    - "Generates from description"
    - "Creates contracts"
    - "Adds error cases"
    
  transformation:
    - "Adds async/sync"
    - "Converts parameter styles"
    - "Generates implementations"
```

## Examples

### Example 1: Login Operation

**@example/login:**

```markdown
### @block::auth/login @kind:operation

```signature
login(email: string, password: string) -> Token | Error
  requires:
    validEmail(email)
    nonEmpty(password)
    password.length >= 8
  ensures:
    result.isOk() -> tokenValid(result.value)
    result.isOk() -> result.value.userId == email
  throws:
    ValidationError
    AuthError
    DatabaseError
```
```

**Parsed:**
```yaml
block:
  id: "@block:auth/login"
  kind: "operation"
  name: "login"
  params:
    - { name: "email", type: "string" }
    - { name: "password", type: "string" }
  returnType: "Token | Error"
  requires:
    - "validEmail(email)"
    - "nonEmpty(password)"
    - "password.length >= 8"
  ensures:
    - "result.isOk() -> tokenValid(result.value)"
    - "result.isOk() -> result.value.userId == email"
  throws:
    - "ValidationError"
    - "AuthError"
    - "DatabaseError"
```

### Example 2: Generic Operation

**@example/generic:**

```markdown
### @block::filter @kind:operation

```signature
async function filter<T>(
  items: T[],
  predicate: (item: T) -> boolean
) -> T[] throws Error
  requires: items !== null
  ensures: result.length <= items.length
  ensures: result.every(predicate)
```
```

### Example 3: Class Method

**@example/method:**

```markdown
### @block::user/update @kind:operation

```signature
public async updateUser(
  id: string,
  data: Partial<UserUpdate>
): Promise<User> | ValidationError
  requires: validId(id)
  requires: data !== undefined
  ensures: result.isOk() -> result.value.id == id
  sideEffects: ["modifies:database", "emits:user.updated"]
```
```

### Example 4: Event Handler

**@example/event:**

```markdown
### @block::handler/event @kind:operation

```signature
onEvent(event: Event) -> void
  requires: event !== null
  ensures: event.isHandled() == true
  sideEffects: ["emits:event.processed"]
```
```

### Example 5: CRUD Operations

**@example/crud:**

```markdown
### @block::repository @kind:operation

```signature
# Create
create<T>(entity: T): T with id
  requires: entity.id === undefined
  ensures: result.id !== undefined

# Read  
findById<T>(id: string): T | null
  requires: validId(id)

# Update
update<T>(id: string, changes: Partial<T>): T | NotFoundError
  requires: validId(id)
  requires: changes !== {}
  ensures: result.id == id

# Delete
delete<T>(id: string): boolean
  requires: validId(id)
  ensures: !exists(id)
```
```

## Implementation

### Operation Lens Implementation

```typescript
export class OperationLens implements Lens {
  name = 'operation';
  
  detect(content: string): boolean {
    return /^(?:async\s+)?(?:function\s+)?\w+.*\(.*\).*(?:->|=>)/m.test(content);
  }
  
  parse(content: string): OperationBlock {
    const codeBlock = content.match(/```signature\s*([\s\S]*?)```/);
    const lines = (codeBlock ? codeBlock[1] : content).split('\n');
    
    const firstLine = lines[0].trim();
    const base = parseSignature(firstLine);
    
    const conditions = parseConditions(lines.slice(1));
    
    return {
      kind: 'operation',
      ...base,
      ...conditions,
      sideEffects: [],
    };
  }
  
  render(block: OperationBlock): string {
    return renderOperation(block);
  }
  
  validate(block: OperationBlock): ValidationResult {
    const errors: string[] = [];
    
    if (!/^[a-zA-Z_]\w*$/.test(block.name)) {
      errors.push(`Invalid operation name: ${block.name}`);
    }
    
    const paramNames = block.params.map(p => p.name);
    if (new Set(paramNames).size !== paramNames.length) {
      errors.push('Duplicate parameter names');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### Contract Verification

```typescript
function verifyContract(
  block: OperationBlock,
  args: any[],
  result: any,
  error?: Error
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const req of block.requires) {
    if (!evaluate(req, { args })) {
      violations.push(`Precondition violated: ${req}`);
    }
  }
  
  if (!error && result !== undefined) {
    for (const ens of block.ensures) {
      if (!evaluate(ens, { result })) {
        violations.push(`Postcondition violated: ${ens}`);
      }
    }
  }
  
  if (error) {
    const throws = block.throws.map(t => t.toLowerCase());
    const errorType = error.constructor.name.toLowerCase();
    if (!throws.some(t => errorType.includes(t))) {
      violations.push(`Unexpected error: ${error.constructor.name}`);
    }
  }
  
  return { valid: violations.length === 0, violations };
}
```

### Code Generation

```typescript
function operationToCode(block: OperationBlock, language: string): string {
  switch (language) {
    case 'typescript':
      return operationToTypeScript(block);
    case 'python':
      return operationToPython(block);
    case 'go':
      return operationToGo(block);
    default:
      return renderOperation(block);
  }
}
```

## References

- "@ref:sip-035-lenses
- @ref:sip-011-mcp-tools
- @ref:sip-073-agent-tools
- @ref:speclang/lenses/operation

## Copyright

This document is in the public domain.
