/**
 * Type definitions for Pipeline Executor
 * 
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline
 */

import { ConvergenceResult } from '../daemon/types';

// ============ Pipeline Configuration ============

export interface PipelineConfig {
  convergence: {
    quiet_period: number;
    max_iterations: number;
  };
  pipeline: {
    on_converge: Stage[];
    on_success: string[];
  };
  recovery: {
    max_attempts: number;
    on_fail: RecoveryAction[];
  };
}

// ============ Stage Types ============

export interface Stage {
  name: string;
  run: string | string[];
  depends_on?: string[];
  condition?: string;
  hooks?: StageHooks;
}

export interface StageHooks {
  pre?: string;
  post?: string;
  post_success?: string;
  post_fail?: string;
}

export interface StageResult {
  name: string;
  success: boolean;
  output: string;
  duration: number;
  error?: string;
  exitCode?: number;
}

export interface PipelineStageState {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  result?: StageResult;
}

// ============ Hook Types ============

export interface Hook {
  name: string;
  script: string;
  context: HookContext;
}

export interface HookContext {
  stage_name?: string;
  stage_success?: boolean;
  stage_output?: string;
  pipeline_result?: PipelineResult;
  timestamp: number;
}

export interface HookResult {
  name: string;
  success: boolean;
  output: string;
  duration: number;
  error?: string;
}

// ============ Recovery Types ============

export type RecoveryActionType = 'rollback' | 'notify' | 'retry' | 'pause';

export interface RecoveryAction {
  type: RecoveryActionType;
  rollback?: {
    target: 'last_spec_change' | 'last_pipeline' | 'all';
  };
  notify?: {
    target: 'orchestrator' | 'log' | 'file';
    message?: string;
  };
  retry?: {
    stage?: string;
    full_pipeline?: boolean;
  };
  pause?: {
    duration?: number;
    reason?: string;
  };
}

export interface RecoveryContext {
  error: Error;
  stage?: string;
  attempt: number;
  pipelineResult?: PipelineResult;
}

export interface RecoveryResult {
  success: boolean;
  actions: Array<{
    type: RecoveryActionType;
    success: boolean;
    error?: string;
  }>;
}

// ============ Pipeline Result Types ============

export interface PipelineResult {
  success: boolean;
  stages: StageResult[];
  duration: number;
  startTime: number;
  endTime: number;
  error?: string;
  recoveryAttempts: number;
  convergence?: ConvergenceResult;
}

// ============ Condition Evaluation ============

export interface ConditionContext {
  changed_files?: string[];
  previous_convergence?: ConvergenceResult;
  stage_results?: StageResult[];
}

// ============ Event Types ============

export interface PipelineEvent {
  type: 'stage_start' | 'stage_complete' | 'stage_fail' | 'hook_start' | 'hook_complete' | 'pipeline_complete' | 'recovery_start' | 'recovery_complete';
  timestamp: number;
  data: unknown;
}

// ============ Executor Options ============

export interface ExecutorOptions {
  configPath?: string;
  dryRun?: boolean;
  verbose?: boolean;
  onEvent?: (event: PipelineEvent) => void;
}
