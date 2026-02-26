---
name: sip-018-maturity-levels-speclang-v0
title: "SIP 18: Project Maturity Levels"
version: 0.1.0
description: Concrete criteria for project_level values POC through Enterprise
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 18: Project Maturity Levels

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP explains project maturity levels (POC → Enterprise).

### Quick Start

1. **POC:** Experimental, minimal validation
2. **MVP:** Core functionality validated
3. **Alpha:** Internal testing, incomplete features
4. **Beta:** External testing, feature complete
5. **Production:** Stable, production-ready
6. **Startup/SMB/MSB/Enterprise:** Organizational scale

### Key Concepts

- **Progression:** POC → MVP → Alpha → Beta → Production
- **Scale Axis:** Startup → SMB → MSB → Enterprise
- **Agent Behavior:** More autonomy at higher levels
- **Validation:** Stricter at higher levels

### When to Read This

- **Setting project_level:** Choose appropriate level
- **Agent configuration:** Understand behavior changes
- **Planning transitions:** Know requirements for next level

### Related SIPs

- SIP 16: Autonomous Validation
- SIP 17: Layer Definitions

## Abstract

This SIP defines concrete criteria for the `project_level` field. Project maturity guides agent behavior, validation strictness, and deployment readiness. Levels progress from POC (experimental) to Enterprise (maximum scale).

## Motivation

Projects need:
- Clear maturity indicators
- Agent behavior adjustment
- Validation strictness control
- Deployment readiness assessment

## Rationale

**Two Dimensions:**
- Maturity: POC → Production (software readiness)
- Scale: Startup → Enterprise (organizational context)

**Agent Behavior:**
- Lower maturity: More human oversight
- Higher maturity: More autonomy
- Scale affects compliance needs

**Validation:**
- POC: Minimal requirements
- Production: Strict requirements

## Specification

### Level Definitions

| Level | Name | Description | Agent Behavior |
|-------|------|-------------|----------------|
| POC | Proof of Concept | Experimental, minimal validation | Human confirmation required |
| MVP | Minimum Viable Product | Core functionality validated | Agent-assisted with review |
| Alpha | Internal Testing | Incomplete features, internal use | Agent-assisted, review major changes |
| Beta | External Testing | Feature complete, stability focus | Autonomous for non-critical |
| Production | Stable Production | Production-ready, supported | Fully autonomous |
| Startup | Small Team Scale | Rapid iteration, limited resources | Autonomous with rapid feedback |
| SMB | Small/Medium Business | Established processes, moderate scale | Autonomous with compliance checks |
| MSB | Medium/Large Business | Complex integration, compliance focus | Autonomous with strict governance |
| Enterprise | Maximum Scale | Strict governance, high availability | Fully autonomous with monitoring |

### POC (Proof of Concept)

```yaml
POC:
  purpose: "Validate core idea feasibility"
  
  spec_requirements:
    - High-level intent clear
    - Core architecture sketched
    - No detailed implementation specs needed
    
  testing_requirements:
    - Manual testing acceptable
    - No automated test suite required
    
  documentation_requirements:
    - Basic README
    - No API documentation required
    
  deployment_requirements:
    - No production deployment
    - Local development only
    
  agent_support: "human_only or agent_assisted"
```

### MVP (Minimum Viable Product)

```yaml
MVP:
  purpose: "Deliver core functionality to early adopters"
  
  spec_requirements:
    - Feature specs complete (layer 1-2)
    - Core implementation specs exist (layer 3-4)
    - Code generation specs may be incomplete
    
  testing_requirements:
    - Core functionality tests exist
    - Basic integration tests
    
  documentation_requirements:
    - User documentation for core features
    - API documentation for public interfaces
    
  deployment_requirements:
    - Can deploy to staging
    - Not yet production-ready
    
  agent_support: "agent_assisted"
```

### Alpha

```yaml
Alpha:
  purpose: "Internal testing with incomplete features"
  
  spec_requirements:
    - Most feature specs complete
    - Implementation specs for core components
    - Some code generation specs exist
    
  testing_requirements:
    - Unit tests for core components
    - Integration tests for key workflows
    - Test coverage > 50%
    
  documentation_requirements:
    - Comprehensive internal documentation
    - API documentation complete
    
  deployment_requirements:
    - Deployed to internal environments
    - Regular internal releases
    
  agent_support: "agent_assisted"
```

### Beta

```yaml
Beta:
  purpose: "External testing with feature completeness"
  
  spec_requirements:
    - All feature specs complete
    - Implementation specs for all components
    - Code generation specs for core components
    
  testing_requirements:
    - Comprehensive test suite
    - End-to-end tests for major flows
    - Test coverage > 80%
    
  documentation_requirements:
    - User documentation complete
    - Developer documentation complete
    - Deployment guides
    
  deployment_requirements:
    - Deployed to beta environment
    - External users can access
    - SLA not guaranteed
    
  agent_support: "agent_autonomous (with oversight)"
```

### Production

```yaml
Production:
  purpose: "Stable, production-ready system"
  
  spec_requirements:
    - All specs complete and validated
    - Code generation specs for all components
    - Test specs for all functionality
    
  testing_requirements:
    - Full test suite with high coverage (>90%)
    - Performance tests
    - Security tests
    
  documentation_requirements:
    - Complete documentation for all audiences
    - Operational runbooks
    - Disaster recovery procedures
    
  deployment_requirements:
    - Deployed to production
    - SLA guaranteed
    - Monitoring and alerting in place
    
  agent_support: "agent_autonomous"
```

### Startup

```yaml
Startup:
  purpose: "Small team, rapid iteration focus"
  team_size: "< 10 people"
  
  process_characteristics:
    - Fast decision cycles
    - Lean documentation
    - High autonomy for developers
    - Focus on growth metrics
    
  agent_behavior: "Autonomous with rapid feedback loops"
```

### SMB (Small/Medium Business)

```yaml
SMB:
  purpose: "Established processes, moderate scale"
  team_size: "10-100 people"
  
  process_characteristics:
    - Defined development processes
    - Basic compliance requirements
    - Moderate documentation
    - Focus on reliability and scaling
    
  agent_behavior: "Autonomous with compliance checks"
```

### MSB (Medium/Large Business)

```yaml
MSB:
  purpose: "Complex integration, compliance focus"
  team_size: "100-1000 people"
  
  process_characteristics:
    - Strict compliance requirements (SOC2, GDPR)
    - Complex integration with existing systems
    - Extensive documentation
    - Enterprise feature focus
    
  agent_behavior: "Autonomous with strict governance"
```

### Enterprise

```yaml
Enterprise:
  purpose: "Maximum scale, strict governance, high availability"
  team_size: "1000+ people"
  
  process_characteristics:
    - Global scale deployment
    - Maximum compliance requirements
    - Highest availability (99.99%+)
    - Extensive monitoring and observability
    
  agent_behavior: "Fully autonomous with extensive monitoring"
```

## Usage Guidelines

```yaml
Guidelines:
  1: "Start at POC for new projects"
  2: "Progress through MVP → Alpha → Beta → Production"
  3: "Use Startup/SMB/MSB/Enterprise for organizational context"
  4: "Mix levels allowed: Beta maturity with Startup scale"
  5: "Agents consider both dimensions: maturity + scale"

LowerMaturity (POC, MVP):
  - Require more human oversight
  - Allow incomplete specs
  - Focus on rapid iteration

HigherMaturity (Production, Enterprise):
  - Require complete specs
  - Enforce strict validation
  - Ensure comprehensive testing
```

## Validation Rules

```yaml
ProjectLevelValidation:
  
  consistency_rules:
    - "agent_autonomous requires project_level >= Beta"
    - "Production specs must have complete depends_on"
    - "Enterprise specs must have compliance tags"
    
  agent_behavior_rules:
    - "POC/MVP: Human confirmation for each operation"
    - "Alpha/Beta: Human review for major, autonomous for minor"
    - "Production+: Fully autonomous generation and deployment"
    - "Startup/SMB/MSB/Enterprise: Adjust compliance checks"
```

## Transition Requirements

### POC → MVP

- [ ] Core features identified
- [ ] Basic tests exist
- [ ] User documentation started
- [ ] Can deploy to staging

### MVP → Alpha

- [ ] Most features specified
- [ ] Test coverage > 50%
- [ ] Internal documentation complete
- [ ] Regular internal releases

### Alpha → Beta

- [ ] All features specified
- [ ] Test coverage > 80%
- [ ] External documentation complete
- [ ] External users can access

### Beta → Production

- [ ] All specs validated
- [ ] Test coverage > 90%
- [ ] Operational runbooks ready
- [ ] Monitoring in place

## Examples

### Startup at Alpha

```yaml
# Mixed maturity and scale
project_level: Alpha
# Implies: 
# - Internal testing phase
# - Some features incomplete
# - Rapid iteration allowed
# - Human review for major changes
```

### Enterprise at Production

```yaml
project_level: Production
# With enterprise characteristics:
# - Global scale
# - Maximum compliance
# - 99.99% availability
# - Extensive monitoring
# - Fully autonomous agents
```

## References

- @ref:speclang/project-maturity-levels
- @ref:speclang/project-maturity-levels/levels
- @ref:speclang/project-maturity-levels/criteria
- SIP 16: Autonomous Validation
- SIP 17: Layer Definitions

## Copyright

This document is in the public domain.
