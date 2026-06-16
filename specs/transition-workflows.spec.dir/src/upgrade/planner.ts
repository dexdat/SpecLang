// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

import type { ParsedSpec, UpgradePlan, UpgradeTarget, UpgradeType } from './types';
import { getUpgradeType } from './types';
import { UpgradeChecklistProvider } from './checklist';

/**
 * Upgrade Planner
 * 
 * Creates upgrade plans based on current and target levels.
 */
export class UpgradePlanner {
  private checklistProvider = new UpgradeChecklistProvider();

  /**
   * Create an upgrade plan for a spec
   */
  createPlan(
    spec: ParsedSpec,
    target: UpgradeTarget,
    options?: { skipValidation?: boolean }
  ): UpgradePlan {
    const current = this.extractCurrentTarget(spec);
    const type = getUpgradeType(current, target);
    
    const checklists = this.getChecklists(current, target);
    
    return {
      specId: spec.metadata.id || 'unknown',
      current,
      target,
      type,
      checklists,
      estimatedDuration: this.estimateDuration(checklists),
      requiredApprovals: this.getRequiredApprovals(type, target)
    };
  }
  
  /**
   * Extract current target from spec metadata
   */
  private extractCurrentTarget(spec: ParsedSpec): UpgradeTarget {
    return {
      project_level: spec.metadata.project_level as any,
      agent_support: spec.metadata.agent_support as any
    };
  }
  
  /**
   * Get checklists for the transition
   */
  private getChecklists(current: UpgradeTarget, target: UpgradeTarget): any[] {
    return this.checklistProvider.getCombinedChecklists(current, target);
  }
  
  /**
   * Estimate duration based on checklists
   */
  private estimateDuration(checklists: any[]): number {
    // Rough estimate: 5 minutes per checklist item
    const totalChecks = checklists.reduce((sum, list) => sum + list.checks.length, 0);
    return totalChecks * 5 * 60 * 1000; // milliseconds
  }
  
  /**
   * Get required approvals based on upgrade type and target
   */
  private getRequiredApprovals(type: UpgradeType, target: UpgradeTarget): string[] {
    const approvals: string[] = [];
    
    if (type === 'project_level' || type === 'combined') {
      if (target.project_level === 'Production' || target.project_level === 'Enterprise') {
        approvals.push('production_readiness_review');
        approvals.push('security_review');
      }
      if (target.project_level === 'Beta') {
        approvals.push('qa_lead');
      }
    }
    
    if (type === 'agent_support' || type === 'combined') {
      if (target.agent_support === 'agent_autonomous') {
        approvals.push('autonomous_readiness_review');
        approvals.push('safety_review');
      }
    }
    
    return approvals;
  }
  
  /**
   * Validate that an upgrade is possible
   */
  validatePlan(plan: UpgradePlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!plan.specId) {
      errors.push('Missing spec ID');
    }
    
    if (!plan.target.project_level && !plan.target.agent_support) {
      errors.push('No target level specified');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}