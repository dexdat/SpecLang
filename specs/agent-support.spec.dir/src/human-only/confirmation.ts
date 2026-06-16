/**
 * SPECLANG-GENERATED: Human-only confirmation workflows
 * Source: @specs/agent-support-levels/levels#human-only
 */

import { ConfirmationType } from './types';

export class HumanOnlyConfirmation {
  private pendingConfirmations: Map<string, ConfirmationType[]> = new Map();

  /**
   * Request confirmation for a spec action
   */
  requestConfirmation(specId: string, confirmationType: ConfirmationType, context: any): string {
    const requestId = `${specId}-${Date.now()}`;
    const pending = this.pendingConfirmations.get(specId) || [];
    pending.push(confirmationType);
    this.pendingConfirmations.set(specId, pending);
    
    console.log(`[HumanOnlyConfirmation] Requested ${confirmationType} for ${specId}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    
    return requestId;
  }

  /**
   * Mark confirmation as completed
   */
  completeConfirmation(specId: string, confirmationType: ConfirmationType): void {
    const pending = this.pendingConfirmations.get(specId) || [];
    const index = pending.indexOf(confirmationType);
    if (index > -1) {
      pending.splice(index, 1);
    }
    this.pendingConfirmations.set(specId, pending);
    console.log(`[HumanOnlyConfirmation] Completed ${confirmationType} for ${specId}`);
  }

  /**
   * Check if all required confirmations are completed
   */
  areAllConfirmationsComplete(specId: string): boolean {
    const pending = this.pendingConfirmations.get(specId) || [];
    return pending.length === 0;
  }

  /**
   * Get pending confirmations for a spec
   */
  getPendingConfirmations(specId: string): ConfirmationType[] {
    return this.pendingConfirmations.get(specId) || [];
  }
}