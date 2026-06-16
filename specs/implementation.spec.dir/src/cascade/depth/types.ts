// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md

/**
 * TypeScript types for cascade depth management
 */

export interface DepthConfig {
  max_depth: number;
  max_files_per_cascade: number;
  max_duration_ms: number;
  quiet_period_ms: number;
}

export const DEFAULT_DEPTH_CONFIG: DepthConfig = {
  max_depth: 100,
  max_files_per_cascade: 1000,
  max_duration_ms: 10 * 60 * 1000, // 10 minutes
  quiet_period_ms: 30 * 1000       // 30 seconds
};

export interface DepthState {
  cascade_id: string;
  current_depth: number;
  files_changed: number;
  started_at: Date;
  last_activity: Date;
  depth_history: DepthEntry[];
}

export interface DepthEntry {
  depth: number;
  file: string;
  agent: string;
  timestamp: Date;
}

export interface DepthResult {
  depth: number;
  files_changed: number;
  elapsed_ms: number;
  warnings: string[];
  shouldPause: boolean;
  shouldAbort: boolean;
}

export interface CycleDetectorConfig {
  max_repeats: number;
  max_pattern_length: number;
}

export const DEFAULT_CYCLE_CONFIG: CycleDetectorConfig = {
  max_repeats: 3,
  max_pattern_length: 5
};

export interface CycleCheckResult {
  hasCycle: boolean;
  cycleFile: string | null;
  reasons: string[];
}

export interface ConvergenceStatus {
  converged: boolean;
  quiet_for_ms?: number;
  required_ms?: number;
  reason: string;
}

export interface DepthCheckResult {
  allowed: boolean;
  reason?: string;
  details?: string[];
  current_depth?: number;
  files_changed?: number;
}

export interface CascadeStatus {
  active: boolean;
  state: DepthState | null;
  convergence: ConvergenceStatus;
}
