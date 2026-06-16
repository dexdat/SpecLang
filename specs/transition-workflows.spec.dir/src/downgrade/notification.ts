// SPECLANG-GENERATED: @speclang/transition-workflows/downgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/downgrade.spec.md

import type { DowngradePlan, DowngradeResult } from './types';

/**
 * Downgrade Notification
 */
export class DowngradeNotification {
  /**
   * Notify stakeholders about a downgrade
   */
  async notify(plan: DowngradePlan, result: DowngradeResult): Promise<void> {
    // TODO: Implement notification logic
    console.log(`Notifying stakeholders about downgrade for spec ${plan.specId}`);
  }
  
  /**
   * Get list of stakeholders to notify
   */
  private getStakeholders(plan: DowngradePlan): string[] {
    const stakeholders: string[] = [];
    
    if (plan.emergency) {
      stakeholders.push('on_call_engineer');
      stakeholders.push('technical_lead');
    }
    
    if (plan.type === 'project_level' || plan.type === 'combined') {
      stakeholders.push('product_owner');
      stakeholders.push('qa_lead');
    }
    
    return stakeholders;
  }
}