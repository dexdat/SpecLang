/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */

import { EventEmitter } from 'events';
import { FileEvent, ConvergenceEvent } from '../types/poc';

/**
 * POC Convergence Detector
 * Simple version - detects when no new events for a quiet period
 */
export class ConvergenceDetector extends EventEmitter {
  private lastEventTime: number;
  private quietPeriodMs: number;
  private cascadeStartTime: number;
  private filesChanged: Set<string>;
  private timer?: NodeJS.Timeout;
  
  constructor(options?: { quietPeriodMs?: number }) {
    super();
    this.quietPeriodMs = options?.quietPeriodMs || 5000; // 5 seconds default
    this.lastEventTime = Date.now();
    this.cascadeStartTime = Date.now();
    this.filesChanged = new Set();
    
    this.startConvergenceCheck();
  }
  
  /**
   * Called when a file event occurs
   */
  onFileChange(filePath: string): void {
    this.lastEventTime = Date.now();
    this.filesChanged.add(filePath);
  }
  
  /**
   * Start convergence checking
   */
  private startConvergenceCheck(): void {
    // Check every 500ms
    this.timer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastEvent = now - this.lastEventTime;
      
      if (timeSinceLastEvent >= this.quietPeriodMs && this.filesChanged.size > 0) {
        this.emitConvergence();
      }
    }, 500);
  }
  
  /**
   * Emit convergence event
   */
  private emitConvergence(): void {
    const duration = Date.now() - this.cascadeStartTime;
    
    const event: ConvergenceEvent = {
      timestamp: Date.now(),
      filesChanged: Array.from(this.filesChanged),
      cascadeDepth: 1, // POC: always depth 1
      duration,
      tasksExecuted: this.filesChanged.size,
      successRate: 1.0
    };
    
    // Reset for next cascade
    this.filesChanged = new Set();
    this.cascadeStartTime = Date.now();
    
    this.emit('converged', event);
  }
  
  /**
   * Stop convergence detector
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
  
  /**
   * Get current state
   */
  getState(): { filesChanged: number; lastEventTime: number } {
    return {
      filesChanged: this.filesChanged.size,
      lastEventTime: this.lastEventTime
    };
  }
}
