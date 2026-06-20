# speclang-header lines:13
id: "@speclang/project-maturity-levels"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [project, maturity, levels, autonomous]
target: src/maturity/
children:
  - "@ref:specs/project-maturity-levels.spec.dir/levels"
- "@ref:specs/project-maturity-levels.spec.dir/criteria"
short: Concrete criteria for each project_level value
---
# Project Maturity Levels

Clear definitions for the `project_level` field (POC → Enterprise).

This specification defines the maturity levels used throughout SpecLang to guide agent behavior, validation strictness, and deployment readiness. The specification is split into detailed parts for autonomous agent operation.

## Overview

```speclang
# @block:levels @kind:note
Project maturity levels indicate the stage of a project's development:

- **POC** (Proof of Concept): Experimental, minimal validation
- **MVP** (Minimum Viable Product): Core functionality validated
- **Alpha**: Internal testing, incomplete features
- **Beta**: External testing, feature complete
- **Production**: Stable, production-ready
- **Startup**: Small team, rapid iteration focus
- **SMB** (Small/Medium Business): Established processes, moderate scale
- **MSB** (Medium/Large Business): Complex integration, compliance focus
- **Enterprise**: Maximum scale, strict governance, high availability

Each level has specific criteria for spec completeness, testing rigor, documentation, and operational readiness.
```

## Detailed Criteria

```speclang
# @block:criteria @kind:note
Criteria for each maturity level include:

1. **Spec Requirements**: Depth and completeness of specifications
2. **Testing Requirements**: Test coverage and types required
3. **Documentation Requirements**: Documentation completeness
4. **Deployment Requirements**: Deployment environment and readiness
5. **Agent Support**: Level of agent autonomy allowed

Detailed criteria are defined in the split specification parts.
```

## Validation Rules

```speclang
# @block:validation @kind:entity
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

## Usage Guidelines

```speclang
# @block:guidelines @kind:note
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
- Enforce strict validation
- Ensure comprehensive testing
```

## Split Parts

This specification is split into multiple parts for better organization and autonomous agent operation:

- @ref:specs/project-maturity-levels.spec.dir/levels – Detailed definitions for each project_level value
- @ref:specs/project-maturity-levels.spec.dir/criteria – Detailed criteria and validation rules
- @ref:specs/project-maturity-levels.spec.dir/depth-requirements – Depth requirements by project scope

Each part can be operated on independently by autonomous agents while maintaining reference integrity.

## References

- @ref:specs/headers#project_level – Header field definition
- @ref:specs/layer-definitions – Layer system integration
- @ref:specs/agent-support-levels – Agent support levels

## Examples

```speclang
# @block:examples @kind:code
Example header with project_level:

```yaml
# speclang-header lines:12
id: "@specs/auth#login"
version: 1.0.0
layer: 2
project_level: Beta
agent_support: agent_autonomous
tags: [auth, login, security]
---
```

This spec is at Beta maturity, allowing agent_autonomous support with external testing readiness.
```

*See individual parts in `project-maturity-levels.spec.dir/` for complete details.*