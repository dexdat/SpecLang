/**
 * Pipeline Module - Main Exports
 * 
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline
 */

// Types
export * from './types';

// Config
export { PipelineConfigManager, loadPipelineConfig, getPipelineConfig } from './config';

// Stages
export { StageExecutor, orderStages, areDependenciesMet } from './stages';

// Hooks
export { HookExecutor, BuiltInHooks, createHookContext } from './hooks';

// Recovery
export { RecoveryExecutor, RecoveryActions } from './recovery';

// Outcome ledger (OBS-2 — cross-process counters for the MCP /metrics endpoint)
export {
  LEDGER_ENV_VAR,
  DEFAULT_LEDGER_RELATIVE_PATH,
  STAGE_RESULTS_FAMILY,
  RECOVERY_FAMILY,
  CONVERGENCE_FAMILY,
  STAGE_DURATION_FAMILY,
  readLedger,
  resolveLedgerPath,
  recordCounter,
  recordStageOutcome,
  recordRecoveryOutcome,
  recordConvergenceOutcome
} from './metrics-ledger';

// Executor
export { PipelineExecutor, createPipelineExecutor } from './executor';
