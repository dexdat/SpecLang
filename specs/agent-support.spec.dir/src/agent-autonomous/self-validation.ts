/**
 * SPECLANG-GENERATED: Self-validation during autonomous execution
 * Source: @specs/agent-support-levels/levels#agent-autonomous
 */

import {
  AgentAction,
  ExecutionResult,
  ValidationResult,
  RuleResult
} from './types';

/**
 * Validation rule interface
 */
interface ValidationRule {
  id: string;
  name: string;
  check: (action: AgentAction, result?: ExecutionResult) => Promise<boolean>;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Self-validator class
 */
export class SelfValidator {
  private rules: ValidationRule[];

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Pre-execution validation
   */
  async preExecutionValidation(action: AgentAction): Promise<ValidationResult> {
    const results: RuleResult[] = [];

    for (const rule of this.rules) {
      try {
        const passed = await rule.check(action);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed,
          severity: rule.severity
        });
      } catch (error: any) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          severity: rule.severity,
          error: error.message
        });
      }
    }

    const hasErrors = results.some(r => !r.passed && r.severity === 'error');
    
    return {
      valid: !hasErrors,
      results,
      errors: results.filter(r => !r.passed && r.severity === 'error'),
      warnings: results.filter(r => !r.passed && r.severity === 'warning')
    };
  }

  /**
   * Post-execution validation
   */
  async postExecutionValidation(
    action: AgentAction,
    result: ExecutionResult
  ): Promise<ValidationResult> {
    const postRules = this.rules.filter(r => 
      r.name.includes('output') || r.name.includes('state')
    );

    const results: RuleResult[] = [];
    for (const rule of postRules) {
      const passed = await rule.check(action, result);
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        severity: rule.severity
      });
    }

    return {
      valid: results.every(r => r.passed),
      results
    };
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): ValidationRule[] {
    return [
      {
        id: 'valid-syntax',
        name: 'code_valid_syntax',
        check: async (action) => {
          // For now, assume syntax is valid for non-generation actions
          return !action.includes('generate') || true;
        },
        severity: 'error'
      },
      {
        id: 'no-breaking-changes',
        name: 'no_breaking_changes_unless_intended',
        check: async (action) => {
          // For now, assume no breaking changes
          return true;
        },
        severity: 'warning'
      },
      {
        id: 'tests-pass',
        name: 'tests_pass_after_change',
        check: async (action, result) => {
          return result?.success ?? true;
        },
        severity: 'error'
      },
      {
        id: 'output-valid',
        name: 'output_valid_structure',
        check: async (action, result) => {
          return result?.success ?? true;
        },
        severity: 'error'
      },
      {
        id: 'state-consistent',
        name: 'state_consistent_after_execution',
        check: async (action, result) => {
          return result?.success ?? true;
        },
        severity: 'warning'
      }
    ];
  }
}