# speclang-header lines:12
id: "@speclang/roadmap/poc/convergence"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Detect when cascade has converged"
tags: [poc, convergence, detection, completion]
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
import { POC_CONSTANTS } from './constants';

export class ConvergenceDetector extends TypedEventEmitter<ConvergenceEvents> {
  private state: ConvergenceState = {
    isTracking: false,
    filesChanged: new Set(),
    currentDepth: 0
  };
  
  /**
   * Handle file change - reset timer
   */
  onFileChange(path: string): void {
    this.state.filesChanged.add(path);
    
    if (!this.state.isTracking) {
      this.state.isTracking = true;
      this.state.startTime = Date.now();
      this.emit('reset', { timestamp: Date.now() });
    }
    
    this.resetTimer();
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
      currentDepth: 0
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
