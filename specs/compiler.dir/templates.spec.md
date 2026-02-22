# speclang-header lines:13
id: "@speclang/compiler.dir/templates"
version: 0.1.0
layer: 2
tags: [compiler, templates, codegen, markers]
imports: ["@speclang/core", "@speclang/stdlib", "@speclang/spec-format"]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:speclang/compiler"
part: 3/3
short: Code generation templates and markers

---
# Code Generation Templates

Templates and markers used during code generation.

## Templates

### @compiler/templates

```speclang
# @block:compiler/templates @kind:note
Codegen uses templates per target:

typescript/entity.hbs:
  export interface {{name}} {
    {{#each fields}}
    {{name}}: {{tsType type}};
    {{/each}}
  }
  
  // @speclang-id: {{blockId}}
  // @speclang-generated: DO NOT EDIT
```

## Markers

### @compiler/markers

```speclang
# @block:compiler/markers @kind:entity
Generated code always includes:

// @speclang-id: @auth/login-handler
// @speclang-version: 1.2.0
// @speclang-layer: 2
// @speclang-generated: DO NOT EDIT BY HAND

These enable:
  - sync back to spec
  - version tracking
  - layer awareness
```