# speclang-header lines:12
id: "@speclang/executor/execution"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [executor, execution, pipeline]
parent: "@ref:specs/executor"


short: "Pipeline stage execution - running commands, hooks, retries"
---
# Stage Execution

Responsible for executing individual pipeline stages, handling command execution, output capture, timeouts, retries, and hooks.

## @executor/stage-executor @kind:entity

```typescript
export class StageExecutor {
  /**
   * Execute a single pipeline stage.
   * @param stage The stage definition
   * @param context Execution context (env vars, working directory, etc.)
   * @returns StageResult with output, status, duration
   */
  async execute(stage: Stage, context: ExecutionContext): Promise<StageResult> {
    // Implementation
  }

  /**
   * Run pre/post hooks for a stage.
   */
  async runHooks(hooks: StageHooks, context: HookContext): Promise<HookResult> {
    // Implementation
  }

  /**
   * Handle retry logic for failed stage.
   */
  async retry(stage: Stage, previousResult: StageResult, context: ExecutionContext): Promise<StageResult> {
    // Implementation
  }
}
```

## @executor/execution-context @kind:entity

```typescript
export interface ExecutionContext {
  env: Record<string, string>;
  cwd: string;
  logger: Logger;
  timeoutMs: number;
  maxRetries: number;
}
```

## @executor/command-executor @kind:entity

```typescript
export interface CommandExecutor {
  /**
   * Execute a shell command.
   */
  run(command: string, options: CommandOptions): Promise<CommandResult>;
}

export interface CommandOptions {
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}
```

## @executor/hook-execution @kind:entity

```typescript
export interface HookExecutor {
  /**
   * Execute a hook (pre/post stage).
   */
  execute(hook: Hook, context: HookContext): Promise<HookResult>;
}
```