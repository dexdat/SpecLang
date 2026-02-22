# speclang-header lines:11
id: "@speclang/project-maturity-levels/criteria"
version: 0.1.0
layer: 2
tags: [project, maturity, levels, criteria, validation]
parent: "@ref:specs/project-maturity-levels"
part: 2/2
project_level: Alpha
agent_support: agent_autonomous
short: Detailed criteria and validation rules for project_level
---
# Project Maturity Level Criteria

Detailed criteria, usage guidelines, and validation rules for each `project_level`.

## Detailed Criteria

### POC (Proof of Concept)

```speclang
# @block:project-level/poc @kind:entity
POC:
  purpose: "Validate core idea feasibility"
  spec_requirements:
    - High-level intent clear
    - Core architecture sketched
    - No need for detailed implementation specs
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

```speclang
# @block:project-level/mvp @kind:entity
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
    - Can be deployed to staging environment
    - Not yet production-ready
  agent_support: "agent_assisted"
```

### Alpha

```speclang
# @block:project-level/alpha @kind:entity
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

```speclang
# @block:project-level/beta @kind:entity
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

```speclang
# @block:project-level/production @kind:entity
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

```speclang
# @block:project-level/startup @kind:entity
Startup:
  purpose: "Small team, rapid iteration focus"
  team_size: "< 10 people"
  process_characteristics:
    - Fast decision cycles
    - Lean documentation
    - High autonomy for developers
    - Focus on growth metrics
  spec_requirements: "Same as Alpha/Beta depending on maturity"
  agent_behavior: "Autonomous with rapid feedback loops"
```

### SMB (Small/Medium Business)

```speclang
# @block:project-level/smb @kind:entity
SMB:
  purpose: "Established processes, moderate scale"
  team_size: "10-100 people"
  process_characteristics:
    - Defined development processes
    - Basic compliance requirements
    - Moderate documentation
    - Focus on reliability and scaling
  spec_requirements: "Same as Beta/Production"
  agent_behavior: "Autonomous with compliance checks"
```

### MSB (Medium/Large Business)

```speclang
# @block:project-level/msb @kind:entity
MSB:
  purpose: "Complex integration, compliance focus"
  team_size: "100-1000 people"
  process_characteristics:
    - Strict compliance requirements (SOC2, GDPR, etc.)
    - Complex integration with existing systems
    - Extensive documentation
    - Enterprise feature focus
  spec_requirements: "Production level with additional compliance specs"
  agent_behavior: "Autonomous with strict governance"
```

### Enterprise

```speclang
# @block:project-level/enterprise @kind:entity
Enterprise:
  purpose: "Maximum scale, strict governance, high availability"
  team_size: "1000+ people"
  process_characteristics:
    - Global scale deployment
    - Maximum compliance requirements
    - Highest availability (99.99%+)
    - Extensive monitoring and observability
  spec_requirements: "Production plus enterprise extensions"
  agent_behavior: "Fully autonomous with extensive monitoring"
```

## Usage Guidelines

```speclang
# @block:project-level/guidelines @kind:note
Guidelines for assigning project_level:

1. **Start at POC** for new projects
2. **Progress through MVP → Alpha → Beta → Production** as features stabilize
3. **Use Startup/SMB/MSB/Enterprise** to indicate organizational context
4. **Mix levels allowed**: A project can be `Beta` maturity with `Startup` scale
5. **Agents should consider both dimensions**: maturity + scale

When project_level indicates lower maturity (POC, MVP):
- Require more human oversight
- Allow incomplete specs
- Focus on rapid iteration over perfection

When project_level indicates higher maturity (Production, Enterprise):
- Require complete specs
- Enstrict validation
- Ensure comprehensive testing
```

## Validation Rules

```speclang
# @block:project-level/validation @kind:entity
ProjectLevelValidation:
  required_fields:
    - project_level: enum value
  
  consistency_rules:
    - Specs with `agent_support: agent_autonomous` must have `project_level >= Beta`
    - Specs with `project_level: Production` must have complete `depends_on` references
    - Specs with `project_level: Enterprise` must have compliance tags
  
  agent_behavior_rules:
    - POC/MVP: Require human confirmation for each operation
    - Alpha/Beta: Human review for major changes, autonomous for minor
    - Production+: Fully autonomous generation and deployment
    - Startup/SMB/MSB/Enterprise: Adjust resource allocation and compliance checks
```

## References

```speclang
# @block:project-level/references @kind:refs
refs:
  - @ref:speclang/headers#project_level
  - @ref:speclang/layer-definitions
  - @ref:speclang/agent-support-levels
```