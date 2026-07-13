# speclang-header lines:9
id: "@speclang/transition-workflows"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [transition, workflow, maturity, upgrade, downgrade]
short: Directory index for transition workflows specifications
---
# Transition Workflows Directory

This directory contains detailed specifications for transition workflows:

- **Upgrade workflows**: Moving specs to higher maturity levels
- **Downgrade workflows**: Rollback and safety procedures for moving specs to lower maturity levels

## Sub‑specifications

```speclang
# @block:transition/directory-index @kind:directory
DirectoryIndex:
  
  upgrade:
    - "@ref:speclang/transition-workflows/upgrade
    - Contains: Upgrade checklists, validation gates, orchestration, examples
  
  downgrade:
    - "@ref:speclang/transition-workflows/downgrade
    - Contains: Downgrade triggers, rollback procedures, emergency workflows
  
  relationship:
    - Upgrade and downgrade workflows share common validation infrastructure
    - Both integrate with agent behavior matrix
    - Orchestration tools support both directions
```

## Quick Reference

### When to Use Which Spec

| Scenario | Primary Spec | Key Sections |
|----------|--------------|--------------|
| Planning an upgrade | @ref:speclang/transition-workflows/upgrade | Upgrade Checklist, Validation Gates |
| Executing a rollback | @ref:speclang/transition-workflows/downgrade | Rollback Procedures, Downgrade Validation |
| Configuring transition gates | Both | Validation Gates, Orchestration |
| Emergency procedures | @ref:speclang/transition-workflows/downgrade | Emergency Rollback, Monitoring Integration |
| Agent behavior changes | Both | Integration with Agent Behavior Matrix |

## Common References

```speclang
# @block:transition/common-refs @kind:refs
refs:
  - "@ref:speclang/project-maturity-levels
  - "@ref:speclang/agent-support-levels
  - "@ref:speclang/autonomous-validation
  - "@ref:speclang/agent-behavior-matrix
  - "@ref:speclang/transition-workflows/upgrade
  - "@ref:speclang/transition-workflows/downgrade
```

## Maintenance Notes

This directory index serves as the entry point for transition workflows.
Detailed content has been moved to the sub‑specifications above.

**Last split**: 2025‑02‑22 (moved detailed checklists and procedures to sub‑specs)