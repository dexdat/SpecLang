---
name: sip-017-layer-definitions-speclang-v0
title: "SIP 17: Layer Definitions"
version: 0.1.0
description: Concrete definitions for layer values 0-10
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 17: Layer Definitions

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP explains the layer system (0-10) for spec abstraction depth.

### Quick Start

1. **Layer 0:** North Star (project intent)
2. **Layer 1-3:** Feature → Component → Detail
3. **Layer 4-5:** Implementation → Code Spec
4. **Layer 6:** Generated Code
5. **Layer 7-9:** Test specs and generated tests
6. **Layer 10:** Deployment/Ops

### Key Concepts

- **Lower = Abstract:** Layer 0 is intent, layer 10 is deployment
- **Higher = Concrete:** Each layer adds detail
- **Ownership:** Different agents own different layers
- **Validation:** Child specs must have layer >= parent

### When to Read This

- **Writing specs:** Assign correct layer
- **Agent routing:** Understand which agent handles which layer
- **Validation:** Debug layer consistency errors

### Related SIPs

- SIP 2: Header Format
- SIP 16: Autonomous Validation
- SIP 18: Maturity Levels

## Abstract

This SIP defines concrete semantic mapping for the `layer` field (0-10). Lower numbers represent abstract intent, higher numbers represent concrete implementation. Agents use layer values to determine appropriate detail level and route work to correct agent roles.

## Motivation

A spec hierarchy needs:
- Clear abstraction levels
- Consistent routing to agents
- Validation of spec completeness
- Progressive refinement tracking

## Rationale

**Numeric Scale:**
- Easy to compare
- Clear ordering
- Simple validation rules

**0-10 Range:**
- Enough granularity
- Not overwhelming
- Matches common patterns

**Agent Ownership:**
- spec-writer: layers 0-4
- code-gen: layers 5-6
- test-writer: layers 7-9
- ops-agent: layer 10

## Specification

### Layer Table

| Layer | Name | Description | Typical Files |
|-------|------|-------------|---------------|
| 0 | North Star | Project intent, goals, architecture | `.scl`, `.spec.md` |
| 1 | Feature | High-level feature breakdown | `.spec.md` |
| 2 | Component | Entities, operations, interfaces | `.spec.yaml` |
| 3 | Detail | Pseudocode, algorithms, diagrams | `.spec.yaml` |
| 4 | Implementation | Language constructs, APIs | `.spec.yaml` |
| 5 | Code Spec | Direct code mapping | `.{ext}.spec` |
| 6 | Generated Code | Output code (not edited) | `.{ext}` |
| 7 | Test Spec | Natural language tests | `.test.spec.md` |
| 8 | Test Code Spec | Test code mapping | `.test.{ext}.spec` |
| 9 | Generated Test | Generated test code | `_test.{ext}` |
| 10 | Deployment/Ops | Infrastructure, config | `.spec.yaml`, `.yaml` |

### Layer 0: North Star

```yaml
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
  owned_by: "human + orchestrator"
  agent_support: "agent_assisted"
```

### Layer 1: Feature

```yaml
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
  agent_support: "agent_autonomous"
```

### Layer 2: Component

```yaml
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
```

### Layer 3: Detail

```yaml
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
```

### Layer 4: Implementation

```yaml
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
```

### Layer 5: Code Spec

```yaml
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
```

### Layer 6: Generated Code

```yaml
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
```

### Layer 7: Test Spec

```yaml
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
```

### Layer 8: Test Code Spec

```yaml
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
```

### Layer 9: Generated Test Code

```yaml
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
```

### Layer 10: Deployment/Ops

```yaml
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
```

## Usage Guidelines

```yaml
Guidelines:
  1: "Start at layer 0 for north star intent"
  2: "Create layer 1 specs for each major feature"
  3: "Expand to layer 2-3 as details are needed"
  4: "Generate layer 5 specs from layer 3-4 specs"
  5: "Generate layer 6 code from layer 5 specs"
  6: "Create parallel test specs at layer 7-9"
  7: "Add deployment specs at layer 10 when needed"

AgentGuidelines:
  - "Respect layer ownership"
  - "Child specs should have layer >= parent"
  - "Use layer to determine detail level"
```

## Validation Rules

```yaml
LayerValidation:
  
  consistency_rules:
    - "Child specs must have layer >= parent"
    - "Specs with depends_on should have similar layers (±2)"
    - "Code specs (layer 5) must reference implementation specs (layer 4)"
    - "Generated code (layer 6) must reference code specs (layer 5)"
    
  agent_behavior:
    - "Layers 0-2: spec-writer role"
    - "Layers 3-4: spec-writer or code-gen role"
    - "Layer 5: code-gen role"
    - "Layers 7-8: test-writer role"
    - "Layer 10: ops-agent role"
```

## Examples

### Layer Progression

```
project.scl (layer 0)
  └── auth.spec.md (layer 1)
      ├── auth/entities.spec.yaml (layer 2)
      ├── auth/login-algorithm.spec.yaml (layer 3)
      ├── auth/login-implementation.spec.yaml (layer 4)
      ├── auth/login.go.spec (layer 5)
      └── generated/go/auth/login.go (layer 6)
```

### Test Spec Progression

```
auth/login.test.spec.md (layer 7)
  └── auth/login.test.go.spec (layer 8)
      └── generated/go/auth/login_test.go (layer 9)
```

## References

- @ref:speclang/layer-definitions
- @ref:speclang/headers#layer
- SIP 2: Header Format
- SIP 16: Autonomous Validation

## Copyright

This document is in the public domain.
