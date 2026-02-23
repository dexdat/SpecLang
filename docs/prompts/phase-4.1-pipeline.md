# Bootstrap Phase 4.1: Pipeline Executor

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.1 of the bootstrap process.

**Prerequisites**: 
- Phase 0-3 complete
- Code generation working

## Your Task
Implement the pipeline executor that runs after convergence. The pipeline builds, tests, and validates generated code.

## Read These Specs First
1. `specs/pipeline.spec.md` - Pipeline specification
2. `specs/recovery.spec.md` - Recovery mechanisms
3. `specs/cascade.spec.md` - Convergence detection

## What to Build

### Files to Create
```
src/pipeline/
├── index.ts            # Main exports
├── executor.ts         # Pipeline executor
├── stages.ts           # Stage definitions
├── hooks.ts            # Hook system
├── recovery.ts         # Recovery actions
├── config.ts           # Configuration
└── types.ts            # TypeScript types

tests/
└── pipeline.test.ts
```

### Requirements

#### 1. Pipeline Configuration

```yaml
# build.yaml (in project root)
convergence:
  quiet_period: 30s
  max_iterations: 100

pipeline:
  on_converge:
    - name: install
      run: "bun install"
      condition: "package.json changed"
      
    - name: typecheck
      run: "bun run tsc --noEmit"
      depends_on: [install]
      
    - name: test
      run: "bun test"
      depends_on: [typecheck]
      hooks:
        pre: "echo 'Running tests...'"
        post_fail: "speclang recover --last"
        
    - name: lint
      run: "bun run lint"
      depends_on: [typecheck]
      
  on_success:
    - "git add -A"
    - "git commit -m 'speclang: pipeline success'"
    
recovery:
  max_attempts: 3
  on_fail:
    - rollback: last_spec_change
    - notify: orchestrator
```

#### 2. Executor Implementation

```typescript
// src/pipeline/executor.ts

interface PipelineConfig {
  convergence: {
    quiet_period: number;
    max_iterations: number;
  };
  pipeline: {
    on_converge: Stage[];
    on_success: string[];
  };
  recovery: {
    max_attempts: number;
    on_fail: RecoveryAction[];
  };
}

interface Stage {
  name: string;
  run: string | string[];
  depends_on?: string[];
  condition?: string;
  timeout?: number;
  retry?: number;
  hooks?: {
    pre?: string;
    post?: string;
    post_success?: string;
    post_fail?: string;
  };
}

interface StageResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  output: string;
  duration: number;
  error?: string;
}

export class PipelineExecutor {
  private config: PipelineConfig;
  private results: Map<string, StageResult> = new Map();
  
  async run(): Promise<PipelineResult> {
    // 1. Load configuration
    this.config = await this.loadConfig();
    
    // 2. Check convergence
    if (!await this.isConverged()) {
      return { status: 'not_converged', stages: [] };
    }
    
    // 3. Execute stages in dependency order
    const stages = this.topologicalSort(this.config.pipeline.on_converge);
    
    for (const stage of stages) {
      const result = await this.executeStage(stage);
      this.results.set(stage.name, result);
      
      if (result.status === 'failed') {
        await this.handleFailure(stage, result);
        return { status: 'failed', stages: Array.from(this.results.values()) };
      }
    }
    
    // 4. Run success hooks
    for (const hook of this.config.pipeline.on_success) {
      await this.runCommand(hook);
    }
    
    return { status: 'success', stages: Array.from(this.results.values()) };
  }
  
  private async executeStage(stage: Stage): Promise<StageResult> {
    const start = Date.now();
    
    // Check condition
    if (stage.condition && !await this.evaluateCondition(stage.condition)) {
      return {
        name: stage.name,
        status: 'skipped',
        output: 'Condition not met',
        duration: 0
      };
    }
    
    // Check dependencies
    if (stage.depends_on) {
      for (const dep of stage.depends_on) {
        const depResult = this.results.get(dep);
        if (!depResult || depResult.status !== 'success') {
          return {
            name: stage.name,
            status: 'skipped',
            output: `Dependency ${dep} not satisfied`,
            duration: 0
          };
        }
      }
    }
    
    // Pre-hook
    if (stage.hooks?.pre) {
      await this.runCommand(stage.hooks.pre);
    }
    
    try {
      // Execute stage
      const commands = Array.isArray(stage.run) ? stage.run : [stage.run];
      let output = '';
      
      for (const cmd of commands) {
        output += await this.runCommand(cmd, stage.timeout);
      }
      
      // Post-success hook
      if (stage.hooks?.post_success) {
        await this.runCommand(stage.hooks.post_success);
      }
      
      return {
        name: stage.name,
        status: 'success',
        output,
        duration: Date.now() - start
      };
    } catch (error) {
      // Post-fail hook
      if (stage.hooks?.post_fail) {
        await this.runCommand(stage.hooks.post_fail);
      }
      
      return {
        name: stage.name,
        status: 'failed',
        output: error.message,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }
}
```

#### 3. Recovery Implementation

```typescript
// src/pipeline/recovery.ts

export class RecoveryManager {
  async recover(failure: StageResult): Promise<void> {
    // 1. Log failure
    await this.logFailure(failure);
    
    // 2. Determine recovery strategy
    const strategy = await this.determineStrategy(failure);
    
    switch (strategy.type) {
      case 'retry':
        await this.retryWithBackoff(failure, strategy);
        break;
        
      case 'rollback':
        await this.rollbackSpec(strategy.specPath);
        break;
        
      case 'skip':
        await this.markAsKnownFailure(failure);
        break;
        
      case 'abort':
        await this.abortAndNotify(failure);
        break;
    }
  }
  
  private async rollbackSpec(specPath: string): Promise<void> {
    // 1. Find last good commit for this spec
    const lastGood = await this.findLastGoodCommit(specPath);
    
    // 2. Revert spec
    await exec(`git checkout ${lastGood} -- ${specPath}`);
    
    // 3. Revert generated code
    const generatedPath = this.getGeneratedPath(specPath);
    await exec(`git checkout ${lastGood} -- ${generatedPath}`);
    
    // 4. Log rollback
    await this.logRollback(specPath, lastGood);
  }
  
  private async retryWithBackoff(
    failure: StageResult, 
    strategy: RetryStrategy
  ): Promise<void> {
    const maxAttempts = strategy.maxAttempts || 3;
    let delay = 1000; // Start with 1 second
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.sleep(delay);
      
      try {
        await this.executeStage(failure.stage);
        return; // Success
      } catch (error) {
        delay *= 2; // Exponential backoff
        await this.logRetry(failure, attempt, error);
      }
    }
    
    // All retries failed, escalate to rollback
    await this.rollbackSpec(strategy.specPath);
  }
}
```

#### 4. Convergence Detection

```typescript
// src/pipeline/convergence.ts

export class ConvergenceDetector {
  private lastEvent: Date | null = null;
  private quietPeriod: number; // milliseconds
  
  constructor(quietPeriodMs: number = 30000) {
    this.quietPeriod = quietPeriodMs;
  }
  
  onFileChange(event: FileEvent): void {
    this.lastEvent = new Date();
  }
  
  isConverged(): boolean {
    if (!this.lastEvent) return true;
    
    const elapsed = Date.now() - this.lastEvent.getTime();
    return elapsed >= this.quietPeriod;
  }
  
  timeUntilConverged(): number | null {
    if (this.isConverged()) return null;
    
    const elapsed = Date.now() - this.lastEvent.getTime();
    return this.quietPeriod - elapsed;
  }
}
```

#### 5. CLI Integration

```bash
# Run pipeline manually
speclang pipeline run

# Check pipeline status
speclang pipeline status

# View pipeline history
speclang pipeline history [--last N]

# Rollback last pipeline
speclang pipeline rollback

# View specific run
speclang pipeline show <run-id>
```

## Test Cases
1. Pipeline runs stages in correct order
2. Dependencies are respected
3. Conditions skip stages correctly
4. Hooks execute at right times
5. Recovery handles failures
6. Rollback restores good state
7. Convergence detection works
8. Max iterations prevents infinite loops

## Validation
```bash
bun test tests/pipeline.test.ts
speclang pipeline run --dry-run
```

## Output Format
After completing, output:
1. Files created
2. Stage execution order
3. Recovery strategies implemented
4. Test results
