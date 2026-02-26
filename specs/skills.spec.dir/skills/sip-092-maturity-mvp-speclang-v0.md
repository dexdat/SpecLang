---
name: sip-092-maturity-mvp-speclang-v0
title: "SIP 92: Maturity Level - MVP"
version: 0.1.0
description: Concrete criteria and guidelines for Minimum Viable Product level
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 92: Maturity Level - MVP

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the MVP (Minimum Viable Product) maturity level.

### Quick Start

**MVP** = Minimum Viable Product
- Purpose: Deliver core functionality to early adopters
- Agent: Agent-assisted with review
- Validation: Core functionality tested

### When to Read This

- Building first usable product version
- Preparing for initial user testing
- Setting project_level in headers
- Planning transitions from POC or to Alpha

### Related SIPs

- SIP 18: Maturity Levels
- SIP 91: Maturity Level - POC
- SIP 93: Maturity Level - Alpha

## Abstract

This SIP defines concrete criteria for the MVP maturity level. MVP represents the stage where core functionality is delivered to early adopters with enough features to provide value and receive feedback.

## MVP Overview

### Definition

```yaml
MVP:
  full_name: "Minimum Viable Product"
  purpose: "Deliver core functionality to early adopters"
  risk_level: "Medium"
  investment: "Moderate"
  
  characteristics:
    - Core features complete
    - Early adopter feedback
    - Minimal but usable
    - Clear value proposition
    - Foundation for iteration
    
  agent_support: "agent_assisted"
```

### Position in Maturity Model

```
Maturity Progression:

POC → MVP → Alpha → Beta → Production
        ↑
        Core features, early users
```

### When to Use MVP

```yaml
MVPAppropriate:
  scenarios:
    - "First release to early adopters"
    - "Testing market demand"
    - "Validating product-market fit"
    - "Building foundation for growth"
    - "Getting user feedback"
    
  not_appropriate:
    - "Only exploring ideas (use POC)"
    - "Feature-complete product (use Beta)"
    - "Production with SLA (use Production)"
    - "External wide release (use Beta)"
```

## MVP Criteria

### Spec Requirements

```yaml
MVPSpecRequirements:
  required:
    - project_level: MVP
    - layer: 1-2 (Feature to Component)
    - Feature specs (layer 1) for core features
    - Component specs (layer 2) for core entities
    - Basic test coverage
    
  recommended:
    - Implementation specs (layer 4) for critical paths
    - Initial API documentation
    - User documentation for core features
    
  not_required:
    - Complete implementation specs
    - Comprehensive test suite
    - Performance optimization
    - Edge case handling
    - Operational runbooks
```

### Content Requirements

```yaml
MVPContent:
  minimum:
    - Feature specs for all core features
    - Entity definitions for data models
    - Interface contracts for APIs
    - Basic user stories
    
  recommended:
    - Core implementation specs
    - Initial test scenarios
    - Basic API docs
    - User guide for core flows
    
  skip:
    - Complete error handling
    - All edge cases
    - Performance tuning
    - Comprehensive documentation
    - Deployment automation
```

### Example MVP Header

```yaml
# speclang-header lines:10
id: @specs/auth
version: 0.1.0
project_level: MVP
layer: 1
short: Core authentication system for the platform
tags: [mvp, auth, core]
agent_support: agent_assisted
---
```

## Agent Behavior

### At MVP Level

```yaml
MVPAgentBehavior:
  mode: "agent_assisted"
  
  autonomous:
    - "Generate implementation specs from design"
    - "Create code from code specs"
    - "Write basic tests"
    - "Generate API documentation"
    - "Refactor within boundaries"
    
  requires_review:
    - "Architecture changes"
    - "New feature specs"
    - "API contract changes"
    - "Major refactoring"
    - "Any production deployment"
    
  not_allowed:
    - "Autonomous production deployment"
    - "Breaking changes without approval"
    - "Feature work beyond MVP scope"
```

### Agent Configuration

```yaml
MVPAgentConfig:
  can_generate_autonomously:
    - "Code from specs"
    - "Tests from test specs"
    - "Documentation from specs"
    - "Simple refactoring"
    
  must_request_human:
    - "New spec creation"
    - "Scope changes"
    - "Architecture decisions"
    - "Deployment to production"
    
  review_triggers:
    - "Breaking changes"
    - "New dependencies"
    - "API modifications"
    - "Security changes"
```

### Human Oversight

```yaml
HumanOversight:
  required_reviews:
    - "All new feature specs"
    - "API design decisions"
    - "Architecture changes"
    - "Before staging deployment"
    
  approval_needed:
    - "Core feature scope"
    - "Technology additions"
    - "Major implementation approaches"
```

## Validation Rules

### MVP Validation

```yaml
MVPValidation:
  rules:
    - "project_level must be MVP"
    - "layer should be 1-4"
    - "Must have feature specs (layer 1)"
    - "Must have component/entity specs (layer 2)"
    - "Must have basic test coverage"
    - "agent_support must be agent_assisted"
    
  warnings:
    - "If layer > 4, may be too detailed for MVP"
    - "If complete test suite, consider Alpha"
    - "If comprehensive docs, consider Alpha"
```

### Transition Checklists

#### From POC to MVP

```yaml
POCToMVP:
  validation:
    - [ ] POC hypothesis was validated
    - [ ] Technical approach confirmed workable
    
  spec_requirements:
    - [ ] Feature specs for core features
    - [ ] Component specs for data models
    - [ ] Initial interface definitions
    
  testing:
    - [ ] Core functionality can be tested
    - [ ] Basic test infrastructure in place
    
  content:
    - [ ] User documentation started
    - [ ] API basics documented
```

#### From MVP to Alpha

```yaml
MVPToAlpha:
  validation:
    - [ ] Core features functional
    - [ ] Early adopters providing feedback
    - [ ] Product-market fit validated
    
  spec_requirements:
    - [ ] Implementation specs for all components
    - [ ] Test specs for core functionality
    - [ ] Performance requirements defined
    
  testing:
    - [ ] Unit tests > 50% coverage
    - [ ] Integration tests for key flows
    - [ ] Test automation in place
    
  deployment:
    - [ ] Can deploy to staging
    - [ ] Monitoring basics in place
```

## Examples

### Example 1: Core Feature MVP

```yaml
# speclang-header lines:10
id: @specs/todo-app
version: 0.1.0
project_level: MVP
layer: 1
short: Simple todo list application
tags: [mvp, todo, core]
agent_support: agent_assisted
---

# Todo App MVP

## Core Features

1. Create todo items
2. Mark items complete
3. Delete items
4. List all items

## Data Model

- Todo { id, title, completed, created_at }

## API

- GET /todos
- POST /todos
- PUT /todos/:id
- DELETE /todos/:id

## Success Criteria

- [ ] Users can CRUD todos
- [ ] Data persists between sessions
- [ ] Basic validation works
```

### Example 2: MVP with Implementation

```yaml
# speclang-header lines:12
id: @specs/user-management
version: 0.1.0
project_level: MVP
layer: 2
short: User registration and login
tags: [mvp, auth, users]
agent_support: agent_assisted
depends_on: @specs/auth
---

# User Management MVP

## Entities

```yaml
User:
  id: uuid
  email: string (unique)
  password_hash: string
  created_at: timestamp
  updated_at: timestamp

Session:
  user_id: uuid
  token: string
  expires_at: timestamp
```

## Operations

```yaml
register:
  input: { email, password }
  output: { user, session }
  
login:
  input: { email, password }  
  output: { user, session }
  
logout:
  input: { session_token }
  output: void
```

## Tests

- Register new user
- Login with valid credentials
- Login with invalid credentials
- Logout
```

### Example 3: MVP with Test Spec

```yaml
# speclang-header lines:10
id: @specs/payment-mvp
version: 0.1.0
project_level: MVP
layer: 2
short: Basic payment processing
tags: [mvp, payments]
agent_support: agent_assisted
---

# Payment MVP

## Test Scenarios

1. Process valid payment
2. Reject invalid card
3. Handle insufficient funds
4. Process refund

## Implementation Notes

- Use Stripe for processing
- Store transaction records
- Basic error handling for common failures
```

## Guidelines

### Best Practices for MVP

```yaml
MVPBestPractices:
  do:
    - "Focus on core value proposition"
    - "Define minimal feature set"
    - "Get early user feedback"
    - "Iterate based on feedback"
    - "Keep technical debt manageable"
    - "Enable agent-assisted generation"
    
  dont:
    - "Don't add features for 'future'"
    - "Don't over-engineer solutions"
    - "Don't skip testing entirely"
    - "Don't ignore user feedback"
    - "Don't deploy to production without review"
```

### Common Mistakes

```yaml
MVPMistakes:
  - name: "Feature creep"
    mistake: "Adding too many features for MVP"
    correction: "Stay focused on core value"
    
  - name: "No testing"
    mistake: "Skipping tests at MVP"
    correction: "Basic coverage required"
    
  - name: "Over-engineering"
    mistake: "Building for unknown future needs"
    correction: "Solve today's problems simply"
    
  - name: "Skipping user feedback"
    mistake: "Not collecting early user input"
    correction: "Plan feedback collection from day 1"
```

## Summary

| Aspect | MVP |
|--------|-----|
| Purpose | Core functionality to early adopters |
| Spec Depth | Feature (1) to Component (2) |
| Testing | Basic coverage |
| Documentation | User guide for core features |
| Agent Mode | agent_assisted |
| Human Oversight | Review for new features/changes |
| Deployment | Staging only |

## References

- @ref:speclang/maturity-levels
- @ref:speclang/maturity-levels/mvp
- @ref:speclang/project-level
- SIP 18: Maturity Levels
- SIP 91: POC
- SIP 93: Alpha

## Copyright

This document is in the public domain.
