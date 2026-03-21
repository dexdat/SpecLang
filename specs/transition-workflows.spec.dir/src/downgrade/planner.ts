// SPECLANG-GENERATED: @speclang/transition-workflows/downgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/downgrade.spec.md

import type { DowngradePlan, DowngradeTarget, DowngradeTrigger } from './types';
import { getDowngradeType } from './types';

/**
 * Downgrade Planner
 */
export class DowngradePlanner {
  /**
   * Create a downgrade plan
   */
  createPlan(
    spec: any,
    target: DowngradeTarget,
    triggers: DowngradeTrigger[],
    emergency: boolean = false
  ): DowngradePlan {
    const current = this.extractCurrentTarget(spec);
    const type = getDowngradeType(current, target);
    
    const checklists = this.getChecklists(current, target);
    
    return {
      specId: spec.metadata.id || 'unknown',
      current,
      target,
      type,
      triggers,
      checklists,
      emergency,
      requiredApprovals: this.getRequiredApprovals(type, target, emergency)
    };
  }
  
  private extractCurrentTarget(spec: any): DowngradeTarget {
    return {
      project_level: spec.metadata.project_level,
      agent_support: spec.metadata.agent_support
    };
  }
  
  private getChecklists(current: DowngradeTarget, target: DowngradeTarget): any[] {
    // TODO: Implement based on downgrade.spec.md
    return [];
  }
  
  private getRequiredApprovals(type: string, target: DowngradeTarget, emergency: boolean): string[] {
    const approvals: string[] = [];
    
    if (emergency) {
      approvals.push('emergency_approval');
    }
    
    if (type === 'project_level' || type === 'combined') {
      if (target.project_level === 'Production' || target.project_level === 'Enterprise') {
        approvals.push('security_review');
      }
    }
    
    return approvals;
  }
}