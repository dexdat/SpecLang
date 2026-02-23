# Bootstrap Phase 4.6: Pipeline Stage Execution

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.6 of the bootstrap process.

**Prerequisites**: Phase 4.1 (Pipeline), Phase 4.5 (Hooks) complete.

## Your Task
Implement stage execution with dependency ordering, conditions, and parallel execution.

## Read These Specs First
1. `specs/pipeline.spec.dir/build.spec.md` - Build stages specification

## Stage Structure

```yaml
stages:
  - name: string
    run: command | command[]
    depends_on: string[]?
    condition: string?
    timeout: duration?
    retry: int?
    parallel: bool?
```

## Implementation

### 1. Stage Types (`pipeline/stages.ts`)

```typescript
export interface Stage {
  name: string;
  run: string | string[];
  depends_on?: string[];
  condition?: string;
  timeout?: number;  // milliseconds
  retry?: number;
  parallel?: boolean;
  hooks?: StageHooks;
}

export interface StageResult {
  name: string;
  status: 'success' | 'failed' | 'skipped' | 'pending';
  output: string;
  duration: number;
  error?: string;
  attempts: number;
}

export interface StageHooks {
  pre?: string | string[];
  post?: string | string[];
  post_success?: string | string[];
  post_fail?: string | string[];
}

export interface StageContext {
  changedFiles: string[];
  previousResults: Map<string, StageResult>;
  projectRoot: string;
  environment: Record<string, string>;
}
```

### 2. Dependency Resolution (`pipeline/dependency-resolver.ts`)

```typescript
export class DependencyResolver {
  resolve(stages: Stage[]): Stage[][] {
    const graph = this.buildGraph(stages);
    const sorted = this.topologicalSort(graph);
    return this.groupByLevel(sorted, graph);
  }
  
  private buildGraph(stages: Stage[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    for (const stage of stages) {
      graph.set(stage.name, new Set(stage.depends_on || []));
    }
    
    // Validate all dependencies exist
    for (const stage of stages) {
      for (const dep of stage.depends_on || []) {
        if (!graph.has(dep)) {
          throw new Error(`Stage "${stage.name}" depends on unknown stage "${dep}"`);
        }
      }
    }
    
    // Check for cycles
    this.detectCycle(graph);
    
    return graph;
  }
  
  private detectCycle(graph: Map<string, Set<string>>): void {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    
    for (const node of graph.keys()) {
      color.set(node, WHITE);
    }
    
    const dfs = (node: string): boolean => {
      color.set(node, GRAY);
      
      for (const dep of graph.get(node) || []) {
        const depColor = color.get(dep);
        if (depColor === GRAY) return true;  // Back edge = cycle
        if (depColor === WHITE && dfs(dep)) return true;
      }
      
      color.set(node, BLACK);
      return false;
    };
    
    for (const node of graph.keys()) {
      if (color.get(node) === WHITE && dfs(node)) {
        throw new Error('Circular dependency detected in stages');
      }
    }
  }
  
  private topologicalSort(graph: Map<string, Set<string>>): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      
      for (const dep of graph.get(node) || []) {
        visit(dep);
      }
      
      result.push(node);
    };
    
    for (const node of graph.keys()) {
      visit(node);
    }
    
    return result;
  }
  
  groupByLevel(sorted: string[], graph: Map<string, Set<string>>): Stage[][] {
    const levels = new Map<string, number>();
    
    for (const node of sorted) {
      const deps = graph.get(node) || new Set();
      const maxDepLevel = Math.max(0, ...Array.from(deps).map(d => levels.get(d) || 0));
      levels.set(node, maxDepLevel + 1);
    }
    
    const groups = new Map<number, string[]>();
    for (const [node, level] of levels) {
      if (!groups.has(level)) groups.set(level, []);
      groups.get(level)!.push(node);
    }
    
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, nodes]) => nodes);
  }
}
```

### 3. Stage Executor (`pipeline/stage-executor.ts`)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class StageExecutor {
  private resolver: DependencyResolver;
  private hookExecutor: HookExecutor;
  private defaultTimeout: number = 300000; // 5 minutes
  
  constructor() {
    this.resolver = new DependencyResolver();
    this.hookExecutor = new HookExecutor();
  }
  
  async executeAll(stages: Stage[], context: StageContext): Promise<Map<string, StageResult>> {
    const results = new Map<string, StageResult>();
    
    // Resolve execution order
    const levels = this.resolver.resolve(stages);
    const stageMap = new Map(stages.map(s => [s.name, s]));
    
    for (const level of levels) {
      // Check which stages in this level can run
      const runnable = level.filter(name => this.canRun(name, stageMap, results));
      
      if (runnable.length === 0) {
        // All stages in this level blocked, fail
        break;
      }
      
      // Run stages in parallel within level
      const promises = runnable.map(name => this.executeStage(
        stageMap.get(name)!,
        { ...context, previousResults: results }
      ));
      
      const levelResults = await Promise.all(promises);
      
      for (const result of levelResults) {
        results.set(result.name, result);
      }
    }
    
    return results;
  }
  
  private canRun(
    name: string,
    stageMap: Map<string, Stage>,
    results: Map<string, StageResult>
  ): boolean {
    const stage = stageMap.get(name)!;
    
    // Check all dependencies succeeded
    for (const dep of stage.depends_on || []) {
      const depResult = results.get(dep);
      if (!depResult || depResult.status !== 'success') {
        return false;
      }
    }
    
    return true;
  }
  
  async executeStage(stage: Stage, context: StageContext): Promise<StageResult> {
    const start = Date.now();
    const maxAttempts = stage.retry || 1;
    
    // Check condition
    if (stage.condition && !this.evaluateCondition(stage.condition, context)) {
      return {
        name: stage.name,
        status: 'skipped',
        output: 'Condition not met',
        duration: 0,
        attempts: 0,
      };
    }
    
    // Check dependencies
    if (stage.depends_on) {
      for (const dep of stage.depends_on) {
        const depResult = context.previousResults.get(dep);
        if (!depResult || depResult.status !== 'success') {
          return {
            name: stage.name,
            status: 'skipped',
            output: `Dependency ${dep} not satisfied`,
            duration: 0,
            attempts: 0,
          };
        }
      }
    }
    
    // Execute with retry
    let lastError: string | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const output = await this.runCommands(stage, context);
        
        return {
          name: stage.name,
          status: 'success',
          output,
          duration: Date.now() - start,
          attempts: attempt,
        };
      } catch (error: any) {
        lastError = error.message;
        
        if (attempt < maxAttempts) {
          await this.delay(1000 * attempt);  // Exponential backoff
        }
      }
    }
    
    return {
      name: stage.name,
      status: 'failed',
      output: lastError || 'Unknown error',
      duration: Date.now() - start,
      error: lastError,
      attempts: maxAttempts,
    };
  }
  
  private async runCommands(stage: Stage, context: StageContext): Promise<string> {
    const commands = Array.isArray(stage.run) ? stage.run : [stage.run];
    const timeout = stage.timeout || this.defaultTimeout;
    let output = '';
    
    for (const cmd of commands) {
      const result = await execAsync(cmd, {
        cwd: context.projectRoot,
        env: { ...process.env, ...context.environment },
        timeout,
        maxBuffer: 10 * 1024 * 1024,  // 10MB
      });
      
      output += result.stdout;
      if (result.stderr) output += '\n' + result.stderr;
    }
    
    return output;
  }
  
  private evaluateCondition(condition: string, context: StageContext): boolean {
    // Parse condition language
    // Examples:
    //   "*.go files changed"
    //   "package.json changed"
    //   "specs/ changed"
    
    const goMatch = condition.match(/^(\S+)\s+(files?\s+)?changed$/);
    if (goMatch) {
      const pattern = goMatch[1];
      return context.changedFiles.some(f => this.matchesPattern(f, pattern));
    }
    
    // Simple glob matching
    return context.changedFiles.some(f => minimatch(f, condition));
  }
  
  private matchesPattern(file: string, pattern: string): boolean {
    if (pattern.startsWith('*.')) {
      return file.endsWith(pattern.slice(1));
    }
    if (pattern.endsWith('/**')) {
      return file.startsWith(pattern.slice(0, -3));
    }
    if (pattern.endsWith('/*')) {
      const dir = pattern.slice(0, -2);
      return file.startsWith(dir + '/');
    }
    return minimatch(file, pattern);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Parallel Execution

```typescript
export class ParallelExecutor {
  async executeGroup(
    stages: Stage[],
    context: StageContext,
    maxParallel: number = 4
  ): Promise<StageResult[]> {
    const results: StageResult[] = [];
    const queue = [...stages];
    const running: Promise<StageResult>[] = [];
    
    while (queue.length > 0 || running.length > 0) {
      // Fill up to maxParallel
      while (running.length < maxParallel && queue.length > 0) {
        const stage = queue.shift()!;
        running.push(this.executeStage(stage, context));
      }
      
      if (running.length > 0) {
        // Wait for any to complete
        const result = await Promise.race(running);
        results.push(result);
        
        // Remove completed from running
        const idx = running.findIndex(
          p => p.then(r => r.name === result.name).catch(() => false)
        );
        if (idx >= 0) running.splice(idx, 1);
      }
    }
    
    return results;
  }
}
```

### 5. Stage Configuration Examples

```yaml
# Simple sequential stages
pipeline:
  on_converge:
    - name: install
      run: "npm install"
      
    - name: build
      run: "npm run build"
      depends_on: [install]
      
    - name: test
      run: "npm test"
      depends_on: [build]

# Parallel stages
pipeline:
  on_converge:
    - name: install-go
      run: "go mod tidy"
      
    - name: install-npm
      run: "npm ci"
      
    - name: build-go
      run: "go build ./..."
      depends_on: [install-go]
      
    - name: build-npm
      run: "npm run build"
      depends_on: [install-npm]
      
    - name: test
      run: "npm test && go test ./..."
      depends_on: [build-go, build-npm]

# Conditional stages
pipeline:
  on_converge:
    - name: go-test
      run: "go test ./..."
      condition: "*.go files changed"
      
    - name: npm-test
      run: "npm test"
      condition: "package.json changed"

# Retry stages
pipeline:
  on_converge:
    - name: flaky-test
      run: "npm test"
      retry: 3
      timeout: 120000
```

## Execution Order Visualization

```
Level 0: [install-go] [install-npm]     <- Parallel
    ↓           ↓
Level 1: [build-go] [build-npm]          <- Parallel (both deps met)
    ↓           ↓
Level 2: [test]                          <- Waits for both
```

## CLI Interface

```bash
# Show stage execution order
speclang pipeline stages list --resolve

# Run specific stage
speclang pipeline stages run build

# Show stage dependencies
speclang pipeline stages deps test

# Dry run (show what would execute)
speclang pipeline stages dry-run
```

## Test Cases
1. Stages run in dependency order
2. Parallel stages execute concurrently
3. Failed dependency skips dependent stage
4. Condition skips stage correctly
5. Retry works on failure
6. Timeout kills long-running stage
7. Circular dependency detected
8. Missing dependency causes error
9. Multiple dependencies all required
10. Stage output captured correctly
11. Environment passed to commands
12. Dependency graph visualization

## Output
1. DependencyResolver with cycle detection
2. StageExecutor with parallel execution
3. Condition evaluation
4. Retry with backoff
5. Timeout handling
6. CLI commands for stage management
