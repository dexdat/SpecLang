# speclang-header lines:13
id: "@speclang/cascade"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [cascade, reactive, loop, triggers, convergence]
children:
  - "@ref:specs/cascade.dir/triggers"
  - "@ref:specs/cascade.dir/convergence"
  - "@ref:specs/cascade.dir/continuous-improvement"
  - "@ref:specs/cascade.dir/error-handling"
short: "Cascade - Reactive loop of spec expansion"
status: draft
---

# Cascade

The reactive loop at the heart of SpecLang. File changes trigger agent reactions, which create more file changes, until convergence is detected.

## Overview

```speclang
# @block:cascade/overview @kind:entity
Cascade:
  concept: Reactive multi-agent file system organism
  trigger: File change (inotify or OpenCode event)
  response: Owning agent reacts, creates/updates files
  propagation: New changes trigger more agents
  convergence: Quiet period detection → pipeline execution
  
  key_properties:
    - concurrent: Multiple agents can fire simultaneously
    - owned: Each file has a single owning agent
    - traceable: Every change references its parent
    - convergent: Guaranteed to reach quiet state
    - continuous_improvement: Enables self-improving applications via OpenClaw integration
  
  example_flow:
    1. User edits project.scl (North Star)
    2. SpecWriter agent expands auth.spec.md
    3. CodeGen agent creates auth.go.spec
    4. TestWriter agent creates auth.test.spec.md
    5. Convergence detected (30s quiet)
    6. Pipeline runs: build, test, deploy
```

## Cascade IDs and UUID Tracking

Each cascade instance has a unique identifier for tracking:

### @block:cascade/uuid-tracking @kind:entity
```speclang
# @block:cascade/uuid-tracking @kind:entity
CascadeTracking:
  cascade_id: "Unique identifier for cascade instance (e.g., cascade-20250222-001)"
  root_change_id: "UUID of initial trigger change"
  generated_at: "Timestamp when cascade started"
  
  propagation:
    - Each agent action generates its own change UUID
    - Agents receive parent UUID from trigger context
    - Child agents inherit parent UUID as their parent
    
  storage:
    - cascade_id stored in spec headers as `part_of: "@cascade:{id}"`
    - change_id stored in spec headers as `change_id: "@change:{uuid}"`
    - parent_id stored in spec headers as `caused_by: "@change:{uuid}"`
    
  reconstruction:
    - All changes with same cascade_id belong to same cascade
    - Follow parent-child relationships via UUID links
    - Reconstruct flow even if commits happen out of order
    
  example:
    - Cascade ID: cascade-20250222-001
    - Root change: @change:a1b2c3d (user edited project.scl)
    - Agent 1: @change:b2c3d4e (parent: a1b2c3d)
    - Agent 2: @change:c3d4e5f (parent: a1b2c3d)
    - Agent 3: @change:d4e5f6g (parent: b2c3d4e)
```

## Queue System

The cascade uses a queue to manage concurrent agent execution:

### @block:cascade/queue-system @kind:entity
```speclang
# @block:cascade/queue-system @kind:entity
QueueSystem:
  purpose: "Manage concurrent agent execution with throttling"
  
  data_structure:
    queue_item:
      trigger_file: "File that changed (origin)"
      timestamp: "When change detected"
      affected_files: "List of files needing updates"
      depth: "Cascade depth counter"
      cascade_id: "Unique cascade identifier"
    
    affected_file:
      file_path: "Path to file needing update"
      owning_agent: "Which agent owns this file"
      priority: "Execution priority (1=high, 5=low)"
      dependencies: "Files this depends on"
  
  algorithm:
    1. File change detected (speclangd or OpenCode plugin)
    2. Read header dependencies (depends_on, children, imports)
    3. Find all affected files (transitive closure)
    4. Add to queue with trigger file and affected files
    5. For each affected file: assign owning agent by pattern
    6. Execute agents concurrently (with throttling)
    7. New file changes trigger new queue items
  
  throttling:
    max_concurrent_agents: "Configurable (default: 5)"
    max_queue_depth: "Prevent infinite loops (default: 100)"
    priority_ordering: "High priority items first"
    host_protection: "Throttle based on system resources"
  
  concurrency:
    multiple_agents: "Can run simultaneously on different files"
    file_locks: "Prevent multiple agents editing same file"
    dependency_ordering: "Respects dependency graph where needed"
```

## Triggers

See @ref:specs/cascade.dir/triggers for how file changes trigger agent reactions, dependency graphs, and concurrency management.

## Convergence

See @ref:specs/cascade.dir/convergence for quiet period detection, pipeline triggering, and recovery mechanisms.

## Failure Handling & Orchestrator

When the build pipeline fails, an **Orchestrator agent** (parent) handles recovery:

### @block:cascade/orchestrator @kind:entity
```speclang
# @block:cascade/orchestrator @kind:entity
Orchestrator:
  role: "Parent agent that handles failures and coordinates recovery"
  
  triggers:
    - build_pipeline_fails: "Tests fail, compilation errors, deployment issues"
    - cascade_stalls: "Queue stuck, agents timeout"
    - user_request: "Manual intervention requested"
  
  actions:
    - analyze_failure: "Read error logs, test results, build output"
    - modify_specs: "Edit spec files to fix issues"
    - modify_code: "Edit generated code if needed"
    - update_build_config: "Adjust build.yaml if pipeline definition flawed"
  
  coordination:
    - while_running: "Other agents paused (queue builds up)"
    - after_completion: "Queued items execute with fixes"
    - cascade_resumes: "New specs/code trigger normal cascade"
  
  example_flow:
    1. Build fails: `go test` fails on generated code
    2. Orchestrator activates: Analyzes test failure
    3. Edits spec: Fixes test definition in `.test.spec.md`
    4. Edits code: Fixes bug in `.go.spec` YAML schema
    5. Completes: Returns control to cascade system
    6. Queue executes: Built-up queue items run with fixes
    7. Next build: Pipeline runs again with corrections
```

The orchestrator has **temporary write access** to multiple files during recovery, unlike regular agents (one file only).

## Relationship to Cascade Protocol

The **Cascade** is the conceptual reactive loop. The **Cascade Protocol** (@ref:specs/cascade-protocol) is the explicit coordination implementation for OpenCode constraints.

In ideal setup (with speclangd Rust daemon), the cascade is fully automatic via inotify. In OpenCode-only mode, the cascade protocol provides explicit coordination.