# Bootstrap Phase 4.5: Pipeline Hook System

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.5 of the bootstrap process.

**Prerequisites**: Phase 4.1 (Pipeline), Phase 4.4 (Git History) complete.

## Your Task
Implement the hook system that runs actions before and after pipeline stages.

## Read These Specs First
1. `specs/pipeline.spec.dir/hooks.spec.md` - Hook specification
2. `specs/pipeline.spec.dir/build.spec.md` - Build stages

## Hook Types

```yaml
hooks:
  pre: run before stage
  post: run after stage (success or fail)
  post_success: run only on success
  post_fail: run only on failure
```

## Implementation

### 1. Hook Types (`pipeline/hooks.ts`)

```typescript
export type HookType = 'pre' | 'post' | 'post_success' | 'post_fail';

export interface Hook {
  type: HookType;
  command: string | string[];
  timeout?: number;
  continueOnError?: boolean;
  env?: Record<string, string>;
}

export interface HookContext {
  stageName: string;
  stageResult?: StageResult;
  projectRoot: string;
  changedFiles: string[];
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface HookResult {
  hook: Hook;
  output: string;
  success: boolean;
  duration: number;
  error?: string;
}
```

### 2. Hook Executor (`pipeline/hook-executor.ts`)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class HookExecutor {
  private builtInHooks: Map<string, BuiltInHook>;
  
  constructor() {
    this.builtInHooks = new Map([
      ['speclang_rollback', this.rollbackHook.bind(this)],
      ['speclang_notify', this.notifyHook.bind(this)],
      ['speclang_log', this.logHook.bind(this)],
      ['speclang_commit', this.commitHook.bind(this)],
    ]);
  }
  
  async executeHooks(
    hooks: Hook[] | Hook | string | string[],
    context: HookContext
  ): Promise<HookResult[]> {
    const normalizedHooks = this.normalizeHooks(hooks);
    const results: HookResult[] = [];
    
    for (const hook of normalizedHooks) {
      const result = await this.executeHook(hook, context);
      results.push(result);
      
      if (!result.success && !hook.continueOnError) {
        break;
      }
    }
    
    return results;
  }
  
  private async executeHook(hook: Hook, context: HookContext): Promise<HookResult> {
    const start = Date.now();
    
    try {
      const commands = Array.isArray(hook.command) ? hook.command : [hook.command];
      let output = '';
      
      for (const cmd of commands) {
        const processedCmd = this.interpolateVariables(cmd, context);
        
        // Check for built-in hook
        const builtIn = this.matchBuiltIn(processedCmd);
        if (builtIn) {
          output += await builtIn(context);
        } else {
          // Execute shell command
          const result = await execAsync(processedCmd, {
            cwd: context.projectRoot,
            env: { ...process.env, ...hook.env },
            timeout: hook.timeout || 30000,
          });
          output += result.stdout + result.stderr;
        }
      }
      
      return {
        hook,
        output,
        success: true,
        duration: Date.now() - start,
      };
    } catch (error: any) {
      return {
        hook,
        output: error.message,
        success: false,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  }
  
  private interpolateVariables(cmd: string, context: HookContext): string {
    return cmd
      .replace(/\{\{stage\}\}/g, context.stageName)
      .replace(/\{\{count\}\}/g, String(context.changedFiles.length))
      .replace(/\{\{files\}\}/g, context.changedFiles.join(' '))
      .replace(/\{\{timestamp\}\}/g, context.timestamp.toISOString())
      .replace(/\{\{root\}\}/g, context.projectRoot);
  }
  
  private matchBuiltIn(cmd: string): BuiltInHook | null {
    const match = cmd.match(/^speclang_(\w+)/);
    if (match) {
      return this.builtInHooks.get(`speclang_${match[1]}`) || null;
    }
    return null;
  }
  
  private normalizeHooks(hooks: any): Hook[] {
    if (!hooks) return [];
    if (typeof hooks === 'string') {
      return [{ type: 'post', command: hooks }];
    }
    if (Array.isArray(hooks)) {
      return hooks.map(h => typeof h === 'string' ? { type: 'post', command: h } : h);
    }
    return [hooks];
  }
}
```

### 3. Built-in Hooks

```typescript
type BuiltInHook = (context: HookContext) => Promise<string>;

class HookExecutor {
  private async rollbackHook(context: HookContext): Promise<string> {
    const { stageResult } = context;
    
    // Find last spec change
    const lastChange = await this.findLastSpecChange();
    if (!lastChange) {
      throw new Error('No spec change to rollback');
    }
    
    // Execute rollback
    await execAsync(`git checkout ${lastChange.commit} -- ${lastChange.specPath}`);
    await execAsync(`git checkout ${lastChange.commit} -- ${lastChange.generatedPath}`);
    
    return `Rolled back ${lastChange.specPath} to ${lastChange.commit}`;
  }
  
  private async notifyHook(context: HookContext): Promise<string> {
    const message = context.stageResult?.status === 'success'
      ? `Stage ${context.stageName} completed successfully`
      : `Stage ${context.stageName} failed: ${context.stageResult?.error}`;
    
    // Send to north star via MCP
    const response = await fetch('http://localhost:3000/mcp/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });
    
    if (!response.ok) {
      throw new Error(`Notification failed: ${response.status}`);
    }
    
    return `Notified: ${message}`;
  }
  
  private async logHook(context: HookContext): Promise<string> {
    const logPath = path.join(context.projectRoot, '.speclang', 'hooks.log');
    const entry = {
      timestamp: context.timestamp.toISOString(),
      stage: context.stageName,
      result: context.stageResult,
    };
    
    await fs.appendFile(logPath, JSON.stringify(entry) + '\n');
    return `Logged to ${logPath}`;
  }
  
  private async commitHook(context: HookContext): Promise<string> {
    const message = `speclang: ${context.stageName} ${context.stageResult?.status || 'completed'}`;
    
    await execAsync('git add -A', { cwd: context.projectRoot });
    await execAsync(`git commit -m "${message}"`, { cwd: context.projectRoot });
    
    return `Committed: ${message}`;
  }
}
```

### 4. Hook Configuration in Stages

```yaml
pipeline:
  on_converge:
    - name: test
      run: "go test ./..."
      hooks:
        pre: "echo 'Testing {{count}} files...'"
        post_success: "speclang notify 'All tests passed'"
        post_fail:
          - "speclang rollback --last-spec"
          - "speclang notify 'Tests failed, rolled back'"
          
    - name: lint
      run: "golangci-lint run"
      hooks:
        pre: "echo 'Running linter...'"
        post_fail: "speclang log --level=error"
        
    - name: build
      run: "go build ./..."
      hooks:
        pre:
          - "echo 'Building...'"
          - "speclang log 'Build started'"
        post: "echo 'Build {{stage}} complete'"
```

### 5. Hook Execution Flow

```typescript
export class PipelineStage {
  private hookExecutor: HookExecutor;
  
  async execute(stage: StageConfig, context: HookContext): Promise<StageResult> {
    const start = Date.now();
    
    // Pre-hooks
    if (stage.hooks?.pre) {
      const preResults = await this.hookExecutor.executeHooks(
        stage.hooks.pre,
        { ...context, stageName: stage.name }
      );
      
      if (preResults.some(r => !r.success)) {
        return {
          name: stage.name,
          status: 'failed',
          output: 'Pre-hook failed',
          duration: Date.now() - start,
          error: preResults.find(r => !r.success)?.error,
        };
      }
    }
    
    try {
      // Execute stage
      const output = await this.runStageCommand(stage);
      
      // Post-success hooks
      if (stage.hooks?.post_success) {
        await this.hookExecutor.executeHooks(
          stage.hooks.post_success,
          { ...context, stageName: stage.name, stageResult: { status: 'success' } }
        );
      }
      
      // Post hooks (always)
      if (stage.hooks?.post) {
        await this.hookExecutor.executeHooks(
          stage.hooks.post,
          { ...context, stageName: stage.name, stageResult: { status: 'success' } }
        );
      }
      
      return {
        name: stage.name,
        status: 'success',
        output,
        duration: Date.now() - start,
      };
    } catch (error: any) {
      // Post-fail hooks
      if (stage.hooks?.post_fail) {
        await this.hookExecutor.executeHooks(
          stage.hooks.post_fail,
          { ...context, stageName: stage.name, stageResult: { status: 'failed', error: error.message } }
        );
      }
      
      // Post hooks (always)
      if (stage.hooks?.post) {
        await this.hookExecutor.executeHooks(
          stage.hooks.post,
          { ...context, stageName: stage.name, stageResult: { status: 'failed', error: error.message } }
        );
      }
      
      return {
        name: stage.name,
        status: 'failed',
        output: error.message,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  }
}
```

## Hook Variables

```yaml
Available in all hook commands:
  {{stage}}      - Current stage name
  {{count}}      - Number of changed files
  {{files}}      - Space-separated list of changed files
  {{timestamp}}  - ISO timestamp
  {{root}}       - Project root path
  {{status}}     - Stage status (success/failed)
  {{duration}}   - Stage duration in ms
```

## CLI Interface

```bash
# Test hooks for a stage
speclang pipeline hooks test --stage build

# Run a specific hook manually
speclang pipeline hooks run speclang_notify "Custom message"

# List all built-in hooks
speclang pipeline hooks list-builtins

# Validate hook configuration
speclang pipeline hooks validate build.yaml
```

## Test Cases
1. Pre-hook runs before stage
2. Post-success hook runs on success
3. Post-fail hook runs on failure
4. Post hook always runs
5. Built-in hooks work correctly
6. Variable interpolation works
7. Multiple hooks execute in order
8. Hook failure can stop pipeline
9. continueOnError allows continuing
10. Timeout kills long-running hooks
11. Environment variables passed to hooks
12. Hook output captured in logs

## Output
1. HookExecutor implementation
2. Built-in hooks (rollback, notify, log, commit)
3. Hook type definitions
4. Variable interpolation
5. Integration with pipeline stages
6. CLI commands for hook management
