/**
 * SPECLANG-GENERATED: Human-only oversight mechanisms
 * Source: @specs/agent-support-levels/levels#human-only
 */

import { OversightMechanism } from './types';

export class HumanOnlyOversight {
  private mechanisms: OversightMechanism[] = [];

  constructor(mechanisms: OversightMechanism[] = []) {
    this.mechanisms = mechanisms;
  }

  /**
   * Add an oversight mechanism
   */
  addMechanism(mechanism: OversightMechanism): void {
    this.mechanisms.push(mechanism);
    console.log(`[HumanOnlyOversight] Added oversight mechanism: ${mechanism.type}`);
  }

  /**
   * Run oversight checks
   */
  runChecks(specId: string): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    for (const mechanism of this.mechanisms) {
      switch (mechanism.frequency) {
        case 'continuous':
          // Simulate continuous check
          issues.push(`Continuous oversight active for ${specId}`);
          break;
        case 'periodic':
          issues.push(`Periodic oversight scheduled for ${specId}`);
          break;
        case 'on_demand':
          issues.push(`On-demand oversight available for ${specId}`);
          break;
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Get default oversight mechanisms for human-only level
   */
  static defaultMechanisms(): OversightMechanism[] {
    return [
      {
        type: 'manual_review',
        description: 'All spec changes require manual review',
        frequency: 'continuous'
      },
      {
        type: 'periodic_audit',
        description: 'Weekly audit of human-only specs',
        frequency: 'periodic'
      },
      {
        type: 'human_intervention',
        description: 'Human intervention required for any agent action',
        frequency: 'on_demand'
      }
    ];
  }
}