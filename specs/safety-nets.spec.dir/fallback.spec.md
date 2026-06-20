# speclang-header lines:11
id: "@speclang/safety-nets/fallback"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [safety, validation, fallback, peer-review]
short: Peer review, fallback protocols, and implementation guidelines
parent: "@speclang/safety-nets"
part: 2/2
---
# Safety Nets: Fallback

Peer review hooks, fallback protocols, cascade prevention, implementation guidelines, and examples.

## Peer Review Hooks

```speclang
# @block:safety-nets/peer-review @kind:entity
PeerReview:
  
  when_review_required:
    - Spec newly labeled `agent_autonomous`
    - Completeness score < 0.7
    - Security-critical component
    - High-risk operation (data deletion, money transfer, etc.)
    - Breaking change to stable API
    
  review_process:
    1. System identifies need for review
    2. Assigns reviewers based on expertise
    3. Notifies reviewers via configured channels
    4. Reviewers examine spec and provide feedback
    5. Feedback incorporated, spec updated
    6. Reviewers approve or request changes
    
  integration:
    - GitHub PR integration
    - GitLab MR integration
    - Standalone review dashboard
    - Email/Slack notifications
    
  automation:
    - Auto-assign reviewers based on tags
    - Auto-merge after approvals
    - Escalation if no response within timeframe
```

## Fallback to Human Review

```speclang
# @block:safety-nets/fallback @kind:entity
FallbackProtocol:
  
  triggers:
    - Confidence score below threshold
    - Validation failure after multiple attempts
    - Test failure in generated code
    - Human manually triggers review
    - System detects anomalous pattern
    
  fallback_actions:
    1. Pause autonomous processing for this spec
    2. Notify human reviewers
    3. Downgrade `agent_support` to `agent_assisted`
    4. Add `needs_human_review` tag
    5. Create review ticket
    
  human_review_process:
    - Human examines spec for deficiencies
    - Human provides specific feedback
    - Spec updated based on feedback
    - Human re-evaluates confidence
    - If satisfactory, restore `agent_autonomous`
    
  automation:
    - Automatic ticket creation in issue tracker
    - Assignment based on workload
    - SLA tracking for review time
```

## Cascading Failure Prevention

```speclang
# @block:safety-nets/cascade-prevention @kind:entity
CascadePrevention:
  
  problem: "One mislabeled spec triggers agents to generate bad code, which creates more bad specs"
  
  prevention_mechanisms:
    1. **Validation gates**: Each cascade step requires validation
    2. **Quarantine**: Specs with low confidence are isolated
    3. **Rate limiting**: Limit number of cascades from low-confidence specs
    4. **Human checkpoints**: Require human approval after N cascade steps
    
  quarantine_protocol:
    - Specs with confidence < 0.6 are quarantined
    - Quarantined specs cannot trigger cascades
    - Quarantined specs require human review to exit quarantine
    
  rate_limiting:
    - Each spec has a cascade budget
    - Low confidence specs have smaller budget
    - Budget resets over time or with human approval
```

## Implementation Guidelines

```speclang
# @block:safety-nets/implementation @kind:entity
Implementation:
  
  phased_rollout:
    Phase 1: Automated analysis only (scoring)
    Phase 2: Confidence scoring with warnings
    Phase 3: Peer review hooks for critical specs
    Phase 4: Full fallback protocols
    
  tools_needed:
    - Completeness analyzer
    - Confidence scoring engine
    - Review workflow system
    - Monitoring dashboard
    
  integration_points:
    - Validation pipeline (pre-cascade)
    - Guard plugin (real-time)
    - CI/CD pipeline (post-generation)
    - Agent orchestrator (routing decisions)
```

## Example Scenarios

### Scenario 1: Mislabeled Spec Detection

```speclang
# @block:safety-nets/example-mislabeling @kind:code
```yaml
spec: "@specs/payment/process"
metadata:
  project_level: Beta
  agent_support: agent_autonomous
  layer: 3
  
analysis:
  step_by_step_coverage: 0.3 (poor)
  reference_resolution: 0.8 (good)
  ambiguity_score: 0.4 (high ambiguity)
  overall_confidence: 0.5 (low)
  
actions:
  - detected_mislabeling: true
  - auto_downgraded: agent_assisted
  - created_review_ticket: #123
  - notified_author: "Spec lacks step-by-step details"
```
```

### Scenario 2: Successful Safety Net Intervention

```speclang
# @block:safety-nets/example-intervention @kind:code
```yaml
spec: "@specs/auth/login"
metadata:
  project_level: Production
  agent_support: agent_autonomous
  
monitoring:
  - test_failure_rate: 15% (above threshold)
  - confidence_score: 0.6 (dropping)
  
safety_net_actions:
  - triggered_fallback: true
  - paused_autonomous_processing: true
  - assigned_human_review: @alice
  - created_incident: #INC-042
  
outcome:
  - human_found: missing error handling steps
  - spec_updated: added step-by-step error handling
  - confidence_restored: 0.85
  - autonomous_processing_resumed: true
```
```

## References

```speclang
# @block:safety-nets/references @kind:refs
refs:
  - "@ref:speclang/autonomous-validation"
  - "@ref:speclang/transition-workflows"
  - "@ref:speclang/agent-behavior-matrix"
  - "@ref:speclang/agent-support-levels"
```