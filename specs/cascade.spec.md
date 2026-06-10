# speclang-header lines:15
id: "@speclang/cascade"
version: 0.2.0
target: src/cascade/
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [cascade, reactive, loop, triggers, convergence, notification-graph, squash, throttle, model-pool]
children:
  - "@ref:specs/cascade.spec.dir/triggers"
  - "@ref:specs/cascade.spec.dir/convergence"
  - "@ref:specs/cascade.spec.dir/continuous-improvement"
  - "@ref:specs/cascade.spec.dir/error-handling"
short: "Cascade - Reactive loop of spec expansion with notification graph, squash, throttle"
status: draft
---

# Cascade

The reactive loop at the heart of SpecLang. File changes trigger agent reactions, which create more file changes, until convergence is detected.

## Overview

```speclang
# @block:cascade/overview @kind:entity
Cascade:
  concept: Reactive multi-agent file system organism
  trigger: File change (inotify or chokidar event)
  response: Owning agent reacts, creates/updates files
  propagation: New changes trigger more agents via notification graph
  convergence: Quiet period detection → pipeline execution

  key_properties:
    - concurrent: Multiple agents can fire simultaneously
    - owned: Each file has a single owning agent
    - traceable: Every change references its parent
    - convergent: Guaranteed to reach quiet state
    - squash: Rapid changes to same file merged within 100ms window
    - throttle: Fairness queue with deferral for hot files

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

### @block::cascade/uuid-tracking @kind:entity
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

### @block::cascade/queue-system @kind:entity
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
    1. File change detected (speclangd or chokidar watcher)
    2. Read header dependencies (depends_on, children, imports) and watch patterns
    3. Query notification graph for all dependent specs
    4. Merge affected files from depends_on + watch patterns + body @ref: links
    5. Add to queue with trigger file and affected files
    6. Apply squash: merge rapid changes to same file within 100ms
    7. Apply throttle: defer hot files to back of queue
    8. For each affected file: assign owning agent by pattern or owned-by header
    9. Execute agents concurrently (with throttling and model pool dispatch)
    10. New file changes trigger new queue items

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

## Notification Graph

### @block:cascade/notification-graph @kind:entity
```speclang
NotificationGraph:
  description: "Directed graph from dependency sources to dependent specs"

  sources:
    - explicit: "depends_on field in spec header"
    - watch_patterns: "watch.files and watch.exclude from spec header"
    - body_refs: "@ref: links in spec body"

  construction:
    - When a spec is parsed, extract all three sources of dependencies
    - For watch patterns, expand globs to concrete file paths
    - Add directed edge: dependency_source → dependent_spec
    - Merge edges to create complete notification graph

  matching:
    - literal: exact file path match
    - glob: "**.spec.md", "**.spec.go.md", etc.
    - exclude: patterns in watch.exclude remove edges

  change_event:
    - When file X changes, query graph for all specs that watch X
    - Emit FileChangeEvent with: path, kind, dependent_specs[]
    - Route events to all dependent specs
```

## Squash

### @block:cascade/squash @kind:entity
```speclang
Squash:
  description: "Debounce rapid changes to same file into one cascade"

  debounce_window: "100ms — rapid changes within this window are merged"

  rules:
    - multiple_changes_same_file: "Merge into single cascade within 100ms"
    - overlapping_cascades: "If cascade N is running and N+1 triggers for overlapping files, merge work"
    - no_data_loss: "Latest content always wins — intermediate states are discarded"

  algorithm:
    1. File change event arrives
    2. Check if same file has pending event within 100ms
    3. If yes: merge into existing event (update timestamp, keep latest content)
    4. If no: create new event and schedule cascade
    5. On cascade start: flush any pending squashed events
```

## Throttle — Fairness Queue with Deferral

### @block:cascade/throttle @kind:entity
```speclang
Throttle:
  description: "Fairness queue with deferral for hot files"

  hot_threshold: "5 times queued in last 60 seconds"

  deferral:
    - first: "File marked 'hot' and deferred to back of queue"
    - requeue: "One more cascade attempt when it reaches front"
    - backoff: "Escalating 2x, 4x, 8x if still hot"
    - notification: "User notified after 3 deferrals"
    - guarantee: "No cascade is ever cancelled — only postponed"

  algorithm:
    1. Track queue_count[file_path] over rolling 60s window
    2. If queue_count > threshold, mark file as 'hot'
    3. Move hot items to back of queue
    4. Process non-hot files while hot files wait
    5. On requeue: check if still hot, apply escalating backoff
    6. After 3 deferrals: notify user via notification system
```

## Model Pool Dispatch

### @block:cascade/model-pool-dispatch @kind:entity
```speclang
ModelPoolDispatch:
  description: "Dispatch cascade work to appropriate model pools"

  header_fields_used:
    - model: "Explicit model override from spec header"
    - model_pool: "Named capability pool from spec header"
    - max_concurrent: "Max concurrent sessions from spec header"
    - rate_limit: "Rate limit per minute from spec header"

  algorithm:
    1. Read model/model_pool field from each changed spec header
    2. Group affected specs by model_pool
    3. For each pool: respect max_concurrent (min(header.value, pool_config.max))
    4. Respect rate_limit (cascade triggers per minute per spec)
    5. Dispatch Pi agent sessions accordingly
    6. Pool-level and spec-level limits both enforced

  resolution_order:
    1. Header model: field — explicit model for this spec
    2. Header model_pool: field — named pool of models with this capability
    3. File pattern default — owned-by role's default model
```

## Triggers

See @ref:specs/cascade.spec.dir/triggers for how file changes trigger agent reactions, dependency graphs, and concurrency management.

## Convergence

See @ref:specs/cascade.spec.dir/convergence for quiet period detection, pipeline triggering, and recovery mechanisms.

## Failure Handling & Orchestrator

When the build pipeline fails, an **Orchestrator agent** (parent) handles recovery:

### @block::cascade/orchestrator @kind:entity
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

The **Cascade** is the conceptual reactive loop. The **Cascade Protocol** (@ref:specs/cascade-protocol) is the explicit coordination implementation for Pi agent session coordination.

In ideal setup (with speclangd Rust daemon), the cascade is fully automatic via inotify. When the daemon is not available, agents coordinate via explicit session handoff.
