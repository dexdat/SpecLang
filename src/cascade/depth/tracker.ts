// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md

import { DepthConfig, DepthState, DepthEntry, DepthResult, DEFAULT_DEPTH_CONFIG } from './types.js';

/**
 * Tracks the depth of a cascade to prevent infinite loops
 */
export class DepthTracker {
  private config: DepthConfig;
  private state: DepthState | null = null;
  private hasCycleChecker: (() => boolean) | null = null;

  constructor(config: Partial<DepthConfig> = {}) {
    this.config = { ...DEFAULT_DEPTH_CONFIG, ...config };
  }

  /**
   * Set a cycle checker function to be called during limit checks
   */
  setCycleChecker(checker: () => boolean): void {
    this.hasCycleChecker = checker;
  }

  /**
   * Start a new cascade with the given ID
   */
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

  /**
   * Increment depth for a new file change
   */
  increment(file: string, agent: string): DepthResult {
    if (!this.state) {
      throw new Error('No active cascade. Call startCascade() first.');
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

  /**
   * Check if any limits have been reached
   */
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

    const hasCycle = this.hasCycleChecker ? this.hasCycleChecker() : false;

    return {
      depth: this.state!.current_depth,
      files_changed: this.state!.files_changed,
      elapsed_ms: elapsed,
      warnings,
      shouldPause,
      shouldAbort: hasCycle
    };
  }

  /**
   * Reset the tracker state
   */
  reset(): void {
    this.state = null;
  }

  /**
   * Get the current state
   */
  getState(): DepthState | null {
    return this.state;
  }

  /**
   * Get the configuration
   */
  getConfig(): DepthConfig {
    return { ...this.config };
  }

  /**
   * Check if a cascade is currently active
   */
  isActive(): boolean {
    return this.state !== null;
  }
}
