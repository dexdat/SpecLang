---
id: "@speclang/executor/scheduling"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [executor, scheduling, pipeline]
parent: @ref:specs/executor
part: 2/2
siblings:
  prev: @ref:specs/executor.spec.dir/execution

short: Pipeline scheduling - stage ordering, dependency resolution, triggers
---
# Pipeline Scheduling

Responsible for determining stage execution order based on dependencies, evaluating triggers, and managing pipeline lifecycle.

## @executor/pipeline-scheduler @kind:entity

```typescript
export class PipelineScheduler {
  /**
   * Schedule pipeline stages based on dependencies.
   * Returns an ordered list of stages ready for execution.
   */
  schedule(stages: Stage[], triggers: Trigger[]): ScheduledStage[] {
    // Topological sort, evaluate conditions
  }

  /**
   * Evaluate triggers to determine if pipeline should run.
   */
  evaluateTriggers(triggers: Trigger[], changeSet: FileChange[]): boolean {
    // Check file patterns, convergence signals, etc.
  }

  /**
   * Determine which stages need to run given changes.
   */
  affectedStages(stages: Stage[], changes: FileChange[]): Stage[] {
    // Match stage conditions against changed files
  }
}
```

## @executor/dependency-graph @kind:entity

```typescript
export interface DependencyGraph {
  nodes: Stage[];
  edges: [Stage, Stage][]; // from dependent to dependency

  /**
   * Get execution order (topological sort).
   */
  getExecutionOrder(): Stage[][]; // layers of parallel stages

  /**
   * Check for cycles.
   */
  hasCycles(): boolean;
}
```

## @executor/trigger-evaluation @kind:entity

```typescript
export interface Trigger {
  name: string;
  condition: string; // glob pattern or expression
  type: 'file_change' | 'convergence' | 'schedule' | 'manual';
}

export function evaluateTrigger(trigger: Trigger, context: TriggerContext): boolean {
  // Evaluate condition against context
}
```

## @executor/pipeline-lifecycle @kind:entity

```typescript
export interface PipelineLifecycle {
  status: 'idle' | 'scheduling' | 'executing' | 'completed' | 'failed';
  currentStage?: Stage;
  completedStages: Stage[];
  failedStages: Stage[];

  /**
   * Start pipeline execution.
   */
  start(): void;

  /**
   * Pause pipeline.
   */
  pause(): void;

  /**
   * Resume pipeline.
   */
  resume(): void;

  /**
   * Cancel pipeline.
   */
  cancel(): void;
}
```