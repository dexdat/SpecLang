---
name: sip-091-maturity-poc-speclang-v0
title: "SIP 91: Maturity Level - POC"
version: 0.1.0
description: Concrete criteria and guidelines for Proof of Concept project level
category: standard
---

# SIP 91: Maturity Level - POC

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the POC (Proof of Concept) maturity level.

### Quick Start

**POC** = Proof of Concept
- Purpose: Validate core idea feasibility
- Agent: Human-only or agent-assisted with human confirmation
- Validation: Minimal

### When to Read This

- Starting new experimental projects
- Setting project_level in headers
- Configuring agent behavior for experimental work
- Planning transition to MVP

### Related SIPs

- SIP 18: Maturity Levels
- SIP 92: Maturity Level - MVP
- SIP 93: Maturity Level - Alpha

## Abstract

This SIP defines concrete criteria for the POC (Proof of Concept) maturity level. POC represents the earliest stage of project development, focused on validating core ideas with minimal overhead and maximum flexibility.

## POC Overview

### Definition

```yaml
POC:
  full_name: "Proof of Concept"
  purpose: "Validate core idea feasibility"
  risk_level: "High"
  investment: "Minimal"
  
  characteristics:
    - Experimental nature
    - Minimal validation
    - Rapid iteration
    - High flexibility
    - Limited documentation
    
  agent_support: "human_only or agent_assisted"
```

### Position in Maturity Model

```
Maturity Progression:

POC → MVP → Alpha → Beta → Production
  ↑
  Earliest stage
```

### When to Use POC

```yaml
POCAppropriate:
  scenarios:
    - "Exploring new technology ideas"
    - "Testing architectural approaches"
    - "Validating user needs"
    - "Building prototypes"
    - "Research projects"
    
  not_appropriate:
    - "Production systems"
    - "Customer-facing features"
    - "Long-term maintained code"
    - "Compliance-required systems"
```

## POC Criteria

### Spec Requirements

```yaml
POCSpecRequirements:
  required:
    - project_level: POC
    - layer: 0 (North Star)
    - short: Brief description of what you're testing
    
  optional:
    - Minimal feature breakdown (layer 1)
    - High-level architecture sketch
    - Basic user stories
    
  not_required:
    - Detailed implementation specs
    - Test specs
    - API documentation
    - Complete entity definitions
```

### Content Requirements

```yaml
POCContent:
  minimum:
    - Project intent and goals
    - Core hypothesis being tested
    - Success criteria (how to know if POC worked)
    
  recommended:
    - Basic feature list
    - Technology candidates to test
    - Known risks or unknowns
    
  skip:
    - Detailed data models
    - API specifications
    - Error handling
    - Edge cases
    - Performance requirements
```

### Example POC Header

```yaml
# speclang-header lines:8
id: @specs/auth-poc
version: 0.1.0
project_level: POC
layer: 0
short: Test passwordless authentication feasibility
tags: [poc, auth, experiment]
agent_support: human_only
---
```

## Agent Behavior

### At POC Level

```yaml
POCAgentBehavior:
  mode: "human_only or agent_assisted"
  
  human_required:
    - All code generation
    - Architecture decisions
    - Technology selection
    - Any implementation work
    
  agent_assisted:
    - Research and information gathering
    - Documentation drafting
    - Formatting and organization
    - Finding similar patterns
    
  not_allowed:
    - Autonomous code generation
    - Independent feature implementation
    - Direct production deployments
```

### Agent Configuration

```yaml
POCAgentConfig:
  confirmation_required:
    - "Every code change"
    - "Every architecture decision"
    - "Every technology choice"
    
  can_suggest:
    - "Code examples"
    - "Architecture patterns"
    - "Research findings"
    
  must_defer:
    - "Implementation to humans"
    - "Design decisions to humans"
    - "Testing approach to humans"
```

### Human Oversight

```yaml
HumanOversight:
  required_actions:
    - "Review all generated content"
    - "Approve implementation approach"
    - "Validate technical decisions"
    - "Confirm success criteria"
    
  review_frequency:
    - "Before any implementation"
    - "After each POC iteration"
    - "Before deciding to proceed"
```

## Validation Rules

### POC Validation

```yaml
POCValidation:
  rules:
    - "project_level must be POC"
    - "layer should be 0-1 (abstract levels)"
    - "No code generation specs allowed"
    - "No test specs required"
    - "agent_support must be human_only or agent_assisted"
    
  warnings:
    - "If layer >= 3, may be too detailed for POC"
    - "If test specs exist, consider MVP"
    - "If multiple features, consider MVP"
```

### Transition to MVP Checklist

```yaml
POCToMVP:
  requirements:
    - [ ] Core hypothesis validated
    - [ ] Technical approach confirmed
    - [ ] Basic feature list defined
    - [ ] Success criteria met
    - [ ] Decision to proceed with development
    
  spec_requirements:
    - [ ] Layer 1 specs for core features
    - [ ] Initial entity definitions (layer 2)
    - [ ] Updated project_level to MVP
    
  agent_requirements:
    - [ ] Configure for agent_assisted mode
```

## Examples

### Example 1: Technology POC

```yaml
# speclang-header lines:10
id: @specs/graph-db-poc
version: 0.1.0
project_level: POC
layer: 0
short: Test Neo4j for social graph storage
tags: [poc, database, experiment]
agent_support: human_only
---

# Graph Database POC

## Hypothesis

Neo4j can handle our social graph requirements with <100ms query times.

## Test Approach

1. Import sample dataset (1M nodes, 10M edges)
2. Run common query patterns
3. Measure latency under load

## Success Criteria

- [ ] Query latency < 100ms for 90th percentile
- [ ] Import time < 10 minutes
- [ ] Can handle concurrent reads
```

### Example 2: Feature POC

```yaml
# speclang-header lines:8
id: @specs/voice-auth-poc
version: 0.1.0
project_level: POC
layer: 0
short: Validate voice biometric authentication
tags: [poc, auth, voice]
agent_support: agent_assisted
---

# Voice Authentication POC

## User Need

Users want to authenticate using their voice instead of passwords.

## Test Questions

- Can voice biometrics achieve <1% false acceptance?
- Is latency acceptable (<2 seconds)?
- Do users find it convenient?

## Next Steps After Validation

If successful, move to MVP with formal feature spec.
```

### Example 3: Architecture POC

```yaml
# speclang-header lines:8
id: @specs/microservices-arch-poc
version: 0.1.0
project_level: POC
layer: 0
short: Validate microservices architecture for scalability
tags: [poc, architecture, microservices]
agent_support: human_only
---

# Microservices Architecture POC

## Question

Can a microservices architecture support 10x growth?

## Testing

- Create proof-of-concept services
- Test inter-service communication
- Evaluate deployment complexity

## Decision Factors

- Complexity vs scalability tradeoff
- Team capability to maintain
- Operational overhead
```

## Guidelines

### Best Practices for POC

```yaml
POCBestPractices:
  do:
    - "Keep specs minimal and high-level"
    - "Focus on one question/hypothesis"
    - "Define clear success criteria"
    - "Get human confirmation for all work"
    - "Document learnings regardless of outcome"
    
  dont:
    - "Don't build complete features"
    - "Don't write comprehensive tests"
    - "Don't create detailed documentation"
    - "Don't deploy to production"
    - "Don't over-invest in tooling"
```

### Common Mistakes

```yaml
POCMistakes:
  - name: "Over-specifying"
    mistake: "Writing detailed specs at POC stage"
    correction: "Keep at layer 0-1, focus on validation"
    
  - name: "Skipping success criteria"
    mistake: "No way to know if POC succeeded"
    correction: "Define measurable success criteria upfront"
    
  - name: "Going too far"
    mistake: "Building production-like code"
    correction: "Prototype only, save detailed work for MVP"
    
  - name: "No human oversight"
    mistake: "Letting agents work autonomously"
    correction: "Require human confirmation for all decisions"
```

## Summary

| Aspect | POC |
|--------|-----|
| Purpose | Validate core idea |
| Spec Depth | Minimal (layer 0-1) |
| Testing | Manual or none |
| Documentation | Basic README |
| Agent Mode | human_only |
| Human Oversight | Full |
| Deployment | None |

## References

- @ref:speclang/maturity-levels
- @ref:speclang/maturity-levels/poc
- @ref:speclang/project-level
- SIP 18: Maturity Levels
- SIP 92: MVP
- SIP 93: Alpha

## Copyright

This document is in the public domain.
