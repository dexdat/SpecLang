---
name: sip-066-go-generator-speclang-v0
title: "SIP 66: Go Generator"
version: 0.1.0
description: Go target code generation with type mapping and templates
category: standard
---

# SIP 66: Go Generator

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the Go code generator for SpecLang.

### Quick Start

```bash
speclang generate --target go
```

### Type Mapping

| SpecLang | Go |
|----------|-----|
| String | string |
| Int | int |
| Float | float64 |
| Bool | bool |
| UUID | uuid.UUID |
| DateTime | time.Time |
| List<T> | []T |
| Map<K,V> | map[K]V |
| Optional<T> | *T |

### When to Read This

- **Go codegen:** Generating Go code
- **Type mapping:** Spec to Go types
- **Templates:** Custom Go templates

### Related SIPs

- SIP 12: Codegen Framework
- SIP 67: Python Generator

## Abstract

This SIP specifies the Go code generator, including type mapping, templates, and Go-specific code generation patterns.

## Motivation

Go is a popular target language for:
- Backend services
- CLI tools
- Microservices
- High-performance systems

## Rationale

**Go Generation Flow:**

```
Spec Block → IR → Go Template → .go File
                ↓
         Struct tags (json, db)
         Error handling
         Interface generation
```

**Benefits:**
- Idiomatic Go code
- Proper error handling
- Struct tags for JSON/DB
- Interface generation

## Specification

### Type Mapping

**@go/type-mapping:**

```speclang
# @block:go/type-mapping @kind:entity
GoTypeMapping:
  primitives:
    String: string
    Int: int
    Int32: int32
    Int64: int64
    UInt: uint
    UInt32: uint32
    UInt64: uint64
    Float32: float32
    Float64: float64
    Bool: bool
    Bytes: []byte
    
  special:
    UUID: uuid.UUID        # github.com/google/uuid
    DateTime: time.Time
    Date: time.Time
    Duration: time.Duration
    URL: *url.URL
    
  collections:
    List<T>: []T
    Set<T>: map[T]struct{}
    Map<K,V>: map[K]V
    
  optional:
    Optional<T>: *T
    Nullable<T>: *T
    
  union:
    Union<T1,T2>: interface{}
```

### Entity Generation

**@go/entity:**

```speclang
# @block:go/entity @kind:operation
Entity → Struct

Mapping:
  entity: struct
  fields: struct fields with tags
  
Tags:
  json: field name, omitempty for optional
  db: column name
  validate: validation rules

Example:
  SpecLang:
    User:
      id: UUID
      email: String
      name: Optional<String>
      createdAt: DateTime
      
  Go:
    type User struct {
        ID        uuid.UUID  `json:"id" db:"id"`
        Email     string     `json:"email" db:"email" validate:"required,email"`
        Name      *string    `json:"name,omitempty" db:"name"`
        CreatedAt time.Time  `json:"createdAt" db:"created_at"`
    }
```

### Operation Generation

**@go/operation:**

```speclang
# @block:go/operation @kind:operation
Operation → Func

Mapping:
  operation: func
  params: function parameters
  returns: (result, error)
  
Pattern:
  func Name(ctx context.Context, params) (Result, error)
  
Example:
  SpecLang:
    getUser(id: UUID): User
    
  Go:
    func (s *Service) GetUser(ctx context.Context, id uuid.UUID) (*User, error)
```

### Policy Generation

**@go/policy:**

```speclang
# @block:go/policy @kind:operation
Policy → Guard Func

Mapping:
  policy: func returning error
  
Pattern:
  func Name(ctx context.Context, input) error
  
Example:
  SpecLang:
    mustBeAdmin(user: User): Boolean
    
  Go:
    func MustBeAdmin(ctx context.Context, user *User) error {
        if user.Role != "admin" {
            return errors.New("unauthorized: admin required")
        }
        return nil
    }
```

### Enum Generation

**@go/enum:**

```speclang
# @block:go/enum @kind:operation
Enum → iota or string

Pattern 1 - iota:
  type Status int
  
  const (
      StatusUnknown Status = iota
      StatusActive
      StatusInactive
  )
  
Pattern 2 - string:
  type Status string
  
  const (
      StatusActive   Status = "active"
      StatusInactive Status = "inactive"
  )
```

### Interface Generation

**@go/interface:**

```speclang
# @block:go/interface @kind:operation
Interface → Go interface

When:
  - Multiple implementations exist
  - Testing requires mocking
  
Example:
  type UserRepository interface {
      Get(ctx context.Context, id uuid.UUID) (*User, error)
      Create(ctx context.Context, user *User) error
      Update(ctx context.Context, user *User) error
      Delete(ctx context.Context, id uuid.UUID) error
  }
```

### Error Generation

**@go/errors:**

```speclang
# @block:go/errors @kind:operation
Errors → Sentinel errors

Pattern:
  var (
      ErrNotFound = errors.New("not found")
      ErrUnauthorized = errors.New("unauthorized")
  )
  
  type ValidationError struct {
      Field string
      Message string
  }
  
  func (e *ValidationError) Error() string {
      return fmt.Sprintf("%s: %s", e.Field, e.Message)
  }
```

## Templates

### Entity Template

**@go/template-entity:**

```handlebars
// @speclang-id: {{blockId}}
// @speclang-generated: DO NOT EDIT

package {{package}}

import (
    "time"
    "github.com/google/uuid"
)

type {{name}} struct {
    {{#each fields}}
    {{pascalName}} {{goType type}} `json:"{{jsonName}}"{{#if dbName}} db:"{{dbName}}"{{/if}}{{#if validate}} validate:"{{validate}}"{{/if}}`
    {{/each}}
}
```

### Operation Template

**@go/template-operation:**

```handlebars
// @speclang-id: {{blockId}}
// @speclang-generated: DO NOT EDIT

{{#if isMethod}}
func (s *{{serviceName}}) {{name}}({{params}}) ({{returnType}}, error) {
{{else}}
func {{name}}({{params}}) ({{returnType}}, error) {
{{/if}}
    // TODO: Implement operation
    return {{zeroValue returnType}}, nil
}
```

### Interface Template

**@go/template-interface:**

```handlebars
// @speclang-id: {{blockId}}
// @speclang-generated: DO NOT EDIT

type {{name}} interface {
    {{#each methods}}
    {{name}}({{params}}) ({{returnType}}, error)
    {{/each}}
}
```

## File Organization

### @go/file-layout

```speclang
# @block:go/file-layout @kind:entity
GoFileLayout:
  generated/go/
    {{domain}}/
      entities.go      # All entities
      operations.go    # All operations  
      errors.go        # All errors
      interfaces.go    # All interfaces
      
  Per-entity option:
    generated/go/
      {{domain}}/
        user/
          entity.go
          repository.go
          service.go
```

### @go/imports

```speclang
# @block:go/imports @kind:entity
StandardImports:
  - context
  - errors
  - fmt
  - time
  
CommonImports:
  - github.com/google/uuid
  - github.com/jmoiron/sqlx (if db)
  - github.com/go-playground/validator/v10
```

## Implementation

### Generator Core

```typescript
class GoGenerator implements TargetGenerator {
  readonly name = 'go';
  readonly fileExt = '.go';
  
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
    
    return artifacts;
  }
  
  private generateEntity(block: Block): Artifact {
    const template = this.loadTemplate('entity');
    const content = template({
      blockId: block.id,
      package: this.getPackage(block),
      name: block.name,
      fields: block.fields.map(f => ({
        pascalName: toPascal(f.name),
        goType: this.mapType(f.type),
        jsonName: f.name,
        dbName: toSnake(f.name),
        validate: this.getValidateTags(f),
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
      'String': 'string',
      'Int': 'int',
      'Int64': 'int64',
      'Float': 'float64',
      'Bool': 'bool',
      'UUID': 'uuid.UUID',
      'DateTime': 'time.Time',
    };
    
    if (mapping[speclangType]) {
      return mapping[speclangType];
    }
    
    // Handle generics
    if (speclangType.startsWith('List<')) {
      const inner = speclangType.slice(5, -1);
      return `[]${this.mapType(inner)}`;
    }
    
    if (speclangType.startsWith('Map<')) {
      const [key, value] = speclangType.slice(4, -1).split(',');
      return `map[${this.mapType(key.trim())}]${this.mapType(value.trim())}`;
    }
    
    if (speclangType.startsWith('Optional<')) {
      const inner = speclangType.slice(9, -1);
      return `*${this.mapType(inner)}`;
    }
    
    return speclangType; // Custom type
  }
}
```

### Template Loader

```typescript
import Handlebars from 'handlebars';

class GoTemplateLoader {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  
  loadTemplate(name: string): HandlebarsTemplateDelegate {
    if (this.templates.has(name)) {
      return this.templates.get(name)!;
    }
    
    const source = fs.readFileSync(
      `templates/go/${name}.hbs`,
      'utf-8'
    );
    
    const template = Handlebars.compile(source);
    this.templates.set(name, template);
    
    return template;
  }
}
```

### Output Writer

```typescript
async function writeGoArtifact(artifact: Artifact): Promise<void> {
  const dir = path.dirname(artifact.path);
  
  await fs.promises.mkdir(dir, { recursive: true });
  
  const content = `// @speclang-id: ${artifact.markers[0]}
// @speclang-generated: DO NOT EDIT

${artifact.content}
`;
  
  await fs.promises.writeFile(artifact.path, content);
  
  // Run gofmt
  execSync(`gofmt -w ${artifact.path}`);
}
```

## References

- @ref:specs/codegen.spec.dir/go
- @ref:specs/codegen.spec.dir/templates
- SIP 12: Codegen Framework
- SIP 67: Python Generator

## Copyright

This document is in the public domain.
