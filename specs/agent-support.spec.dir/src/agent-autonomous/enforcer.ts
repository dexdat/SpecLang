/**
 * SPECLANG-GENERATED: Agent-autonomous agent support enforcer
 * Source: @specs/agent-support-levels/levels#agent-autonomous
 */

import {
  AgentAutonomousLevel,
  AgentAutonomousConfig,
  AgentAction,
  AutonomousResult,
  AutonomousExecutionResult,
  ExecutionContext,
  SafetyCheckResult,
  LimitCheckResult
} from './types';
import { AutonomousExecutor } from './executor';
import { SelfValidator } from './self-validation';
import { OperationalLimits } from './limits';

/**
 * Predefined configurations for each agent-autonomous level
 */
export const AGENT_AUTONOMOUS_CONFIGS: Record<AgentAutonomousLevel, AgentAutonomousConfig> = {
  autonomous_execute: {
    level: 'autonomous_execute',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: false,
    selfHealing: true,
    maxAutonomyDepth: 3,
    deploymentEnabled: false
  },
  autonomous_with_rollback: {
    level: 'autonomous_with_rollback',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: true,
    selfHealing: true,
    maxAutonomyDepth: 5,
    deploymentEnabled: false
  },
  autonomous_full_control: {
    level: 'autonomous_full_control',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: true,
    selfHealing: true,
    maxAutonomyDepth: 10,
    deploymentEnabled: true
  },
  autonomous_deploy: {
    level: 'autonomous_deploy',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: true,
    selfHealing: true,
    maxAutonomyDepth: Infinity,
    deploymentEnabled: true
  }
};

/**
 * Agent-autonomous enforcer class
 */
export class AgentAutonomousEnforcer {
  private config: AgentAutonomousConfig;
  private executor: AutonomousExecutor;
  private validator: SelfValidator;
  private limits: OperationalLimits;

  /**
   * Create an agent-autonomous enforcer
   * @param config - Agent-autonomous level or partial config
   */
  constructor(config: AgentAutonomousLevel | Partial<AgentAutonomousConfig>) {
    if (typeof config === 'string') {
      this.config = AGENT_AUTONOMOUS_CONFIGS[config];
    } else {
      this.config = { ...AGENT_AUTONOMOUS_CONFIGS.autonomous_full_control, ...config };
    }
    
    this.executor = new AutonomousExecutor(this.config);
    this.validator = new SelfValidator();
    this.limits = new OperationalLimits(this.config);
  }

  /**
   * Check if an action can proceed autonomously
   */
  async canExecute(action: AgentAction): Promise<AutonomousResult> {
    // Check operational limits
    const limitsCheck = await this.limits.checkLimits(action);
    if (!limitsCheck.allowed) {
      return {
        allowed: false,
        reason: limitsCheck.reason,
        blockedBy: limitsCheck.blockedBy
      };
    }

    // Validate action is safe for autonomous execution
    const safetyCheck = await this.validateSafety(action);
    if (!safetyCheck.safe) {
      return {
        allowed: false,
        reason: safetyCheck.reason,
        requiresReview: true
      };
    }

    return {
      allowed: true,
      autonomyLevel: this.config.level,
      canRollback: this.config.autoRollback,
      canSelfHeal: this.config.selfHealing,
      maxDepth: this.config.maxAutonomyDepth
    };
  }

  /**
   * Execute an action autonomously
   */
  async executeAutonomous(
    action: AgentAction,
    context: ExecutionContext
  ): Promise<AutonomousExecutionResult> {
    const execution: AutonomousExecutionResult = {
      id: this.generateId(),
      action,
      status: 'running',
      startedAt: new Date(),
      checkpoints: [],
      errors: [],
      recoveryAttempts: 0
    };

    try {
      // Pre-execution validation
      await this.validator.preExecutionValidation(action);

      // Execute with autonomous control
      const result = await this.executor.execute(action, context);
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = result;

      // Post-execution validation
      await this.validator.postExecutionValidation(action, result);

    } catch (error: any) {
      execution.status = 'failed';
      execution.errors.push(error.message);

      // Attempt autonomous recovery if enabled
      if (this.config.autoRollback) {
        execution.recoveryAttempts = await this.attemptRecovery(execution);
      }

      if (execution.recoveryAttempts > 0) {
        execution.status = 'recovered';
      }
    }

    // Report execution
    await this.report(execution);

    return execution;
  }

  /**
   * Get the current configuration
   */
  getConfig(): AgentAutonomousConfig {
    return { ...this.config };
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(partial: Partial<AgentAutonomousConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  /**
   * Validate safety of an action for autonomous execution
   */
  private async validateSafety(action: AgentAction): Promise<SafetyCheckResult> {
    // Basic safety checks
    if (action === 'autonomous_deploy' && !this.config.deploymentEnabled) {
      return {
        safe: false,
        reason: 'Deployment not enabled for current autonomy level'
      };
    }

    if (action.includes('execute') && this.config.maxAutonomyDepth <= 0) {
      return {
        safe: false,
        reason: 'Autonomy depth limit reached'
      };
    }

    return { safe: true };
  }

  /**
   * Attempt recovery for a failed execution
   */
  private async attemptRecovery(execution: AutonomousExecutionResult): Promise<number> {
    // Simple recovery: just return 0 attempts for now
    // TODO: Integrate with AutonomousRecovery class
    return 0;
  }

  /**
   * Report execution (placeholder)
   */
  private async report(execution: AutonomousExecutionResult): Promise<void> {
    // TODO: Integrate with AutonomousReporter
    console.log(`Autonomous execution ${execution.id} completed with status: ${execution.status}`);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `autonomous-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get default configuration
   */
  static defaultConfig(): AgentAutonomousConfig {
    return AGENT_AUTONOMOUS_CONFIGS.autonomous_full_control;
  }
}