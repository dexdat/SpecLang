// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
import type { UpgradePlan, ExecutionResult } from './types';

export class UpgradeExecutor {
  async execute(plan: UpgradePlan): Promise<ExecutionResult> {
    console.log('Executing upgrade plan for spec ' + plan.specs.map(function(s) { return s.id; }).join(', '));
    await this.updateSpecMetadata(plan);
    const warnings: string[] = [];
    if (plan.requiredApprovals && plan.requiredApprovals.length > 0) {
      warnings.push('Pending approvals: ' + plan.requiredApprovals.join(', '));
    }
    const result: ExecutionResult = { success: true, plan: plan, executedAt: new Date().toISOString() };
    if (warnings.length > 0) { result.warnings = warnings; }
    return result;
  }

  async rollback(plan: UpgradePlan, _result: ExecutionResult): Promise<void> {
    console.log('Rolling back upgrade plan for spec ' + plan.specs.map(function(s) { return s.id; }).join(', '));
  }

  private async updateSpecMetadata(plan: UpgradePlan): Promise<void> {
    console.log('Updating spec ' + plan.specs.map(function(s) { return s.id; }).join(', ') + ':');
    console.log('  Transition: ' + plan.from + ' → ' + plan.to);
  }
}
