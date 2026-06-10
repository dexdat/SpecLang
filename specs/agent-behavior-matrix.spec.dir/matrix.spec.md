---
id: "@speclang/agent-behavior-matrix/matrix"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, behavior, matrix, autonomous]
short: Core behavior matrix definitions
parent: "@speclang/agent-behavior-matrix"
part: "1/2"
---
# Agent Behavior Matrix

Defines how each agent role should behave based on metadata fields.

## Overview

```speclang
# @block:behavior-matrix/overview @kind:note
Agents adjust their behavior based on three metadata fields:
1. `project_level` (POC → Enterprise)
2. `agent_support` (human_only → agent_autonomous)
3. `layer` (depth in tree)

This spec provides explicit rules for each combination, ensuring
consistent agent behavior across the project.
```

## Core Principles

```speclang
# @block:behavior-matrix/principles @kind:entity
Principles:
  
  autonomy_gradient:
    - Lower maturity (POC/MVP) → more human oversight
    - Higher maturity (Production+) → more autonomy
    
  safety_first:
    - When uncertain, ask for human help
    - When validation fails, stop and report
    - Never break the build
    
  progressive_enablement:
    - Start with human_only, progress to agent_autonomous
    - Each level unlocks new capabilities
    - Downgrade possible if failures occur
    
  role_specialization:
    - Each agent role (spec-writer, code-gen, etc.) has different rules
    - Roles respect file ownership boundaries
```

## Behavior by Project Level

### POC (Proof of Concept)

```speclang
# @block:behavior-matrix/poc @kind:entity
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

### MVP (Minimum Viable Product)

```speclang
# @block:behavior-matrix/mvp @kind:entity
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

### Alpha

```speclang
# @block:behavior-matrix/alpha @kind:entity
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

### Beta

```speclang
# @block:behavior-matrix/beta @kind:entity
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

### Production

```speclang
# @block:behavior-matrix/production @kind:entity
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

## Behavior by Agent Support Level

### human_only

```speclang
# @block:behavior-matrix/human-only @kind:entity
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

### agent_assisted

```speclang
# @block:behavior-matrix/agent-assisted @kind:entity
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

### agent_autonomous

```speclang
# @block:behavior-matrix/agent-autonomous @kind:entity
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

## Combined Matrix

```speclang
# @block:behavior-matrix/combined @kind:table
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
```
