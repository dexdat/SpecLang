# speclang-header lines:10
id: "@speclang/agent-support-levels/behaviors"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, support, behaviors, transitions, integration]
short: Agent behavior matrix, transition guidelines, and integration with metadata
parent: "@speclang/agent-support-levels"
part: 2/2
---
# Agent Support Levels - Behaviors

How agents behave at each support level, transition guidelines, and integration with other metadata.

## Agent Behavior Matrix

```speclang
# @block:agent-support/behavior-matrix @kind:table
| Agent Role | human_only | agent_assisted | agent_autonomous |
|------------|------------|----------------|------------------|
| Spec-Writer | Read only<br>Suggest edits | Propose changes<br>Require approval | Full generation<br>Auto-split large specs |
| Code-Gen | No code generation | Generate draft code<br>Require review | Generate and commit<br>Auto-test |
| Test-Writer | No test generation | Write test specs<br>Require review | Full test generation<br>Auto-run tests |
| North-Star | Human only updates | Assist with ref updates | Update project.scl references |
| Orchestrator | Manual routing | Semi-automatic routing | Full automatic routing |
```

## Transition Guidelines

```speclang
# @block:agent-support/transitions @kind:note
Moving between agent_support levels:

**human_only → agent_assisted**:
1. Add step-by-step descriptions for key operations
2. Resolve critical references
3. Set `agent_support: agent_assisted`
4. Human review and approval

**agent_assisted → agent_autonomous**:
1. Ensure all operations have step-by-step descriptions
2. Resolve ALL references
3. Eliminate ambiguous language
4. Complete all required metadata fields
5. Run autonomous validation tool
6. Set `agent_support: agent_autonomous`
7. Monitor initial autonomous operations

**agent_autonomous → agent_assisted** (downgrade):
1. Triggered by validation failures
2. Human intervention required
3. Update `agent_support` field
4. Add human review requirements
```

## Integration with Other Metadata

```speclang
# @block:agent-support/integration @kind:entity
Integration:
  with_project_level:
    - POC/MVP: Typically `human_only` or `agent_assisted`
    - Alpha/Beta: Typically `agent_assisted`
    - Production+: Can be `agent_autonomous`
    
  with_layer:
    - Layer 0-2: Often `agent_assisted` (high-level intent)
    - Layer 3-5: Often `agent_autonomous` (detailed specs)
    - Layer 6-10: Typically `agent_autonomous` (generated artifacts)
    
  combined_behavior:
    - `project_level: POC` + `agent_support: agent_autonomous` = Invalid (warning)
    - `project_level: Production` + `agent_support: human_only` = Inefficient (warning)
    - `layer: 0` + `agent_support: agent_autonomous` = Possible but rare
```

## References

```speclang
# @block:agent-support/references @kind:refs
refs:
  - "@ref:speclang/headers#agent_support"
  - "@ref:speclang/layer-definitions"
  - "@ref:speclang/project-maturity-levels"
  - "@ref:speclang/autonomous-validation"
```