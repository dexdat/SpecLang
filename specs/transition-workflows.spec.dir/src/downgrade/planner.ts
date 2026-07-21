// SPECLANG-GENERATED: @speclang/transition-workflows/downgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/downgrade.spec.md

import type {
  DowngradePlan,
  DowngradeTarget,
  DowngradeTrigger,
  MaturityLevel,
  TransitionChecklist,
} from './types';
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
  
  private getChecklists(
    current: DowngradeTarget,
    target: DowngradeTarget
  ): TransitionChecklist[] {
    const fromLevel = (current.project_level ?? 'POC') as MaturityLevel;
    const toLevel = (target.project_level ?? fromLevel) as MaturityLevel;

    const preDowngrade: TransitionChecklist = {
      from: fromLevel,
      to: toLevel,
      checks: [
        {
          category: 'documentation',
          description: 'Confirm downgrade is necessary (root cause analysis)',
          required: true,
          automated: true,
        },
        {
          category: 'documentation',
          description: 'Ensure no data loss will occur',
          required: true,
          automated: false,
        },
        {
          category: 'documentation',
          description: 'Verify rollback path exists',
          required: true,
          automated: false,
        },
        {
          category: 'documentation',
          description: 'Check dependencies can handle downgrade',
          required: true,
          automated: false,
        },
      ],
    };

    const postDowngrade: TransitionChecklist = {
      from: fromLevel,
      to: toLevel,
      checks: [
        {
          category: 'testing',
          description: 'Validate spec integrity after downgrade',
          required: true,
          automated: false,
        },
        {
          category: 'testing',
          description: 'Run tests at target level',
          required: true,
          automated: false,
        },
        {
          category: 'testing',
          description: 'Ensure all references still resolve',
          required: true,
          automated: false,
        },
        {
          category: 'testing',
          description: 'Confirm agent behavior adjusts appropriately',
          required: true,
          automated: false,
        },
      ],
    };

    return [preDowngrade, postDowngrade];
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