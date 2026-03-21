/**
 * SPECLANG-GENERATED: Autonomous error recovery
 * Source: @specs/agent-support-levels/levels#agent-autonomous
 */

import {
  AutonomousExecutionResult,
  ExecutionContext,
  RecoveryStrategy,
  RecoveryResult
} from './types';

/**
 * Autonomous recovery class
 */
export class AutonomousRecovery {
  private strategies: RecoveryStrategy[];
  private maxAttempts: number;

  constructor(maxAttempts: number = 3) {
    this.maxAttempts = maxAttempts;
    this.strategies = this.initializeStrategies();
  }

  /**
   * Attempt recovery for a failed execution
   */
  async attemptRecovery(
    execution: AutonomousExecutionResult
  ): Promise<number> {
    let attempts = 0;
    let currentError: Error | null = new Error(execution.errors[execution.errors.length - 1] || 'Unknown error');

    while (attempts < this.maxAttempts && currentError) {
      const strategy = this.findStrategy(currentError);
      
      if (!strategy) {
        break;
      }

      attempts++;
      
      const result = await strategy.execute(currentError, execution.context!);
      
      if (result.recovered) {
        return attempts;
      }

      currentError = result.newError;
    }

    return attempts;
  }

  /**
   * Find appropriate recovery strategy for an error
   */
  private findStrategy(error: Error): RecoveryStrategy | null {
    for (const strategy of this.strategies) {
      if (strategy.applicableErrors.some(e => error.message.includes(e))) {
        return strategy;
      }
    }
    return null;
  }

  /**
   * Initialize recovery strategies
   */
  private initializeStrategies(): RecoveryStrategy[] {
    return [
      {
        id: 'retry',
        name: 'retry_with_backoff',
        applicableErrors: ['timeout', 'network', 'ECONNREFUSED'],
        execute: async (error, context) => {
          await this.sleep(Math.pow(2, (context as any).retryCount || 0) * 1000);
          return { recovered: true, newError: null };
        }
      },
      {
        id: 'fallback',
        name: 'fallback_implementation',
        applicableErrors: ['not implemented', 'unsupported'],
        execute: async (error, context) => {
          // Implement fallback logic here
          return { recovered: true, newError: null };
        }
      },
      {
        id: 'rollback',
        name: 'rollback_changes',
        applicableErrors: ['validation failed', 'test failed'],
        execute: async (error, context) => {
          // Implement rollback logic here
          return { recovered: true, newError: null };
        }
      }
    ];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}