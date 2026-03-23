---
name: sip-090-layers-abstraction-speclang-v0
title: "SIP 90: Abstraction Concepts"
version: 0.1.0
description: Core concepts for understanding abstraction in the layer system
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 90: Abstraction Concepts

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP explains abstraction concepts underlying the layer system.

### Quick Start

- **Abstraction:** Removing detail while preserving meaning
- **Layers:** Progressive concretization from intent to code
- **Invariants:** What stays constant across layers
- **Transformation:** How specs convert between layers

### When to Read This

- Understanding why layers exist
- Designing new layer relationships
- Debugging abstraction issues

### Related SIPs

- SIP 17: Layer Definitions
- SIP 89: Layers Overview

## Abstract

This SIP defines core abstraction concepts that underpin the layer system. Understanding these concepts enables effective spec design, proper layer assignment, and correct transformation between abstraction levels.

## Core Concepts

### Abstraction Defined

```yaml
Abstraction:
  definition: "The process of removing detail while preserving essential meaning"
  
  in_specs:
    - "Layer 0: Project intent (no implementation detail)"
    - "Layer 3: Algorithm design (no language syntax)"
    - "Layer 6: Working code (full detail)"
    
  principle: "Each layer should answer 'what' questions at its level"
```

### Layer Progression

```yaml
LayerProgression:
  description: "Each layer adds concrete detail while preserving invariants"
  
  invariant_preserved:
    - "Layer 0→1: Intent and goals"
    - "Layer 1→2: Feature scope"
    - "Layer 2→3: Component interfaces"
    - "Layer 3→4: Algorithm behavior"
    - "Layer 4→5: Implementation approach"
    - "Layer 5→6: Final syntax"
    
  detail_added:
    - "Intent → User stories"
    - "Stories → Components"
    - "Components → Entities"
    - "Entities → Pseudocode"
    - "Pseudocode → Code"
    - "Code → Working program"
```

### Abstraction Levels

```yaml
AbstractionLevels:
  Strategic:
    layers: [0]
    question: "Why are we building this?"
    answer: "Business goals, vision, value"
    
  Architectural:
    layers: [1, 2]
    question: "What are the major parts?"
    answer: "Features, components, interfaces"
    
  Design:
    layers: [3, 4]
    question: "How does it work?"
    answer: "Algorithms, data flows, implementations"
    
  Implementation:
    layers: [5, 6]
    question: "What exactly runs?"
    answer: "Code, binaries, executables"
    
  Validation:
    layers: [7, 8, 9]
    question: "Does it work correctly?"
    answer: "Tests, coverage, edge cases"
    
  Operations:
    layers: [10]
    question: "How is it deployed?"
    answer: "Infrastructure, config, automation"
```

## Transformation Rules

### Layer-to-Layer Transformations

```yaml
Transformations:
  L0_to_L1:
    name: "Feature Breakdown"
    input: "North Star (goals, vision)"
    output: "Feature specs (user stories, use cases)"
    preserved: ["Business objectives"]
    added: ["Feature scope", "User personas"]
    
  L1_to_L2:
    name: "Component Definition"
    input: "Feature specs"
    output: "Component specs (entities, interfaces)"
    preserved: ["Feature scope"]
    added: ["Entity definitions", "Interface contracts"]
    
  L2_to_L3:
    name: "Detail Design"
    input: "Component specs"
    output: "Detail specs (algorithms, pseudocode)"
    preserved: ["Interfaces", "Entity structures"]
    added: ["Logic flows", "Error handling", "Edge cases"]
    
  L3_to_L4:
    name: "Implementation Mapping"
    input: "Detail specs"
    output: "Implementation specs"
    preserved: ["Algorithm behavior"]
    added: ["Language constructs", "Library choices"]
    
  L4_to_L5:
    name: "Code Specification"
    input: "Implementation specs"
    output: "Code specs (with SPECLANG-ID)"
    preserved: ["Function signatures", "Types"]
    added: ["Exact syntax", "Imports", " idioms"]
    
  L5_to_L6:
    name: "Code Generation"
    input: "Code specs"
    output: "Generated code"
    preserved: ["All spec content"]
    added: ["Formatting", "Documentation", "Headers"]
```

### Parallel Transformations

```yaml
ParallelTransformations:
  Testing:
    layers: [2, 3] → [7]
    name: "Test Specification"
    input: "Component or detail specs"
    output: "Test spec (scenarios, cases)"
    
  TestCode:
    layers: [7] → [8]
    name: "Test Code Mapping"
    input: "Test specs"
    output: "Test code specs"
    
  TestGeneration:
    layers: [8] → [9]
    name: "Test Generation"
    input: "Test code specs"
    output: "Generated test code"
    
  Deployment:
    layers: [6] → [10]
    name: "Deployment Specification"
    input: "Generated code"
    output: "Deployment specs"
```

## Invariant Preservation

### What Stays Constant

```yaml
Invariants:
  FeatureScope:
    layers: [0, 1, 2]
    description: "The feature being built doesn't change"
    example: "Authentication feature remains auth through all layers"
    
  InterfaceContracts:
    layers: [2, 3, 4]
    description: "Component interfaces remain stable"
    example: "Login function signature unchanged from component to detail"
    
  AlgorithmBehavior:
    layers: [3, 4, 5]
    description: "Core logic remains consistent"
    example: "Password hashing algorithm same in pseudocode and code"
    
  TypeStructures:
    layers: [2, 4, 5, 6]
    description: "Data types preserved"
    example: "User entity has same fields throughout"
```

### What Changes

```yaml
Changes:
  from_abstract_to_concrete:
    - "Natural language → Pseudocode → Code"
    - "Intent → User stories → Implementation"
    - "High-level description → Detailed algorithms"
    - "Language-agnostic → Language-specific"
    - "Concepts → Exact syntax"
    
  across_generation:
    - "SPECLANG-ID markers → Actual code"
    - "Template placeholders → Real values"
    - "Abstract types → Concrete types"
    - "Generic error handling → Specific error codes"
```

## Abstraction Guidelines

### When to Use Each Layer

```yaml
LayerGuidelines:
  UseLayer0:
    - "Defining project vision"
    - "Setting strategic goals"
    - "Describing high-level architecture"
    
  UseLayer1:
    - "Breaking down features"
    - "Writing user stories"
    - "Defining use cases"
    
  UseLayer2:
    - "Defining data models"
    - "Designing interfaces"
    - "Specifying component boundaries"
    
  UseLayer3:
    - "Describing algorithms"
    - "Writing pseudocode"
    - "Detailing workflows"
    
  UseLayer4:
    - "Mapping to language features"
    - "Choosing libraries"
    - "Defining implementation approach"
    
  UseLayer5:
    - "Writing code specs"
    - "Adding SPECLANG-ID markers"
    - "Specifying exact syntax"
```

### Avoiding Abstraction Mistakes

```yaml
CommonMistakes:
  - name: "Skipping layers"
    description: "Jumping from layer 1 to layer 5 loses detail"
    fix: "Progress through intermediate layers"
    
  - name: "Mixing layers"
    description: "Putting implementation in feature spec"
    fix: "Separate concerns by layer"
    
  - name: "Losing invariants"
    description: "Changing interface in later layer"
    fix: "Preserve contracts through transformation"
    
  - name: "Over-abstracting"
    description: "Layer 0 with no child specs"
    fix: "Break down to layer 1"
    
  - name: "Under-abstracting"
    description: "Layer 6 without proper parent specs"
    fix: "Create upstream specs first"
```

## Validation

### Abstraction Consistency

```yaml
AbstractionValidation:
  rules:
    - "Each spec must have clear layer assignment"
    - "Layer progression must be valid (no skipping)"
    - "Invariants must be preserved"
    - "Cross-layer references must be logical"
    
  checks:
    - "Parent-child relationships valid"
    - "depends_on references correct layer"
    - "Transformations follow rules"
    - "No layer mixing in single spec"
```

## Examples

### Authentication Feature Abstraction

```yaml
# Layer 0: North Star
id: @specs/auth
layer: 0
short: "Secure authentication system"

# Layer 1: Feature  
id: @specs/auth/login
layer: 1
depends_on: @specs/auth
user_story: "As a user, I want to log in so that I can access my account"

# Layer 2: Component
id: @specs/auth/entities
layer: 2
depends_on: @specs/auth/login
entities:
  - User { id, email, password_hash, roles }
  - Session { user_id, token, expires_at }

# Layer 3: Detail
id: @specs/auth/login-algorithm
layer: 3
depends_on: @specs/auth/entities
algorithm: |
  1. Receive email/password
  2. Lookup user by email
  3. Verify password hash
  4. Generate JWT
  5. Return session

# Layer 4: Implementation
id: @specs/auth/login-impl
layer: 4
depends_on: @specs/auth/login-algorithm
implementation: |
  - Use bcrypt for password hashing
  - Use jsonwebtoken library
  - Store sessions in Redis
```

### Invariant Preservation Example

```yaml
InvariantExample:
  interface_preserved:
    layer_2: "function login(email: string, password: string): Session"
    layer_3: "login receives credentials, returns session token"
    layer_4: "async function login(email: string, password: string): Promise<Session>"
    layer_5: "func Login(email, password string) (Session, error)"
    layer_6: "func Login(email, password string) (Session, error) { ... }"
    
  note: "Interface contract stable from layer 2 through 6"
```

## References

- "@ref:speclang/layers
- @ref:speclang/layers/abstraction
- @ref:speclang/layers/transformations
- SIP 17: Layer Definitions
- SIP 89: Layers Overview
- SIP 91-93: Maturity Levels

## Copyright

This document is in the public domain.
