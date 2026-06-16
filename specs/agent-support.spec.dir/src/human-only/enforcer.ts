/**
 * SPECLANG-GENERATED: Human-only agent support enforcer
 * Source: @specs/agent-support-levels/levels#human-only
 */

import { HumanOnlyPolicy, AgentAction, HumanOnlyValidationResult, Violation } from './types';

export class HumanOnlyEnforcer {
  private policy: HumanOnlyPolicy;

  constructor(policy: HumanOnlyPolicy) {
    this.policy = policy;
  }

  /**
   * Check if an agent action is allowed
   */
  isActionAllowed(action: AgentAction): boolean {
    return this.policy.allowedActions.includes(action);
  }

  /**
   * Validate a spec against human-only policy
   */
  validateSpec(specId: string, agentActions: AgentAction[]): HumanOnlyValidationResult {
    const violations: Violation[] = [];
    
    for (const action of agentActions) {
      if (!this.isActionAllowed(action)) {
        violations.push({
          type: 'action_not_allowed',
          message: `Action "${action}" is not allowed for human-only specs`,
          severity: 'high'
        });
      }
    }

    const passed = violations.length === 0;
    const suggestions = passed ? [] : ['Restrict agent to read-only access'];

    return {
      specId,
      passed,
      violations,
      suggestions
    };
  }

  /**
   * Get default policy for human-only level
   */
  static defaultPolicy(): HumanOnlyPolicy {
    return {
      requiresHumanInterpretation: true,
      allowedActions: ['read_spec', 'suggest_improvements'],
      requiredConfirmations: ['interpretation_confirmation', 'decision_confirmation'],
      approvalSteps: [
        { step: 'spec_interpretation', required: true, humanRole: 'domain_expert' },
        { step: 'implementation_decision', required: true, humanRole: 'technical_lead' }
      ],
      oversightMechanisms: [
        { type: 'manual_review', description: 'All spec changes require manual review', frequency: 'continuous' }
      ],
      restrictions: [
        { action: 'generate_draft_code', enforcement: 'block' },
        { action: 'run_tests', enforcement: 'block' },
        { action: 'propose_edits', enforcement: 'require_confirmation' }
      ]
    };
  }
}