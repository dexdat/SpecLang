# Bootstrap Phase 0.20: Cascade Depth and Cycle Detection

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.20 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.19 (Foundation + Triggers) complete
- Understanding of cascade flow

## Your Task
Implement depth tracking, limits, and cycle detection to prevent infinite cascades and protect system resources.

## Read These Specs First
1. `specs/cascade.spec.dir/triggers.spec.md` - Depth limits section
2. `specs/cascade-protocol.spec.md` - Cascade coordination
3. `specs/daemon.spec.md` - Convergence detection

## What to Build

### Files to Create
```
src/cascade/
├── depth/
│   ├── index.ts           # Main exports
│   ├── tracker.ts         # Depth tracking
│   ├── limits.ts          # Depth limits
│   ├── cycle-detection.ts # Cycle detection
│   ├── convergence.ts     # Convergence detection
│   └── types.ts           # TypeScript types

tests/
└── cascade-depth.test.ts
```

### Requirements

#### 1. Depth Types

```typescript
// src/cascade/depth/types.ts

interface DepthConfig {
  max_depth: number;
  max_files_per_cascade: number;
  max_duration_ms: number;
  quiet_period_ms: number;
}

const DEFAULT_DEPTH_CONFIG: DepthConfig = {
  max_depth: 100,
  max_files_per_cascade: 1000,
  max_duration_ms: 10 * 60 * 1000, // 10 minutes
  quiet_period_ms: 30 * 1000       // 30 seconds
};

interface DepthState {
  cascade_id: string;
  current_depth: number;
  files_changed: number;
  started_at: Date;
  last_activity: Date;
  depth_history: DepthEntry[];
}

interface DepthEntry {
  depth: number;
  file: string;
  agent: string;
  timestamp: Date;
}
```

#### 2. Depth Tracker

```typescript
// src/cascade/depth/tracker.ts

export class DepthTracker {
  private config: DepthConfig;
  private state: DepthState | null = null;
  
  constructor(config: Partial<DepthConfig> = {}) {
    this.config = { ...DEFAULT_DEPTH_CONFIG, ...config };
  }
  
  startCascade(cascadeId: string): void {
    this.state = {
      cascade_id: cascadeId,
      current_depth: 0,
      files_changed: 0,
      started_at: new Date(),
      last_activity: new Date(),
      depth_history: []
    };
  }
  
  increment(file: string, agent: string): DepthResult {
    if (!this.state) {
      throw new Error('No active cascade');
    }
    
    const newDepth = this.state.current_depth + 1;
    
    this.state.current_depth = newDepth;
    this.state.files_changed++;
    this.state.last_activity = new Date();
    
    this.state.depth_history.push({
      depth: newDepth,
      file,
      agent,
      timestamp: new Date()
    });
    
    return this.checkLimits();
  }
  
  private checkLimits(): DepthResult {
    const warnings: string[] = [];
    let shouldPause = false;
    
    // Check depth limit
    if (this.state!.current_depth >= this.config.max_depth) {
      warnings.push(`Max depth reached: ${this.config.max_depth}`);
      shouldPause = true;
    }
    
    // Check file limit
    if (this.state!.files_changed >= this.config.max_files_per_cascade) {
      warnings.push(`Max files changed: ${this.config.max_files_per_cascade}`);
      shouldPause = true;
    }
    
    // Check duration
    const elapsed = Date.now() - this.state!.started_at.getTime();
    if (elapsed >= this.config.max_duration_ms) {
      warnings.push(`Max duration reached: ${this.config.max_duration_ms}ms`);
      shouldPause = true;
    }
    
    return {
      depth: this.state!.current_depth,
      files_changed: this.state!.files_changed,
      elapsed_ms: elapsed,
      warnings,
      shouldPause,
      shouldAbort: this.hasCycle()
    };
  }
  
  reset(): void {
    this.state = null;
  }
  
  getState(): DepthState | null {
    return this.state;
  }
}

interface DepthResult {
  depth: number;
  files_changed: number;
  elapsed_ms: number;
  warnings: string[];
  shouldPause: boolean;
  shouldAbort: boolean;
}
```

#### 3. Cycle Detection

```typescript
// src/cascade/depth/cycle-detection.ts

interface CycleDetectorConfig {
  max_repeats: number;        // Same file edited N times
  max_pattern_length: number; // Pattern cycle length to detect
}

const DEFAULT_CYCLE_CONFIG: CycleDetectorConfig = {
  max_repeats: 3,
  max_pattern_length: 5
};

export class CycleDetector {
  private config: CycleDetectorConfig;
  private fileEditCounts: Map<string, number>;
  private recentFiles: string[];
  
  constructor(config: Partial<CycleDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CYCLE_CONFIG, ...config };
    this.fileEditCounts = new Map();
    this.recentFiles = [];
  }
  
  recordEdit(file: string): CycleCheckResult {
    // Track edit count
    const count = (this.fileEditCounts.get(file) || 0) + 1;
    this.fileEditCounts.set(file, count);
    
    // Track recent files
    this.recentFiles.push(file);
    if (this.recentFiles.length > this.config.max_pattern_length * 2) {
      this.recentFiles.shift();
    }
    
    return this.detectCycle();
  }
  
  private detectCycle(): CycleCheckResult {
    const cycles: string[] = [];
    
    // Check for repeated edits
    for (const [file, count] of this.fileEditCounts) {
      if (count >= this.config.max_repeats) {
        cycles.push(`File ${file} edited ${count} times`);
      }
    }
    
    // Check for repeating patterns
    const pattern = this.findRepeatingPattern();
    if (pattern) {
      cycles.push(`Pattern detected: ${pattern.join(' -> ')}`);
    }
    
    return {
      hasCycle: cycles.length > 0,
      cycleFile: this.findCycleFile(),
      reasons: cycles
    };
  }
  
  private findRepeatingPattern(): string[] | null {
    const len = this.recentFiles.length;
    if (len < 4) return null;
    
    // Try different pattern lengths
    for (let patternLen = 2; patternLen <= this.config.max_pattern_length; patternLen++) {
      if (len < patternLen * 2) continue;
      
      const recent = this.recentFiles.slice(-patternLen * 2);
      const firstHalf = recent.slice(0, patternLen);
      const secondHalf = recent.slice(patternLen);
      
      if (JSON.stringify(firstHalf) === JSON.stringify(secondHalf)) {
        return firstHalf;
      }
    }
    
    return null;
  }
  
  private findCycleFile(): string | null {
    // Find the file with most edits
    let maxFile: string | null = null;
    let maxCount = 0;
    
    for (const [file, count] of this.fileEditCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxFile = file;
      }
    }
    
    if (maxCount >= this.config.max_repeats) {
      return maxFile;
    }
    
    return null;
  }
  
  reset(): void {
    this.fileEditCounts.clear();
    this.recentFiles = [];
  }
}

interface CycleCheckResult {
  hasCycle: boolean;
  cycleFile: string | null;
  reasons: string[];
}
```

#### 4. Convergence Detection

```typescript
// src/cascade/depth/convergence.ts

export class ConvergenceDetector {
  private quietPeriodMs: number;
  private lastActivity: Date | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private onConverge: (() => void) | null = null;
  
  constructor(quietPeriodMs: number = 30000) {
    this.quietPeriodMs = quietPeriodMs;
  }
  
  recordActivity(): void {
    this.lastActivity = new Date();
    this.resetTimer();
  }
  
  onConvergeCallback(callback: () => void): void {
    this.onConverge = callback;
  }
  
  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      if (this.onConverge) {
        this.onConverge();
      }
    }, this.quietPeriodMs);
  }
  
  checkConvergence(): ConvergenceStatus {
    if (!this.lastActivity) {
      return { converged: false, reason: 'no_activity' };
    }
    
    const elapsed = Date.now() - this.lastActivity.getTime();
    const converged = elapsed >= this.quietPeriodMs;
    
    return {
      converged,
      quiet_for_ms: elapsed,
      required_ms: this.quietPeriodMs,
      reason: converged ? 'quiet_period_elapsed' : 'still_active'
    };
  }
  
  reset(): void {
    this.lastActivity = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

interface ConvergenceStatus {
  converged: boolean;
  quiet_for_ms?: number;
  required_ms?: number;
  reason: string;
}
```

#### 5. Integrated Depth Manager

```typescript
// src/cascade/depth/index.ts

export class CascadeDepthManager {
  private tracker: DepthTracker;
  private cycleDetector: CycleDetector;
  private convergenceDetector: ConvergenceDetector;
  
  constructor(config: Partial<DepthConfig> = {}) {
    this.tracker = new DepthTracker(config);
    this.cycleDetector = new CycleDetector();
    this.convergenceDetector = new ConvergenceDetector(config.quiet_period_ms);
    
    this.convergenceDetector.onConvergeCallback(() => {
      this.onCascadeComplete();
    });
  }
  
  startCascade(cascadeId: string): void {
    this.tracker.startCascade(cascadeId);
    this.cycleDetector.reset();
    this.convergenceDetector.reset();
  }
  
  onFileChange(file: string, agent: string): DepthCheckResult {
    // Record activity for convergence
    this.convergenceDetector.recordActivity();
    
    // Check for cycles
    const cycleResult = this.cycleDetector.recordEdit(file);
    if (cycleResult.hasCycle) {
      return {
        allowed: false,
        reason: 'cycle_detected',
        details: cycleResult.reasons
      };
    }
    
    // Increment depth
    const depthResult = this.tracker.increment(file, agent);
    
    if (depthResult.shouldAbort) {
      return {
        allowed: false,
        reason: 'cycle_detected',
        details: depthResult.warnings
      };
    }
    
    if (depthResult.shouldPause) {
      return {
        allowed: false,
        reason: 'limit_reached',
        details: depthResult.warnings,
        current_depth: depthResult.depth
      };
    }
    
    return {
      allowed: true,
      current_depth: depthResult.depth,
      files_changed: depthResult.files_changed
    };
  }
  
  private onCascadeComplete(): void {
    const state = this.tracker.getState();
    if (state) {
      console.log(`[convergence] Cascade ${state.cascade_id} converged`);
      console.log(`  Depth: ${state.current_depth}`);
      console.log(`  Files: ${state.files_changed}`);
      
      // Persist final state
      this.persistState(state);
    }
  }
  
  private persistState(state: DepthState): void {
    // Write to .speclang/cascade_state.json
  }
  
  getStatus(): CascadeStatus {
    const state = this.tracker.getState();
    const convergence = this.convergenceDetector.checkConvergence();
    
    return {
      active: state !== null && !convergence.converged,
      state,
      convergence
    };
  }
}

interface DepthCheckResult {
  allowed: boolean;
  reason?: string;
  details?: string[];
  current_depth?: number;
  files_changed?: number;
}

interface CascadeStatus {
  active: boolean;
  state: DepthState | null;
  convergence: ConvergenceStatus;
}
```

## Depth Flow Example

```
Depth 0:  user edits project.scl
Depth 1:  spec-writer creates auth.scl
Depth 2:  spec-writer creates auth/entities.scl
Depth 3:  spec-writer creates auth/operations.scl
Depth 4:  code-gen creates auth.go.spec
Depth 5:  code-gen creates generated/go/auth.go
Depth 6:  test-writer creates auth.test.spec.scl
Depth 7:  test-writer creates auth_test.go
Depth 8:  convergence detected (30s quiet)
```

## Test Cases
1. Track depth correctly through cascade
2. Pause at max depth
3. Pause at max files
4. Pause at max duration
5. Detect file edit cycles
6. Detect pattern cycles
7. Detect convergence after quiet period
8. Reset state between cascades
9. Persist state to disk

## Validation
```bash
bun test tests/cascade-depth.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Test results
3. Depth management summary
