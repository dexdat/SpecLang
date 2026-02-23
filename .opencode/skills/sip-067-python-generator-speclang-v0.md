---
name: sip-067-python-generator-speclang-v0
title: "SIP 67: Python Generator"
version: 0.1.0
description: Python target code generation with type hints and Pydantic models
category: standard
---

# SIP 67: Python Generator

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the Python code generator for SpecLang.

### Quick Start

```bash
speclang generate --target python
```

### Type Mapping

| SpecLang | Python |
|----------|--------|
| String | str |
| Int | int |
| Float | float |
| Bool | bool |
| UUID | UUID |
| DateTime | datetime |
| List<T> | list[T] |
| Map<K,V> | dict[K, V] |
| Optional<T> | T \| None |

### When to Read This

- **Python codegen:** Generating Python code
- **Pydantic models:** Validation models
- **Type hints:** Modern Python typing

### Related SIPs

- SIP 12: Codegen Framework
- SIP 66: Go Generator

## Abstract

This SIP specifies the Python code generator, including type mapping, Pydantic models, and Python-specific patterns.

## Motivation

Python is popular for:
- ML/AI applications
- Data processing
- Web APIs (FastAPI)
- Scripting

## Rationale

**Python Generation Flow:**

```
Spec Block → IR → Python Template → .py File
                ↓
         @dataclass or Pydantic
         Type hints
         Async support
```

**Benefits:**
- Modern type hints
- Pydantic validation
- FastAPI compatibility
- Async/await support

## Specification

### Type Mapping

**@python/type-mapping:**

```speclang
# @block:python/type-mapping @kind:entity
PythonTypeMapping:
  primitives:
    String: str
    Int: int
    Float: float
    Bool: bool
    Bytes: bytes
    
  special:
    UUID: UUID              # uuid.UUID
    DateTime: datetime      # datetime.datetime
    Date: date              # datetime.date
    Time: time              # datetime.time
    Duration: timedelta     # datetime.timedelta
    Decimal: Decimal        # decimal.Decimal
    
  collections:
    List<T>: list[T]
    Set<T>: set[T]
    Map<K,V>: dict[K, V]
    Tuple<T...>: tuple[T, ...]
    
  optional:
    Optional<T>: T | None
    Nullable<T>: T | None
    
  union:
    Union<T1,T2>: T1 | T2
```

### Entity Generation (Pydantic)

**@python/entity-pydantic:**

```speclang
# @block:python/entity-pydantic @kind:operation
Entity → Pydantic BaseModel

Mapping:
  entity: BaseModel class
  fields: typed attributes
  
Features:
  - Automatic validation
  - JSON serialization
  - ORM mode support

Example:
  SpecLang:
    User:
      id: UUID
      email: String
      name: Optional<String>
      createdAt: DateTime
      
  Python:
    from pydantic import BaseModel, Field
    from uuid import UUID
    from datetime import datetime
    from typing import Optional
    
    class User(BaseModel):
        id: UUID
        email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
        name: Optional[str] = None
        created_at: datetime = Field(default_factory=datetime.utcnow, alias='createdAt')
        
        class Config:
            populate_by_name = True
```

### Entity Generation (dataclass)

**@python/entity-dataclass:**

```speclang
# @block:python/entity-dataclass @kind:operation
Entity → @dataclass

When:
  - No validation needed
  - Lightweight structures
  
Example:
  SpecLang:
    Point:
      x: Float
      y: Float
      
  Python:
    from dataclasses import dataclass
    
    @dataclass
    class Point:
        x: float
        y: float
```

### Operation Generation

**@python/operation:**

```speclang
# @block:python/operation @kind:operation
Operation → def/async def

Mapping:
  operation: function
  params: typed parameters
  returns: return type
  
Sync:
  def name(params) -> ReturnType:
  
Async:
  async def name(params) -> ReturnType:

Example:
  SpecLang:
    getUser(id: UUID): User
    
  Python:
    from uuid import UUID
    
    async def get_user(id: UUID) -> User:
        """Get user by ID."""
        pass
```

### Policy Generation

**@python/policy:**

```speclang
# @block:python/policy @kind:operation
Policy → Decorator or Guard

Pattern 1 - Decorator:
  def must_be_admin(func):
      @wraps(func)
      async def wrapper(user: User, *args, **kwargs):
          if user.role != "admin":
              raise PermissionError("Admin required")
          return await func(user, *args, **kwargs)
      return wrapper

Pattern 2 - Guard function:
  def check_admin(user: User) -> None:
      if user.role != "admin":
          raise PermissionError("Admin required")
```

### Enum Generation

**@python/enum:**

```speclang
# @block:python/enum @kind:operation
Enum → Enum class

Example:
  SpecLang:
    Status:
      - active
      - inactive
      
  Python:
    from enum import Enum
    
    class Status(str, Enum):
        ACTIVE = "active"
        INACTIVE = "inactive"
```

### Protocol Generation

**@python/protocol:**

```speclang
# @block:python/protocol @kind:operation
Interface → Protocol

Example:
  SpecLang:
    UserRepository:
      get(id: UUID): User
      create(user: User): void
      
  Python:
    from typing import Protocol
    
    class UserRepository(Protocol):
        async def get(self, id: UUID) -> User: ...
        async def create(self, user: User) -> None: ...
```

### Error Generation

**@python/errors:**

```speclang
# @block:python/errors @kind:operation
Errors → Exception classes

Example:
  class SpecLangError(Exception):
      """Base error for SpecLang generated code."""
      pass
      
  class NotFoundError(SpecLangError):
      """Resource not found."""
      pass
      
  class ValidationError(SpecLangError):
      """Validation failed."""
      def __init__(self, field: str, message: str):
          self.field = field
          self.message = message
          super().__init__(f"{field}: {message}")
```

## Templates

### Pydantic Entity Template

**@python/template-pydantic:**

```handlebars
# @speclang-id: {{blockId}}
# @speclang-generated: DO NOT EDIT

from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict

class {{name}}(BaseModel):
    {{#each fields}}
    {{pythonName}}: {{pythonType}}{{#if defaultValue}} = {{defaultValue}}{{else if optional}} = None{{/if}}
    {{/each}}
    
    model_config = ConfigDict(
        populate_by_name=True,
    )
```

### Operation Template

**@python/template-operation:**

```handlebars
# @speclang-id: {{blockId}}
# @speclang-generated: DO NOT EDIT

{{#if isAsync}}async {{/if}}def {{pythonName}}({{params}}) -> {{returnType}}:
    """{{description}}"""
    # TODO: Implement operation
    pass
```

### Enum Template

**@python/template-enum:**

```handlebars
# @speclang-id: {{blockId}}
# @speclang-generated: DO NOT EDIT

from enum import Enum

class {{name}}(str, Enum):
    {{#each values}}
    {{upperName}} = "{{value}}"
    {{/each}}
```

## File Organization

### @python/file-layout

```speclang
# @block:python/file-layout @kind:entity
PythonFileLayout:
  generated/python/
    {{domain}}/
      __init__.py
      models.py        # All Pydantic models
      operations.py    # All operations
      errors.py        # All exceptions
      protocols.py     # All protocols
      
  Per-entity option:
    generated/python/
      {{domain}}/
        __init__.py
        user/
          __init__.py
          model.py
          repository.py
          service.py
```

### @python/imports

```speclang
# @block:python/imports @kind:entity
StandardImports:
  - __future__.annotations
  - typing
  - dataclasses
  - enum
  
PydanticImports:
  - pydantic.BaseModel
  - pydantic.Field
  - pydantic.ConfigDict
```

## Implementation

### Generator Core

```typescript
class PythonGenerator implements TargetGenerator {
  readonly name = 'python';
  readonly fileExt = '.py';
  
  generate(ir: ResolvedIR): Artifact[] {
    const artifacts: Artifact[] = [];
    
    for (const block of ir.blocks) {
      switch (block.kind) {
        case 'entity':
          artifacts.push(this.generateEntity(block));
          break;
        case 'operation':
          artifacts.push(this.generateOperation(block));
          break;
        case 'policy':
          artifacts.push(this.generatePolicy(block));
          break;
        case 'enum':
          artifacts.push(this.generateEnum(block));
          break;
      }
    }
    
    // Add __init__.py
    artifacts.push(this.generateInit(ir));
    
    return artifacts;
  }
  
  private generateEntity(block: Block): Artifact {
    const usePydantic = block.annotations?.pydantic !== false;
    const template = this.loadTemplate(usePydantic ? 'pydantic' : 'dataclass');
    
    const content = template({
      blockId: block.id,
      name: block.name,
      fields: block.fields.map(f => ({
        pythonName: toSnake(f.name),
        pythonType: this.mapType(f.type),
        optional: f.optional,
        defaultValue: f.default,
      })),
    });
    
    return {
      path: this.getOutputPath(block),
      content,
      markers: [`@speclang-id: ${block.id}`],
    };
  }
  
  mapType(speclangType: string): string {
    const mapping: Record<string, string> = {
      'String': 'str',
      'Int': 'int',
      'Float': 'float',
      'Bool': 'bool',
      'UUID': 'UUID',
      'DateTime': 'datetime',
    };
    
    if (mapping[speclangType]) {
      return mapping[speclangType];
    }
    
    if (speclangType.startsWith('List<')) {
      const inner = speclangType.slice(5, -1);
      return `list[${this.mapType(inner)}]`;
    }
    
    if (speclangType.startsWith('Map<')) {
      const [key, value] = speclangType.slice(4, -1).split(',');
      return `dict[${this.mapType(key.trim())}, ${this.mapType(value.trim())}]`;
    }
    
    if (speclangType.startsWith('Optional<')) {
      const inner = speclangType.slice(9, -1);
      return `${this.mapType(inner)} | None`;
    }
    
    return speclangType;
  }
  
  private generateInit(ir: ResolvedIR): Artifact {
    const exports = ir.blocks
      .map(b => b.name)
      .filter(Boolean)
      .map(name => `from .models import ${name}`);
    
    return {
      path: `${ir.package}/__init__.py`,
      content: `# @speclang-generated: DO NOT EDIT\n\n${exports.join('\n')}\n`,
      markers: [],
    };
  }
}
```

### Type Mapper

```typescript
class PythonTypeMapper {
  map(speclangType: string): string {
    // Handle Union types
    if (speclangType.includes('|')) {
      const types = speclangType.split('|').map(t => this.map(t.trim()));
      return types.join(' | ');
    }
    
    // Handle Optional
    const optionalMatch = speclangType.match(/^Optional<(.+)>$/);
    if (optionalMatch) {
      return `${this.map(optionalMatch[1])} | None`;
    }
    
    // Handle List
    const listMatch = speclangType.match(/^List<(.+)>$/);
    if (listMatch) {
      return `list[${this.map(listMatch[1])}]`;
    }
    
    // Handle Dict/Map
    const dictMatch = speclangType.match(/^Map<(.+),\s*(.+)>$/);
    if (dictMatch) {
      return `dict[${this.map(dictMatch[1])}, ${this.map(dictMatch[2])}]`;
    }
    
    // Primitive types
    return this.primitives[speclangType] || speclangType;
  }
  
  private primitives: Record<string, string> = {
    'String': 'str',
    'Int': 'int',
    'Int32': 'int',
    'Int64': 'int',
    'Float': 'float',
    'Float32': 'float',
    'Float64': 'float',
    'Bool': 'bool',
    'Bytes': 'bytes',
    'UUID': 'UUID',
    'DateTime': 'datetime',
    'Date': 'date',
    'Time': 'time',
  };
}
```

### Output Writer

```typescript
async function writePythonArtifact(artifact: Artifact): Promise<void> {
  const dir = path.dirname(artifact.path);
  
  await fs.promises.mkdir(dir, { recursive: true });
  
  const lines = [
    `# @speclang-id: ${artifact.markers[0] || 'auto'}`,
    '# @speclang-generated: DO NOT EDIT',
    '',
  ];
  
  if (artifact.content.includes('BaseModel') || 
      artifact.content.includes('Field(')) {
    lines.unshift('from __future__ import annotations', '');
  }
  
  const content = lines.join('\n') + artifact.content;
  
  await fs.promises.writeFile(artifact.path, content);
  
  // Run black formatter if available
  try {
    execSync(`black ${artifact.path}`, { stdio: 'pipe' });
  } catch {
    // black not installed, skip
  }
}
```

## FastAPI Integration

### @python/fastapi

```speclang
# @block:python/fastapi @kind:note
Generated Python code is FastAPI-compatible:

- Pydantic models work as request/response bodies
- Async operations work as route handlers
- Type hints enable automatic OpenAPI docs

Example integration:

  from fastapi import FastAPI, Depends
  from generated.python.auth import User, get_user
  
  app = FastAPI()
  
  @app.get("/users/{user_id}", response_model=User)
  async def read_user(user_id: UUID):
      return await get_user(user_id)
```

## References

- @ref:specs/codegen.spec.dir/python
- @ref:specs/codegen.spec.dir/templates
- SIP 12: Codegen Framework
- SIP 66: Go Generator

## Copyright

This document is in the public domain.
