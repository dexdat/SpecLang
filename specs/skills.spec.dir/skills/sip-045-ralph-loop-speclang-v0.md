---
name: sip-045-ralph-loop-speclang-v0
title: "SIP 45: Ralph Loop System"
version: 0.1.0
description: Dual-agent Ralph Loop with steering packets for autonomous iteration
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 45: Ralph Loop System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Ralph Loop System—a dual-agent coordination pattern for building SpecLang using SpecLang.

### Quick Start

Ralph Loop pattern:
1. Allocate array with complete backing specifications
2. Goal: Build complete Speclang system
3. Loop with two agents:
   - Builder Agent: Writes implementation specs and code
   - Verifier Agent: Validates output, creates steering packets
4. Watch loop for failure domains
5. Engineer solutions for failures
6. Repeat until goal achieved

### When to Read This

- **Autonomous development**: Running unattended spec-to-code cycles
- **Meta-circular bootstrap**: Building SpecLang with SpecLang
- **Steering feedback**: Understanding how agents correct each other

### Related SIPs

- SIP 6: Agent Protocol
- SIP 7: Cascade System
- SIP 27: Recovery
- SIP 44: Bootstrap Process

## Abstract

This SIP defines the Ralph Loop—a dual-agent iteration system where a Builder Agent writes implementation and a Verifier Agent validates output. Failed validations produce steering packets that guide the Builder. This implements meta-circular development for self-hosting SpecLang.

## Motivation

Building SpecLang autonomously requires:
- Continuous iteration on specs and code
- Validation at each step
- Feedback loop for corrections
- No human intervention required

The Ralph Loop provides this through coordinated agents.

## Rationale

**Why dual agents:**

1. **Separation of concerns**: Builder creates, Verifier validates
2. **Objectivity**: Verifier is independent of Builder's assumptions
3. **Steering packets**: Structured feedback instead of random retries
4. **Failure domains**: Systematic error categorization and resolution

## Specification

### Architecture

```yaml
RalphLoopArchitecture:
  components:
    builder_agent:
      role: "Write implementation specs and code"
      capabilities:
        - Read all SIPs and existing specs
        - Write implementation specs (.spec.md, .spec.yaml)
        - Generate code from specs (.go.spec, .ts.spec)
        - Follow file naming conventions
        - Use speclang tools (when available)
      triggers:
        - Steering packet from Verifier
        - Todo list item
        - Manual human instruction
      outputs:
        - New/modified spec files
        - Generated code files
        - Commit messages
        - Progress report
        
    verifier_agent:
      role: "Validate output, create steering packets"
      capabilities:
        - Validate spec format compliance
        - Check code compilation
        - Run tests
        - Verify references and dependencies
        - Create steering packets
      validation_pipeline:
        1: Spec Format Check
        2: Header Compliance
        3: Reference Validation
        4: Code Compilation
        5: Test Execution
        6: Integration Test
      outputs:
        - Validation reports
        - Steering packets
        - Failure analysis
        - Success confirmation
```

### Steering Packets

```yaml
SteeringPacket:
  format: JSON stored in SQLite commands table
  
  types:
    error_report:
      fields:
        - task_id
        - error_type
        - file_path
        - error_message
        - suggested_fix
        - priority
      
    fix_suggestion:
      fields:
        - task_id
        - file_path
        - current_state
        - suggested_change
        - rationale
          
    priority_change:
      fields:
        - task_id
        - new_priority
        - reason
        - dependencies
          
    success_confirmation:
      fields:
        - task_id
        - files_created
        - tests_passed
        - next_recommendation
```

### Validation Pipeline

```yaml
ValidationPipeline:
  stages:
    stage_1_spec_format:
      checks:
        - Header present and valid
        - ID matches file path convention
        - Required fields present
        - Tags non-empty
        - References exist
        - File extension correct (.spec.md, .spec.yaml, .{ext}.spec)
          
    stage_2_code_compilation:
      checks:
        - Generated code syntax valid
        - Imports resolve
        - Type checking passes
        - No compilation errors
          
    stage_3_test_execution:
      checks:
        - All tests pass
        - Test coverage meets threshold
        - Integration tests pass
        - Performance within bounds
          
    stage_4_integration:
      checks:
        - System components integrate
        - End-to-end flows work
        - No regression issues
        - Security checks pass
```

### Todo List Management

```yaml
TodoList:
  source: Generated from complete spec analysis
  
  generation:
    1: Analyze all specs in _index.json
    2: Identify missing implementation specs
    3: Determine dependencies
    4: Estimate effort/complexity
    5: Create prioritized list
      
  format:
    - task_id: unique identifier
    - description: what to implement
    - depends_on: prerequisite tasks
    - estimated_complexity: low/medium/high
    - priority: 1-10
    - assigned_to: builder/verifier
    - status: pending/in_progress/done/failed
```

### Loop Control

```yaml
RalphLoopControl:
  steps:
    1: Load complete backing specifications
    2: Generate todo list
    3: Spawn Builder and Verifier agents
    4: While todo list has pending tasks:
        a: Get next task
        b: Assign task to Builder
        c: Builder executes task
        d: Verifier validates output
        e: If validation succeeds, mark task done and add any recommendations
        f: If validation fails, create steering packet, send to Builder, retry task
    5: When all tasks done, run system verification, final validation, and success report
```

### SQLite Schema Extensions

```sql
-- Ralph Loop tables (extends existing schema)
CREATE TABLE ralph_tasks (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  depends_on TEXT,  -- JSON array
  estimated_complexity TEXT,
  priority INTEGER DEFAULT 5,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER,
  started_at INTEGER,
  completed_at INTEGER
);

CREATE TABLE steering_packets (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  type TEXT,
  content TEXT,  -- JSON
  created_at INTEGER,
  processed_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);

CREATE TABLE validation_results (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  stage TEXT,
  passed BOOLEAN,
  details TEXT,  -- JSON
  created_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);
```

### Integration Points

```yaml
RalphLoopIntegration:
  with_agent_protocol:
    - Builder and Verifier are special agents
    - Use existing session management
    - Follow ownership rules
    - Integrate with cascade system
      
  with_cascade:
    - Loop can trigger file changes
    - File changes can add to todo list
    - Convergence detection can pause loop
      
  with_recovery:
    - Loop failures trigger recovery
    - Steering packets can request rollback
    - Validation failures auto-recover
```

### Implementation Phases

```yaml
ImplementationPhases:
  phase_1_manual_emulation:
    - Human acts as Builder
    - speclang-builder agent acts as Verifier
    - Manual steering packets
    - Goal: Complete spec set
      
  phase_2_semi_automated:
    - speclang-builder as Builder
    - Automated validation scripts as Verifier
    - SQLite-based steering packets
    - Goal: Core implementation specs
      
  phase_3_full_automation:
    - Dedicated Builder agent
    - Dedicated Verifier agent  
    - Full validation pipeline
    - Goal: Complete Speclang system
      
  phase_4_self_hosting:
    - Use built Speclang to improve itself
    - Evolutionary development
    - Continuous Ralph Loop
```

### Failure Domains

```yaml
FailureDomains:
  common_failures:
    1: Spec format violations
    2: Missing dependencies
    3: Compilation errors
    4: Test failures
    5: Integration issues
    6: Performance problems
    7: Security vulnerabilities

  engineering_responses:
    1: Add validation checks
    2: Create better error messages
    3: Improve todo list generation
    4: Enhance steering packets
    5: Add recovery mechanisms
    6: Update documentation/SIPs
```

## Examples

### Example 1: Basic Loop Cycle

```
Task: Implement auth spec
  ↓
Builder: Write specs/auth.spec.md
  ↓
Verifier: Check format → Header valid ✓
          Check refs → All resolve ✓
          Check compilation → N/A (spec only)
  ↓
Success confirmation: task_001 complete
  ↓
Next task: Generate auth code
  ↓
Builder: Write generated/go/auth.go
  ↓
Verifier: Check compilation → Error: undefined import
  ↓
Steering packet: {error: "undefined import", fix: "add import statement"}
  ↓
Builder: Fix auth.go
  ↓
Verifier: Check compilation → ✓
  ↓
Task complete
```

### Example 2: Priority Change

```json
{
  "type": "priority_change",
  "task_id": "task_042",
  "new_priority": 1,
  "reason": "Blocking 3 downstream tasks",
  "dependencies": ["task_010", "task_011", "task_012"]
}
```

### Example 3: Fix Suggestion

```json
{
  "type": "fix_suggestion",
  "task_id": "task_023",
  "file_path": "specs/validation.spec.md",
  "current_state": "Missing @block:id on line 45",
  "suggested_change": "Add '# @block:validation/step @kind:operation'",
  "rationale": "Required for reference resolution"
}
```

## Implementation

```python
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import json
import sqlite3
from datetime import datetime

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    FAILED = "failed"

class PacketType(Enum):
    ERROR_REPORT = "error_report"
    FIX_SUGGESTION = "fix_suggestion"
    PRIORITY_CHANGE = "priority_change"
    SUCCESS_CONFIRMATION = "success_confirmation"

@dataclass
class SteeringPacket:
    task_id: str
    packet_type: PacketType
    content: dict
    created_at: int = field(default_factory=lambda: int(datetime.now().timestamp()))
    processed_at: Optional[int] = None

@dataclass
class RalphTask:
    id: str
    description: str
    depends_on: list[str] = field(default_factory=list)
    estimated_complexity: str = "medium"
    priority: int = 5
    assigned_to: str = "builder"
    status: TaskStatus = TaskStatus.PENDING

class RalphLoop:
    def __init__(self, db_path: str = ".speclang/speclang.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_tables()
        self.tasks: list[RalphTask] = []
        self.pending_packets: list[SteeringPacket] = []
        
    def _init_tables(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS ralph_tasks (
                id TEXT PRIMARY KEY,
                description TEXT NOT NULL,
                depends_on TEXT,
                estimated_complexity TEXT,
                priority INTEGER DEFAULT 5,
                assigned_to TEXT,
                status TEXT DEFAULT 'pending',
                created_at INTEGER,
                started_at INTEGER,
                completed_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS steering_packets (
                id TEXT PRIMARY KEY,
                task_id TEXT,
                type TEXT,
                content TEXT,
                created_at INTEGER,
                processed_at INTEGER,
                FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
            );
        """)
        
    def run(self):
        self._load_tasks()
        while self._has_pending_tasks():
            task = self._get_next_task()
            self._execute_task(task)
            result = self._validate_task(task)
            if result.passed:
                self._mark_complete(task, result)
            else:
                packet = self._create_steering_packet(task, result)
                self._send_to_builder(packet)
                
    def _has_pending_tasks(self) -> bool:
        return any(t.status == TaskStatus.PENDING for t in self.tasks)
        
    def _get_next_task(self) -> RalphTask:
        pending = [t for t in self.tasks if t.status == TaskStatus.PENDING]
        pending.sort(key=lambda t: t.priority, reverse=True)
        for task in pending:
            if self._dependencies_met(task):
                return task
        raise RuntimeError("No available tasks with met dependencies")
        
    def _dependencies_met(self, task: RalphTask) -> bool:
        for dep_id in task.depends_on:
            dep = next((t for t in self.tasks if t.id == dep_id), None)
            if not dep or dep.status != TaskStatus.DONE:
                return False
        return True
```

## References

- "@ref:speclang/ralph-loop
- @ref:speclang/agent-protocol
- @ref:speclang/cascade
- @ref:speclang/recovery
- SIP 6: Agent Protocol
- SIP 7: Cascade System
- SIP 27: Recovery

## Copyright

This document is in the public domain.
