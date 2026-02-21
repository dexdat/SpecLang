# speclang-header lines:9
id: "@speclang/semantic-definitions"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [semantic, definitions, metadata, autonomous]
short: Consolidated semantic definitions for layer, project_level, and agent_support
---
# Semantic Definitions

Consolidated reference for metadata field semantics.

## Overview

```speclang
# @block:semantic-definitions/overview @kind:note
This spec provides the semantic definitions for three critical metadata fields:
1. `layer` (0-10 abstraction depth)
2. `project_level` (POC → Enterprise maturity)
3. `agent_support` (human_only → agent_autonomous)

For detailed definitions, see the specialized specs:
- @ref:speclang/layer-definitions
- @ref:speclang/project-maturity-levels  
- @ref:speclang/agent-support-levels

This spec focuses on how these fields interact and provides examples
of valid metadata combinations.
```

## Quick Reference Tables

### Layer Mapping (0-10)

```speclang
# @block:semantic-definitions/layer-table @kind:table
| Layer | Name | Purpose | Example Spec |
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

### Project Level Criteria

```speclang
# @block:semantic-definitions/project-level-table @kind:table
| Level | Maturity | Team Size | Focus |
|-------|----------|-----------|-------|
| POC | Proof of Concept | 1-3 | Idea validation |
| MVP | Minimum Viable Product | 2-5 | Core functionality |
| Alpha | Internal Testing | 3-10 | Feature completion |
| Beta | External Testing | 5-20 | Stability |
| Production | Stable Production | 10+ | Reliability |
| Startup | Small Team Scale | <10 | Rapid iteration |
| SMB | Small/Medium Business | 10-100 | Process establishment |
| MSB | Medium/Large Business | 100-1000 | Compliance, integration |
| Enterprise | Maximum Scale | 1000+ | Governance, availability |
```

### Agent Support Behaviors

```speclang
# @block:semantic-definitions/agent-support-table @kind:table
| Level | Agent Permissions | Human Involvement | Use Case |
|-------|------------------|------------------|----------|
| human_only | Read-only, suggestions | Full control | Early brainstorming |
| agent_assisted | Write with approval | Review and approve | MVP development |
| agent_autonomous | Full read/write/deploy | Monitoring only | Production systems |
```

## Field Interactions

```speclang
# @block:semantic-definitions/interactions @kind:entity
FieldInteractions:

  layer_and_project_level:
    - Layer 0 specs often have `project_level: Alpha` or higher
    - Layer 5+ specs typically require `project_level >= Beta`
    - Deployment specs (layer 10) often have `project_level: Production+`
    
  layer_and_agent_support:
    - Layer 0-2: Often `agent_assisted` (high-level intent)
    - Layer 3-5: Often `agent_autonomous` (detailed specs)
    - Layer 6-10: Typically `agent_autonomous` (generated artifacts)
    
  project_level_and_agent_support:
    - POC/MVP: Typically `human_only` or `agent_assisted`
    - Alpha/Beta: Typically `agent_assisted`
    - Production+: Can be `agent_autonomous`
    - Startup/SMB/MSB/Enterprise: Adjust autonomy based on maturity
```

## Example Metadata Combinations

### Example 1: POC Feature Spec

```speclang
# @block:semantic-definitions/example-poc @kind:code
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
# @block:new-feature/overview @kind:note
This is a proof of concept. Details to be filled later.
```
```

### Example 2: MVP Component Spec

```speclang
# @block:semantic-definitions/example-mvp @kind:code
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
# @block:auth/user @kind:entity
User:
  fields:
    - id: UUID
    - email: String
    - password_hash: String
```
```

### Example 3: Production Code Spec

```speclang
# @block:semantic-definitions/example-production @kind:code
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
# @block:auth/login @kind:code
```go
package auth

// SPECLANG-ID: @ref:specs/auth#login
func Login(email, password string) (*Token, error) {
    // Implementation
}
```
```
```

### Example 4: Enterprise Deployment Spec

```speclang
# @block:semantic-definitions/example-enterprise @kind:code
```yaml
# speclang-header lines:14
id: @specs/deployment/k8s
version: 2.0.0
layer: 10
project_level: Enterprise
agent_support: agent_autonomous
tags: [deployment, k8s, enterprise, high-availability]
short: Kubernetes deployment for enterprise scale
---
# @block:deployment/k8s @kind:entity
KubernetesDeployment:
  replicas: 10
  autoscaling:
    min: 5
    max: 100
  resources:
    requests:
      cpu: "100m"
      memory: "256Mi"
```
```

## Validation Rules

```speclang
# @block:semantic-definitions/validation @kind:entity
SemanticValidation:

  cross_field_validation:
    - If `agent_support: agent_autonomous` then `project_level >= Beta` (warning)
    - If `layer: 0` and `project_level: Production` (warning - unusual but allowed)
    - If `layer: 5` and `agent_support: human_only` (warning - inefficient)
    
  completeness_rules:
    - Specs with `project_level: Production` must have complete `depends_on`
    - Specs with `agent_support: agent_autonomous` must pass autonomous validation
    - Specs with `layer: 5` must have `target` field
```

## Agent Behavior Matrix

```speclang
# @block:semantic-definitions/behavior-matrix @kind:table
| Metadata Combination | Spec-Writer | Code-Gen | Test-Writer | Orchestrator |
|---------------------|-------------|----------|-------------|--------------|
| POC + human_only | Suggest only | No generation | No generation | Manual routing |
| MVP + agent_assisted | Propose edits | Draft code | Draft tests | Semi-auto routing |
| Beta + agent_assisted | Auto-expand | Generate with review | Generate with review | Auto-routing with oversight |
| Production + agent_autonomous | Full generation | Full generation | Full generation | Full auto-routing |
| Enterprise + agent_autonomous | Full generation with compliance | Full generation with compliance | Full generation with compliance | Full auto-routing with governance |
```

## Transition Examples

```speclang
# @block:semantic-definitions/transitions @kind:note
How metadata evolves as a project matures:

**Feature evolution**:
1. POC (layer 1, human_only) → MVP (layer 2, agent_assisted)
2. MVP → Alpha (layer 3, agent_assisted)
3. Alpha → Beta (layer 4, agent_assisted)
4. Beta → Production (layer 5, agent_autonomous)

**Team growth**:
1. Startup (Alpha, agent_assisted) → SMB (Beta, agent_assisted)
2. SMB → MSB (Production, agent_autonomous)
3. MSB → Enterprise (Production, agent_autonomous with governance)
```

## Implementation Guidance

```speclang
# @block:semantic-definitions/implementation @kind:note
For tool implementers:

1. **Reference resolution**: Use `_index.json` for validating references
2. **Layer validation**: Check layer appropriateness based on content type
3. **Project level validation**: Verify criteria met (see project-maturity-levels)
4. **Agent support validation**: Apply autonomous validation rules when needed
5. **Cross-field validation**: Implement the validation rules above

All validation should be integrated into:
- Guard plugin (real-time)
- CI/CD pipelines
- Editor extensions
```

## References

```speclang
# @block:semantic-definitions/references @kind:refs
refs:
  - @ref:speclang/layer-definitions
  - @ref:speclang/project-maturity-levels
  - @ref:speclang/agent-support-levels
  - @ref:speclang/autonomous-validation
  - @ref:speclang/headers
  - @ref:speclang/validation
```