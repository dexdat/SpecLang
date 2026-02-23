---
name: sip-103-transition-downgrade-speclang-v0
title: "SIP 103: Transition Downgrade Workflows"
version: 0.1.0
description: Procedures for downgrading specs when autonomy is revoked
category: standard
---

# SIP 103: Transition Downgrade Workflows

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines workflows for downgrading specs when they no longer meet autonomous requirements.

### Quick Start

**Downgrade Triggers:**
- Validation failures
- Security issues
- Test failures
- Human decision

### When to Read This

- Handling autonomous failures
- Planning rollback procedures
- Implementing downgrade automation
- Setting up safety nets

### Related SIPs

- SIP 19: Agent Support Levels
- SIP 99: Agent-Assisted
- SIP 100: Agent-autonomous
- SIP 101: Behavior Matrix
- SIP 102: Transition Upgrade

## Abstract

This SIP defines the procedures and triggers for downgrading specs from agent_autonomous to agent_assisted (or human_only). Downgrades are safety mechanisms that ensure human oversight when autonomous operation is no longer appropriate.

## Downgrade Triggers

### Automatic Triggers

```yaml
automatic_triggers:
  validation_failures:
    - "Reference resolution fails"
    - "Step-by-step missing for operations"
    - "Ambiguous language detected"
    - "Metadata incomplete"
    
  quality_failures:
    - "Test coverage drops below threshold"
    - "Test failures exceed limit"
    - "Code quality issues"
    
  runtime_failures:
    - "Production incidents"
    - "Security vulnerabilities"
    - "Data corruption"
```

### Manual Triggers

```yaml
manual_triggers:
  human_decision:
    - "Security audit failure"
    - "Compliance violation"
    - "Critical bug found"
    - "Architectural change needed"
    - "Deprecation of features"
    
  review_outcome:
    - "Human review rejects autonomy"
    - "External audit findings"
    - "Customer escalation"
```

### Warning Signs

```yaml
warning_signs:
  before_downgrade:
    - "Increased test failures"
    - "Validation warnings"
    - "Reference issues"
    - "Performance degradation"
    
  monitoring:
    - "Track failure rates"
    - "Monitor validation passes"
    - "Alert on anomalies"
```

## Downgrade Paths

### agent_autonomous → agent_assisted

```yaml
autonomous_to_assisted:
  description: "Reduce autonomy, require human approval"
  typical_trigger: "Validation issues or quality concerns"
  urgency: "Medium"
  
  changes:
    - "agent_support: agent_assisted"
    - "Human approval required for commits"
    - "Review all autonomous changes"
    
  procedure:
    1. "Identify trigger"
    2. "Document issue"
    3. "Update agent_support"
    4. "Notify stakeholders"
    5. "Fix underlying issue"
    6. "Plan re-upgrade"
```

### agent_autonomous → human_only

```yaml
autonomous_to_human:
  description: "Full revert to human control"
  typical_trigger: "Critical failure or security issue"
  urgency: "High"
  
  changes:
    - "agent_support: human_only"
    - "No agent code generation"
    - "Human does everything"
    
  procedure:
    1. "Immediate: disable autonomous agents"
    2. "Document critical issue"
    3. "Update agent_support"
    4. "Notify security team"
    5. "Root cause analysis"
    6. "Plan full remediation"
```

### agent_assisted → human_only

```yaml
assisted_to_human:
  description: "Remove agent assistance"
  typical_trigger: "Repeated quality issues or safety concerns"
  urgency: "Low-Medium"
  
  changes:
    - "agent_support: human_only"
    - "Agents can only read/suggest"
    
  procedure:
    1. "Document issues"
    2. "Update agent_support"
    3. "Retrain team on process"
    4. "Plan improvement"
```

## Downgrade Procedure

### Step-by-Step

```yaml
downgrade_procedure:
  step_1: "Detect trigger"
    - "Automated: validation tool detects issue"
    - "Manual: human identifies problem"
    
  step_2: "Assess severity"
    - "Critical: immediate full downgrade"
    - "Major: downgrade to assisted"
    - "Minor: warn first, downgrade if continues"
    
  step_3: "Document issue"
    - "What failed"
    - "When detected"
    - "Impact assessment"
    - "Recommended action"
    
  step_4: "Execute downgrade"
    - "Update agent_support field"
    - "Update index if needed"
    - "Notify stakeholders"
    
  step_5: "Preserve history"
    - "Keep previous versions"
    - "Log downgrade event"
    - "Document in spec"
    
  step_6: "Plan remediation"
    - "What needs fixing"
    - "Timeline"
    - "Who responsible"
```

### Emergency Downgrade

```yaml
emergency_downgrade:
  triggers:
    - "Security vulnerability"
    - "Data corruption"
    - "Production outage"
    
  immediate_actions:
    1. "Disable autonomous agents"
    2. "Block deployments"
    3. "Notify security team"
    4. "Document incident"
    
  follow_up:
    - "Root cause analysis"
    - "Fix critical issues"
    - "Re-evaluate autonomy"
    - "Plan re-upgrade if appropriate"
```

## Rollback vs Downgrade

### When Rollback (Not Downgrade)

```yaml
rollback_scenarios:
  - "Bad code commit (revert commit)"
  - "Failed deployment (revert deployment)"
  - "Broken test (revert test changes)"
  
  difference:
    - "Rollback: revert specific change"
    - "Downgrade: change autonomy level"
```

### Decision Matrix

```yaml
rollback_vs_downgrade:
  rollback_when:
    - "Single bad change"
    - "Known good previous state"
    - "Quick fix available"
    
  downgrade_when:
    - "Systemic issues"
    - "Validation persistently failing"
    - "Security concerns"
    - "Trust broken"
```

## Re-upgrade After Downgrade

### Requirements

```yaml
re_upgrade_requirements:
  from_assisted_to_autonomous:
    - "Original issue resolved"
    - "Validation passes"
    - "Human review approves"
    - "Monitoring in place"
    
  from_human_to_assisted:
    - "Issue fully understood"
    - "Process improvements made"
    - "Team trained"
    - "Monitoring enhanced"
```

### Waiting Period

```yaml
re_upgrade_waiting_period:
  after_downgrade_type:
    validation_failure: "24 hours"
    quality_failure: "1 week"
    security_issue: "1 month + security review"
    critical_incident: "Security review + approval"
```

### Documentation

```yaml
re_upgrade_documentation:
  required:
    - "Root cause of downgrade"
    - "Steps taken to fix"
    - "Validation proof"
    - "Human approval"
    
  optional:
    - "Timeline of issues"
    - "Team learnings"
    - "Process improvements"
```

## Safety Nets

### Prevention

```yaml
prevention_measures:
  validation_gates:
    - "Block autonomous if validation fails"
    - "Block autonomous if tests failing"
    - "Block autonomous if coverage low"
    
  monitoring:
    - "Track autonomous agent success rate"
    - "Alert on degradation"
    - "Auto-downgrade on thresholds"
```

### Human Override

```yaml
human_override:
  always_available:
    - "Human can disable autonomy anytime"
    - "No agent can prevent override"
    - "Override logged and audited"
    
  emergency:
    - "Kill switch for autonomous agents"
    - "Immediate deployment block"
    - "Direct human control"
```

## Downgrade Checklist

### For agent_autonomous → agent_assisted

```yaml
downgrade_checklist:
  immediate:
    - [ ] "Update agent_support to agent_assisted"
    - [ ] "Notify stakeholders"
    - [ ] "Document trigger"
    - [ ] "Preserve spec history"
    
  follow_up:
    - [ ] "Analyze root cause"
    - [ ] "Fix underlying issues"
    - [ ] "Update validation checks"
    - [ ] "Plan re-upgrade"
```

### For agent_autonomous → human_only

```yaml
emergency_downgrade_checklist:
  immediate:
    - [ ] "Disable autonomous agents"
    - [ ] "Block deployments"
    - [ ] "Update agent_support to human_only"
    - [ ] "Notify security team"
    - [ ] "Document incident"
    
  follow_up:
    - [ ] "Root cause analysis"
    - [ ] "Fix critical issues"
    - [ ] "Security review"
    - [ ] "Plan re-upgrade or permanent downgrade"
```

## Monitoring After Downgrade

### What to Watch

```yaml
post_downgrade_monitoring:
  track:
    - "Human action rates"
    - "Issue resolution time"
    - "Quality metrics"
    - "Team capacity"
    
  alerts:
    - "If issues not fixed within timeline"
    - "If new issues emerge"
    - "If team overwhelmed"
```

## Summary

| Downgrade | Trigger | Urgency | Action |
|-----------|---------|---------|--------|
| autonomous → assisted | Validation failures | Medium | Require approval |
| autonomous → human_only | Security/critical | High | Full human control |
| assisted → human_only | Quality issues | Low | No agent generation |

## References

- @ref:speclang/agent-support-levels
- @ref:speclang/agent-assisted
- @ref:speclang/agent-autonomous
- @ref:speclang/behavior-matrix
- SIP 19: Agent Support Levels
- SIP 102: Transition Upgrade

## Copyright

This document is in the public domain.
