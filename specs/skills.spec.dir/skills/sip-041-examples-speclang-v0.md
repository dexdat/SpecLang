---
name: sip-041-examples-speclang-v0
title: "SIP 41: Examples System"
version: 0.1.0
description: Example specifications demonstrating SpecLang features
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 41: Examples System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Examples System—example specs demonstrating SpecLang features.

### Quick Start

Examples live in `specs/examples.spec.spec.dir/`:
- `hello-world.spec.md` - Minimal working example
- Each demonstrates specific features

### When to Read This

- **Learning**: How to write specs
- **Templates**: Starting points for new specs
- **Validation**: Testing system behavior

### Related SIPs

- SIP 0: What is SpecLang
- SIP 15: Self-Specifying
- SIP 42: Project Layout

## Abstract

This SIP defines the Examples System—a collection of example specs that demonstrate SpecLang features. Examples serve as learning materials, templates, and validation cases.

## Motivation

Users need:
- Working examples to learn from
- Templates to start new specs
- Validation cases for testing
- Documentation by example

Examples fill all these needs.

## Rationale

**Example approach:**

1. **Simple**: Start with minimal examples
2. **Progressive**: Build up complexity
3. **Complete**: Full working code
4. **Annotated**: Explain what happens

## Specification

### Example Structure

```yaml
ExampleSpec:
  header:
    id: "@examples/{name}"
    version: "1.0.0"
    layer: 10              # Examples at highest layer
    tags: [example, {name}]
    status: draft
    project_level: POC     # Examples are POC level
    agent_support: agent_autonomous
    
  sections:
    - title: "# {Name} Example"
    - overview: Brief description
    - implementation: Code blocks
    - expected_output: What to expect
    - verification_steps: How to verify
    - success_criteria: Checklist
```

### Directory Layout

```yaml
ExamplesLayout:
  parent: specs/examples.spec.md
  children_dir: specs/examples.spec.spec.dir/
  
  examples:
    - hello-world.spec.md       # Minimal example
    - entities.spec.md          # Entity definitions
    - operations.spec.md        # Operation definitions
    - references.spec.md        # Cross-spec references
    - splitting.spec.md         # Dynamic splitting demo
    - cascade.spec.md           # Full cascade demo
```

### Example Categories

```yaml
ExampleCategories:
  basic:
    - hello-world               # Minimal working example
    - entities                  # Simple entity definitions
    - operations                # Simple operations
    
  intermediate:
    - references                # Cross-spec references
    - validation                # Validation rules
    - splitting                 # Dynamic splitting
    
  advanced:
    - cascade                   # Full cascade demo
    - multi-agent               # Multi-agent coordination
    - self-modifying            # Spec that modifies itself
```

### Hello World Template

```yaml
HelloWorldTemplate:
  header:
    id: "@examples/hello-world"
    version: "1.0.0"
    layer: 10
    tags: [example, hello-world, tutorial]
    status: draft
    project_level: POC
    agent_support: agent_autonomous
    short: "Hello World Example"
    
  content:
    title: "# Hello World Example"
    overview: |
      Minimal working example of the SpecLang cascade.
      Demonstrates: Writing spec, generating code, verifying compilation
    
    implementation: |
      ### @block:hello/function @kind:code
      ```typescript
      export function helloWorld(name: string): string {
        return `Hello, ${name}!`;
      }
      ```
      
    expected_output: |
      Hello, SpecLang!
      
    verification:
      - Generate: src/examples/hello-world.ts
      - Compile: npx tsc --noEmit
      - Run: node dist/examples/hello-world.js
      - Verify: Output matches expected
      
    success_criteria:
      - "[ ] Code generates without errors"
      - "[ ] TypeScript compilation passes"
      - "[ ] Function exports correctly"
      - "[ ] Example usage runs"
```

### Example Metadata

```yaml
ExampleMetadata:
  required_fields:
    - id: Must start with @examples/
    - version: Semantic version
    - layer: Always 10 for examples
    - tags: Include "example" tag
    - short: Brief description
    
  optional_fields:
    - difficulty: beginner | intermediate | advanced
    - demonstrates: List of features demonstrated
    - prerequisites: Other examples to read first
    - estimated_time: Time to complete
```

### Example Generation

```yaml
ExampleGeneration:
  command: "speclang example create {name}"
  
  template_selection:
    - hello-world: Minimal template
    - entity: Entity-focused template
    - operation: Operation-focused template
    - full: Complete template with all sections
    
  auto_fields:
    - id: Generated from name
    - version: Start at 1.0.0
    - layer: Always 10
    - created: Current timestamp
```

## Examples

### Example 1: Hello World Spec

```yaml
# specs/examples.spec.spec.dir/hello-world.spec.md
id: "@examples/hello-world"
version: "1.0.0"
layer: 10
tags: [example, hello-world, tutorial]
status: draft
project_level: POC
agent_support: agent_autonomous
short: "Hello World Example"
---

# Hello World Example

Minimal working example of the SpecLang cascade.

## Overview

This spec demonstrates:
1. Writing a spec
2. Generating code from spec
3. Verifying code compiles

## Implementation

### @block:hello/function @kind:code
```typescript
export function helloWorld(name: string): string {
  return `Hello, ${name}!`;
}
```

## Expected Output

```
Hello, SpecLang!
```

## Success Criteria

- [ ] Code generates without errors
- [ ] TypeScript compilation passes
- [ ] Function exports correctly
```

### Example 2: Entity Example

```yaml
# specs/examples.spec.spec.dir/entities.spec.md
id: "@examples/entities"
version: "1.0.0"
layer: 10
tags: [example, entities]
short: "Entity Definitions Example"
---

# Entity Definitions Example

Demonstrates how to define entities in SpecLang.

## Entities

### @block:user/entity @kind:entity
```yaml
User:
  id: UUID
  email: String (unique)
  name: String
  created_at: DateTime
  
  constraints:
    - email must be valid format
    - name must not be empty
```

### @block:session/entity @kind:entity
```yaml
Session:
  id: UUID
  user_id: UUID -> User
  token: String
  expires_at: DateTime
  
  constraints:
    - expires_at must be in future
```
```

## Implementation

```python
from dataclasses import dataclass
from typing import Optional
from enum import Enum

class Difficulty(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

@dataclass
class ExampleMetadata:
    id: str
    version: str = "1.0.0"
    layer: int = 10
    tags: list[str] = None
    difficulty: Difficulty = Difficulty.BEGINNER
    demonstrates: list[str] = None
    prerequisites: list[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = ["example"]
        else:
            self.tags = ["example"] + self.tags

class ExampleGenerator:
    TEMPLATES = {
        "hello-world": """# {id}
version: "1.0.0"
layer: 10
tags: [example, hello-world]
short: "{title}"
---

# {title}

{description}

## Implementation

### @block:main/function @kind:code
```typescript
export function main(): string {{
  return "Hello, World!";
}}
```
""",
        "entity": """# {id}
version: "1.0.0"
layer: 10
tags: [example, entities]
short: "{title}"
---

# {title}

{description}

## Entities

### @block:{name}/entity @kind:entity
```yaml
{name}:
  id: UUID
  # Add fields here
```
"""
    }
    
    def create(self, name: str, template: str = "hello-world", **kwargs) -> str:
        template_str = self.TEMPLATES.get(template, self.TEMPLATES["hello-world"])
        return template_str.format(
            id=f"@examples/{name}",
            title=name.replace("-", " ").title(),
            description=kwargs.get("description", "Example specification."),
            name=name,
            **kwargs
        )
```

## References

- @ref:speclang/examples
- @ref:speclang/examples.spec.spec.dir/hello-world
- SIP 0: What is SpecLang
- SIP 15: Self-Specifying

## Copyright

This document is in the public domain.
