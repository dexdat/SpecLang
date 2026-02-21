# speclang-header lines:9
id: "@speclang/layer-definitions"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [layer, definitions, autonomous, metadata]
short: Concrete definitions for layer values 0-10
---
# Layer Definitions

Clear semantic mapping for the `layer` field (0-10 abstraction depth).

## Overview

```speclang
# @block:layer/overview @kind:note
The `layer` field indicates abstraction depth within the spec hierarchy.
Lower numbers are more abstract (intent), higher numbers are more concrete (code).

Layer values are used by agents to:
- Determine appropriate level of detail to add
- Validate spec completeness for given layer
- Route spec changes to appropriate agent roles
- Ensure consistent abstraction across the project

All specs must have a layer value between 0 and 10 inclusive.
```

## Layer Table

```speclang
# @block:layer/table @kind:table
| Layer | Name | Description | Typical Spec Types | Example |
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

## Layer 0: North Star

```speclang
# @block:layer/0-northstar @kind:entity
Layer0:
  name: "North Star"
  purpose: "Define overall project intent, goals, architecture"
  content_required:
    - Project vision statement
    - High-level architecture diagram
    - Key components list
    - Target languages
    - Reference to all major features
  typical_file: "project.scl"
  owned_by: "human + AI (orchestrator)"
  agent_support: "agent_assisted (human reviews)"
  example: "@ref:northstar/speclang"
```

## Layer 1: Feature

```speclang
# @block:layer/1-feature @kind:entity
Layer1:
  name: "Feature"
  purpose: "Break down a major feature into components"
  content_required:
    - Feature description
    - User stories / use cases
    - Component breakdown
    - Dependencies on other features
    - Non-functional requirements
  typical_file: "{feature}.spec.md"
  owned_by: "spec-writer"
  agent_support: "agent_autonomous (with validation)"
  example: "@ref:specs/auth"
```

## Layer 2: Component

```speclang
# @block:layer/2-component @kind:entity
Layer2:
  name: "Component"
  purpose: "Define entities, operations, interfaces, data models"
  content_required:
    - Entity definitions with fields
    - Operation signatures (inputs/outputs)
    - Interface contracts
    - Data flow diagrams
    - Error handling strategies
  typical_file: "{component}.spec.yaml"
  owned_by: "spec-writer"
  agent_support: "agent_autonomous"
  example: "@ref:specs/auth/entities"
```

## Layer 3: Detail

```speclang
# @block:layer/3-detail @kind:entity
Layer3:
  name: "Detail"
  purpose: "Provide detailed design, pseudocode, algorithms"
  content_required:
    - Step-by-step algorithm descriptions
    - Pseudocode with clear logic
    - State diagrams
    - Performance considerations
    - Security considerations
  typical_file: "{component}-detail.spec.yaml"
  owned_by: "spec-writer"
  agent_support: "agent_autonomous"
  example: "@ref:specs/auth/login-algorithm"
```

## Layer 4: Implementation

```speclang
# @block:layer/4-implementation @kind:entity
Layer4:
  name: "Implementation"
  purpose: "Map detailed design to target language constructs"
  content_required:
    - Language-specific API designs
    - Class/struct definitions
    - Function signatures with types
    - Library dependencies
    - Configuration requirements
  typical_file: "{component}-implementation.spec.yaml"
  owned_by: "code-gen"
  agent_support: "agent_autonomous"
  example: "@ref:specs/auth/login-implementation"
```

## Layer 5: Code Spec

```speclang
# @block:layer/5-code-spec @kind:entity
Layer5:
  name: "Code Spec"
  purpose: "Direct mapping to code with language-specific syntax"
  content_required:
    - Complete code with SPECLANG-ID markers
    - References to source spec blocks
    - Import statements
    - Language idioms and best practices
  typical_file: "{component}.{ext}.spec"
  owned_by: "code-gen"
  agent_support: "agent_autonomous"
  example: "@ref:generated/auth/login.go.spec"
```

## Layer 6: Generated Code

```speclang
# @block:layer/6-generated-code @kind:entity
Layer6:
  name: "Generated Code"
  purpose: "Actual output code (not edited by humans)"
  content_required:
    - Compilable code
    - Proper formatting
    - Documentation comments
    - Generated headers with references
  typical_file: "generated/{lang}/{path}.{ext}"
  owned_by: "code-gen"
  agent_support: "agent_autonomous"
  example: "@ref:generated/go/auth/login.go"
```

## Layer 7: Test Spec

```speclang
# @block:layer/7-test-spec @kind:entity
Layer7:
  name: "Test Spec"
  purpose: "Natural language test descriptions"
  content_required:
    - Test scenarios (Given/When/Then)
    - Expected outcomes
    - Edge cases
    - Performance benchmarks
  typical_file: "{component}.test.spec.md"
  owned_by: "test-writer"
  agent_support: "agent_autonomous"
  example: "@ref:specs/auth/login.test.spec.md"
```

## Layer 8: Test Code Spec

```speclang
# @block:layer/8-test-code-spec @kind:entity
Layer8:
  name: "Test Code Spec"
  purpose: "Test code mapping"
  content_required:
    - Test framework code with SPECLANG-ID markers
    - Test cases mapping to test spec scenarios
    - Setup/teardown procedures
    - Assertion libraries
  typical_file: "{component}.test.{ext}.spec"
  owned_by: "test-writer"
  agent_support: "agent_autonomous"
  example: "@ref:generated/auth/login.test.go.spec"
```

## Layer 9: Generated Test Code

```speclang
# @block:layer/9-generated-test-code @kind:entity
Layer9:
  name: "Generated Test Code"
  purpose: "Generated test code"
  content_required:
    - Executable test code
    - Test assertions
    - Coverage instrumentation
    - Integration with test runner
  typical_file: "generated/{lang}/{path}_test.{ext}"
  owned_by: "test-writer"
  agent_support: "agent_autonomous"
  example: "@ref:generated/go/auth/login_test.go"
```

## Layer 10: Deployment/Ops

```speclang
# @block:layer/10-deployment @kind:entity
Layer10:
  name: "Deployment/Ops"
  purpose: "Deployment configuration, infrastructure"
  content_required:
    - Infrastructure as code definitions
    - Configuration files
    - Environment variables
    - Monitoring and logging setup
  typical_file: "deployment/{env}.spec.yaml"
  owned_by: "ops-agent"
  agent_support: "agent_autonomous"
  example: "@ref:specs/deployment/k8s"
```

## Usage Guidelines

```speclang
# @block:layer/guidelines @kind:note
Guidelines for assigning layer values:

1. **Start at layer 0** for north star intent
2. **Create layer 1 specs** for each major feature
3. **Expand to layer 2-3** as details are needed
4. **Generate layer 5 specs** from layer 3-4 specs
5. **Generate layer 6 code** from layer 5 specs
6. **Create parallel test specs** at layer 7-9
7. **Add deployment specs** at layer 10 when needed

Agents should:
- Respect layer ownership (each role owns specific layers)
- Validate layer consistency (child specs should have layer >= parent)
- Use layer to determine appropriate detail level
```

## Validation Rules

```speclang
# @block:layer/validation @kind:entity
LayerValidation:
  required_fields:
    - layer: integer 0-10
  
  consistency_rules:
    - Child specs (referenced via `parent`) must have layer >= parent layer
    - Specs with `depends_on` should have similar layers (±2)
    - Code specs (layer 5) must reference implementation specs (layer 4)
    - Generated code (layer 6) must reference code specs (layer 5)
  
  agent_behavior:
    - Specs with layer <= 2: spec-writer role
    - Specs with layer 3-4: spec-writer or code-gen role
    - Specs with layer 5: code-gen role
    - Specs with layer 7-8: test-writer role
    - Specs with layer 10: ops-agent role
```

## References

```speclang
# @block:layer/references @kind:refs
refs:
  - @ref:speclang/headers#layer
  - @ref:speclang/spec-format#layers
  - @ref:speclang/project-maturity-levels
  - @ref:speclang/agent-support-levels
```