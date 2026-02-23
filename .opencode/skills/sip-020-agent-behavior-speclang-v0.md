---
name: sip-020-agent-behavior-speclang-v0
title: "SIP 20: Agent Behavior Matrix"
version: 0.1.0
description: Behavior rules for each project_level × agent_support combination
category: standard
---

# SIP 20: Agent Behavior Matrix

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines how agent roles behave based on metadata combinations.

### Quick Start

Agents adjust behavior based on:
1. `project_level` (POC → Enterprise)
2. `agent_support` (human_only → agent_autonomous)
3. `layer` (0-10)

### When to Read This

- **Building agents:** Implementing agent behavior rules
- **Understanding expectations:** What agents can/cannot do
- **Debugging:** Why an agent acted a certain way

### Related SIPs

- SIP 19: Agent Support Levels
- SIP 21: Semantic Definitions
- SIP 23: Safety Nets

## Abstract

This SIP provides explicit rules for how agent roles should behave based on metadata fields. The behavior matrix combines project maturity level and agent support level to determine appropriate autonomy, ensuring consistent and safe agent behavior across all projects.

## Motivation

Without explicit behavior rules:
- Agents may act too aggressively on immature specs
- Agents may be too cautious on production-ready specs
- Behavior is inconsistent across agents and projects

A behavior matrix solves this by codifying expectations.

## Rationale

**Core Principles:**

1. **Autonomy Gradient**: Lower maturity → more human oversight
2. **Safety First**: When uncertain, ask for human help
3. **Progressive Enablement**: Start human_only, progress to autonomous
4. **Role Specialization**: Each role has different rules

## Specification

### Agent Roles

```yaml
agent_roles:
  spec_writer:
    responsibility: "Read, write, expand spec files"
    owns: "specs/**/*.spec.*"
    
  code_gen:
    responsibility: "Generate code from specs"
    owns: "generated/**/*"
    
  test_writer:
    responsibility: "Generate and run tests"
    owns: "tests/**/*"
    
  orchestrator:
    responsibility: "Route work to appropriate agents"
    owns: ".speclang/sessions/*"
```

### Behavior by Project Level

#### POC (Proof of Concept)

```yaml
POCBehavior:
  spec_writer:
    - Read-only access to existing specs
    - Suggest edits via comments
    - No automatic spec generation
    
  code_gen:
    - No code generation
    - Can suggest code snippets
    - Must get human approval for any generation
    
  test_writer:
    - No test generation
    - Suggest test cases
    
  orchestrator:
    - Manual routing of all changes
    - Human makes all decisions
    
  human_involvement: "Full control"
```

#### MVP (Minimum Viable Product)

```yaml
MVPBehavior:
  spec_writer:
    - Can propose spec edits
    - Requires human approval before writing
    - Can expand high-level specs to layer 2-3
    
  code_gen:
    - Generate draft code for review
    - Cannot commit without approval
    - Focus on core functionality only
    
  test_writer:
    - Write basic test specs for review
    - Generate simple test code
    
  orchestrator:
    - Semi-automatic routing
    - Human approves routing decisions
    
  human_involvement: "Review and approve all changes"
```

#### Alpha

```yaml
AlphaBehavior:
  spec_writer:
    - Auto-expand specs from layer 1→3
    - Human review for major changes
    - Autonomous for minor clarifications
    
  code_gen:
    - Generate code for non-critical components
    - Human review for critical paths
    - Can commit with approval
    
  test_writer:
    - Generate comprehensive test specs
    - Human review for integration tests
    
  orchestrator:
    - Automatic routing with oversight
    - Human can override
    
  human_involvement: "Review major changes, monitor minor"
```

#### Beta

```yaml
BetaBehavior:
  spec_writer:
    - Full spec generation for layer 3-5
    - Human review only for breaking changes
    - Autonomous updates for non-breaking
    
  code_gen:
    - Generate and commit code automatically
    - Human review for security-critical code
    - Run tests before commit
    
  test_writer:
    - Generate and run tests automatically
    - Human review for performance tests
    
  orchestrator:
    - Full automatic routing
    - Human monitoring only
    
  human_involvement: "Monitoring and emergency override"
```

#### Production

```yaml
ProductionBehavior:
  spec_writer:
    - Full autonomous spec generation
    - Self-healing on validation failures
    - Human only for strategic changes
    
  code_gen:
    - Full autonomous code generation
    - Automatic testing and deployment
    - Rollback on failure
    
  test_writer:
    - Full autonomous test generation
    - Continuous test optimization
    
  orchestrator:
    - Fully autonomous routing
    - Predictive load balancing
    
  human_involvement: "Strategic direction only"
```

### Behavior by Agent Support Level

#### human_only

```yaml
HumanOnlyBehavior:
  all_roles:
    - Read-only access
    - Can make suggestions
    - Cannot write files
    - Cannot trigger cascades
    
  human_role:
    - Full control over all operations
    - Manual execution of all steps
    - No agent automation
```

#### agent_assisted

```yaml
AgentAssistedBehavior:
  spec_writer:
    - Propose spec edits
    - Require approval before write
    - Can auto-expand with permission
    
  code_gen:
    - Generate draft code
    - Require review before commit
    - Can run tests for validation
    
  test_writer:
    - Propose test specs
    - Require approval
    
  orchestrator:
    - Suggest routing
    - Human makes final decision
    
  approval_workflow:
    - All changes go through human review
    - Human can approve, reject, or modify
```

#### agent_autonomous

```yaml
AgentAutonomousBehavior:
  spec_writer:
    - Full write access to owned specs
    - Auto-split large specs
    - Self-correct validation errors
    
  code_gen:
    - Generate and commit code
    - Run tests automatically
    - Rollback on test failure
    
  test_writer:
    - Generate and run tests
    - Report coverage metrics
    
  orchestrator:
    - Automatic routing
    - Load balancing
    - Failure recovery
    
  safety_mechanisms:
    - Validation before write
    - Tests before commit
    - Rollback on failure
    - Human alert on critical failures
```

### Combined Matrix

| project_level | agent_support | Spec-Writer | Code-Gen | Test-Writer | Orchestrator |
|---------------|---------------|-------------|----------|-------------|--------------|
| POC | human_only | Suggest only | No generation | No generation | Manual routing |
| POC | agent_assisted | Propose edits | Draft code (review) | Draft tests (review) | Semi-auto routing |
| MVP | agent_assisted | Expand specs (review) | Generate core (review) | Basic tests (review) | Semi-auto routing |
| Alpha | agent_assisted | Auto-expand (major review) | Generate non-critical | Comprehensive tests | Auto-routing with oversight |
| Beta | agent_assisted | Full generation (breaking review) | Generate & commit (security review) | Generate & run tests | Full auto-routing |
| Beta | agent_autonomous | Full autonomous generation | Full autonomous generation | Full autonomous generation | Full autonomous routing |
| Production | agent_autonomous | Full autonomous + self-healing | Full autonomous + rollback | Full autonomous + optimization | Fully autonomous + predictive |
| Enterprise | agent_autonomous | Full autonomous + compliance | Full autonomous + compliance | Full autonomous + compliance | Fully autonomous + governance |

### Mixed Maturity Handling

```yaml
MixedMaturity:
  scenario: "Some specs Alpha, others Beta, others Production"
  
  handling_rules:
    1_lowest_common_denominator: "When interacting with lower maturity specs, use their rules"
    2_upgrade_path: "Agents can propose upgrading lower maturity specs"
    3_isolation: "Higher maturity agents can operate autonomously within their domain"
    4_integration_points: "Human review required when crossing maturity boundaries"
    
  examples:
    - "Beta spec depends on Alpha spec → agent uses Alpha rules for that dependency"
    - "Production spec depends on Beta spec → agent uses Beta rules for that dependency"
    - "Autonomous agent working on Alpha spec → uses agent_assisted behavior"
```

### Fallback Protocols

```yaml
FallbackProtocols:
  when_to_fallback:
    - Validation failures (spec format, references)
    - Test failures
    - Compilation errors
    - Resource exhaustion
    - Timeout
    - Human intervention request
    
  fallback_actions:
    1: "Stop current operation"
    2: "Rollback any partial changes"
    3: "Notify human with error details"
    4: "Suggest fixes"
    5: "Wait for human response"
    
  escalation_path:
    - "First fallback: retry with simpler approach"
    - "Second fallback: downgrade agent_support level"
    - "Third fallback: human takeover"
```

### Resource Allocation

```yaml
ResourceAllocation:
  by_project_level:
    POC: "Minimal resources (light validation, no heavy processing)"
    MVP: "Basic resources (core generation, simple tests)"
    Alpha: "Moderate resources (full generation, comprehensive tests)"
    Beta: "Substantial resources (optimization, performance tests)"
    Production: "Full resources (everything needed)"
    Enterprise: "Maximum resources (compliance checks, security scans)"
    
  by_agent_support:
    human_only: "No computational resources allocated"
    agent_assisted: "Limited resources (budgeted)"
    agent_autonomous: "Full resources as needed"
```

## Implementation Guidelines

1. **Read metadata first**: Check `project_level`, `agent_support`, `layer` before acting
2. **Apply appropriate rules**: Use the matrix to determine behavior
3. **Respect boundaries**: Don't exceed permissions for given level
4. **Implement fallbacks**: Always have a safe fallback path
5. **Log decisions**: Record which rules were applied for audit

## References

- @ref:speclang/agent-behavior-matrix
- @ref:speclang/agent-support-levels
- @ref:speclang/semantic-definitions
- SIP 19: Agent Support Levels
- SIP 23: Safety Nets

## Copyright

This document is in the public domain.
