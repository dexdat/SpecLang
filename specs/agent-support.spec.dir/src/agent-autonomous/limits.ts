/**
 * SPECLANG-GENERATED: Operational limits for autonomous execution
 * Source: @specs/agent-support-levels/levels#agent-autonomous
 */

import {
  AgentAutonomousConfig,
  AgentAction,
  LimitType,
  OperationalLimit,
  LimitCheckResult
} from './types';

/**
 * Operational limits class
 */
export class OperationalLimits {
  private limits: Map<LimitType, OperationalLimit>;
  private config: AgentAutonomousConfig;

  constructor(config: AgentAutonomousConfig) {
    this.config = config;
    this.limits = this.initializeLimits();
  }

  /**
   * Check if an action is allowed within limits
   */
  async checkLimits(action: AgentAction): Promise<LimitCheckResult> {
    const limit = this.limits.get('executions_per_hour');
    if (limit && limit.current >= limit.max) {
      return {
        allowed: false,
        reason: 'Execution rate limit exceeded',
        blockedBy: 'executions_per_hour'
      };
    }

    // Check rollback depth limit
    const rollbackLimit = this.limits.get('rollback_depth');
    if (rollbackLimit && rollbackLimit.current >= rollbackLimit.max) {
      return {
        allowed: false,
        reason: 'Maximum rollback depth exceeded',
        blockedBy: 'rollback_depth'
      };
    }

    return { allowed: true };
  }

  /**
   * Record an execution for limit tracking
   */
  async recordExecution(action: AgentAction): Promise<void> {
    const limit = this.limits.get('executions_per_hour');
    if (limit) {
      limit.current++;
    }

    // Reset limits if window expired (simplified)
    this.resetExpiredLimits();
  }

  /**
   * Reset limits that have expired windows
   */
  private resetExpiredLimits(): void {
    const now = Date.now();
    for (const limit of this.limits.values()) {
      // Simplified: reset every hour for executions_per_hour
      if (limit.type === 'executions_per_hour' && limit.window > 0) {
        // In a real implementation, we'd track timestamps
        // For now, we'll just reset periodically
        if (Math.random() < 0.01) { // 1% chance to simulate window expiration
          limit.current = 0;
        }
      }
    }
  }

  /**
   * Initialize default limits
   */
  private initializeLimits(): Map<LimitType, OperationalLimit> {
    return new Map([
      ['executions_per_hour', { type: 'executions_per_hour', current: 0, max: 100, window: 3600000 }],
      ['changes_per_day', { type: 'changes_per_day', current: 0, max: 50, window: 86400000 }],
      ['rollback_depth', { type: 'rollback_depth', current: 0, max: this.config.maxAutonomyDepth, window: 0 }],
      ['deployment_frequency', { type: 'deployment_frequency', current: 0, max: 10, window: 86400000 }]
    ]);
  }

  /**
   * Get current limit values
   */
  getLimitValues(): Record<LimitType, number> {
    const result: Record<LimitType, number> = {} as any;
    for (const [type, limit] of this.limits.entries()) {
      result[type] = limit.current;
    }
    return result;
  }

  /**
   * Set a limit value
   */
  setLimit(type: LimitType, max: number): void {
    const limit = this.limits.get(type);
    if (limit) {
      limit.max = max;
    }
  }
}