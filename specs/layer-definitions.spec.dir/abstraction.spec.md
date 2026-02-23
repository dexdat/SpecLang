# speclang-header lines:11
id: "@speclang/layer-definitions/abstraction"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [layer, definitions, abstraction, guidelines]
parent: "@speclang/layer-definitions"
part: "1/2"
short: Abstract depth definitions, table, guidelines, and validation rules
---
# Depth Definitions: Abstraction

Clear semantic mapping for the `layer` field (depth in dependency tree).

## Overview

```speclang
# @block:depth/overview @kind:note
The `layer` field indicates abstraction depth within the spec hierarchy.
Lower numbers are more abstract (intent), higher numbers are more concrete (code).

Layer values are used by agents to:
- Determine appropriate level of detail to add
- Validate spec completeness for given layer
- Route spec changes to appropriate agent roles
- Ensure consistent abstraction across the project

All specs must have a layer value (non-negative integer).
```

## Depth Table

```speclang
# @block:depth/table @kind:table
| Depth | Name | Description | Typical Spec Types | Example |
|-------|------|-------------|-------------------|---------|
| 0 | North Star | Overall project intent, goals, architecture | `.scl`, `.spec.md` | `project.scl` |
| 1 | Feature | High-level feature breakdown, user stories | `.spec.md` | `auth.spec.md` |
| 2 | Component | Entities, operations, interfaces, data models | `.spec.md`, `.spec.yaml` | `auth/entities.spec.yaml` |
| 3 | Detail | Detailed design, pseudocode, algorithms, diagrams | `.spec.yaml` | `auth/login-algorithm.spec.yaml` |
| 4 | Implementation | Mapping to target language constructs, APIs | `.spec.yaml` | `auth/login-implementation.spec.yaml` |
| 5 | Code Spec | Direct code mapping with language-specific syntax | `.{ext}.spec` | `auth/login.go.spec` |
| 6 | Generated Code | Actual output code (not edited by humans) | `.{ext}` (generated/) | `generated/go/auth/login.go` |
| 7 | Test Spec | Natural language test descriptions | `.test.spec.md` | `auth/login.test.spec.md` |
| 8 | Test Code Spec | Test code mapping | `.test.{ext}.spec` | `auth/login.test.go.spec` |
| 9 | Generated Test Code | Generated test code | `_test.{ext}` | `generated/go/auth/login_test.go` |
| 10 | Deployment/Ops | Deployment configuration, infrastructure | `.spec.yaml`, `.yaml` | `deployment/k8s.spec.yaml` |
```

## Usage Guidelines

```speclang
# @block:depth/guidelines @kind:note
Guidelines for assigning layer values:

1. **Start at depth 0** for north star intent
2. **Create depth 1 specs** for each major feature
3. **Expand to depth 2-3** as details are needed
4. **Generate depth 5 specs** from depth 3-4 specs
5. **Generate depth 6 code** from depth 5 specs
6. **Create parallel test specs** at depth 7-9
7. **Add deployment specs** at depth 10 when needed

Agents should:
- Respect depth ownership (each role owns specific depth ranges)
- Validate depth consistency (child specs should have depth >= parent)
- Use depth to determine appropriate detail level
```

## Validation Rules

```speclang
# @block:depth/validation @kind:entity
LayerValidation:
  required_fields:
    - layer: integer (depth)
  
  consistency_rules:
    - Child specs (referenced via `parent`) must have layer >= parent layer
    - Specs with `depends_on` should have similar layers (±2)
    - Code specs (layer 5) must reference implementation specs (layer 4)
    - Generated code (layer 6) must reference code specs (layer 5)
  
  agent_behavior:
    - Specs with depth <= 2: spec-writer role
    - Specs with depth 3-4: spec-writer or code-gen role
    - Specs with depth 5: code-gen role
    - Specs with depth 7-8: test-writer role
    - Specs with depth 10: ops-agent role
```

## References

```speclang
# @block:depth/references @kind:refs
refs:
  - @ref:speclang/headers#layer
  - @ref:speclang/spec-format#layers
  - @ref:speclang/project-maturity-levels
  - @ref:speclang/agent-support-levels
```