# speclang-header lines:12
id: "@speclang/ralph-loop/state"
version: 0.1.0
layer: 2
tags: [ralph, loop, state, entities, schema]
imports: []
parent: "@ref:specs/ralph-looppart: 2/2
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Ralph Loop state definitions, entities, and data schemas
---
# Ralph Loop State Definitions

Entity definitions, data schemas, and state management for the dual‑agent Ralph Loop.

## Agents

### @ralph/builder-agent
```speclang
# @block:ralph/builder-agent @kind:entity
BuilderAgent:
  role: "Write implementation specs and code"
  
  capabilities:
    - Read all SIPs and existing specs
    - Write implementation specs (.spec.md or .spec.yaml)
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
```

### @ralph/verifier-agent
```speclang
# @block:ralph/verifier-agent @kind:entity
VerifierAgent:
  role: "Validate output, create steering packets"
  
  capabilities:
    - Validate spec format compliance
    - Check code compilation
    - Run tests
    - Verify references and dependencies
    - Create steering packets
    
  validation_pipeline:
    1. Spec Format Check
    2. Header Compliance
    3. Reference Validation
    4. Code Compilation
    5. Test Execution
    6. Integration Test
    
  outputs:
    - Validation reports
    - Steering packets
    - Failure analysis
    - Success confirmation
```

## Steering Packets

### @ralph/steering-packets
```speclang
# @block:ralph/steering-packets @kind:entity
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

## Validation Pipeline

### @ralph/validation
```speclang
# @block:ralph/validation @kind:entity
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

## Todo List Management

### @ralph/todo-list
```speclang
# @block:ralph/todo-list @kind:entity
TodoList:
  source: Generated from complete spec analysis
  
  generation:
    1. Analyze all specs in _index.json
    2. Identify missing implementation specs
    3. Determine dependencies
    4. Estimate effort/complexity
    5. Create prioritized list
    
  format:
    - task_id: unique identifier
    - description: what to implement
    - depends_on: prerequisite tasks
    - estimated_complexity: low/medium/high
    - priority: 1-10
    - assigned_to: builder/verifier
    - status: pending/in_progress/done/failed
```

## SQLite Schema Extensions

### @ralph/sqlite
```speclang
# @block:ralph/sqlite @kind:code
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
```