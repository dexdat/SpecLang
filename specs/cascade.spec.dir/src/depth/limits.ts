// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md

import { DepthConfig, DEFAULT_DEPTH_CONFIG } from './types.js';

/**
 * Depth limits configuration and validation
 */

export interface LimitViolation {
  limit: string;
  current: number;
  max: number;
  message: string;
}

export interface LimitCheckResult {
  valid: boolean;
  violations: LimitViolation[];
}

/**
 * Manages depth limits and validates against them
 */
export class DepthLimits {
  private config: DepthConfig;

  constructor(config: Partial<DepthConfig> = {}) {
    this.config = { ...DEFAULT_DEPTH_CONFIG, ...config };
  }

  /**
   * Validate depth against all limits
   */
  validate(depth: number, filesChanged: number, elapsedMs: number): LimitCheckResult {
    const violations: LimitViolation[] = [];

    // Check max depth
    if (depth >= this.config.max_depth) {
      violations.push({
        limit: 'max_depth',
        current: depth,
        max: this.config.max_depth,
        message: `Depth ${depth} exceeds max depth ${this.config.max_depth}`
      });
    }

    // Check max files
    if (filesChanged >= this.config.max_files_per_cascade) {
      violations.push({
        limit: 'max_files_per_cascade',
        current: filesChanged,
        max: this.config.max_files_per_cascade,
        message: `Files changed ${filesChanged} exceeds max ${this.config.max_files_per_cascade}`
      });
    }

    // Check max duration
    if (elapsedMs >= this.config.max_duration_ms) {
      violations.push({
        limit: 'max_duration_ms',
        current: elapsedMs,
        max: this.config.max_duration_ms,
        message: `Elapsed time ${elapsedMs}ms exceeds max ${this.config.max_duration_ms}ms`
      });
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Get the current config
   */
  getConfig(): DepthConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<DepthConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get a human-readable summary of limits
   */
  getLimitsSummary(): string {
    return `DepthLimits:
  max_depth: ${this.config.max_depth}
  max_files_per_cascade: ${this.config.max_files_per_cascade}
  max_duration_ms: ${this.config.max_duration_ms} (${this.formatDuration(this.config.max_duration_ms)})
  quiet_period_ms: ${this.config.quiet_period_ms} (${this.formatDuration(this.config.quiet_period_ms)})`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  }
}
