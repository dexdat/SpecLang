# speclang-header lines:10
id: "@speclang/roadmap/poc/convergence"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Detect when cascade has converged"
tags: [poc, convergence, detection, completion]
project_level: Alpha
agent_support: agent_autonomous
---

# POC: Convergence Detection

Know when the cascade is complete.

## Requirements

### @poc/convergence/detection

**Convergence Definition:**
No file changes for 5 consecutive seconds.

**Timer Logic:**
1. Start timer on first file change
2. Reset timer on each subsequent change
3. Trigger convergence when timer expires
4. Emit convergence event

**Event Format:**
```typescript
interface ConvergenceEvent {
  timestamp: number;
  filesChanged: string[];
  cascadeDepth: number;
  duration: number; // ms from first change to convergence
}
```

## Implementation

### @poc/convergence/impl

```typescript
import { TypedEventEmitter } from './events';
import { ConvergenceEvents, ConvergenceEvent, ConvergenceState } from './types';
import { POC_CONSTANTS } from './types';

export class ConvergenceDetector extends TypedEventEmitter<ConvergenceEvents> {
  private state: ConvergenceState = {
    isTracking: false,
    filesChanged: new Set(),
    currentDepth: 0,
    cascadeHistory: [],
    edgeGraph: new Map()  // Track edges: fileA -> fileB (fileA caused fileB to regenerate)
  };
  
  private readonly MAX_DEPTH = POC_CONSTANTS.MAX_DEPTH; // 10
  private readonly MAX_FILES_PER_CASCADE = 100;  // Prevent runaway file generation
  
  // Atomic lock using promise queue to prevent race conditions
  private processingLock: Promise<void> = Promise.resolve();
  private isLocked = false;
  
  /**
   * Acquire lock atomically using compare-and-swap pattern
   * @returns true if lock acquired, false if already locked
   */
  private acquireLock(): boolean {
    if (this.isLocked) {
      return false;
    }
    this.isLocked = true;
    return true;
  }
  
  /**
   * Release the lock
   */
  private releaseLock(): void {
    this.isLocked = false;
  }
  
  /**
   * Handle file change - reset timer
   * Includes proper circular dependency detection using edge tracking
   * Thread-safe with atomic locking
   */
  onFileChange(path: string, causedBy?: string): void {
    // Validate path is non-empty
    if (!path || typeof path !== 'string' || path.trim() === '') {
      console.error('[ConvergenceDetector] Invalid path provided to onFileChange');
      return;
    }
    
    // Atomic lock acquisition
    if (!this.acquireLock()) {
      console.error(`[ConvergenceDetector] Concurrent modification detected for ${path}, queueing`);
      // Queue this operation to run after current one completes
      this.processingLock = this.processingLock.then(() => {
        this._onFileChange(path, causedBy);
      });
      return;
    }
    
    try {
      this._onFileChange(path, causedBy);
    } finally {
      this.releaseLock();
    }
  }
  
  /**
   * Internal implementation (assumes lock is held)
   */
  private _onFileChange(path: string, causedBy?: string): void {
    // Check for runaway cascade (too many files)
    if (this.state.filesChanged.size >= this.MAX_FILES_PER_CASCADE) {
      this.emit('max-files', { 
        count: this.state.filesChanged.size,
        timestamp: Date.now()
      });
      return;
    }
    
    // Track cascade history
    this.state.cascadeHistory.push(path);
    if (this.state.cascadeHistory.length > this.MAX_DEPTH * 2) {
      this.state.cascadeHistory.shift();
    }
    
    // PROPER CIRCULAR DETECTION: Build dependency graph
    if (causedBy) {
      // Check for cycle BEFORE adding edge
      if (this.wouldCreateCycle(causedBy, path)) {
        this.state.currentDepth++;
        
        if (this.state.currentDepth >= this.MAX_DEPTH) {
          this.emit('circular-dependency', { 
            depth: this.state.currentDepth,
            from: causedBy,
            to: path,
            timestamp: Date.now(),
            cycle: this.findCycle(causedBy, path)
          });
          this.reset();
          return;
        }
        
        // Don't add edge that would create cycle
        console.warn(`[Convergence] Skipping edge ${causedBy} -> ${path} (would create cycle)`);
      } else {
        // Only add edge if it won't create a cycle
        if (!this.state.edgeGraph.has(causedBy)) {
          this.state.edgeGraph.set(causedBy, new Set());
        }
        this.state.edgeGraph.get(causedBy)!.add(path);
      }
    }
    
    this.state.filesChanged.add(path);
    
    if (!this.state.isTracking) {
      this.state.isTracking = true;
      this.state.startTime = Date.now();
      this.emit('reset', { timestamp: Date.now() });
    }
    
    this.resetTimer();
  }
  
  /**
   * Build reverse graph for O(1) predecessor lookups
   * Maps node -> set of nodes that point to it
   */
  private buildReverseGraph(): Map<string, Set<string>> {
    const reverse = new Map<string, Set<string>>();
    
    for (const [source, targets] of this.state.edgeGraph) {
      for (const target of targets) {
        if (!reverse.has(target)) {
          reverse.set(target, new Set());
        }
        reverse.get(target)!.add(source);
      }
    }
    
    return reverse;
  }
  
  /**
   * Check if adding edge from -> to would create a cycle
   * Uses iterative DFS: O(V + E) where V = files, E = dependencies
   */
  private wouldCreateCycle(from: string, to: string): boolean {
    // Use DFS to detect if 'to' can reach 'from'
    const visited = new Set<string>();
    const stack = [to];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === from) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      
      const neighbors = this.state.edgeGraph.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Find the actual cycle path for debugging
   * Uses reverse graph for O(path length) instead of O(V * path)
   */
  private findCycle(from: string, to: string): string[] {
    const reverseGraph = this.buildReverseGraph();
    const path: string[] = [to];
    let current = to;
    
    while (current !== from) {
      const predecessors = reverseGraph.get(current);
      if (!predecessors || predecessors.size === 0) break;
      
      // Get first predecessor
      const predecessor = predecessors.values().next().value;
      path.unshift(predecessor);
      current = predecessor;
      
      // Safety: prevent infinite loop
      if (path.length > this.MAX_DEPTH) break;
    }
    
    return path;
  }
  
  /**
   * Reset the convergence timer
   */
  private resetTimer(): void {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
    }
    
    this.state.timer = setTimeout(() => {
      this.emitConvergence();
    }, POC_CONSTANTS.CONVERGENCE_MS); // Use constant (5000ms)
  }
  
  /**
   * Emit convergence event and reset state
   */
  private emitConvergence(): void {
    const duration = this.state.startTime 
      ? Date.now() - this.state.startTime 
      : 0;
    
    const event: ConvergenceEvent = {
      timestamp: Date.now(),
      filesChanged: Array.from(this.state.filesChanged),
      cascadeDepth: this.state.currentDepth,
      history: [...this.state.cascadeHistory],
      duration,
      tasksExecuted: 0,  // Set by daemon
      successRate: 1.0   // Set by daemon
    };
    
    this.emit('converged', event);
    this.reset();
  }
  
  /**
   * Reset convergence state
   */
  reset(): void {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
    }
    
    this.state = {
      isTracking: false,
      filesChanged: new Set(),
      currentDepth: 0,
      cascadeHistory: [],
      edgeGraph: new Map()
    };
  }
}
```

## Safety Limits

### @poc/convergence/safety

**Max Cascade Depth:** 10
- Prevents infinite loops
- Logs warning at depth 8
- Errors at depth 10

**Max Duration:** 5 minutes
- Prevents runaway cascades
- Error and abort if exceeded
