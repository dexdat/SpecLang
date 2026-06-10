---
id: "@speclang/executor"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [executor, pipeline, scheduling, execution]
children:
  - "@ref:@ref:specs/executor.spec.dir/execution"  - "@ref:specs/executor.spec.dir/scheduling"

short: Pipeline executor - orchestrates stage scheduling and execution
---
# Pipeline Executor

Orchestrates pipeline stage scheduling and execution. Splits into two sub‑specs:

- **Execution** (`@ref:specs/executor.spec.dir/execution`): Running individual stages, commands, hooks, retries.
- **Scheduling** (`@ref:specs/executor.spec.dir/scheduling`): Stage ordering, dependency resolution, triggers.

## @block:pipelineexecutor @kind:entity

```typescript
export class PipelineExecutor extends EventEmitter {
  /**
   * High‑level pipeline orchestrator that combines scheduling and execution.
   * Uses a scheduler to determine order and a stage executor to run commands.
   */
  constructor(
    private scheduler: PipelineScheduler,
    private stageExecutor: StageExecutor
  ) {
    super();
  }

  /**
   * Run the entire pipeline.
   */
  async runPipeline(config: PipelineConfig): Promise<PipelineResult> {
    // 1. Schedule stages
    // 2. Execute in order
    // 3. Collect results
    // 4. Emit events
  }
}
```

## @block:createpipelineexecutor @kind:code

```typescript
export async function createPipelineExecutor(options?: ExecutorOptions): Promise<PipelineExecutor> {
  // Factory function that creates a configured PipelineExecutor
  const scheduler = new PipelineScheduler();
  const stageExecutor = new StageExecutor();
  return new PipelineExecutor(scheduler, stageExecutor);
}
```