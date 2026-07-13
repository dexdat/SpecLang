# speclang-header lines:11
id: "@speclang/semantic-definitions/project-levels"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [semantic, definitions, project-level, agent-support, autonomous]
short: Project level and agent support definitions and interactions
parent: "speclang/semantic-definitions"
part: "2/2"
---
# Project Level and Agent Support Definitions

Part 2 of 2: Project maturity levels and agent support semantics.

## Project Level Criteria

```speclang
# @block:semantic-definitions/project-level-table @kind:table
| Level | Maturity | Team Size | Focus |
|-------|----------|-----------|-------|
| POC | Proof of Concept | 1-3 | Idea validation |
| MVP | Minimum Viable Product | 2-5 | Core functionality |
| Alpha | Internal Testing | 3-10 | Feature completion |
| Beta | External Testing | 5-20 | Stability |
| Production | Stable Production | 10+ | Reliability |
| Startup | Small Team Scale | <10 | Rapid iteration |
| SMB | Small/Medium Business | 10-100 | Process establishment |
| MSB | Medium/Large Business | 100-1000 | Compliance, integration |
| Enterprise | Maximum Scale | 1000+ | Governance, availability |
```

## Agent Support Behaviors

```speclang
# @block:semantic-definitions/agent-support-table @kind:table
| Level | Agent Permissions | Human Involvement | Use Case |
|-------|------------------|------------------|----------|
| human_only | Read-only, suggestions | Full control | Early brainstorming |
| agent_assisted | Write with approval | Review and approve | MVP development |
| agent_autonomous | Full read/write/deploy | Monitoring only | Production systems |
```

## Field Interactions Involving Project Level and Agent Support

```speclang
# @block:semantic-definitions/interactions-project-level @kind:entity
ProjectLevelInteractions:

  project_level_and_agent_support:
    - POC/MVP: Typically `human_only` or `agent_assisted`
    - Alpha/Beta: Typically `agent_assisted`
    - Production+: Can be `agent_autonomous`
    - Startup/SMB/MSB/Enterprise: Adjust autonomy based on maturity
```

## Validation Rules for Project Level and Agent Support

```speclang
# @block:semantic-definitions/validation-project-level @kind:entity
ProjectLevelValidation:

  cross_field_validation:
    - If `agent_support: agent_autonomous` then `project_level >= Beta` (warning)
    
  completeness_rules:
    - Specs with `project_level: Production` must have complete `depends_on`
    - Specs with `agent_support: agent_autonomous` must pass autonomous validation
```

## Agent Behavior Matrix

```speclang
# @block:semantic-definitions/behavior-matrix @kind:table
| Metadata Combination | Spec-Writer | Code-Gen | Test-Writer | Orchestrator |
|---------------------|-------------|----------|-------------|--------------|
| POC + human_only | Suggest only | No generation | No generation | Manual routing |
| MVP + agent_assisted | Propose edits | Draft code | Draft tests | Semi-auto routing |
| Beta + agent_assisted | Auto-expand | Generate with review | Generate with review | Auto-routing with oversight |
| Production + agent_autonomous | Full generation | Full generation | Full generation | Full auto-routing |
| Enterprise + agent_autonomous | Full generation with compliance | Full generation with compliance | Full generation with compliance | Full auto-routing with governance |
```

## Transition Examples for Team Growth

```speclang
# @block:semantic-definitions/transitions-team-growth @kind:note
How metadata evolves as a team grows:

**Team growth**:
1. Startup (Alpha, agent_assisted) → SMB (Beta, agent_assisted)
2. SMB → MSB (Production, agent_autonomous)
3. MSB → Enterprise (Production, agent_autonomous with governance)
```

## Implementation Guidance for Project Level and Agent Support

```speclang
# @block:semantic-definitions/implementation-project-level @kind:note
For tool implementers:

1. **Project level validation**: Verify criteria met (see project-maturity-levels)
2. **Agent support validation**: Apply autonomous validation rules when needed
3. **Cross-field validation**: Implement the validation rules above

All validation should be integrated into:
- Guard plugin (real-time)
- CI/CD pipelines
- Editor extensions
```

## References

```speclang
# @block:semantic-definitions/references-project-level @kind:refs
refs:
  - "@ref:speclang/project-maturity-levels
  - "@ref:speclang/agent-support-levels
  - "@ref:speclang/layer-definitions
  - "@ref:speclang/autonomous-validation
```