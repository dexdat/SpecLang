---
id: "@speclang/agent-behavior-matrix/transitions"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, behavior, transitions, autonomous]
short: Transition workflows and fallback protocols
parent: "@speclang/agent-behavior-matrix"
part: "2/2"
---
## Mixed Maturity Handling

```speclang
# @block:behavior-matrix/mixed-maturity @kind:entity
MixedMaturity:
  
  scenario: "Some specs Alpha, others Beta, others Production"
  
  handling_rules:
    1. **Lowest common denominator**: When interacting with lower maturity specs, use their rules
    2. **Upgrade path**: Agents can propose upgrading lower maturity specs
    3. **Isolation**: Higher maturity agents can operate autonomously within their domain
    4. **Integration points**: Human review required when crossing maturity boundaries
    
  example:
    - Beta spec depends on Alpha spec → agent uses Alpha rules for that dependency
    - Production spec depends on Beta spec → agent uses Beta rules for that dependency
    - Autonomous agent working on Alpha spec → uses agent_assisted behavior
```

## Fallback Protocols

```speclang
# @block:behavior-matrix/fallback @kind:entity
FallbackProtocols:
  
  when_to_fallback:
    - Validation failures (spec format, references)
    - Test failures
    - Compilation errors
    - Resource exhaustion
    - Timeout
    - Human intervention request
    
  fallback_actions:
    1. Stop current operation
    2. Rollback any partial changes
    3. Notify human with error details
    4. Suggest fixes
    5. Wait for human response
    
  escalation_path:
    - First fallback: retry with simpler approach
    - Second fallback: downgrade agent_support level
    - Third fallback: human takeover
```

## Resource Allocation Rules

```speclang
# @block:behavior-matrix/resources @kind:entity
ResourceAllocation:
  
  by_project_level:
    - POC: Minimal resources (light validation, no heavy processing)
    - MVP: Basic resources (core generation, simple tests)
    - Alpha: Moderate resources (full generation, comprehensive tests)
    - Beta: Substantial resources (optimization, performance tests)
    - Production: Full resources (everything needed)
    - Enterprise: Maximum resources (compliance checks, security scans)
  
  by_agent_support:
    - human_only: No computational resources allocated
    - agent_assisted: Limited resources (budgeted)
    - agent_autonomous: Full resources as needed
  
  budgeting:
    - Each agent session has resource budget
    - Budget increases with project_level
    - Exceeding budget triggers fallback
```

## Implementation Guidelines

```speclang
# @block:behavior-matrix/implementation @kind:note
For agent implementers:

1. **Read metadata first**: Check `project_level`, `agent_support`, `layer` before acting
2. **Apply appropriate rules**: Use the matrix to determine behavior
3. **Respect boundaries**: Don't exceed permissions for given level
4. **Implement fallbacks**: Always have a safe fallback path
5. **Log decisions**: Record which rules were applied for audit

Integration points:
- Guard plugin enforces behavior rules
- Orchestrator routes based on metadata
- Validation system checks compliance
```

## References

```speclang
# @block:behavior-matrix/references @kind:refs
refs:
  - "@ref:speclang/project-maturity-levels
  - "@ref:speclang/agent-support-levels
  - "@ref:speclang/semantic-definitions
  - "@ref:speclang/autonomous-validation
```