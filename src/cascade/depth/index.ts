// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md

import * as fs from 'fs';
import * as path from 'path';

import { DepthTracker } from './tracker.js';
import { CycleDetector } from './cycle-detection.js';
import { ConvergenceDetector } from './convergence.js';
import { DepthConfig, DepthState, DepthCheckResult, CascadeStatus, DEFAULT_DEPTH_CONFIG } from './types.js';

/**
 * Integrated cascade depth manager
 * Coordinates depth tracking, cycle detection, and convergence
 */
export class CascadeDepthManager {
  private tracker: DepthTracker;
  private cycleDetector: CycleDetector;
  private convergenceDetector: ConvergenceDetector;
  private stateDir: string;

  constructor(config: Partial<DepthConfig> = {}) {
    this.tracker = new DepthTracker(config);
    this.cycleDetector = new CycleDetector();
    this.convergenceDetector = new ConvergenceDetector(
      config.quiet_period_ms || DEFAULT_DEPTH_CONFIG.quiet_period_ms
    );
    this.stateDir = '.speclang';

    // Connect cycle detector to tracker
    this.tracker.setCycleChecker(() => {
      const cycleResult = this.cycleDetector.checkForCycles();
      return cycleResult.hasCycle;
    });

    // Set up convergence callback
    this.convergenceDetector.onConvergeCallback(() => {
      this.onCascadeComplete();
    });
  }

  /**
   * Start a new cascade
   */
  startCascade(cascadeId: string): void {
    this.tracker.startCascade(cascadeId);
    this.cycleDetector.reset();
    this.convergenceDetector.reset();
    console.log(`[depth] Cascade ${cascadeId} started`);
  }

  /**
   * Handle a file change event
   * Returns whether the cascade should continue
   */
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

  /**
   * Called when convergence is detected
   */
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

  /**
   * Persist cascade state to disk
   */
  private persistState(state: DepthState): void {
    try {
      // Ensure directory exists
      if (!fs.existsSync(this.stateDir)) {
        fs.mkdirSync(this.stateDir, { recursive: true });
      }

      const stateFile = path.join(this.stateDir, 'cascade_state.json');
      const stateData = {
        ...state,
        started_at: state.started_at.toISOString(),
        last_activity: state.last_activity.toISOString(),
        depth_history: state.depth_history.map(entry => ({
          ...entry,
          timestamp: entry.timestamp.toISOString()
        })),
        converged_at: new Date().toISOString()
      };

      fs.writeFileSync(stateFile, JSON.stringify(stateData, null, 2));
      console.log(`[depth] State persisted to ${stateFile}`);
    } catch (error) {
      console.error(`[depth] Failed to persist state: ${error}`);
    }
  }

  /**
   * Get the current status of the cascade
   */
  getStatus(): CascadeStatus {
    const state = this.tracker.getState();
    const convergence = this.convergenceDetector.checkConvergence();

    return {
      active: state !== null && !convergence.converged,
      state,
      convergence
    };
  }

  /**
   * Check if a cascade is currently active
   */
  isActive(): boolean {
    return this.tracker.isActive();
  }

  /**
   * Get the cycle detector for external access
   */
  getCycleDetector(): CycleDetector {
    return this.cycleDetector;
  }

  /**
   * Get the convergence detector for external access
   */
  getConvergenceDetector(): ConvergenceDetector {
    return this.convergenceDetector;
  }

  /**
   * Set the state directory for persistence
   */
  setStateDir(dir: string): void {
    this.stateDir = dir;
  }

  /**
   * Reset all state (for testing or manual reset)
   */
  reset(): void {
    this.tracker.reset();
    this.cycleDetector.reset();
    this.convergenceDetector.reset();
  }
}

// Re-export types
export * from './types.js';
export { DepthTracker } from './tracker.js';
export { CycleDetector } from './cycle-detection.js';
export { ConvergenceDetector } from './convergence.js';
