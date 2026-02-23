---
name: sip-019-agent-support-speclang-v0
title: "SIP 19: Agent Support Levels"
version: 0.1.0
description: Behavioral expectations for agent_support field (human_only, agent_assisted, agent_autonomous)
category: standard
---

# SIP 19: Agent Support Levels

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `agent_support` field and its three levels of agent autonomy.

### Quick Start

| Level | Agent Permissions | Human Involvement |
|-------|-------------------|-------------------|
| `human_only` | Read-only, suggestions | Full control |
| `agent_assisted` | Write with approval | Review and approve |
| `agent_autonomous` | Full read/write/deploy | Monitoring only |

### When to Read This

- **Setting metadata:** Choosing the right `agent_support` level
- **Building agents:** Understanding what autonomy level permits
- **Validation:** Implementing validation rules for autonomous specs

### Related SIPs

- SIP 20: Agent Behavior Matrix
- SIP 21: Semantic Definitions
- SIP 22: Validation System

## Abstract

This SIP defines the `agent_support` metadata field that indicates how ready a spec is for autonomous agent operation. Three levels provide a clear progression from human-only to fully autonomous operation, with specific behavioral expectations and validation requirements at each level.

## Motivation

Without clear definitions of agent autonomy levels:
- Agents don't know what they're allowed to do
- Humans don't know when they need to review
- Specs may be mislabeled as autonomous when they're not ready

A well-defined `agent_support` field solves these problems.

## Rationale

**Three-Level System:**

1. **human_only**: For early-stage specs lacking detail
2. **agent_assisted**: For specs with most details but needing oversight
3. **agent_autonomous**: For production-ready specs with complete detail

This matches real-world development: start with human control, progress to assistance, eventually achieve autonomy.

## Specification

### Level Definitions

#### human_only

```yaml
human_only:
  purpose: "Spec requires human interpretation and execution"
  
  spec_characteristics:
    - Vague or ambiguous language
    - Missing step-by-step instructions
    - Unresolved references
    - High-level intent only
    
  agent_permissions:
    - Can read spec content
    - Can suggest improvements
    - Cannot modify spec directly
    - Cannot generate code from spec
    
  human_responsibilities:
    - Interpret spec intent
    - Write implementation details
    - Make all decisions
    - Review all outputs
```

#### agent_assisted

```yaml
agent_assisted:
  purpose: "Agents can help but need human review/approval"
  
  spec_characteristics:
    - Clear requirements but missing details
    - Some step-by-step instructions
    - Most references resolved
    - Some ambiguous language remains
    
  agent_permissions:
    - Can propose spec edits
    - Can generate draft code
    - Can run tests and report results
    - Cannot commit changes without approval
    
  human_responsibilities:
    - Review agent proposals
    - Approve or reject changes
    - Provide clarification when needed
    - Make final decisions on critical items
```

#### agent_autonomous

```yaml
agent_autonomous:
  purpose: "Agents can fully operate based on spec content"
  
  spec_characteristics:
    - Complete step-by-step descriptions
    - All references resolve to existing blocks
    - No ambiguous natural language
    - All required metadata fields present
    
  agent_permissions:
    - Full read/write access to spec
    - Generate and commit code
    - Run tests and deploy
    - Self-correct errors
    - Create new specs as needed
    
  human_responsibilities:
    - Monitor system health
    - Emergency override if needed
    - Post-hoc review of changes
    - Set high-level goals
```

### Validation Requirements

```yaml
validation:
  human_only:
    - No validation required
    
  agent_assisted:
    - Header must be valid
    - References must exist (warnings allowed)
    - No syntax errors
    - Human review flag set
    
  agent_autonomous:
    - Header complete with all required fields
    - All operations have step-by-step descriptions
    - All `@ref:` references resolve to existing blocks
    - No ambiguous natural language in critical sections
    - All dependencies explicitly declared
    - Layer value appropriate for content
    - Project_level criteria met
```

### Agent Behavior Matrix

| Agent Role | human_only | agent_assisted | agent_autonomous |
|------------|------------|----------------|------------------|
| Spec-Writer | Read only, suggest | Propose, require approval | Full generation, auto-split |
| Code-Gen | No generation | Draft code, review | Generate and commit, auto-test |
| Test-Writer | No generation | Draft tests, review | Full generation, auto-run |
| Orchestrator | Manual routing | Semi-automatic | Full automatic |

### Transition Guidelines

**human_only → agent_assisted:**
1. Add step-by-step descriptions for key operations
2. Resolve critical references
3. Set `agent_support: agent_assisted`
4. Human review and approval

**agent_assisted → agent_autonomous:**
1. Ensure all operations have step-by-step descriptions
2. Resolve ALL references
3. Eliminate ambiguous language
4. Complete all required metadata fields
5. Run autonomous validation tool
6. Set `agent_support: agent_autonomous`
7. Monitor initial autonomous operations

**Downgrade (agent_autonomous → agent_assisted):**
1. Triggered by validation failures
2. Human intervention required
3. Update `agent_support` field
4. Add human review requirements

### Integration with Other Metadata

```yaml
with_project_level:
  - POC/MVP: Typically human_only or agent_assisted
  - Alpha/Beta: Typically agent_assisted
  - Production+: Can be agent_autonomous
  
with_layer:
  - Layer 0-2: Often agent_assisted (high-level intent)
  - Layer 3-5: Often agent_autonomous (detailed specs)
  - Layer 6-10: Typically agent_autonomous (generated artifacts)
  
combined_warnings:
  - POC + agent_autonomous = Invalid (warning)
  - Production + human_only = Inefficient (warning)
```

## Examples

### Example 1: human_only Spec

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

### Example 2: agent_assisted Spec

```yaml
# speclang-header lines:12
id: @specs/auth/entities
version: 0.1.0
layer: 2
project_level: MVP
agent_support: agent_assisted
tags: [auth, entities]
short: User entity definition
---
# User Entity

## Fields
- id: UUID
- email: String (unique)
- password_hash: String

## Operations
- Create user
- Authenticate user
- Update profile
```

### Example 3: agent_autonomous Spec

```yaml
# speclang-header lines:15
id: @specs/auth/login
version: 1.0.0
layer: 3
project_level: Production
agent_support: agent_autonomous
tags: [auth, login]
depends_on: ["@specs/auth/entities", "@specs/crypto"]
short: Login operation with full step-by-step
---
# Login Operation

## @block:auth/login @kind:operation

### Steps
1. Receive email and password from request
2. Validate email format (regex: `^[^@]+@[^@]+\.[^@]+$`)
3. Query user by email from database
4. If user not found, return `UserNotFound` error
5. Hash provided password using bcrypt
6. Compare hash with stored hash
7. If mismatch, return `InvalidCredentials` error
8. Generate JWT token with 24h expiry
9. Return token to client

### Error Handling
- `UserNotFound`: HTTP 404, message "User not found"
- `InvalidCredentials`: HTTP 401, message "Invalid credentials"
- `DatabaseError`: HTTP 500, message "Internal error"
```

## References

- @ref:speclang/agent-support-levels
- @ref:speclang/agent-behavior-matrix
- @ref:speclang/semantic-definitions
- SIP 20: Agent Behavior Matrix
- SIP 22: Validation System

## Copyright

This document is in the public domain.
