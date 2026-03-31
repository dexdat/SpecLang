# speclang-header lines:9
id: "@specs/transition"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [transition, workflow, maturity, upgrade, downgrade, safety]
short: Transition workflows for moving specs between maturity and agent support levels
---
# Transition Workflows

Comprehensive system for moving specs between project maturity levels (POC → MVP → Alpha → Beta → Production) and agent support levels (human_only → agent_assisted → agent_autonomous).

## Overview

```speclang
# @block:transition/overview @kind:note
Transition workflows ensure safe, audited movement of specs between levels.
Each transition direction has its own checklist, validation gates, and safety mechanisms.

Key principles:
- **Safety first**: No transition without validation
- **Audit trail**: All transitions logged with approvals
- **Rollback ready**: Every upgrade has a downgrade path
- **Agent aware**: Transitions affect agent behavior immediately
```

## Transition Types

```speclang
# @block:transition/types @kind:entity
TransitionTypes:
  
  project_level_transitions:
    - POC → MVP
    - MVP → Alpha
    - Alpha → Beta
    - Beta → Production
    - Production → Enterprise (scale change)
    
  agent_support_transitions:
    - human_only → agent_assisted
    - agent_assisted → agent_autonomous
    
  combined_transitions:
    - Often happen together (Alpha + agent_assisted → Beta + agent_autonomous)
    - Can happen separately
    - Must maintain consistency
```

## Core Components

```speclang
# @block:transition/components @kind:entity
Components:
  
  upgrade_workflow:
    - Defined in @ref:speclang/transition-workflows/upgrade
    - Upgrade planner
    - Upgrade validator
    - Upgrade executor
    - Upgrade rollback
    
  downgrade_workflow:
    - Defined in @ref:speclang/transition-workflows/downgrade
    - Downgrade triggers
    - Rollback procedures
    - Emergency workflows
    
  safety_system:
    - Pre-transition validation gates
    - Post-transition verification
    - Monitoring integration
    - Alerting on regression
    
  registry:
    - Workflow registry
    - Transition history
    - Approval tracking
    - Audit logging
```

## Safety Checks

```speclang
# @block:transition/safety-checks @kind:entity
SafetyChecks:
  
  pre_transition:
    - All dependencies at same or higher level
    - No open validation errors
    - Tests pass at current level
    - Documentation complete
    - Human review completed (if required)
    
  during_transition:
    - No concurrent modifications
    - Lock on spec being transitioned
    - Validation gates pass sequentially
    - Approvals collected and verified
    
  post_transition:
    - Spec integrity verified
    - Tests pass at new level
    - References still resolve
    - Agent behavior adjusted
    - Monitoring confirms stability
    
  emergency_procedures:
    - Automatic rollback on validation failure
    - Manual override with elevated permissions
    - Post-mortem required for emergency downgrades
    - Communication plan for stakeholders
```

## Validation Gates

```speclang
# @block:transition/validation-gates @kind:entity
ValidationGates:
  
  gate_implementation:
    - Pre-transition validation script
    - Integrated into CI/CD pipeline
    - Blocks transition if checks fail
    - Produces detailed reports
    
  checks_per_level:
    - POC → MVP: Basic validation only
    - MVP → Alpha: Reference resolution, basic tests
    - Alpha → Beta: Step-by-step validation, comprehensive tests
    - Beta → Production: Autonomous validation, security tests
    - human_only → agent_assisted: Agent understanding check
    - agent_assisted → agent_autonomous: Full autonomous validation
    
  gate_configuration:
    - Each gate configurable per project
    - Gates can be bypassed with manual approval (audited)
    - Gates produce detailed reports
```

## Workflow Orchestration

```speclang
# @block:transition/orchestration @kind:entity
Orchestration:
  
  initiator:
    - Human product owner
    - Automated system (when criteria met)
    - Agent suggestion (with human approval)
    
  workflow_steps:
    1. Initiate transition request
    2. Run pre-transition validation
    3. If validation passes, proceed to approval
    4. Gather required approvals
    5. Execute transition (update metadata, run migrations)
    6. Run post-transition validation
    7. Monitor for issues
    8. Complete transition (update status)
    
  tools:
    - Transition management dashboard
    - Automated validation pipeline
    - Approval workflow system
    - Audit logging
```

## Integration Points

```speclang
# @block:transition/integration @kind:entity
Integration:
  
  with_agent_behavior_matrix:
    - After transition, agents immediately adopt new behavior rules
    - Transition may trigger agent role changes
    - Resource allocation updated automatically
    
  with_monitoring:
    - Monitor agent behavior after transition
    - Alert if agents not following new rules
    - Adjust as needed
    
  with_pipeline:
    - Pipeline stages updated based on new maturity level
    - Test suites expanded/contracted
    - Deployment targets adjusted
    
  with_documentation:
    - Documentation regenerated with new maturity level
    - Examples updated
    - Tutorials adjusted
```

## CLI Commands

```speclang
# @block:transition/cli-commands @kind:entity
CLICommands:
  
  upgrade:
    - `speclang upgrade <spec> --to <level>`: Upgrade spec to target level
    - `speclang upgrade --check <spec>`: Check if spec can be upgraded
    - `speclang upgrade --plan <spec>`: Show upgrade plan without executing
    
  downgrade:
    - `speclang downgrade <spec> --to <level>`: Downgrade spec to target level
    - `speclang downgrade --emergency <spec>`: Emergency downgrade with bypass
    - `speclang downgrade --rollback <spec>`: Rollback last transition
    
  status:
    - `speclang transition-status <spec>`: Show transition history
    - `speclang transition-pending`: List pending transitions
    - `speclang transition-approve <id>`: Approve pending transition
```

## Examples

### Example: Alpha → Beta Transition

```speclang
# @block:transition/example-alpha-beta @kind:code
```yaml
# Transition request
transition:
  spec: @specs/auth
  from: { project_level: Alpha, agent_support: agent_assisted }
  to: { project_level: Beta, agent_support: agent_autonomous }
  
# Validation results
validation:
  step_by_step: PASS
  references: PASS (all 42 references resolved)
  ambiguity: PASS (no ambiguous language)
  tests: PASS (324 tests, 89% coverage)
  
# Approvals
approvals:
  - product_owner: approved
  - security: approved
  - qa: approved
  
# Execution
execution:
  metadata_updated: true
  artifacts_generated: true
  post_validation: PASS
  
# Completion
completion:
  timestamp: 2024-03-15T10:30:00Z
  status: successful
```
```

## References
## Registry Interface

```speclang
# @block:transition/registry @kind:interface
interface TransitionRegistry {
  registerUpgrade(workflow: UpgradeWorkflow): void;
  registerDowngrade(workflow: DowngradeWorkflow): void;
  getWorkflow(type: 'upgrade' | 'downgrade', fromLevel: string, toLevel: string): Workflow | null;
  listWorkflows(): Workflow[];
}

# @block:transition/workflow-types @kind:interface
interface Workflow {
  type: 'upgrade' | 'downgrade';
  fromLevel: string;
  toLevel: string;
  execute(): Promise<void>;
}

interface UpgradeWorkflow extends Workflow {
  type: 'upgrade';
}

interface DowngradeWorkflow extends Workflow {
  type: 'downgrade';
}

# @block:transition/registry-impl @kind:class
class TransitionRegistryImpl implements TransitionRegistry {
  private workflows: Map<string, Workflow> = new Map();

  registerUpgrade(workflow: UpgradeWorkflow): void {
    const key = `upgrade:${workflow.fromLevel}:${workflow.toLevel}`;
    this.workflows.set(key, workflow);
  }

  registerDowngrade(workflow: DowngradeWorkflow): void {
    const key = `downgrade:${workflow.fromLevel}:${workflow.toLevel}`;
    this.workflows.set(key, workflow);
  }

  getWorkflow(type: 'upgrade' | 'downgrade', fromLevel: string, toLevel: string): Workflow | null {
    const key = `${type}:${fromLevel}:${toLevel}`;
    return this.workflows.get(key) || null;
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}
```

```speclang
# @block:transition/references @kind:refs
refs:
  - "@ref:speclang/project-maturity-levels
  - "@ref:speclang/agent-support-levels
  - "@ref:speclang/autonomous-validation
  - "@ref:speclang/agent-behavior-matrix
  - "@ref:speclang/transition-workflows/upgrade
  - "@ref:speclang/transition-workflows/downgrade
```

## Maintenance Notes

This spec serves as the top-level overview of transition workflows.
Detailed procedures are in the sub‑specifications referenced above.

**Last updated**: 2026‑03‑31
**Status**: Active
**Next review**: 2026‑04‑30