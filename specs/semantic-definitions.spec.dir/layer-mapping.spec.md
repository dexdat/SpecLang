# speclang-header lines:10
id: "@speclang/semantic-definitions/layer-mapping"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [semantic, definitions, layer, mapping, autonomous]
short: Layer mapping definitions and interactions
parent: "@speclang/semantic-definitions"
part: "1/2"
---
# Depth Mapping Definitions

Part 1 of 2: Layer semantics and interactions.

## Depth Mapping Table

```speclang
# @block:semantic-definitions/depth-table @kind:table
| Depth | Name | Purpose | Example Spec |
|-------|------|---------|--------------|
| 0 | North Star | Project intent | `project.scl` |
| 1 | Feature | Feature breakdown | `auth.spec.md` |
| 2 | Component | Entities, operations | `auth/entities.spec.yaml` |
| 3 | Detail | Pseudocode, algorithms | `auth/login-algorithm.spec.yaml` |
| 4 | Implementation | Language mapping | `auth/login-implementation.spec.yaml` |
| 5 | Code Spec | Direct code mapping | `auth/login.go.spec` |
| 6 | Generated Code | Output code | `generated/go/auth/login.go` |
| 7 | Test Spec | Test descriptions | `auth/login.test.spec.md` |
| 8 | Test Code Spec | Test code mapping | `auth/login.test.go.spec` |
| 9 | Generated Test Code | Generated tests | `generated/go/auth/login_test.go` |
| 10 | Deployment/Ops | Infrastructure | `deployment/k8s.spec.yaml` |
```

## Field Interactions Involving Layer

```speclang
# @block:semantic-definitions/interactions-depth @kind:entity
LayerInteractions:

  layer_and_project_level:
    - Depth 0 specs often have `project_level: Alpha` or higher
    - Depth 5+ specs typically require `project_level >= Beta`
    - Deployment specs (depth 10) often have `project_level: Production+`
    
  layer_and_agent_support:
    - Depth 0-2: Often `agent_assisted` (high-level intent)
    - Depth 3-5: Often `agent_autonomous` (detailed specs)
    - Depth 6-10: Typically `agent_autonomous` (generated artifacts)
```

## Validation Rules for Layer

```speclang
# @block:semantic-definitions/validation-depth @kind:entity
LayerValidation:

  cross_field_validation:
    - If `layer: 0` and `project_level: Production` (warning - unusual but allowed)
    - If `layer: 5` and `agent_support: human_only` (warning - inefficient)
    
  completeness_rules:
    - Specs with `layer: 5` must have `target` field
```

## Transition Examples Involving Layer

```speclang
# @block:semantic-definitions/transitions-depth @kind:note
How layer evolves as a project matures:

**Feature evolution**:
1. POC (layer 1, human_only) → MVP (layer 2, agent_assisted)
2. MVP → Alpha (layer 3, agent_assisted)
3. Alpha → Beta (layer 4, agent_assisted)
4. Beta → Production (layer 5, agent_autonomous)
```

## Implementation Guidance for Layer

```speclang
# @block:semantic-definitions/implementation-depth @kind:note
For tool implementers:

1. **Layer validation**: Check layer appropriateness based on content type
2. **Cross-field validation**: Implement the validation rules above

All validation should be integrated into:
- Guard plugin (real-time)
- CI/CD pipelines
- Editor extensions
```

## References

```speclang
# @block:semantic-definitions/references-depth @kind:refs
refs:
  - "@ref:speclang/layer-definitions
  - "@ref:speclang/project-maturity-levels
  - "@ref:speclang/agent-support-levels
  - "@ref:speclang/autonomous-validation
```