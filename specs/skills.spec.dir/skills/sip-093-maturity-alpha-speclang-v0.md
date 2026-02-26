---
name: sip-093-maturity-alpha-speclang-v0
title: "SIP 93: Maturity Level - Alpha"
version: 0.1.0
description: Concrete criteria and guidelines for Alpha project level
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 93: Maturity Level - Alpha

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the Alpha maturity level.

### Quick Start

**Alpha** = Internal Testing
- Purpose: Internal testing with incomplete features
- Agent: Agent-assisted, review for major changes
- Validation: Unit tests > 50% coverage

### When to Read This

- Preparing for internal testing
- Setting project_level in headers
- Planning transitions from MVP or to Beta
- Configuring agent behavior for Alpha projects

### Related SIPs

- SIP 18: Maturity Levels
- SIP 91: Maturity Level - POC
- SIP 92: Maturity Level - MVP
- SIP 94: Maturity Level - Beta (future)

## Abstract

This SIP defines concrete criteria for the Alpha maturity level. Alpha represents the stage where features are internally tested with incomplete functionality, focused on finding bugs and gathering internal feedback before external testing.

## Alpha Overview

### Definition

```yaml
Alpha:
  full_name: "Alpha"
  purpose: "Internal testing with incomplete features"
  risk_level: "Low-Medium"
  investment: "Significant"
  
  characteristics:
    - Feature-complete for internal use
    - Internal team testing
    - Bugs being discovered and fixed
    - Performance tuning beginning
    - Documentation expanding
    
  agent_support: "agent_assisted"
```

### Position in Maturity Model

```
Maturity Progression:

POC → MVP → Alpha → Beta → Production
              ↑
         Internal testing
```

### When to Use Alpha

```yaml
AlphaAppropriate:
  scenarios:
    - "Internal team testing"
    - "Feature complete but unstable"
    - "Finding and fixing bugs"
    - "Performance testing"
    - "Security testing"
    - "Building to Beta quality"
    
  not_appropriate:
    - "External user access"
    - "Production workloads"
    - "Customer support ready"
    - "SLA commitments"
```

## Alpha Criteria

### Spec Requirements

```yaml
AlphaSpecRequirements:
  required:
    - project_level: Alpha
    - layer: 2-4 (Component to Implementation)
    - Feature specs for all features (layer 1)
    - Component specs for all components (layer 2)
    - Detail specs for complex components (layer 3)
    - Implementation specs for core paths (layer 4)
    - Test specs for core functionality (layer 7)
    
  recommended:
    - Code specs for all components (layer 5)
    - Full API documentation
    - Developer documentation
    - Operational notes
    
  not_required:
    - Complete generated code (layer 6)
    - Comprehensive test suite (layer 8-9)
    - Production deployment specs
    - Full operational runbooks
```

### Content Requirements

```yaml
AlphaContent:
  minimum:
    - All features specified at detail level
    - Implementation approach defined
    - Test scenarios for core flows
    - API documentation
    - Basic developer documentation
    
  recommended:
    - Most code specs generated
    - Performance requirements defined
    - Error handling documented
    - Configuration requirements
    
  skip:
    - Complete edge case handling
    - Production-grade error messages
    - Full monitoring/alerting
    - Disaster recovery procedures
```

### Example Alpha Header

```yaml
# speclang-header lines:12
id: @specs/platform
version: 0.1.0
project_level: Alpha
layer: 2
short: Platform services for internal testing
tags: [alpha, platform, internal]
agent_support: agent_assisted
---
```

## Agent Behavior

### At Alpha Level

```yaml
AlphaAgentBehavior:
  mode: "agent_assisted"
  
  autonomous:
    - "Generate code specs from implementation"
    - "Write unit tests"
    - "Generate API documentation"
    - "Refactor within scope"
    - "Fix bugs from test failures"
    - "Performance optimization"
    
  requires_review:
    - "New features beyond scope"
    - "Major architectural changes"
    - "Security modifications"
    - "External service integrations"
    
  not_allowed:
    - "Autonomous production deployment"
    - "Breaking changes without review"
    - "External user access"
```

### Agent Configuration

```yaml
AlphaAgentConfig:
  can_generate_autonomously:
    - "Code from implementation specs"
    - "Unit tests from test specs"
    - "API documentation"
    - "Bug fixes"
    - "Performance improvements"
    - "Code refactoring"
    
  must_request_human:
    - "New feature introduction"
    - "Architecture changes"
    - "Security changes"
    - "External integrations"
    
  review_triggers:
    - "New dependencies"
    - "API changes"
    - "Database schema changes"
    - "Infrastructure changes"
```

### Human Oversight

```yaml
HumanOversight:
  required_reviews:
    - "New feature specifications"
    - "Architecture decisions"
    - "Security changes"
    - "External integrations"
    - "Breaking changes"
    
  approval_needed:
    - "Deployment to new environments"
    - "Major version changes"
    - "Before Beta transition"
```

## Validation Rules

### Alpha Validation

```yaml
AlphaValidation:
  rules:
    - "project_level must be Alpha"
    - "layer should be 1-5"
    - "Must have feature specs for all features"
    - "Must have implementation specs"
    - "Must have test specs"
    - "Test coverage > 50%"
    - "agent_support must be agent_assisted"
    
  warnings:
    - "If test coverage < 50%, move back to MVP"
    - "If no test specs, move back to MVP"
    - "If feature-incomplete, move back to MVP"
```

### Transition Checklists

#### From MVP to Alpha

```yaml
MVPToAlpha:
  validation:
    - [ ] Core features functional
    - [ ] Early adopter feedback incorporated
    - [ ] MVP success criteria met
    
  spec_requirements:
    - [ ] All features specified
    - [ ] Implementation specs for core paths
    - [ ] Test specs written
    - [ ] API documentation complete
    
  testing:
    - [ ] Unit test infrastructure ready
    - [ ] Test coverage > 50%
    - [ ] Integration tests for key flows
    
  deployment:
    - [ ] Internal environment configured
    - [ ] Internal releases scheduled
```

#### From Alpha to Beta

```yaml
AlphaToBeta:
  validation:
    - [ ] All major bugs fixed
    - [ ] Internal testing complete
    - [ ] Performance acceptable
    - [ ] Security review passed
    
  spec_requirements:
    - [ ] Code specs for all components
    - [ ] Test code specs
    - [ ] Complete API docs
    - [ ] User documentation ready
    
  testing:
    - [ ] Test coverage > 80%
    - [ ] End-to-end tests passing
    - [ ] Performance tests passing
    - [ ] Security tests passing
    
  deployment:
    - [ ] Beta environment ready
    - [ ] External users can access
    - [ ] Monitoring in place
    - [ ] Error tracking configured
```

## Examples

### Example 1: Alpha Project

```yaml
# speclang-header lines:12
id: @specs/analytics-platform
version: 0.1.0
project_level: Alpha
layer: 2
short: Analytics platform for internal testing
tags: [alpha, analytics, internal]
agent_support: agent_assisted
---

# Analytics Platform Alpha

## Features (All Specified)

- Dashboard with charts
- Data pipeline processing
- User event tracking
- Report generation
- Export functionality

## Test Coverage

- Unit tests > 60%
- Integration tests for pipelines
- Dashboard rendering tests

## Documentation

- API docs complete
- Developer guide in progress
- User guide draft

## Internal Testing

- Deployed to staging.internal
- QA team testing
- Performance benchmarks running
```

### Example 2: Alpha with Full Stack

```yaml
# speclang-header lines:10
id: @specs/cms-alpha
version: 0.1.0
project_level: Alpha
layer: 2
short: CMS for internal content team
tags: [alpha, cms, content]
agent_support: agent_assisted
---

# CMS Alpha

## Implementation Coverage

- Backend API: Complete
- Frontend: Feature complete
- Database: Schema stable
- Auth: Working

## Test Status

- Unit tests: 55% coverage
- Integration: Key flows covered
- E2E: Basic user journeys pass

## Known Issues

- [ ] Image upload timeout under load
- [ ] Rich text editor edge cases
- [ ] Search performance with >10k articles

## Next Steps

Fix critical bugs, improve test coverage, prepare for Beta.
```

### Example 3: Alpha Transition Checklist

```yaml
AlphaReadiness:
  specs_complete:
    - [x] All features at layer 3+
    - [x] Implementation specs for all components
    - [x] Test specs for core features
    
  testing_ready:
    - [x] Unit tests > 50%
    - [x] Integration tests passing
    - [ ] Performance tests passing
    - [x] Security tests started
    
  documentation:
    - [x] API documentation
    - [x] Developer documentation
    - [ ] User documentation draft
    
  internal_users:
    - [x] Internal environment ready
    - [ ] Training materials prepared
    - [x] Bug tracking configured
```

## Guidelines

### Best Practices for Alpha

```yaml
AlphaBestPractices:
  do:
    - "Complete all feature specifications"
    - "Focus on bug finding and fixing"
    - "Establish test coverage > 50%"
    - "Document APIs comprehensively"
    - "Begin performance testing"
    - "Enable agent-assisted generation"
    - "Prepare for Beta transition"
    
  dont:
    - "Don't expose to external users"
    - "Don't make SLA commitments"
    - "Don't skip bug fixes for features"
    - "Don't delay security testing"
    - "Don't ignore performance issues"
```

### Common Mistakes

```yaml
AlphaMistakes:
  - name: "Premature Beta"
    mistake: "Moving to Beta with critical bugs"
    correction: "Fix major bugs first, then Beta"
    
  - name: "Insufficient testing"
    mistake: "Skipping test coverage requirements"
    correction: "Meet 50% coverage before Alpha"
    
  - name: "No documentation"
    mistake: "Skipping docs at Alpha"
    correction: "Document APIs and key components"
    
  - name: "Feature creep"
    mistake: "Adding features instead of stabilizing"
    correction: "Focus on Alpha quality first"
```

## Summary

| Aspect | Alpha |
|--------|-------|
| Purpose | Internal testing, incomplete features |
| Spec Depth | Feature (1) to Implementation (4) |
| Testing | Unit tests > 50%, integration tests |
| Documentation | API complete, developer docs |
| Agent Mode | agent_assisted |
| Human Oversight | Review for major changes |
| Deployment | Internal environments |

## References

- @ref:speclang/maturity-levels
- @ref:speclang/maturity-levels/alpha
- @ref:speclang/project-level
- SIP 18: Maturity Levels
- SIP 91: POC
- SIP 92: MVP
- SIP 94: Beta (future)

## Copyright

This document is in the public domain.
