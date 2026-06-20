# speclang-header lines:11
id: "@speclang/hooks/lifecycle"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, hooks, lifecycle]
parent: "@ref:specs/hooks"
part: 1/2
short: "Hook lifecycle execution and context creation"
---
# Hook Lifecycle

Manages hook execution lifecycle: executing hooks, creating context, handling errors, and running multiple hooks.

## @block:hookexecutor @kind:entity

```typescript
export class HookExecutor {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  async execute(hook: Hook): Promise<HookResult> {
    // Executes a single hook script, captures output, handles errors
  }

  async executeMultiple(hooks: Hook[]): Promise<HookResult[]> {
    // Executes multiple hooks sequentially, continues on failure
  }

  private runScript(script: string): Promise<string> {
    // Runs shell script via child process spawn
  }
}
```

## @block:createhookcontext @kind:code

```typescript
export function createHookContext(
  stageName?: string,
  stageSuccess?: boolean,
  stageOutput?: string,
  pipelineResult?: unknown
): HookContext {
  // Creates a hook context with stage information and timestamp
  return {
    stage_name: stageName,
    stage_success: stageSuccess,
    stage_output: stageOutput,
    pipeline_result: pipelineResult as never,
    timestamp: Date.now(),
  };
}
```

## @block:hookcontext @kind:entity

```typescript
export interface HookContext {
  stage_name?: string;
  stage_success?: boolean;
  stage_output?: string;
  pipeline_result?: unknown;
  timestamp: number;
}
```

Note: Hook and HookResult types are defined in the pipeline types spec (`@ref:specs/pipeline/types`).