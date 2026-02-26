---
name: sip-027-recovery-speclang-v0
title: "SIP 27: Recovery System"
version: 0.1.0
description: Self-healing, automatic rollback, and notification when things go wrong
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 27: Recovery System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines how SpecLang recovers from failures—automatic rollback, notification, and self-healing.

### Quick Start

Recovery mechanisms:
1. **Failure detection**: Build fails, tests fail, agent timeout
2. **Rollback**: Revert spec changes
3. **Notification**: Alert orchestrator/user
4. **Self-healing**: Attempt automatic fix
5. **Manual intervention**: Human steps in

### When to Read This

- **Handling failures:** Understanding recovery flow
- **Configuring recovery:** Setting retry/rollback policies
- **Building resilient systems:** Error handling patterns

### Related SIPs

- SIP 13: Pipeline System
- SIP 14: Guard Plugin
- SIP 23: Safety Nets
- SIP 28: Cascade Protocol

## Abstract

This SIP defines SpecLang's Recovery System—a comprehensive framework for handling failures during cascade operations. The system provides automatic rollback, notification, retry strategies, and self-healing capabilities to maintain spec-code consistency even when errors occur.

## Motivation

In a reactive cascade, failures can cascade:
- Bad spec → Bad code → More bad specs
- Build failure stops the cascade
- Tests fail but code is already generated
- Agents timeout and leave locks

A robust recovery system prevents cascading failures.

## Rationale

**Defense in Depth:**

1. **Detect**: Identify failures early
2. **Isolate**: Prevent spread
3. **Recover**: Automatic healing when possible
4. **Notify**: Human intervention when needed
5. **Learn**: Update confidence scores

This matches production incident management practices.

## Specification

### Failure Types

```yaml
FailureTypes:
  build_fail:
    cause: "Code doesn't compile"
    severity: high
    recovery: "Rollback spec, notify, show error"
    
  test_fail:
    cause: "Tests don't pass"
    severity: medium
    recovery: "Rollback spec, notify, show diff"
    
  agent_timeout:
    cause: "Agent didn't respond in time"
    severity: medium
    recovery: "Kill session, retry with backoff"
    
  lock_conflict:
    cause: "Two agents want same file"
    severity: low
    recovery: "Serialize, first-come-first-serve"
    
  spec_invalid:
    cause: "Spec has syntax errors"
    severity: high
    recovery: "Notify orchestrator, block cascade"
    
  ref_broken:
    cause: "@ref points to non-existent block"
    severity: medium
    recovery: "Notify, require manual fix"
    
  cascade_depth:
    cause: "Cascade exceeded max depth"
    severity: high
    recovery: "Pause cascade, notify user"
```

### Rollback System

```yaml
Rollback:
  what_is_rollbacked:
    - "Spec file changes"
    - "Generated code changes"
    - "Test file changes"
    
  what_is_preserved:
    - "Error logs"
    - "Cascade state"
    - "Notification history"
    
  checkpoints:
    when_created:
      - "Before each cascade"
      - "Before each pipeline run"
      - "After successful convergence"
      
    checkpoint_data:
      - "Spec file hashes"
      - "Generated file hashes"
      - "Agent session states"
      - "Lock states"
      
  process:
    1: "Identify last good checkpoint"
    2: "Verify checkpoint integrity"
    3: "Restore file states"
    4: "Clear agent locks"
    5: "Log rollback event"
    6: "Notify orchestrator"
    
  rollback_file: |
    # .speclang/checkpoints/cascade-001.json
    {
      "cascade_id": "cascade-001",
      "timestamp": "2024-01-15T10:00:00Z",
      "files": {
        "specs/auth.spec.md": "sha256:abc123",
        "src/auth/handler.ts": "sha256:def456"
      },
      "status": "pre_cascade"
    }
```

### Notification System

```yaml
Notification:
  target: "Orchestrator session (north star owner)"
  
  content:
    - "What failed"
    - "Error message"
    - "Stack trace / details"
    - "What was rolled back"
    - "Suggested fix"
    
  channels:
    - "Inline in north star file"
    - "AI session message"
    - "Log file"
    - "External notification (Slack, email)"
    
  severity_levels:
    info: "Minor issue, auto-recovered"
    warning: "Recoverable, but attention needed"
    error: "Manual intervention required"
    critical: "System halted"
    
  format: |
    # .speclang/notifications/notify-2024-01-15-001.yaml
    notification:
      id: notify-2024-01-15-001
      timestamp: 2024-01-15T10:30:00Z
      severity: error
      
      failure:
        type: test_fail
        stage: go_test
        message: "3 tests failed in auth package"
        
      rollback:
        spec_file: specs/auth.spec.md
        change: "added @block:auth/magic-login"
        reverted_to: version 1.0.0
        
      suggestion:
        - "Review magic-login implementation"
        - "Check JWT token generation"
        - "Verify email mock is configured"
```

### Retry Strategies

```yaml
RetryStrategies:
  immediate:
    when: "Transient errors (network, timeout)"
    max_attempts: 3
    
  exponential_backoff:
    when: "Resource contention, rate limits"
    formula: "delay = base * 2^attempt"
    base: "1s"
    max_delay: "60s"
    max_attempts: 5
    
  fixed_delay:
    when: "Agent timeout, lock conflict"
    delay: "5s"
    max_attempts: 3
    
  no_retry:
    when: "Syntax errors, broken references"
    action: "Immediate notification"
    
  configuration: |
    # build.yaml
    retry:
      build_fail: no_retry
      test_fail: immediate
      agent_timeout: exponential_backoff
      lock_conflict: fixed_delay
```

### Self-Healing Strategies

```yaml
SelfHealing:
  description: "Recover without human intervention when possible"
  
  strategies:
    regenerate:
      trigger: "Generated code corrupted"
      action: "Delete and regenerate from spec"
      
    re_expand:
      trigger: "Expanded spec has errors"
      action: "Delete and re-expand from parent"
      
    fix_imports:
      trigger: "Missing imports in generated code"
      action: "Auto-add imports from stdlib"
      
    fix_refs:
      trigger: "Broken @ref"
      action: "Search for correct ref, suggest update"
      
    recover_lock:
      trigger: "Abandoned lock from crashed agent"
      action: "Check agent status, release if dead"
      
  flow:
    - Error detected
    - Check if self-healable
    - Apply appropriate strategy
    - Verify fix worked
    - If failed, escalate to rollback
    - If succeeded, continue cascade
    
  limitations:
    - "Cannot fix spec syntax errors"
    - "Cannot resolve ambiguous references"
    - "Cannot fix logical errors"
    - "Max 3 self-heal attempts per cascade"
```

### Error Logging

```yaml
ErrorLogging:
  location: ".speclang/errors/"
  format: "JSON per file"
  
  contents:
    - timestamp: "ISO 8601"
    - session: "Agent session ID"
    - agent: "Agent name"
    - error_type: "Failure type enum"
    - error_message: "Human-readable message"
    - stack_trace: "If available"
    - affected_files: "List of file paths"
    - recovery_action: "What was done"
    
  retention: "30 days"
  
  example: |
    // .speclang/errors/2024-01-15T10-30-00.json
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "session": "sess-003",
      "agent": "code-gen-go",
      "error": {
        "type": "build_fail",
        "message": "undefined: User in handler.go:23",
        "file": "src/auth/handler.go",
        "line": 23
      },
      "recovery": {
        "action": "rollback",
        "spec_reverted": "specs/auth.spec.md",
        "notification_sent": true
      }
    }
```

### Manual Intervention

```yaml
ManualIntervention:
  triggers:
    - "Max retries exceeded"
    - "Unhealable error"
    - "Spec syntax error (AI can't fix)"
    - "Critical system error"
    
  actions:
    - "User edits north star or spec"
    - "User runs /recover or /retry"
    - "User runs /rollback manually"
    
  commands:
    /recover: "Attempt recovery again"
    /rollback: "Revert last changes"
    /status: "Show current error state"
    /ignore: "Mark error as known, continue"
    /escalate: "Create incident ticket"
    
  escalation:
    when: "Recovery keeps failing"
    levels:
      level_1: "Auto-retry (3 attempts)"
      level_2: "Auto-rollback + notify"
      level_3: "Pause cascade + notify"
      level_4: "Require human approval"
      
    on_escalate:
      - "Write to north star with details"
      - "Create .speclang/ESCALATION file"
      - "Stop all agent activity"
      - "Wait for /resume or /abort"
```

### Recovery Configuration

```yaml
RecoveryConfig:
  location: "build.yaml or .speclangrc"
  
  defaults:
    max_attempts: 3
    backoff: exponential
    notify_on_fail: true
    auto_rollback: true
    log_retention: 30d
    
  per_agent:
    spec-writer:
      on_error: notify_only
    code-gen:
      on_error: rollback_and_retry
    test-writer:
      on_error: retry_immediate
      
  example: |
    # build.yaml
    recovery:
      max_attempts: 3
      backoff: exponential
      auto_rollback: true
      
      on_fail:
        - log: .speclang/errors/
        - rollback: last_spec_change
        - notify: northstar
        
      strategies:
        build_fail: rollback
        test_fail: rollback_and_notify
        agent_timeout: retry_with_backoff
        spec_invalid: notify_only
```

### State Recovery

```yaml
StateRecovery:
  description: "Recover from corrupted system state"
  
  checkpoints:
    frequency: "Before each major operation"
    location: ".speclang/checkpoints/"
    
  checkpoint_data:
    - "Spec file hashes"
    - "Generated file hashes"
    - "Agent session states"
    - "Lock states"
    - "Cascade depth"
    
  restore_process:
    1: "Load checkpoint"
    2: "Verify hashes match"
    3: "Restore file states"
    4: "Clear locks"
    5: "Reset cascade depth"
    6: "Restart cascade"
    
  integrity_check:
    - "All specs pass validation"
    - "All refs resolve"
    - "Generated code compiles"
    - "No orphan locks"
```

## Examples

### Example 1: Build Failure Recovery

```yaml
scenario: "Code generation produces invalid Go code"

cascade_step:
  agent: "code-gen-go"
  input: "specs/auth.spec.md"
  output: "src/auth/handler.go"
  
error:
  type: build_fail
  message: "undefined: User in handler.go:23"
  
recovery_actions:
  1_log:
    file: ".speclang/errors/2024-01-15T10-30-00.json"
    content: { error details }
    
  2_rollback:
    spec: "specs/auth.spec.md"
    reverted_to: "version 1.0.0"
    generated: "src/auth/handler.go deleted"
    
  3_notify:
    target: "orchestrator"
    message: |
      Build failed in auth handler.
      Undefined: User at line 23.
      Specs rolled back to 1.0.0.
      Suggestion: Check @ref:specs/users in auth.spec.md
```

### Example 2: Self-Healing Success

```yaml
scenario: "Generated code missing import"

error:
  type: build_fail
  message: "undefined: time.Duration"
  
self_healing:
  strategy: "fix_imports"
  action: "Add 'import \"time\"' to handler.go"
  result: "success"
  
verification:
  command: "go build ./..."
  result: "passed"
  
cascade_continues: true
```

### Example 3: Manual Intervention Required

```yaml
scenario: "Broken reference cannot be auto-fixed"

error:
  type: ref_broken
  message: "@ref:specs/users#profile not found"
  
self_healing_attempt:
  strategy: "fix_refs"
  search_result: "No matching block found"
  result: "failed"
  
escalation:
  level: 4
  action: "require_human_approval"
  notification: |
    Cannot resolve @ref:specs/users#profile
    
    Options:
    1. Create specs/users.spec.md with #profile block
    2. Update reference to existing block
    3. Remove the reference
    
    Cascade paused. Run /resume after fix.
```

## Implementation

```python
class RecoveryManager:
    def __init__(self, config: RecoveryConfig):
        self.config = config
        self.checkpoint_manager = CheckpointManager()
        self.notifier = Notifier()
        self.error_log = ErrorLog()
        
    def handle_failure(self, failure: Failure) -> RecoveryResult:
        self.error_log.log(failure)
        
        if self.can_self_heal(failure):
            result = self.attempt_self_heal(failure)
            if result.success:
                return RecoveryResult(healed=True)
                
        if self.should_retry(failure):
            return RecoveryResult(retry=True, delay=self.get_backoff_delay(failure))
            
        self.rollback(failure)
        self.notifier.notify(failure)
        
        return RecoveryResult(rolled_back=True)
        
    def rollback(self, failure: Failure):
        checkpoint = self.checkpoint_manager.get_last_good()
        
        for file_path, expected_hash in checkpoint.files.items():
            self.restore_file(file_path, expected_hash)
            
        self.clear_locks()
        self.log_rollback(failure, checkpoint)
```

## References

- @ref:speclang/recovery
- @ref:speclang/recovery.spec.dir/rollback
- @ref:speclang/recovery.spec.dir/retry
- SIP 13: Pipeline System
- SIP 14: Guard Plugin
- SIP 23: Safety Nets

## Copyright

This document is in the public domain.
