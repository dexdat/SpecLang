/**
 * Convergence detection for speclangd
 * 
 * Generated from: @speclang/daemon/convergence
 * 
 * Detects when the cascade has settled (no events for quiet period)
 */

import { EventEmitter } from 'events';
import { FileEvent, ConvergenceResult, DaemonConfig } from './types';

export class ConvergenceDetector extends EventEmitter {
  private lastEventTime: number;
  private quietPeriodMs: number;
  private maxDepth: number;
  private cascadeStartTime: number;
  private filesChangedCount: number;
  private currentDepth: number;
  private converged: boolean;
  private checkTimer?: NodeJS.Timeout;

  constructor(config: DaemonConfig) {
    super();
    this.quietPeriodMs = config.convergence.quietPeriod * 1000;
    this.maxDepth = config.convergence.maxDepth;
    this.lastEventTime = Date.now();
    this.cascadeStartTime = Date.now();
    this.filesChangedCount = 0;
    this.currentDepth = 0;
    this.converged = true; // Start converged
    
    // Start periodic convergence check
    this.startConvergenceCheck();
  }

  /**
   * Called when a file event occurs
   */
  onEvent(event: FileEvent): void {
    this.lastEventTime = Date.now();
    this.filesChangedCount++;
    this.converged = false;
    
    // If this is the first event in a new cascade
    if (this.currentDepth === 0) {
      this.cascadeStartTime = Date.now();
    }
    
    this.currentDepth++;
    
    this.emit('event', event);
    console.log(`[Convergence] Event received: ${event.kind} - ${event.path}`);
    console.log(`[Convergence] Files changed: ${this.filesChangedCount}, Depth: ${this.currentDepth}`);
  }

  /**
   * Check if the system has converged (quiet for configured period)
   */
  isConverged(): boolean {
    if (this.converged) return true;
    
    const timeSinceLastEvent = Date.now() - this.lastEventTime;
    return timeSinceLastEvent >= this.quietPeriodMs;
  }

  /**
   * Get time remaining until convergence (if not yet converged)
   */
  timeRemaining(): number | null {
    if (this.isConverged()) return null;
    
    const timeSinceLastEvent = Date.now() - this.lastEventTime;
    return Math.max(0, this.quietPeriodMs - timeSinceLastEvent);
  }

  /**
   * Get current convergence status
   */
  getStatus(): {
    converged: boolean;
    filesChanged: number;
    currentDepth: number;
    timeRemaining: number | null;
    quietPeriod: number;
  } {
    return {
      converged: this.isConverged(),
      filesChanged: this.filesChangedCount,
      currentDepth: this.currentDepth,
      timeRemaining: this.timeRemaining(),
      quietPeriod: this.quietPeriodMs,
    };
  }

  /**
   * Get convergence result
   */
  getConvergenceResult(): ConvergenceResult {
    const duration = Date.now() - this.cascadeStartTime;
    
    const result: ConvergenceResult = {
      converged: this.isConverged(),
      filesChanged: this.filesChangedCount,
      duration,
      cascadeDepth: this.currentDepth,
      timestamp: Date.now(),
    };

    if (result.converged) {
      this.converged = true;
      this.emit('converged', result);
      console.log(`[Convergence] Cascade complete! Files: ${result.filesChanged}, Duration: ${duration}ms`);
    }

    return result;
  }

  /**
   * Reset convergence state
   */
  reset(): void {
    this.filesChangedCount = 0;
    this.currentDepth = 0;
    this.converged = false;
    this.cascadeStartTime = Date.now();
    console.log('[Convergence] State reset');
  }

  /**
   * Start periodic convergence checking
   */
  private startConvergenceCheck(): void {
    this.checkTimer = setInterval(() => {
      if (!this.converged && this.isConverged()) {
        this.getConvergenceResult();
      }
    }, 1000); // Check every second
  }

  /**
   * Stop convergence checking
   */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
  }

  /**
   * Wait for convergence (async)
   */
  async waitForConvergence(timeoutMs?: number): Promise<ConvergenceResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (this.isConverged()) {
          resolve(this.getConvergenceResult());
          return;
        }
        
        if (timeoutMs && Date.now() - startTime > timeoutMs) {
          reject(new Error('Convergence timeout'));
          return;
        }
        
        setTimeout(check, 500);
      };
      
      check();
    });
  }

  /**
   * Get current cascade depth
   */
  getCascadeDepth(): number {
    return this.currentDepth;
  }

  /**
   * Update max depth from config
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = depth;
  }

  /**
   * Update quiet period from config
   */
  setQuietPeriod(seconds: number): void {
    this.quietPeriodMs = seconds * 1000;
  }
}
