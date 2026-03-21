/**
 * SPECLANG-GENERATED: Agent-autonomous agent support types
 * Source: @specs/agent-support-levels/levels#agent-autonomous
 */

/**
 * Agent-autonomous execution levels
 */
export type AgentAutonomousLevel = 
  | 'autonomous_execute'
  | 'autonomous_with_rollback'
  | 'autonomous_full_control'
  | 'autonomous_deploy';

/**
 * Configuration for agent-autonomous mode
 */
export interface AgentAutonomousConfig {
  level: AgentAutonomousLevel;
  requireHumanGuidance: boolean;
  confirmationRequired: boolean;
  approvalRequired: boolean;
  autoRollback: boolean;
  selfHealing: boolean;
  maxAutonomyDepth: number;
  deploymentEnabled: boolean;
}

/**
 * Result from agent-autonomous enforcement check
 */
export interface AutonomousResult {
  allowed: boolean;
  reason?: string;
  blockedBy?: string;
  requiresReview?: boolean;
  autonomyLevel?: AgentAutonomousLevel;
  canRollback?: boolean;
  canSelfHeal?: boolean;
  maxDepth?: number;
}

/**
 * Agent action types (shared with agent-assisted)
 */
export type AgentAction = 
  | 'read_spec'
  | 'suggest_improvements'
  | 'propose_edits'
  | 'generate_draft_code'
  | 'run_tests'
  | 'report_results'
  | 'execute_with_guidance'
  | 'autonomous_execute'
  | 'autonomous_deploy';

/**
 * Execution context for autonomous actions
 */
export interface ExecutionContext {
  specId: string;
  filePath: string;
  metadata: Record<string, unknown>;
  dependencies: string[];
  riskAssessment: RiskLevel;
}

/**
 * Risk levels for autonomous execution
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Autonomous execution result
 */
export interface AutonomousExecutionResult {
  id: string;
  action: AgentAction;
  status: 'running' | 'completed' | 'failed' | 'recovered';
  startedAt: Date;
  completedAt?: Date;
  checkpoints: Checkpoint[];
  errors: string[];
  recoveryAttempts: number;
  result?: ExecutionResult;
  context?: ExecutionContext;
}

/**
 * Execution result from checkpoint (shared)
 */
export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

/**
 * Checkpoint interface (shared)
 */
export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  requiresHumanCheck: boolean;
  results?: CheckpointResult;
}

/**
 * Checkpoint result (shared)
 */
export interface CheckpointResult {
  success: boolean;
  output?: unknown;
  errors?: string[];
  duration: number;
}

/**
 * Validation rule result
 */
export interface RuleResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  error?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  results: RuleResult[];
  errors?: RuleResult[];
  warnings?: RuleResult[];
}

/**
 * Recovery strategy
 */
export interface RecoveryStrategy {
  id: string;
  name: string;
  applicableErrors: string[];
  execute: (error: Error, context: ExecutionContext) => Promise<RecoveryResult>;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  recovered: boolean;
  newError: Error | null;
}

/**
 * Autonomous report
 */
export interface AutonomousReport {
  id: string;
  actionId: string;
  status: ExecutionStatus;
  duration: number;
  changes: Change[];
  tests: TestResult[];
  risks: Risk[];
  recommendations: string[];
  timestamp: Date;
}

/**
 * Execution status for reports
 */
export type ExecutionStatus = 'success' | 'partial' | 'failure' | 'recovered';

/**
 * Change interface (simplified)
 */
export interface Change {
  type: string;
  file: string;
  description: string;
}

/**
 * Test result (simplified)
 */
export interface TestResult {
  passed: boolean;
  name: string;
  duration: number;
}

/**
 * Risk interface
 */
export interface Risk {
  level: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

/**
 * Operational limit types
 */
export type LimitType = 
  | 'executions_per_hour'
  | 'changes_per_day'
  | 'rollback_depth'
  | 'deployment_frequency';

/**
 * Operational limit
 */
export interface OperationalLimit {
  type: LimitType;
  current: number;
  max: number;
  window: number; // ms
}

/**
 * Limit check result
 */
export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  blockedBy?: string;
}

/**
 * Safety check result
 */
export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
}