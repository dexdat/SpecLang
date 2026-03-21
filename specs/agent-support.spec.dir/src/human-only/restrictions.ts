/**
 * SPECLANG-GENERATED: Human-only agent restrictions
 * Source: @specs/agent-support-levels/levels#human-only
 */

import { Restriction, AgentAction } from './types';

export class HumanOnlyRestrictions {
  private restrictions: Restriction[] = [];

  constructor(restrictions: Restriction[] = []) {
    this.restrictions = restrictions;
  }

  /**
   * Check if an action is restricted
   */
  checkRestriction(action: AgentAction, context?: any): { allowed: boolean; reason?: string } {
    const restriction = this.restrictions.find(r => r.action === action);
    if (!restriction) {
      return { allowed: true };
    }

    switch (restriction.enforcement) {
      case 'block':
        return { allowed: false, reason: `Action "${action}" is blocked for human-only specs` };
      case 'warn':
        console.warn(`Warning: Action "${action}" may require human oversight`);
        return { allowed: true };
      case 'require_confirmation':
        console.log(`Action "${action}" requires confirmation`);
        return { allowed: true };
      default:
        return { allowed: true };
    }
  }

  /**
   * Apply restrictions to a list of actions
   */
  filterAllowedActions(actions: AgentAction[]): AgentAction[] {
    return actions.filter(action => {
      const { allowed } = this.checkRestriction(action);
      return allowed;
    });
  }

  /**
   * Get default restrictions for human-only level
   */
  static defaultRestrictions(): Restriction[] {
    return [
      { action: 'generate_draft_code', enforcement: 'block' },
      { action: 'run_tests', enforcement: 'block' },
      { action: 'propose_edits', enforcement: 'require_confirmation' },
      { action: 'suggest_improvements', enforcement: 'warn' }
    ];
  }
}