---
name: sip-047-transition-workflows-speclang-v0
title: "SIP 47: Transition Workflows"
version: 0.1.0
description: Maturity level upgrades and downgrade workflows with approval gates
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 47: Transition Workflows

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Transition Workflows—procedures for moving specs between maturity levels with validation gates and approval workflows.

### Quick Start

Transition types:
1. **Upgrade**: Move to higher maturity (e.g., Alpha → Beta)
2. **Downgrade**: Rollback to lower maturity (e.g., Production → Beta)
3. **Emergency**: Fast-track rollback for critical issues

### When to Read This

- **Maturity upgrades**: Promoting specs to higher levels
- **Rollbacks**: Handling failed deployments
- **Approval workflows**: Understanding validation gates

### Related SIPs

- SIP 18: Maturity Levels
- SIP 19: Agent Support Levels
- SIP 20: Agent Behavior Matrix
- SIP 16: Autonomous Validation

## Abstract

This SIP defines Transition Workflows that govern how specs move between project maturity levels. Each transition requires validation gates, approval workflows, and rollback procedures. This ensures spec quality increases progressively while maintaining safety for downgrades.

## Motivation

Specs evolve through maturity levels:
- New specs start at POC
- Validated specs move to Alpha, Beta, Production
- Sometimes specs need rollback
- Agents behave differently at each level

Transition workflows ensure:
- Quality gates are enforced
- Approvals are obtained
- History is preserved
- Rollbacks are safe

## Rationale

**Gated transitions:**

1. **Validation before transition**: All checks pass
2. **Approval workflow**: Right people sign off
3. **Atomic transitions**: All-or-nothing changes
4. **Audit trail**: Every transition logged
5. **Rollback capability**: Easy reversal if needed

## Specification

### Maturity Level Hierarchy

```yaml
MaturityHierarchy:
  levels:
    POC:
      order: 1
      description: "Proof of Concept"
      criteria: "Experimental, minimal validation"
      
    MVP:
      order: 2
      description: "Minimum Viable Product"
      criteria: "Core functionality validated"
      
    Alpha:
      order: 3
      description: "Internal testing"
      criteria: "Incomplete features, internal use"
      
    Beta:
      order: 4
      description: "External testing"
      criteria: "Feature complete, external testing"
      
    Production:
      order: 5
      description: "Production ready"
      criteria: "Stable, fully validated"
      
    Startup:
      order: 3
      description: "Small team, rapid iteration"
      parallel_to: Alpha
      
    SMB:
      order: 4
      description: "Small/Medium Business"
      parallel_to: Beta
      
    MSB:
      order: 4.5
      description: "Medium/Large Business"
      criteria: "Complex integration, compliance"
      
    Enterprise:
      order: 5
      description: "Maximum scale"
      criteria: "Strict governance, full compliance"
```

### Upgrade Workflows

```yaml
UpgradeWorkflow:
  steps:
    1_validate:
      action: "Run validation tool at level 5"
      requirement: "confidence_score >= 0.95 for agent_autonomous"
      on_failure: "Block, show validation report"
      
    2_check_dependencies:
      action: "Verify all dependencies at target level or higher"
      requirement: "No dependencies at lower level than target"
      on_failure: "Warn, require explicit override"
      
    3_peer_review:
      action: "Request peer review"
      requirement: "At least one approval from team member"
      skip_if: "project_level < Beta"
      
    4_integration_test:
      action: "Run integration tests"
      requirement: "All integration tests pass"
      skip_if: "No integration tests defined"
      
    5_approval:
      action: "Obtain formal approval"
      requirement: "Approval from designated approver"
      skip_if: "project_level < Production"
      
    6_transition:
      action: "Update project_level in header"
      side_effects:
        - "Update _index.json"
        - "Create git commit"
        - "Log to transitions table"
        - "Notify relevant agents"
        
    7_post_transition:
      action: "Run post-transition validation"
      on_failure: "Trigger automatic rollback"
```

### Downgrade Workflows

```yaml
DowngradeWorkflow:
  triggers:
    - "Validation failures in production"
    - "Critical bugs discovered"
    - "Security vulnerabilities"
    - "Compliance violations"
    - "Manual request"
    
  types:
    planned:
      description: "Scheduled downgrade for maintenance"
      approval: "Single maintainer approval"
      notice: "24 hour notice required"
      
    emergency:
      description: "Immediate rollback for critical issues"
      approval: "Any team member"
      notice: "None required"
      post_action: "Incident report within 24 hours"
      
  steps:
    1_validate_trigger:
      action: "Confirm downgrade is warranted"
      requirement: "Documented reason for downgrade"
      
    2_notify:
      action: "Notify stakeholders"
      channels: ["slack", "email", "pagerduty"]
      skip_if: "emergency"
      
    3_backup:
      action: "Create backup of current state"
      stores:
        - "Git tag: pre-downgrade-{spec_id}-{timestamp}"
        - "SQLite backup record"
        
    4_transition:
      action: "Update project_level to lower level"
      side_effects:
        - "Update agent_support if needed"
        - "Disable autonomous features"
        - "Create git commit"
        
    5_verify:
      action: "Verify system stability at new level"
      checks:
        - "Specs still parse"
        - "References resolve"
        - "Agents can operate"
        
    6_document:
      action: "Create incident/decision record"
      fields:
        - reason
        - previous_level
        - new_level
        - approver
        - timestamp
```

### Validation Gates

```yaml
ValidationGates:
  POC_to_MVP:
    validation_level: 3
    confidence_threshold: 0.75
    approvals: 0
    checks:
      - "Core entities defined"
      - "Basic operations specified"
      
  MVP_to_Alpha:
    validation_level: 4
    confidence_threshold: 0.85
    approvals: 1
    checks:
      - "All blocks have content"
      - "No TODO markers"
      - "References resolve"
      
  Alpha_to_Beta:
    validation_level: 5
    confidence_threshold: 0.90
    approvals: 1
    checks:
      - "Implementation exists"
      - "Tests pass"
      - "Integration validated"
      
  Beta_to_Production:
    validation_level: 5
    confidence_threshold: 0.95
    approvals: 2
    checks:
      - "Full test coverage"
      - "Security review"
      - "Performance validated"
      - "Documentation complete"
```

### Agent Behavior Changes

```yaml
AgentBehaviorTransitions:
  on_upgrade:
    POC_to_MVP:
      agent_support: "human_only → human_only"
      behavior: "No change"
      
    MVP_to_Alpha:
      agent_support: "human_only → agent_assisted"
      behavior: "Agents can suggest, require human approval"
      
    Alpha_to_Beta:
      agent_support: "agent_assisted → agent_assisted"
      behavior: "More autonomous suggestions"
      
    Beta_to_Production:
      agent_support: "agent_assisted → agent_autonomous"
      behavior: "Full autonomous operation if confidence >= 0.95"
      
  on_downgrade:
    Production_to_Beta:
      agent_support: "agent_autonomous → agent_assisted"
      behavior: "Require human confirmation for changes"
      
    Beta_to_Alpha:
      agent_support: "agent_assisted → agent_assisted"
      behavior: "More cautious, frequent check-ins"
      
    Alpha_to_MVP:
      agent_support: "agent_assisted → human_only"
      behavior: "Human must approve all changes"
```

### Orchestration Tool

```yaml
TransitionOrchestrator:
  cli:
    upgrade:
      usage: "speclang transition upgrade <spec> --to <level>"
      options:
        --force: "Skip validation (dangerous)"
        --dry-run: "Show what would happen"
        --approver: "Specify approver"
        
    downgrade:
      usage: "speclang transition downgrade <spec> --to <level>"
      options:
        --reason: "Required: reason for downgrade"
        --emergency: "Emergency downgrade (skip approvals)"
        --notify: "Notification channels"
        
    history:
      usage: "speclang transition history <spec>"
      description: "Show transition history for spec"
      
  api:
    request_transition:
      params:
        spec_id: string
        from_level: string
        to_level: string
        reason: string
        approver: string
      returns: TransitionRecord
      
    approve_transition:
      params:
        transition_id: string
        approver: string
        approved: boolean
        notes: string
      returns: TransitionResult
      
    get_pending:
      params:
        approver: string
      returns: TransitionRequest[]
```

### SQLite Schema

```sql
CREATE TABLE transitions (
  id TEXT PRIMARY KEY,
  spec_id TEXT NOT NULL,
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  type TEXT NOT NULL,  -- upgrade, downgrade, emergency
  reason TEXT,
  requested_by TEXT NOT NULL,
  requested_at INTEGER NOT NULL,
  
  -- Validation results
  validation_passed BOOLEAN,
  validation_report TEXT,  -- JSON
  
  -- Approval tracking
  approvals_required INTEGER DEFAULT 1,
  approvals_received INTEGER DEFAULT 0,
  approvers TEXT,  -- JSON array of approver IDs
  
  -- Status
  status TEXT DEFAULT 'pending',  -- pending, approved, completed, rejected, rolled_back
  
  -- Completion
  completed_at INTEGER,
  completed_by TEXT,
  
  -- Rollback
  rollback_of TEXT,  -- ID of original transition if this is a rollback
  
  FOREIGN KEY (spec_id) REFERENCES specs(id)
);

CREATE TABLE transition_approvals (
  id TEXT PRIMARY KEY,
  transition_id TEXT NOT NULL,
  approver TEXT NOT NULL,
  approved BOOLEAN NOT NULL,
  notes TEXT,
  approved_at INTEGER,
  
  FOREIGN KEY (transition_id) REFERENCES transitions(id)
);

CREATE TABLE transition_events (
  id TEXT PRIMARY KEY,
  transition_id TEXT NOT NULL,
  event TEXT NOT NULL,
  details TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (transition_id) REFERENCES transitions(id)
);
```

## Examples

### Example 1: Upgrade Flow

```bash
$ speclang transition upgrade specs/auth.spec.md --to Beta

Transition Request: @speclang/auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Level: Alpha
Target Level: Beta

Step 1: Validation...
  ✓ Syntax check passed
  ✓ References resolved
  ✓ Completeness check passed
  ✓ Semantic validation passed
  ✓ Safety analysis passed
  Confidence: 0.92

Step 2: Dependencies...
  ✓ All dependencies at Beta or higher

Step 3: Peer Review...
  Requesting review from: @alice, @bob
  
  Waiting for approval... (1/1 required)
  ✓ Approved by @alice

Step 4: Integration Test...
  ✓ All integration tests pass

Step 5: Transition...
  ✓ Updated header: project_level: Beta
  ✓ Updated _index.json
  ✓ Created commit: abc1234
  ✓ Notified agents

Transition complete: Alpha → Beta
```

### Example 2: Emergency Downgrade

```bash
$ speclang transition downgrade specs/payment.spec.md --to Beta --emergency --reason "Critical security vulnerability CVE-2025-1234"

EMERGENCY DOWNGRADE: @speclang/payment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Level: Production
Target Level: Beta
Reason: Critical security vulnerability CVE-2025-1234

⚠ Emergency mode: Skipping approvals

Step 1: Backup...
  ✓ Created tag: pre-downgrade-payment-1708600000

Step 2: Transition...
  ✓ Updated header: project_level: Beta
  ✓ Updated agent_support: agent_autonomous → agent_assisted
  ✓ Created commit: def5678

Step 3: Verify...
  ✓ System stable at Beta level

Step 4: Document...
  ✓ Created incident record: INC-2025-0222-001

⚠ Action required: Submit incident report within 24 hours
```

### Example 3: Transition History

```bash
$ speclang transition history specs/auth.spec.md

Transition History: @speclang/auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 2025-01-15 10:30:00
   POC → MVP
   By: @alice
   Reason: Core functionality validated
   
2. 2025-02-01 14:22:00
   MVP → Alpha
   By: @bob
   Reason: Ready for internal testing
   Approved by: @alice
   
3. 2025-02-22 09:15:00
   Alpha → Beta
   By: @charlie
   Reason: Feature complete
   Approved by: @alice
   Validation: 0.92 confidence
```

## Implementation

```python
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import json
import sqlite3
from datetime import datetime

class TransitionType(Enum):
    UPGRADE = "upgrade"
    DOWNGRADE = "downgrade"
    EMERGENCY = "emergency"

class TransitionStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    COMPLETED = "completed"
    REJECTED = "rejected"
    ROLLED_BACK = "rolled_back"

class MaturityLevel(Enum):
    POC = 1
    MVP = 2
    ALPHA = 3
    BETA = 4
    PRODUCTION = 5

@dataclass
class TransitionRequest:
    spec_id: str
    from_level: MaturityLevel
    to_level: MaturityLevel
    transition_type: TransitionType
    reason: str
    requested_by: str
    
@dataclass
class TransitionRecord:
    id: str
    request: TransitionRequest
    status: TransitionStatus
    validation_passed: bool = False
    approvals_received: int = 0
    approvals_required: int = 1

LEVEL_ORDER = {
    "POC": 1, "MVP": 2, "Alpha": 3, "Beta": 4, "Production": 5,
    "Startup": 3, "SMB": 4, "MSB": 4.5, "Enterprise": 5
}

GATES = {
    ("POC", "MVP"): {"level": 3, "confidence": 0.75, "approvals": 0},
    ("MVP", "Alpha"): {"level": 4, "confidence": 0.85, "approvals": 1},
    ("Alpha", "Beta"): {"level": 5, "confidence": 0.90, "approvals": 1},
    ("Beta", "Production"): {"level": 5, "confidence": 0.95, "approvals": 2},
}

class TransitionOrchestrator:
    def __init__(self, db_path: str = ".speclang/speclang.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_tables()
        
    def _init_tables(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS transitions (
                id TEXT PRIMARY KEY,
                spec_id TEXT NOT NULL,
                from_level TEXT NOT NULL,
                to_level TEXT NOT NULL,
                type TEXT NOT NULL,
                reason TEXT,
                requested_by TEXT NOT NULL,
                requested_at INTEGER NOT NULL,
                validation_passed BOOLEAN,
                validation_report TEXT,
                approvals_required INTEGER DEFAULT 1,
                approvals_received INTEGER DEFAULT 0,
                approvers TEXT,
                status TEXT DEFAULT 'pending',
                completed_at INTEGER,
                completed_by TEXT,
                rollback_of TEXT
            );
            CREATE TABLE IF NOT EXISTS transition_approvals (
                id TEXT PRIMARY KEY,
                transition_id TEXT NOT NULL,
                approver TEXT NOT NULL,
                approved BOOLEAN NOT NULL,
                notes TEXT,
                approved_at INTEGER
            );
        """)
        
    def request_upgrade(self, spec_id: str, to_level: str, requested_by: str) -> TransitionRecord:
        current_level = self._get_current_level(spec_id)
        
        if LEVEL_ORDER.get(to_level, 0) <= LEVEL_ORDER.get(current_level, 0):
            raise ValueError(f"Target level {to_level} must be higher than current {current_level}")
            
        request = TransitionRequest(
            spec_id=spec_id,
            from_level=MaturityLevel[current_level.upper()] if current_level.upper() in MaturityLevel.__members__ else MaturityLevel.POC,
            to_level=MaturityLevel[to_level.upper()] if to_level.upper() in MaturityLevel.__members__ else MaturityLevel.POC,
            transition_type=TransitionType.UPGRADE,
            reason="Upgrade requested",
            requested_by=requested_by,
        )
        
        return self._create_transition(request)
        
    def request_downgrade(self, spec_id: str, to_level: str, reason: str, 
                          requested_by: str, emergency: bool = False) -> TransitionRecord:
        current_level = self._get_current_level(spec_id)
        
        if LEVEL_ORDER.get(to_level, 0) >= LEVEL_ORDER.get(current_level, 0):
            raise ValueError(f"Target level {to_level} must be lower than current {current_level}")
            
        request = TransitionRequest(
            spec_id=spec_id,
            from_level=MaturityLevel[current_level.upper()] if current_level.upper() in MaturityLevel.__members__ else MaturityLevel.POC,
            to_level=MaturityLevel[to_level.upper()] if to_level.upper() in MaturityLevel.__members__ else MaturityLevel.POC,
            transition_type=TransitionType.EMERGENCY if emergency else TransitionType.DOWNGRADE,
            reason=reason,
            requested_by=requested_by,
        )
        
        record = self._create_transition(request)
        
        if emergency:
            return self._execute_emergency_downgrade(record)
            
        return record
        
    def approve(self, transition_id: str, approver: str, approved: bool, notes: str = "") -> TransitionRecord:
        record = self._get_transition(transition_id)
        
        self.conn.execute("""
            INSERT INTO transition_approvals (id, transition_id, approver, approved, notes, approved_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (f"appr-{datetime.now().timestamp()}", transition_id, approver, approved, notes, int(datetime.now().timestamp())))
        
        if approved:
            record.approvals_received += 1
            self._update_approvals(transition_id, record.approvals_received)
            
            if record.approvals_received >= record.approvals_required:
                return self._execute_transition(record)
                
        return record
        
    def _execute_transition(self, record: TransitionRecord) -> TransitionRecord:
        self._update_spec_level(record.request.spec_id, record.request.to_level.value)
        
        self.conn.execute("""
            UPDATE transitions SET status = ?, completed_at = ?, completed_by = ?
            WHERE id = ?
        """, (TransitionStatus.COMPLETED.value, int(datetime.now().timestamp()), record.request.requested_by, record.id))
        
        record.status = TransitionStatus.COMPLETED
        return record
        
    def _execute_emergency_downgrade(self, record: TransitionRecord) -> TransitionRecord:
        self._create_backup(record.request.spec_id)
        return self._execute_transition(record)
        
    def _create_backup(self, spec_id: str):
        pass
        
    def _get_current_level(self, spec_id: str) -> str:
        return "Alpha"
        
    def _create_transition(self, request: TransitionRequest) -> TransitionRecord:
        import uuid
        record = TransitionRecord(
            id=str(uuid.uuid4()),
            request=request,
            status=TransitionStatus.PENDING,
        )
        
        gate = GATES.get((request.from_level.name.lower().capitalize(), 
                         request.to_level.name.lower().capitalize()), {})
        record.approvals_required = gate.get("approvals", 1)
        
        if request.transition_type == TransitionType.EMERGENCY:
            record.approvals_required = 0
            
        self.conn.execute("""
            INSERT INTO transitions 
            (id, spec_id, from_level, to_level, type, reason, requested_by, requested_at, 
             approvals_required, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (record.id, request.spec_id, request.from_level.name, request.to_level.name,
              request.transition_type.value, request.reason, request.requested_by,
              int(datetime.now().timestamp()), record.approvals_required, record.status.value))
              
        return record
```

## References

- "@ref:speclang/transition-workflows
- @ref:speclang/project-maturity-levels
- @ref:speclang/agent-behavior-matrix
- SIP 18: Maturity Levels
- SIP 19: Agent Support Levels
- SIP 20: Agent Behavior Matrix

## Copyright

This document is in the public domain.
