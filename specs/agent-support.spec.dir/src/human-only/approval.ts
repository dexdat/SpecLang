/**
 * SPECLANG-GENERATED: Human-only approval tracking
 * Source: @specs/agent-support-levels/levels#human-only
 */

import { ApprovalStep } from './types';

export class HumanOnlyApproval {
  private approvals: Map<string, ApprovalStep[]> = new Map();

  /**
   * Start approval process for a spec
   */
  startApprovalProcess(specId: string, steps: ApprovalStep[]): string {
    const processId = `${specId}-${Date.now()}`;
    this.approvals.set(processId, steps);
    console.log(`[HumanOnlyApproval] Started approval process ${processId} with ${steps.length} steps`);
    return processId;
  }

  /**
   * Mark an approval step as completed
   */
  completeStep(processId: string, stepIndex: number, approver: string): void {
    const steps = this.approvals.get(processId);
    if (!steps) {
      throw new Error(`Approval process ${processId} not found`);
    }
    if (stepIndex < 0 || stepIndex >= steps.length) {
      throw new Error(`Invalid step index ${stepIndex}`);
    }
    const step = steps[stepIndex];
    console.log(`[HumanOnlyApproval] Step "${step.step}" completed by ${approver}`);
    // In a real implementation, you would store completion status
  }

  /**
   * Check if all approval steps are completed
   */
  isApprovalComplete(processId: string): boolean {
    const steps = this.approvals.get(processId);
    if (!steps) return false;
    // Simplified: assume all steps are required
    return steps.every(step => step.required);
  }

  /**
   * Get remaining steps
   */
  getRemainingSteps(processId: string): ApprovalStep[] {
    const steps = this.approvals.get(processId) || [];
    return steps.filter(step => step.required);
  }
}