---
name: sip-086-lenses-entity-speclang-v0
title: "SIP 86: Entity Lens"
version: 0.1.0
description: Entity and data structure parsing for spec blocks
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 86: Entity Lens

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the Entity Lens—parsing and rendering of entity definitions within spec blocks.

### Quick Start

```markdown
### @block::user-entity @kind:entity

```yaml
id: string
email: string
name: string
role: user | admin
created_at: datetime
metadata: json
```
```

### When to Read This

- **Data models**: Entity definitions
- **Type definitions**: Structured data
- **Schema specs**: Database schemas, APIs

### Related SIPs

- SIP 35: Lenses System
- SIP 54: SQLite Schema
- SIP 75: Spec Entities

## Abstract

This SIP defines the Entity Lens—a specialized lens for parsing and rendering entity definitions within SpecLang blocks. The lens supports field definitions, types, constraints, and relationships.

## Motivation

Entities are fundamental:
- Data models
- API schemas
- Database tables
- Configuration

Entity lens extracts structured field data.

## Rationale

**Why entity lens:**
- Structured field parsing
- Type inference
- Constraint extraction
- Relationship modeling

## Specification

### Lens Definition

**@lens/definition:**

```yaml
EntityLens:
  name: "entity"
  kind_marker: "@kind:entity"
  detector: "field:type pattern detected"
  priority: 30
```

### Block Format

**@lens/format:**

```yaml
block:
  id: "@block:user"
  kind: "entity"
  
  entity_lens:
    fields:
      id: string
      name: string
      email: string
```

### Field Syntax

**@lens/syntax:**

```yaml
FieldFormat:
  basic: "field_name: type_name"
  optional: "field_name?: type_name"
  array: "field_name: type_name[]"
  map: "field_name: Map<key, value>"
  union: "field_name: type_a | type_b"
  reference: "field_name: ""@ref:entity-id"```

### Supported Types

**@lens/types:**

```yaml
ScalarTypes:
  string: "Text data"
  number: "Numeric data"
  integer: "Whole numbers"
  boolean: "True/false"
  binary: "Binary data"
  uuid: "UUID v4"
  datetime: "ISO 8601 datetime"
  date: "Date only"
  time: "Time only"
  email: "Email address"
  url: "URL"
  json: "JSON object"
  yaml: "YAML object"
  xml: "XML object"

ComplexTypes:
  array: "List of values"
  map: "Key-value pairs"
  object: "Nested object"
  union: "Multiple possible types"
  enum: "Enumerated values"
```

### Parsing

**@lens/parsing:**

```typescript
interface EntityBlock {
  kind: 'entity';
  name: string;
  fields: Field[];
  constraints: Constraint[];
  indexes: Index[];
  relationships: Relationship[];
}

interface Field {
  name: string;
  type: string;
  optional: boolean;
  array: boolean;
  defaultValue?: string;
  constraints: FieldConstraint[];
  description?: string;
}
```

### Field Parsing

**@lens/field_parsing:**

```typescript
function parseField(line: string): Field {
  const trimmed = line.trim();
  
  const pattern = /^(\??)([\w]+)\s*:\s*(.+?)(\s*=\s*(.*))?$/;
  const match = trimmed.match(pattern);
  
  if (!match) {
    throw new Error(`Invalid field syntax: ${line}`);
  }
  
  const [, optional, name, typeWithModifiers, , defaultValue] = match;
  
  const { type, array, genericType } = parseType(typeWithModifiers);
  
  return {
    name,
    type,
    optional: optional === '?',
    array,
    defaultValue,
    constraints: [],
  };
}

function parseType(typeStr: string): { type: string; array: boolean; genericType?: string } {
  const arrayMatch = typeStr.match(/^(.+?)\[\]$/);
  if (arrayMatch) {
    const genericMatch = arrayMatch[1].match(/^Map<(.+),\s*(.+)>$/);
    if (genericMatch) {
      return { type: 'map', array: true, genericType: `${genericMatch[1]},${genericMatch[2]}` };
    }
    return { type: arrayMatch[1], array: true };
  }
  
  const genericMatch = typeStr.match(/^(.+)<(.+)>$/);
  if (genericMatch) {
    return { type: genericMatch[1], array: false, genericType: genericMatch[2] };
  }
  
  return { type: typeStr, array: false };
}
```

### Constraint Parsing

**@lens/constraints:**

```typescript
interface Constraint {
  type: 'primary_key' | 'unique' | 'not_null' | 'foreign_key' | 'check' | 'default';
  fields: string[];
  reference?: { table: string; column: string };
  condition?: string;
  value?: any;
}

function parseConstraints(lines: string[]): Constraint[] {
  const constraints: Constraint[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#@primary_key')) {
      const fields = extractFieldNames(trimmed);
      constraints.push({ type: 'primary_key', fields });
    }
    
    if (trimmed.startsWith('#@unique')) {
      const fields = extractFieldNames(trimmed);
      constraints.push({ type: 'unique', fields });
    }
    
    if (trimmed.startsWith('#@not_null')) {
      const fields = extractFieldNames(trimmed);
      constraints.push({ type: 'not_null', fields });
    }
    
    if (trimmed.startsWith('#@foreign_key')) {
      const refMatch = trimmed.match(/@foreign_key\s+\((\w+)\)\s+references\s+(\w+)\.(\w+)/);
      if (refMatch) {
        constraints.push({
          type: 'foreign_key',
          fields: [refMatch[1]],
          reference: { table: refMatch[2], column: refMatch[3] },
        });
      }
    }
    
    if (trimmed.startsWith('#@default')) {
      const defaultMatch = trimmed.match(/@default\(([^)]+)\)/);
      if (defaultMatch) {
        constraints.push({ type: 'default', fields: [], value: parseDefault(defaultMatch[1]) });
      }
    }
  }
  
  return constraints;
}
```

### Relationship Parsing

**@lens/relationships:**

```typescript
interface Relationship {
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  from: string;
  to: string;
  through?: string;
}

function parseRelationships(lines: string[]): Relationship[] {
  const relationships: Relationship[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    const oneToOne = trimmed.match(/(\w+)\s*->\s*(\w+)/);
    if (oneToOne) {
      relationships.push({ type: 'one_to_one', from: oneToOne[1], to: oneToOne[2] });
    }
    
    const oneToMany = trimmed.match(/(\w+)\s*->>\s*(\w+)/);
    if (oneToMany) {
      relationships.push({ type: 'one_to_many', from: oneToMany[1], to: oneToMany[2] });
    }
    
    const manyToMany = trimmed.match(/(\w+)\s*<->\s*(\w+)/);
    if (manyToMany) {
      const throughMatch = trimmed.match(/through\s+(\w+)/);
      relationships.push({
        type: 'many_to_many',
        from: manyToMany[1],
        to: manyToMany[2],
        through: throughMatch?.[1],
      });
    }
  }
  
  return relationships;
}
```

### Index Parsing

**@lens/indexes:**

```typescript
interface Index {
  name: string;
  fields: string[];
  unique: boolean;
  type?: string;
}

function parseIndexes(lines: string[]): Index[] {
  const indexes: Index[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#@index')) {
      const indexMatch = trimmed.match(/#@index\s+(?:(\w+)\s+)?\(([^)]+)\)(\s+unique)?/);
      if (indexMatch) {
        indexes.push({
          name: indexMatch[1] || `idx_${indexMatch[2].replace(/,\s*/g, '_')}`,
          fields: indexMatch[2].split(',').map(f => f.trim()),
          unique: indexMatch[3] !== undefined,
        });
      }
    }
  }
  
  return indexes;
}
```

### Rendering

**@lens/rendering:**

```typescript
function renderEntity(block: EntityBlock): string {
  const lines: string[] = ['```yaml'];
  
  for (const field of block.fields) {
    let fieldStr = '';
    
    if (field.optional) {
      fieldStr += '?';
    }
    
    fieldStr += field.name;
    fieldStr += ': ';
    
    if (field.array) {
      fieldStr += `${field.type}[]`;
    } else {
      fieldStr += field.type;
    }
    
    if (field.defaultValue !== undefined) {
      fieldStr += ` = ${field.defaultValue}`;
    }
    
    lines.push(fieldStr);
  }
  
  for (const constraint of block.constraints) {
    lines.push(renderConstraint(constraint));
  }
  
  for (const rel of block.relationships) {
    lines.push(renderRelationship(rel));
  }
  
  lines.push('```');
  return lines.join('\n');
}
```

### Validation Rules

**@lens/validation:**

```yaml
ValidationRules:
  - name: valid_field_syntax
    description: "Field must match field:type pattern"
    check: parseField(line)
    
  - name: valid_type
    description: "Type must be recognized"
    check: type in knownTypes
    
  - name: unique_field_names
    description: "Field names must be unique"
    check: fields.length == unique(fields).length
    
  - name: valid_references
    description: "References must point to existing entities"
    check: all refs resolve
    
  - name: valid_constraints
    description: "Constraints must reference existing fields"
    check: constraint.fields in fields
```

### AI Behavior

**@lens/ai:**

```yaml
AIBehavior:
  auto_detection:
    - "Detects field:type patterns"
    - "Infers types from values"
    - "Identifies relationships"
    
  generation:
    - "Generates entities from prose"
    - "Adds fields from requirements"
    - "Creates relationships"
    
  transformation:
    - "Converts to/from code types"
    - "Generates database schemas"
    - "Creates API schemas"
```

## Examples

### Example 1: User Entity

**@example/user:**

```markdown
### @block::user @kind:entity

```yaml
# User entity for authentication
id: uuid
email: string
name: string
password_hash: string
role: user | admin | moderator
avatar_url?: url
created_at: datetime
updated_at: datetime
last_login?: datetime

#@primary_key (id)
#@unique (email)
#@index (created_at)
```
```

**Parsed:**
```yaml
block:
  id: "@block:user"
  kind: "entity"
  name: "user"
  fields:
    - { name: "id", type: "uuid", optional: false }
    - { name: "email", type: "string", optional: false }
    - { name: "name", type: "string", optional: false }
    - { name: "password_hash", type: "string", optional: false }
    - { name: "role", type: "union", optional: false }
    - { name: "avatar_url", type: "url", optional: true }
    - { name: "created_at", type: "datetime", optional: false }
    - { name: "updated_at", type: "datetime", optional: false }
    - { name: "last_login", type: "datetime", optional: true }
  constraints:
    - { type: "primary_key", fields: ["id"] }
    - { type: "unique", fields: ["email"] }
    - { type: "index", fields: ["created_at"], unique: false }
```

### Example 2: Order Entity

**@example/order:**

```markdown
### @block::order @kind:entity

```yaml
id: string
user_id: uuid
items: order_item[]
status: pending | processing | shipped | delivered | cancelled
total_amount: number
currency: string
shipping_address: address
billing_address?: address
notes?: string
created_at: datetime
shipped_at?: datetime
delivered_at?: datetime

#@primary_key (id)
#@foreign_key (user_id) references user(id)
#@index (user_id, created_at)
#@index (status)
```
```

### Example 3: Entity Relationships

**@example/relationships:**

```markdown
### @block::entities @kind:entity

```yaml
# Entities with relationships

user -> post         # One user has many posts
post -> comment      # One post has many comments
user <-> role        # Many users have many roles (through user_roles)

#@entity user
#@entity post
#@entity comment
#@entity role
#@entity user_roles
```
```

### Example 4: Complex Types

**@example/complex:**

```markdown
### @block::config @kind:entity

```yaml
settings: map<string, any>
tags: string[]
metadata: json
coordinates?: { lat: number, lng: number }
permissions: permission[]
schedule: schedule
```
```

## Implementation

### Entity Lens Implementation

```typescript
export class EntityLens implements Lens {
  name = 'entity';
  
  detect(content: string): boolean {
    return /^(\??)[\w]+\s*:\s*.+$/m.test(content);
  }
  
  parse(content: string): EntityBlock {
    const codeBlock = content.match(/```(?:yaml|yml)?\s*([\s\S]*?)```/);
    const lines = (codeBlock ? codeBlock[1] : content).split('\n')
      .filter(l => l.trim() && !l.trim().startsWith('#'));
    
    const fields: Field[] = [];
    const constraints: Constraint[] = [];
    const relationships: Relationship[] = [];
    const indexes: Index[] = [];
    
    for (const line of lines) {
      if (line.includes(':')) {
        fields.push(parseField(line));
      } else if (line.startsWith('#@')) {
        constraints.push(...parseConstraints([line]));
        relationships.push(...parseRelationships([line]));
        indexes.push(...parseIndexes([line]));
      }
    }
    
    return { kind: 'entity', name: '', fields, constraints, indexes, relationships };
  }
  
  render(block: EntityBlock): string {
    return renderEntity(block);
  }
  
  validate(block: EntityBlock): ValidationResult {
    const errors: string[] = [];
    const fieldNames = block.fields.map(f => f.name);
    
    if (new Set(fieldNames).size !== fieldNames.length) {
      errors.push('Duplicate field names');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### Type Inference

```typescript
function inferType(value: string): string {
  if (value === 'true' || value === 'false') return 'boolean';
  if (/^\d+$/.test(value)) return 'integer';
  if (/^\d+\.\d+$/.test(value)) return 'number';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'datetime';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(value)) return 'uuid';
  if (value.startsWith('{') || value.startsWith('[')) return 'json';
  return 'string';
}
```

### SQL Generation

```typescript
function entityToSQL(block: EntityBlock): string {
  const lines: string[] = [];
  
  lines.push(`CREATE TABLE ${block.name} (`);
  
  const columnDefs = block.fields.map(field => {
    let def = `  ${field.name} ${fieldTypeToSQL(field.type)}`;
    if (!field.optional) def += ' NOT NULL';
    if (field.defaultValue) def += ` DEFAULT ${field.defaultValue}`;
    return def;
  });
  
  for (const constraint of block.constraints) {
    if (constraint.type === 'primary_key') {
      columnDefs.push(`  PRIMARY KEY (${constraint.fields.join(', ')})`);
    }
    if (constraint.type === 'unique') {
      columnDefs.push(`  UNIQUE (${constraint.fields.join(', ')})`);
    }
  }
  
  lines.push(columnDefs.join(',\n'));
  lines.push(');');
  
  return lines.join('\n');
}
```

## References

- "@ref:sip-035-lenses
- @ref:sip-054-sqlite-schema
- @ref:sip-075-spec-entities
- @ref:speclang/lenses/entity

## Copyright

This document is in the public domain.
