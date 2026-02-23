---
name: sip-099-agent-assisted-speclang-v0
title: "SIP 99: Agent-Assisted Level"
version: 0.1.0
description: Detailed criteria and workflows for agent_assisted support level
category: standard
---

# SIP 99: Agent-Assisted Level

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `agent_assisted` level in detail.

### Quick Start

**agent_assisted** = Agent help with human approval
- Purpose: Agents can propose, humans decide
- Permissions: Propose, draft, assist; no autonomous commit
- Validation: Basic checks, warnings for missing detail

### When to Read This

- Setting agent_support in spec headers
- Configuring agent behavior for projects
- Implementing agent-assisted workflows
- Planning transition to agent_autonomous

### Related SIPs

- SIP 19: Agent Support Levels
- SIP 100: Agent-Autonomous Level
- SIP 101: Behavior Matrix
- SIP 102: Transition Upgrade
- SIP 18: Maturity Levels

## Abstract

This SIP provides comprehensive criteria for the `agent_assisted` support level. At this level, agents can generate content, propose changes, and assist with implementation, but require human review and approval before committing changes.

## agent_assisted Overview

### Definition

```yaml
agent_assisted:
  full_name: "Agent-Assisted"
  purpose: "Agents can help but need human review/approval"
  autonomy_level: "Medium"
  risk_level: "Low-Medium"
  
  characteristics:
    - Agents can propose changes
    - Agents can generate draft content
    - Human approval required for commits
    - Some ambiguous language acceptable
    - References mostly resolved
    
  permissions:
    - Read all spec content
    - Propose spec edits
    - Generate draft code
    - Run tests and report results
    - Suggest improvements
    
  restrictions:
    - Cannot commit without approval
    - Cannot deploy autonomously
    - Cannot make breaking changes
```

### Position in Autonomy Model

```
Autonomy Progression:

human_only → agent_assisted → agent_autonomous
                 ↑
            Current level
```

### When to Use agent_assisted

```yaml
agent_assistedAppropriate:
  scenarios:
    - "MVP and Alpha projects"
    - "Features that need oversight"
    - "Teams transitioning to autonomous"
    - "Complex or critical changes"
    
  not_appropriate:
    - "Production systems ready for full autonomy"
    - "Simple, well-understood changes"
    - "Emergency hotfixes"
```

## agent_assisted Criteria

### Spec Requirements

```yaml
agent_assistedSpecRequirements:
  required:
    - agent_support: agent_assisted
    - Valid header with required fields
    - Basic step-by-step for key operations
    - Most references resolved
    
  recommended:
    - Complete step-by-step for all operations
    - All references resolved
    - Error handling documented
    - Test scenarios defined
    
  not_required:
    - Complete edge case coverage
    - Comprehensive error messages
    - Full generated code
```

### Content Requirements

```yaml
agent_assistedContent:
  minimum:
    - Clear requirements for primary flows
    - Basic implementation approach
    - Key test scenarios
    - Main error cases
    
  recommended:
    - Detailed step-by-step for all operations
    - Complete error handling
    - Configuration requirements
    - Integration points documented
    
  skip:
    - Auto-generated code specs
    - Complete test suite
    - Production deployment specs
```

### Example agent_assisted Header

```yaml
# speclang-header lines:12
id: @specs/payment-service
version: 0.1.0
project_level: Alpha
layer: 2
agent_support: agent_assisted
tags: [payment, service]
short: Payment processing service
---
```

## Agent Behavior

### At agent_assisted Level

```yaml
agent_assistedBehavior:
  can_do_autonomously:
    - "Generate code from implementation specs"
    - "Write unit tests"
    - "Create API documentation"
    - "Refactor within scope"
    - "Fix test failures"
    - "Update non-critical dependencies"
    
  must_request_review:
    - "New feature specifications"
    - "Architecture changes"
    - "Security modifications"
    - "External service integrations"
    - "Breaking changes"
    - "Database schema changes"
    
  must_request_approval:
    - "All commits to main branch"
    - "Pull requests"
    - "Deployment decisions"
    - "Dependency updates"
```

### Agent Configuration

```yaml
agent_assistedConfig:
  autonomous_actions:
    - "Code generation from specs"
    - "Unit test writing"
    - "Documentation generation"
    - "Bug fixes from test failures"
    - "Refactoring within boundaries"
    - "Format and lint fixes"
    
  review_required_actions:
    - "New features"
    - "Architecture changes"
    - "Security changes"
    - "API changes"
    - "Database schema"
    - "Infrastructure"
    
  approval_required_actions:
    - "All commits"
    - "Branch merges"
    - "Deployments"
    - "Dependency major updates"
```

### Human Responsibilities

```yaml
HumanResponsibilities:
  must_review:
    - "All proposed changes"
    - "Code generation output"
    - "Test coverage reports"
    - "Performance implications"
    
  must_approve:
    - "Commits to protected branches"
    - "Pull request merges"
    - "Deployments"
    - "Breaking changes"
    
  can_defer_to_agent:
    - "Code formatting"
    - "Documentation updates"
    - "Test additions"
    - "Dependency minor updates"
```

## Validation Rules

### agent_assisted Validation

```yaml
agent_assistedValidation:
  rules:
    - "agent_support must be agent_assisted"
    - "Header must be valid"
    - "References should exist (warnings allowed)"
    - "No syntax errors"
    - "Human review flag present"
    
  warnings:
    - "If step-by-step missing for key operations"
    - "If references unresolved"
    - "If ambiguous language in critical paths"
    - "If layer inappropriate for content"
```

### Transition Checklists

#### To agent_autonomous

```yaml
agent_assistedToAutonomous:
  validation:
    - [ ] Step-by-step for all operations
    - [ ] All references resolved
    - [ ] No ambiguous language in critical sections
    - [ ] All required metadata present
    
  readiness:
    - [ ] Tests passing autonomously
    - [ ] Code quality acceptable
    - [ ] Error handling complete
    - [ ] Documentation comprehensive
    
  approval:
    - [ ] Human review passed
    - [ ] Security review passed
    - [ ] Transition approved
```

## Examples

### Example 1: agent_assisted Service

```yaml
# speclang-header lines:12
id: @specs/user-service
version: 0.1.0
project_level: Alpha
layer: 2
agent_support: agent_assisted
tags: [user, service]
short: User management service
---

# User Service

## Features
- Create user
- Update profile
- Delete user

## Implementation
- Agents can generate code
- Human review required for commits
```

### Example 2: agent_assisted Transition Ready

```yaml
# speclang-header lines:15
id: @specs/auth-login
version: 1.0.0
project_level: Production
layer: 3
agent_support: agent_assisted
tags: [auth, login]
depends_on: ["@specs/user-entities"]
short: Login operation ready for review
---

# Login Operation

## Steps
1. Receive credentials
2. Validate input
3. Query user
4. Verify password
5. Generate token
6. Return response
```

## Guidelines

### Best Practices for agent_assisted

```yaml
agent_assistedBestPractices:
  do:
    - "Define clear boundaries for agent actions"
    - "Require review for important changes"
    - "Provide detailed feedback on proposals"
    - "Document approval workflows"
    - "Prepare for autonomous transition"
    
  dont:
    - "Don't allow unapproved commits"
    - "Don't skip security reviews"
    - "Don't skip human oversight"
```

### Common Mistakes

```yaml
agent_assistedMistakes:
  - name: "Approving everything"
    mistake: "Human rubber-stamps all agent proposals"
    correction: "Review content thoroughly"
    
  - name: "Too restrictive"
    mistake: "Agents can't do anything useful"
    correction: "Define clear autonomous boundaries"
    
  - name: "No feedback loop"
    mistake: "Agents don't learn from reviews"
    correction: "Track review patterns"
```

## Summary

| Aspect | agent_assisted |
|--------|---------------|
| Purpose | Agents help, humans approve |
| Autonomy | Medium |
| Commit | Requires approval |
| Deployment | Requires approval |
| Best For | MVP, Alpha, complex changes |

## References

- @ref:speclang/agent-support-levels
- @ref:speclang/agent-autonomous
- @ref:speclang/behavior-matrix
- SIP 19: Agent Support Levels
- SIP 100: Agent-Autonomous

## Copyright

This document is in the public domain.
