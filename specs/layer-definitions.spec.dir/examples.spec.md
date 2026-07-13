# speclang-header lines:11
id: "@speclang/layer-definitions/examples"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [layer, definitions, examples, concrete]
parent: "speclang/layer-definitions"
part: "2/2"
short: Concrete depth definitions with examples
---
# Depth Definitions: Examples

Concrete definitions for each layer value with examples.

## Depth 0: North Star

```speclang
# @block:depth/0-northstar @kind:entity
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
  example: ""@ref:northstar/speclang```

## Depth 1: Feature

```speclang
# @block:depth/1-feature @kind:entity
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
  example: ""@ref:specs/auth```

## Depth 2: Component

```speclang
# @block:depth/2-component @kind:entity
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
  example: ""@ref:specs/auth/entities```

## Depth 3: Detail

```speclang
# @block:depth/3-detail @kind:entity
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
  example: ""@ref:specs/auth/login-algorithm```

## Depth 4: Implementation

```speclang
# @block:depth/4-implementation @kind:entity
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
  example: ""@ref:specs/auth/login-implementation```

## Depth 5: Code Spec

```speclang
# @block:depth/5-code-spec @kind:entity
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
  example: ""@ref:generated/auth/login.go.spec```

## Depth 6: Generated Code

```speclang
# @block:depth/6-generated-code @kind:entity
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
  example: ""@ref:generated/go/auth/login.go```

## Depth 7: Test Spec

```speclang
# @block:depth/7-test-spec @kind:entity
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
  example: ""@ref:specs/auth/login.test.spec.md```

## Depth 8: Test Code Spec

```speclang
# @block:depth/8-test-code-spec @kind:entity
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
  example: ""@ref:generated/auth/login.test.go.spec```

## Depth 9: Generated Test Code

```speclang
# @block:depth/9-generated-test-code @kind:entity
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
  example: ""@ref:generated/go/auth/login_test.go```

## Depth 10: Deployment/Ops

```speclang
# @block:depth/10-deployment @kind:entity
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
  example: ""@ref:specs/deployment/k8s```