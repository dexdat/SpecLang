# speclang-header lines:11
id: "@speclang/agent-support-levels/levels"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, support, levels, definitions]
short: "Definitions of human_only, agent_assisted, and agent_autonomous levels"
parent: "speclang/agent-support-levels"

---
# Agent Support Levels - Definitions

Clear definitions for the `agent_support` field (human_only → agent_autonomous).

## Overview

```speclang
# @block:agent-support/overview @kind:note
The `agent_support` field indicates the readiness of a spec for autonomous agent operation.
It tells agents how much they can rely on the spec content without human intervention.

Three levels:
1. **human_only**: Spec requires human interpretation and execution
2. **agent_assisted**: Agents can help but need human review/approval
3. **agent_autonomous**: Agents can fully operate based on spec content

This field works with `project_level` and `layer` to determine agent behavior.
```

## Level Definitions

```speclang
# @block:agent-support/definitions @kind:table
| Level | Name | Description | Agent Permissions | Human Involvement |
|-------|------|-------------|-------------------|-------------------|
| human_only | Human Only | Spec requires human interpretation | Read-only access<br>No modifications<br>Suggestions only | Full control<br>All decisions human-made |
| agent_assisted | Agent Assisted | Agents can help with human oversight | Read/write with approval<br>Generate code with review<br>Propose changes | Review and approve<br>Provide guidance<br>Make final decisions |
| agent_autonomous | Agent Autonomous | Agents can fully operate autonomously | Full read/write<br>Generate and deploy<br>Self-correct | Monitoring only<br>Emergency override<br>Post-hoc review |
```

## human_only

```speclang
# @block:agent-support/human-only @kind:entity
HumanOnly:
  purpose: "Spec requires human interpretation and execution"
  spec_characteristics:
    - Vague or ambiguous language
    - Missing step-by-step instructions
    - Unresolved references
    - High-level intent only
  agent_permissions:
    - Can read spec content
    - Can suggest improvements
    - Cannot modify spec directly
    - Cannot generate code from spec
  human_responsibilities:
    - Interpret spec intent
    - Write implementation details
    - Make all decisions
    - Review all outputs
  validation_requirements:
    - No validation required (human judgment)
  example_use_cases:
    - Early brainstorming documents
    - High-level architecture sketches
    - Legacy documentation
```

## agent_assisted

```speclang
# @block:agent-support/agent-assisted @kind:entity
AgentAssisted:
  purpose: "Agents can help but need human review/approval"
  spec_characteristics:
    - Clear requirements but missing details
    - Some step-by-step instructions
    - Most references resolved
    - Some ambiguous language remains
  agent_permissions:
    - Can propose spec edits
    - Can generate draft code
    - Can run tests and report results
    - Cannot commit changes without approval
  human_responsibilities:
    - Review agent proposals
    - Approve or reject changes
    - Provide clarification when needed
    - Make final decisions on critical items
  validation_requirements:
    - Basic validation (header format, reference existence)
    - Human review required before cascade
  example_use_cases:
    - MVP stage projects
    - Complex features needing human expertise
    - Security-critical components
```

## agent_autonomous

```speclang
# @block:agent-support/agent-autonomous @kind:entity
AgentAutonomous:
  purpose: "Agents can fully operate based on spec content"
  spec_characteristics:
    - Complete step-by-step descriptions
    - All references resolve to existing blocks
    - No ambiguous natural language
    - All required metadata fields present
  agent_permissions:
    - Full read/write access to spec
    - Generate and commit code
    - Run tests and deploy
    - Self-correct errors
    - Create new specs as needed
  human_responsibilities:
    - Monitor system health
    - Emergency override if needed
    - Post-hoc review of changes
    - Set high-level goals
  validation_requirements:
    - Strict validation (complete step-by-step, resolved references, etc.)
    - Automated checks before cascade
    - No human review required for routine changes
  example_use_cases:
    - Production-ready systems
    - Well-defined components
    - Repetitive code generation tasks
```

## Validation Requirements

```speclang
# @block:agent-support/validation @kind:entity
AgentSupportValidation:
  human_only:
    - No validation required
    
  agent_assisted:
    - Header must be valid
    - References must exist (warnings allowed)
    - No syntax errors
    - Human review flag set
    
  agent_autonomous:
    - Header complete with all required fields
    - All operations have step-by-step descriptions
    - All `@ref:` references resolve to existing blocks
    - No ambiguous natural language in critical sections
    - All dependencies explicitly declared
    - Layer value appropriate for content
    - Project_level criteria met
    
  validation_tools:
    - Automated scanner for `agent_autonomous` specs
    - Reference resolution checker
    - Step-by-step completeness analyzer
    - Ambiguity detector
```