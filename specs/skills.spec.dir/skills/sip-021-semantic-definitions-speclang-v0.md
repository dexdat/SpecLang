---
name: sip-021-semantic-definitions-speclang-v0
title: "SIP 21: Semantic Definitions"
version: 0.1.0
description: Consolidated semantic definitions for layer, project_level, and agent_support
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 21: Semantic Definitions

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP provides unified semantic definitions for SpecLang's core metadata fields.

### Quick Start

| Field | Values | Purpose |
|-------|--------|---------|
| `layer` | 0-10 | Abstraction depth |
| `project_level` | POC→Enterprise | Maturity/scale |
| `agent_support` | human_only→agent_autonomous | Agent autonomy |

### When to Read This

- **Setting metadata:** Understanding what each value means
- **Validation:** Implementating cross-field validation
- **Tool development:** Building tools that interpret metadata

### Related SIPs

- SIP 19: Agent Support Levels
- SIP 20: Agent Behavior Matrix
- SIP 22: Validation System

## Abstract

This SIP consolidates semantic definitions for three critical metadata fields: `layer`, `project_level`, and `agent_support`. These definitions ensure consistent interpretation across tools, agents, and human readers, enabling proper validation and behavior determination.

## Motivation

Without unified definitions:
- Different tools interpret values differently
- Validation rules are inconsistent
- Agent behavior varies unpredictably

Unified semantic definitions solve these problems.

## Rationale

Three fields work together:

1. **layer**: Where in the abstraction hierarchy (0=north star, 10=deployment)
2. **project_level**: How mature the project is (POC→Enterprise)
3. **agent_support**: How much agent autonomy is allowed

These fields constrain each other and determine appropriate behavior.

## Specification

### Layer Definitions (0-10)

| Layer | Name | Purpose | Example |
|-------|------|---------|---------|
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

**Layer Constraints:**

```yaml
layer_constraints:
  0:
    max_size: "100 lines"
    content: "High-level goals, features list"
    
  1_2:
    max_size: "500 lines"
    content: "Features, components, entities"
    
  3_4:
    max_size: "300 lines"
    content: "Algorithms, implementation details"
    
  5:
    max_size: "200 lines"
    content: "Code-level specs, direct mapping"
    
  6_9:
    generated: true
    content: "Generated artifacts"
    
  10:
    content: "Infrastructure, deployment config"
```

### Project Level Definitions

| Level | Maturity | Team Size | Focus | Autonomy Typical |
|-------|----------|-----------|-------|------------------|
| POC | Proof of Concept | 1-3 | Idea validation | human_only |
| MVP | Minimum Viable Product | 2-5 | Core functionality | agent_assisted |
| Alpha | Internal Testing | 3-10 | Feature completion | agent_assisted |
| Beta | External Testing | 5-20 | Stability | agent_assisted |
| Production | Stable Production | 10+ | Reliability | agent_autonomous |
| Startup | Small Team Scale | <10 | Rapid iteration | agent_assisted |
| SMB | Small/Medium Business | 10-100 | Process establishment | agent_assisted |
| MSB | Medium/Large Business | 100-1000 | Compliance, integration | agent_autonomous |
| Enterprise | Maximum Scale | 1000+ | Governance, availability | agent_autonomous |

**Project Level Criteria:**

```yaml
project_level_criteria:
  POC:
    - Experimental, minimal validation
    - May have incomplete features
    - No stability guarantees
    
  MVP:
    - Core functionality works
    - Basic validation in place
    - Limited feature set
    
  Alpha:
    - Internal testing phase
    - Features mostly complete
    - Known bugs may exist
    
  Beta:
    - External testing phase
    - Feature complete
    - Stability focus
    
  Production:
    - Stable release
    - Fully tested
    - Production-ready
    
  Startup:
    - Small team, rapid iteration
    - Process light
    - Speed over structure
    
  SMB:
    - Established processes
    - Moderate scale
    - Balance of speed and structure
    
  MSB:
    - Complex integration needs
    - Compliance focus
    - Governance emerging
    
  Enterprise:
    - Maximum scale
    - Strict governance
    - Full compliance requirements
```

### Agent Support Definitions

| Level | Agent Permissions | Human Involvement | Use Case |
|-------|------------------|------------------|----------|
| human_only | Read-only, suggestions | Full control | Early brainstorming |
| agent_assisted | Write with approval | Review and approve | MVP development |
| agent_autonomous | Full read/write/deploy | Monitoring only | Production systems |

**Agent Support Requirements:**

```yaml
agent_support_requirements:
  human_only:
    spec_requirements: []
    validation: "None required"
    
  agent_assisted:
    spec_requirements:
      - Valid header
      - Most references resolved
      - Basic step-by-step
    validation: "Basic format check"
    
  agent_autonomous:
    spec_requirements:
      - Complete header with all fields
      - All references resolved
      - Complete step-by-step
      - No ambiguous language
      - All dependencies declared
    validation: "Strict validation required"
```

### Field Interactions

```yaml
FieldInteractions:
  layer_and_project_level:
    - "Layer 0 specs often have project_level: Alpha or higher"
    - "Layer 5+ specs typically require project_level >= Beta"
    - "Deployment specs (layer 10) often have project_level: Production+"
    
  layer_and_agent_support:
    - "Layer 0-2: Often agent_assisted (high-level intent)"
    - "Layer 3-5: Often agent_autonomous (detailed specs)"
    - "Layer 6-10: Typically agent_autonomous (generated artifacts)"
    
  project_level_and_agent_support:
    - "POC/MVP: Typically human_only or agent_assisted"
    - "Alpha/Beta: Typically agent_assisted"
    - "Production+: Can be agent_autonomous"
```

### Validation Rules

```yaml
SemanticValidation:
  cross_field_validation:
    - rule: "If agent_support: agent_autonomous then project_level >= Beta"
      severity: warning
      
    - rule: "If layer: 0 and project_level: Production"
      severity: warning
      message: "Unusual but allowed"
      
    - rule: "If layer: 5 and agent_support: human_only"
      severity: warning
      message: "Inefficient combination"
      
    - rule: "If POC + agent_autonomous"
      severity: warning
      message: "POC should not be agent_autonomous"
      
  completeness_rules:
    - "Specs with project_level: Production must have complete depends_on"
    - "Specs with agent_support: agent_autonomous must pass autonomous validation"
    - "Specs with layer: 5 must have target field"
```

## Examples

### Example 1: POC Feature Spec

```yaml
# speclang-header lines:9
id: @specs/new-feature
version: 0.0.1
layer: 1
project_level: POC
agent_support: human_only
tags: [new, experimental]
short: Experimental feature for validation
---
# New Feature
This is a proof of concept. Details to be filled later.
```

### Example 2: MVP Component Spec

```yaml
# speclang-header lines:11
id: @specs/auth/entities
version: 0.1.0
layer: 2
project_level: MVP
agent_support: agent_assisted
tags: [auth, entities, mvp]
short: User entity definition for MVP
---
# User Entity
User:
  fields:
    - id: UUID
    - email: String
    - password_hash: String
```

### Example 3: Production Code Spec

```yaml
# speclang-header lines:13
id: @generated/auth/login.go.spec
version: 1.0.0
layer: 5
project_level: Production
agent_support: agent_autonomous
tags: [auth, login, go]
target: go
produces: generated/go/auth/login.go
---
# Login Function
```go
package auth
func Login(email, password string) (*Token, error) {
    // Implementation
}
```
```

### Example 4: Enterprise Deployment Spec

```yaml
# speclang-header lines:14
id: @specs/deployment/k8s
version: 2.0.0
layer: 10
project_level: Enterprise
agent_support: agent_autonomous
tags: [deployment, k8s, enterprise]
short: Kubernetes deployment for enterprise scale
---
KubernetesDeployment:
  replicas: 10
  autoscaling:
    min: 5
    max: 100
```

### Behavior Matrix Summary

| Metadata Combination | Spec-Writer | Code-Gen | Test-Writer | Orchestrator |
|---------------------|-------------|----------|-------------|--------------|
| POC + human_only | Suggest only | No generation | No generation | Manual routing |
| MVP + agent_assisted | Propose edits | Draft code | Draft tests | Semi-auto routing |
| Beta + agent_assisted | Auto-expand | Generate with review | Generate with review | Auto-routing with oversight |
| Production + agent_autonomous | Full generation | Full generation | Full generation | Full auto-routing |
| Enterprise + agent_autonomous | Full with compliance | Full with compliance | Full with compliance | Full with governance |

## Implementation Guidance

1. **Reference resolution**: Use `_index.json` for validating references
2. **Layer validation**: Check layer appropriateness based on content type
3. **Project level validation**: Verify criteria met per definitions
4. **Agent support validation**: Apply autonomous validation rules when needed
5. **Cross-field validation**: Implement the validation rules above

## References

- @ref:speclang/semantic-definitions
- @ref:speclang/layer-definitions
- @ref:speclang/project-maturity-levels
- @ref:speclang/agent-support-levels
- SIP 19: Agent Support Levels
- SIP 20: Agent Behavior Matrix

## Copyright

This document is in the public domain.
