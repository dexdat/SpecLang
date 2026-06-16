---
name: sip-105-safety-fallback-speclang-v0
title: "SIP 105: Safety Fallback Protocols"
version: 0.1.0
description: Fallback protocols when safety confidence is insufficient
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 105: Safety Fallback Protocols

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines fallback protocols for when safety confidence is insufficient for autonomous operation.

### Quick Start

Fallback protocol chain:
1. **Review Request**: Request human review
2. **Escalation**: Escalate to appropriate authority
3. **Limited Action**: Proceed with restrictions
4. **Full Abort**: Stop all autonomous actions

### When to Read This

- **Building fallback systems**: Implementing safety fallbacks
- **Configuring agents**: Setting fallback behavior
- **Handling failures**: What to do when confidence is low

### Related SIPs

- SIP 23: Safety Nets
- SIP 104: Confidence Scoring
- SIP 106: Detection Mechanisms

## Abstract

This SIP defines the fallback protocols when safety confidence is insufficient for autonomous operation. It establishes the escalation hierarchy, limited action modes, and abort procedures.

## Motivation

Autonomous agents need:
- **Graceful degradation**: Fall back instead of fail
- **Clear escalation**: Know when to involve humans
- **Limited capabilities**: Operate with restrictions
- **Safe abort**: Stop safely when necessary

## Rationale

**Progressive Fallback:**

1. Request review before blocking
2. Allow limited operation with constraints
3. Escalate critical decisions
4. Abort safely when uncertain

## Specification

### Fallback Levels

```yaml
FallbackLevels:
  level_1_review:
    trigger: confidence < proceed_threshold
    action: "Request human review"
    timeout_minutes: 30
    can_proceed: false
    
  level_2_approval:
    trigger: "level_1_review approved"
    action: "Proceed with approval"
    constraints:
      - limited_scope: true
      - enhanced_logging: true
      - no_production_deploy: true
    can_proceed: true
    
  level_3_restricted:
    trigger: "confidence < fallback_threshold"
    action: "Restricted operation mode"
    constraints:
      - read_only: true
      - no_modifications: true
      - audit_only: true
      - sandboxed_execution: true
    can_proceed: false
    
  level_4_escalate:
    trigger: "confidence < abort_threshold"
    action: "Escalate to authority"
    timeout_minutes: 60
    escalation_targets:
      - senior_developer
      - security_team
      - project_lead
    can_proceed: false
    
  level_5_abort:
    trigger: "confidence < minimum OR critical_failure"
    action: "Full abort"
    procedures:
      - rollback_changes: true
      - preserve_logs: true
      - notify_stakeholders: true
      - disable_agent: false  # Only if repeated failures
    can_proceed: false
```

### Fallback Protocol Chain

```yaml
FallbackChain:
  stages:
    - name: detect_insufficient_confidence
      check:
        - confidence_score < threshold
        - validation_failures_detected
        - anomaly_detected
      
    - name: request_review
      actions:
        - generate_review_request
        - attach_confidence_report
        - notify_reviewer
        - set_timeout_timer
      
    - name: await_response
      states:
        - approved
        - rejected
        - timeout
        - escalated
      
    - name: execute_based_on_response
      approved:
        - proceed_with_constraints
        - log_approval
        - track_approval_reference
        
      rejected:
        - abort_operation
        - preserve_rejection_reason
        - suggest_fixes
        
      timeout:
        - escalate_to_next_level
        - notify_escalation_target
        
      escalated:
        - await_escalation_decision
        - apply_escalation_result
```

### Review Request Format

```yaml
ReviewRequest:
  required_fields:
    - request_id: UUID
    - timestamp: ISO8601
    - project_id: string
    - operation_type: string
    - confidence_score: float
    - confidence_level: enum
    - decision_reasoning: string
    
  context:
    - operation_summary: string
    - changes_proposed: list
    - affected_files: list
    - dependencies: list
    
  signals:
    - signal_name: string
      value: float
      weight: float
      concern_level: enum
      
  constraints_proposed:
    - constraint_name: string
      description: string
      mandatory: boolean
      
  response_options:
    - approve: "Proceed as proposed"
    - approve_with_constraints: "Proceed with additional constraints"
    - reject: "Do not proceed"
    - request_changes: "Proceed after changes made"
    - escalate: "Forward to higher authority"
```

### Limited Action Modes

```yaml
LimitedActionModes:
  sandbox_mode:
    description: "Execute in isolated environment"
    restrictions:
      - no_network_access: true
      - no_file_system_write: true
      - memory_limit_mb: 512
      - execution_timeout_seconds: 30
      - no_external_services: true
      
    allowed_operations:
      - syntax_validation
      - static_analysis
      - test_discovery
      - dependency_checking
      
    required_actions:
      - log_all_operations
      - capture_all_output
      - report_findings_only

  read_only_mode:
    description: "Read-only operations only"
    restrictions:
      - no_file_modification: true
      - no_state_changes: true
      - no_deployments: true
      
    allowed_operations:
      - spec_reading
      - reference_resolution
      - index_queries
      - validation_only
      
    required_actions:
      - generate_report_only
      - no_code_emission

  audit_mode:
    description: "Audit only, no execution"
    restrictions:
      - no_generation: true
      - no_execution: true
      - no_modifications: true
      
    allowed_operations:
      - spec_analysis
      - validation_checks
      - report_generation
      
    output:
      - detailed_audit_report
      - recommendations
      - confidence_analysis
```

### Abort Procedures

```yaml
AbortProcedures:
  graceful_abort:
    steps:
      - name: preserve_state
        actions:
          - snapshot_current_state
          - backup_unsaved_changes
          - logAbortPoint
          
      - name: rollback_operations
        actions:
          - reverse_partial_changes
          - restore_original_state
          - cleanup_temp_files
          
      - name: notify_stakeholders
        actions:
          - alert_project_team
          - log_abort_reason
          - create_incident_record
          
      - name: prepare_recovery
        actions:
          - provide_recovery_instructions
          - list_blocking_issues
          - suggest_fixes

  emergency_abort:
    trigger_conditions:
      - critical_security_breach
      - data_corruption_detected
      - cascade_failure_detected
      - human_cancellation
      
    immediate_actions:
      - kill_all_processes: true
      - isolate_environment: true
      - preserve_evidence: true
      - notify_emergency_team: true
      
    follow_up:
      - incident_report_required
      - root_cause_analysis
      - recovery_plan
```

## Examples

### Example 1: Level 1 Review Fallback

```python
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum

class FallbackLevel(Enum):
    NONE = "none"
    REVIEW = "review"
    APPROVAL = "approval"
    RESTRICTED = "restricted"
    ESCALATE = "escalate"
    ABORT = "abort"

class FallbackManager:
    """Manage fallback protocols."""
    
    def __init__(self, config: dict):
        self.config = config
        self.thresholds = config.get("thresholds", {})
    
    def determine_fallback(
        self,
        confidence: float,
        project_level: str,
        has_approval: bool,
        is_critical: bool
    ) -> FallbackLevel:
        """Determine appropriate fallback level."""
        
        thresholds = self.thresholds.get(project_level, {
            "proceed": 0.8,
            "fallback": 0.6,
            "abort": 0.3
        })
        
        # Critical changes always require more caution
        if is_critical:
            thresholds = {
                "proceed": thresholds["proceed"] + 0.1,
                "fallback": thresholds["fallback"] + 0.1,
                "abort": thresholds["abort"] + 0.05
            }
        
        if confidence >= thresholds["proceed"]:
            return FallbackLevel.NONE
        
        if confidence >= thresholds["fallback"]:
            if has_approval:
                return FallbackLevel.APPROVAL
            return FallbackLevel.REVIEW
        
        if confidence >= thresholds["abort"]:
            return FallbackLevel.ESCALATE
        
        return FallbackLevel.ABORT
    
    def create_review_request(
        self,
        operation: str,
        confidence: float,
        signals: List[dict]
    ) -> dict:
        """Create a human review request."""
        
        return {
            "request_id": generate_uuid(),
            "timestamp": iso8601_now(),
            "operation": operation,
            "confidence_score": confidence,
            "confidence_level": self._level_from_score(confidence),
            "signals": signals,
            "response_options": [
                "approve",
                "approve_with_constraints", 
                "reject",
                "request_changes",
                "escalate"
            ],
            "timeout_minutes": 30
        }
    
    def apply_constraints(
        self,
        operation: dict,
        constraints: List[str]
    ) -> dict:
        """Apply operational constraints."""
        
        constrained = operation.copy()
        
        for constraint in constraints:
            if constraint == "limited_scope":
                constrained["scope"] = "limited"
                constrained["max_files"] = 5
            elif constraint == "enhanced_logging":
                constrained["log_level"] = "debug"
                constrained["capture_output"] = True
            elif constraint == "no_production_deploy":
                constrained["target"] = "staging"
            elif constraint == "sandboxed_execution":
                constrained["sandbox"] = True
                constrained["network_access"] = False
        
        return constrained
```

### Example 2: Escalation Path

```python
class EscalationManager:
    """Handle escalation to higher authorities."""
    
    ESCALATION_PATHS = {
        "POC": ["maintainer"],
        "MVP": ["maintainer", "lead_developer"],
        "Alpha": ["lead_developer", "project_manager"],
        "Beta": ["project_manager", "security_team"],
        "Production": ["security_team", "architect"],
        "Startup": ["lead_developer"],
        "SMB": ["lead_developer", "project_manager"],
        "MSB": ["project_manager", "security_team", "compliance"],
        "Enterprise": ["security_team", "compliance", "executive"]
    }
    
    def __init__(self, project_level: str):
        self.project_level = project_level
        self.escalation_path = self.ESCALATION_PATHS.get(
            project_level,
            ["maintainer"]
        )
    
    def escalate(
        self,
        request: dict,
        reason: str,
        current_level: int = 0
    ) -> dict:
        """Escalate to next authority in path."""
        
        if current_level >= len(self.escalation_path):
            return {
                "status": "max_escalation_reached",
                "recommendation": "abort_operation"
            }
        
        target = self.escalation_path[current_level]
        
        escalation = {
            "escalation_id": generate_uuid(),
            "original_request": request,
            "reason": reason,
            "target_authority": target,
            "escalation_level": current_level + 1,
            "timeout_minutes": 60,
            "required_response": True
        }
        
        self._notify_authority(target, escalation)
        
        return escalation
    
    def handle_timeout(
        self,
        escalation: dict
    ) -> dict:
        """Handle escalation timeout."""
        
        current_level = escalation.get("escalation_level", 1)
        
        if current_level < len(self.escalation_path):
            return self.escalate(
                escalation["original_request"],
                "previous_escalation_timeout",
                current_level
            )
        
        return {
            "status": "max_escalation_timeout",
            "recommendation": "abort_operation",
            "reason": "No authority available to make decision"
        }
```

### Example 3: Restricted Mode Execution

```python
class RestrictedExecutor:
    """Execute operations in restricted mode."""
    
    def __init__(self, mode: str):
        self.mode = mode
        self.execution_log = []
    
    def execute(
        self,
        operation: dict,
        constraints: dict
    ) -> dict:
        """Execute in restricted mode."""
        
        if self.mode == "sandbox":
            return self._sandbox_execute(operation, constraints)
        elif self.mode == "read_only":
            return self._read_only_execute(operation, constraints)
        elif self.mode == "audit":
            return self._audit_only(operation, constraints)
        else:
            raise ValueError(f"Unknown restricted mode: {self.mode}")
    
    def _sandbox_execute(
        self,
        operation: dict,
        constraints: dict
    ) -> dict:
        """Execute in sandbox mode."""
        
        result = {
            "mode": "sandbox",
            "operation": operation["type"],
            "sandbox_restrictions": {
                "network_access": False,
                "filesystem_write": False,
                "memory_limit_mb": 512,
                "timeout_seconds": 30
            },
            "allowed_results": [],
            "findings": []
        }
        
        # Run allowed operations only
        if operation["type"] == "validation":
            result["findings"] = self._run_sandbox_validation(
                operation["content"]
            )
        elif operation["type"] == "analysis":
            result["findings"] = self._run_sandbox_analysis(
                operation["content"]
            )
        
        return result
    
    def _read_only_execute(
        self,
        operation: dict,
        constraints: dict
    ) -> dict:
        """Execute in read-only mode."""
        
        result = {
            "mode": "read_only",
            "operation": operation["type"],
            "restrictions": {
                "no_modifications": True,
                "no_state_changes": True
            }
        }
        
        # Only read operations
        if operation["type"] == "query":
            result["data"] = self._execute_query(operation["query"])
        elif operation["type"] == "analyze":
            result["analysis"] = self._analyze_read_only(
                operation["content"]
            )
        
        return result
    
    def _audit_only(
        self,
        operation: dict,
        constraints: dict
    ) -> dict:
        """Execute in audit-only mode."""
        
        result = {
            "mode": "audit",
            "operation": operation["type"],
            "findings": [],
            "recommendations": [],
            "confidence_analysis": {}
        }
        
        # Just analyze and report
        result["findings"] = self._audit_findings(operation["content"])
        result["recommendations"] = self._generate_recommendations(
            result["findings"]
        )
        
        return result
```

## Backwards Compatibility

- Fallback levels can be configured per-project
- Default behavior maintains existing validation
- API provides backward-compatible mode flag

## Security Implications

- Fallback decisions must be logged immutably
- Approval chains must be verified
- Restricted modes must be enforced strictly

## References

- "@ref:speclang/safety-nets
- @ref:speclang/confidence-scoring
- @ref:speclang/detection-mechanisms
- SIP 23: Safety Nets
- SIP 104: Confidence Scoring
- SIP 106: Detection Mechanisms

## Copyright

This document is in the public domain.
