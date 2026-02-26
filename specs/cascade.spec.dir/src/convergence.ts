// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md

import { ConvergenceStatus } from './types.js';

/**
 * Detects convergence when the cascade has been quiet for a specified period
 */
export class ConvergenceDetector {
  private quietPeriodMs: number;
  private lastActivity: Date | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private onConverge: (() => void) | null = null;

  constructor(quietPeriodMs: number = 30000) {
    this.quietPeriodMs = quietPeriodMs;
  }

  /**
   * Record an activity (file change) to reset the quiet timer
   */
  recordActivity(): void {
    this.lastActivity = new Date();
    this.resetTimer();
  }

  /**
   * Set a callback to be called when convergence is detected
   */
  onConvergeCallback(callback: () => void): void {
    this.onConverge = callback;
  }

  /**
   * Reset the convergence timer
   */
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

  /**
   * Check the current convergence status
   */
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

  /**
   * Get the time since last activity
   */
  getTimeSinceLastActivity(): number {
    if (!this.lastActivity) return 0;
    return Date.now() - this.lastActivity.getTime();
  }

  /**
   * Get the configured quiet period
   */
  getQuietPeriod(): number {
    return this.quietPeriodMs;
  }

  /**
   * Set a new quiet period
   */
  setQuietPeriod(ms: number): void {
    this.quietPeriodMs = ms;
    // Reset timer if there's recent activity
    if (this.lastActivity) {
      this.resetTimer();
    }
  }

  /**
   * Check if there's any recorded activity
   */
  hasActivity(): boolean {
    return this.lastActivity !== null;
  }

  /**
   * Reset the detector
   */
  reset(): void {
    this.lastActivity = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
