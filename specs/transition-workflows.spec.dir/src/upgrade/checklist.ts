// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

import type { UpgradeChecklist, UpgradeTarget } from './types';

/**
 * Upgrade Checklist Provider
 * 
 * Provides checklists for different upgrade types based on the spec.
 */
export class UpgradeChecklistProvider {
  /**
   * Get checklists for a project level upgrade
   */
  getProjectLevelChecklists(from: string, to: string): UpgradeChecklist[] {
    // TODO: Implement based on upgrade.spec.md
    return [];
  }
  
  /**
   * Get checklists for an agent support upgrade
   */
  getAgentSupportChecklists(from: string, to: string): UpgradeChecklist[] {
    // TODO: Implement based on upgrade.spec.md
    return [];
  }
  
  /**
   * Get combined checklists for both upgrades
   */
  getCombinedChecklists(current: UpgradeTarget, target: UpgradeTarget): UpgradeChecklist[] {
    const checklists: UpgradeChecklist[] = [];
    
    if (current.project_level !== target.project_level) {
      checklists.push(...this.getProjectLevelChecklists(current.project_level!, target.project_level!));
    }
    
    if (current.agent_support !== target.agent_support) {
      checklists.push(...this.getAgentSupportChecklists(current.agent_support!, target.agent_support!));
    }
    
    return checklists;
  }
}