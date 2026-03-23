---
name: sip-100-agent-autonomous-speclang-v0
title: "SIP 100: Agent-Autonomous Level"
version: 0.1.0
description: Detailed criteria and workflows for agent_autonomous support level
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 100: Agent-Autonomous Level

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `agent_autonomous` level in detail.

### Quick Start

**agent_autonomous** = Full agent operation
- Purpose: Agents can fully operate based on spec
- Permissions: Read, write, generate, deploy autonomously
- Validation: Complete checks, all references resolved

### When to Read This

- Setting agent_support to agent_autonomous
- Configuring autonomous agent behavior
- Validating specs for full autonomy
- Implementing autonomous validation

### Related SIPs

- SIP 19: Agent Support Levels
- SIP 99: Agent-Assisted Level
- SIP 101: Behavior Matrix
- SIP 102: Transition Upgrade
- SIP 18: Maturity Levels

## Abstract

This SIP provides comprehensive criteria for the `agent_autonomous` support level. At this level, agents can fully operate based on spec content without human intervention, including generating code, running tests, and deploying.

## agent_autonomous Overview

### Definition

```yaml
agent_autonomous:
  full_name: "Agent-Autonomous"
  purpose: "Agents can fully operate based on spec content"
  autonomy_level: "High"
  risk_level: "Controlled"
  
  characteristics:
    - Complete step-by-step descriptions
    - All references resolve to existing blocks
    - No ambiguous natural language
    - All required metadata fields present
    - Full validation passed
    
  permissions:
    - Full read/write access to spec
    - Generate and commit code
    - Run tests and deploy
    - Self-correct errors
    - Create new specs as needed
    
  requirements:
    - Production or mature project level
    - Comprehensive test coverage
    - Complete documentation
    - Security review passed
```

### Position in Autonomy Model

```
Autonomy Progression:

human_only → agent_assisted → agent_autonomous
                                   ↑
                              Full autonomy
```

### When to Use agent_autonomous

```yaml
agent_autonomousAppropriate:
  scenarios:
    - "Production systems with complete specs"
    - "Well-understood, stable features"
    - "Projects with high maturity (Beta, Production)"
    - "Teams wanting full automation"
    
  prerequisites:
    - All operations have step-by-step descriptions
    - All @ref: references resolve
    - No ambiguous language in critical sections
    - Complete error handling defined
    - Test scenarios specified
```

## agent_autonomous Criteria

### Spec Requirements

```yaml
agent_autonomousSpecRequirements:
  required:
    - agent_support: agent_autonomous
    - Complete header with all required fields
    - Step-by-step for ALL operations
    - All @ref: references resolve to existing blocks
    - No ambiguous natural language
    - All dependencies explicitly declared
    - Layer value appropriate for content
    - project_level criteria met
    
  validation:
    - "All operations have explicit steps"
    - "All references valid"
    - "No unresolved placeholders"
    - "Metadata complete"
    - "Security considerations addressed"
```

### Content Requirements

```yaml
agent_autonomousContent:
  required:
    - Step-by-step for every operation
    - Complete error handling
    - All edge cases defined
    - Configuration requirements
    - Integration specifications
    
  validated:
    - References resolve correctly
    - Dependencies declared
    - No circular dependencies
    - Layer appropriate for content
```

### Example agent_autonomous Header

```yaml
# speclang-header lines:9
id: @specs/api/users
version: 1.0.0
project_level: Production
layer: 3
agent_support: agent_autonomous
tags: [api, users, production]
depends_on: ["@specs/auth", "@specs/validation"]
short: User API with full autonomous support
---
```

## Agent Behavior

### At agent_autonomous Level

```yaml
agent_autonomousBehavior:
  can_do_fully:
    - "Generate code from specs"
    - "Write and run tests"
    - "Refactor within scope"
    - "Fix bugs autonomously"
    - "Deploy to appropriate environments"
    - "Create related specs"
    - "Update documentation"
    
  self_corrects:
    - "Test failures (retry/fix)"
    - "Linting errors"
    - "Type errors"
    - "Missing imports"
    
  escalates_only:
    - "Security vulnerabilities"
    - "Data corruption risks"
    - "Unrecoverable errors"
    - "Configuration secrets needed"
```

### Agent Configuration

```yaml
agent_autonomousConfig:
  full_autonomy:
    - "Code generation from specs"
    - "Test generation and execution"
    - "Documentation updates"
    - "Bug fixing"
    - "Refactoring"
    - "Dependency updates (non-breaking)"
    - "Deployment to non-production"
    
  approval_required:
    - "Production deployments"
    - "Major version bumps"
    - "Breaking changes"
    - "Security modifications"
    - "New external dependencies"
    
  never_do:
    - "Expose secrets"
    - "Disable security controls"
    - "Corrupt data"
    - "Ignore test failures"
```

### Monitoring and Safety

```yaml
SafetyMeasures:
  monitoring:
    - "Log all autonomous actions"
    - "Track success/failure rates"
    - "Monitor performance metrics"
    - "Alert on anomalies"
    
  rollback:
    - "Auto-rollback on failure"
    - "Version control for specs"
    - "Deployment rollback capability"
    
  human_oversight:
    - "Post-hoc review of changes"
    - "Periodic audits"
    - "Emergency stop capability"
```

## Validation Rules

### agent_autonomous Validation

```yaml
agent_autonomousValidation:
  required_checks:
    - "Header complete with all fields"
    - "All operations have step-by-step"
    - "All @ref: resolve to existing blocks"
    - "No ambiguous language in critical sections"
    - "All dependencies declared"
    - "Layer appropriate for content"
    - "project_level criteria met"
    
  automated_tests:
    - "Reference resolver"
    - "Step completeness checker"
    - "Metadata validator"
    - "Layer validator"
    
  quality_gates:
    - "Must pass all checks"
    - "No warnings allowed"
    - "Complete documentation"
```

### Transition Checklists

#### From agent_assisted

```yaml
assistedToAutonomous:
  spec_completeness:
    - [ ] Step-by-step for ALL operations
    - [ ] All references resolved
    - [ ] No ambiguous language
    - [ ] All metadata present
    
  validation:
    - [ ] Autonomous validation passed
    - [ ] Security review passed
    - [ ] Test coverage acceptable
    - [ ] Documentation complete
    
  approval:
    - [ ] Human approval for autonomy
    - [ ] Monitoring configured
    - [ ] Rollback procedures tested
```

## Examples

### Example 1: agent_autonomous API

```yaml
# speclang-header lines:15
id: @specs/api/health
version: 1.0.0
project_level: Production
layer: 3
agent_support: agent_autonomous
tags: [api, health, production]
short: Health check endpoint
---

# Health Check

## @block:health-check @kind:operation

### Steps
1. Receive GET /health request
2. Check database connectivity
3. Check cache connectivity
4. Check external service status
5. Return combined status
6. Include timestamps in response

### Error Handling
- DatabaseError: Return 503 with details
- CacheError: Return 503, continue
- Timeout: Return 504 after 5s
```

### Example 2: Full Feature

```yaml
# speclang-header lines:18
id: @specs/user-create
version: 1.0.0
project_level: Production
layer: 4
agent_support: agent_autonomous
tags: [user, create, production]
depends_on: ["@specs/user-entities", "@specs/validation"]
short: User creation with full validation
---

# User Creation

## @block:user-create @kind:operation

### Steps
1. Receive POST /users with JSON body
2. Validate email format (regex)
3. Validate password strength (min 8 chars, 1 uppercase, 1 number)
4. Check email not already registered
5. Hash password with bcrypt (cost 12)
6. Insert user into database
7. Generate UUID for user
8. Return 201 with user object (exclude password)

### Error Handling
- InvalidEmail: 400 "Invalid email format"
- WeakPassword: 400 "Password too weak"
- EmailExists: 409 "Email already registered"
- DatabaseError: 500 "Internal error"
```

## Guidelines

### Best Practices for agent_autonomous

```yaml
agent_autonomousBestPractices:
  do:
    - "Write complete step-by-step for all operations"
    - "Resolve all references before marking autonomous"
    - "Test autonomous validation thoroughly"
    - "Monitor autonomous agent performance"
    - "Maintain rollback capabilities"
    - "Review autonomous changes periodically"
    
  dont:
    - "Don't mark incomplete specs as autonomous"
    - "Don't skip validation checks"
    - "Don't ignore monitoring"
    - "Don't skip security reviews"
```

### Common Mistakes

```yaml
agent_autonomousMistakes:
  - name: "Premature autonomy"
    mistake: "Marking incomplete specs as autonomous"
    correction: "Complete all steps first"
    
  - name: "No monitoring"
    mistake: "Letting agents run without oversight"
    correction: "Implement monitoring and alerts"
    
  - name: "No rollback"
    mistake: "No way to undo autonomous changes"
    correction: "Always maintain version control"
```

## Summary

| Aspect | agent_autonomous |
|--------|------------------|
| Purpose | Full autonomous operation |
| Autonomy | High |
| Commit | Autonomous |
| Deployment | Conditional autonomous |
| Best For | Production, complete specs |
| Validation | Complete |

## References

- "@ref:speclang/agent-support-levels
- @ref:speclang/agent-assisted
- @ref:speclang/behavior-matrix
- SIP 19: Agent Support Levels
- SIP 99: Agent-Assisted

## Copyright

This document is in the public domain.
