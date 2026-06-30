// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

import type { ParsedSpec, UpgradePlan, UpgradeTarget, UpgradeType, SpecRef, TransitionCheck } from './types';
import { getUpgradeType } from './types';
import { UpgradeChecklistProvider } from './checklist';

const VALID_PROJECT_PATHS: Array<[string, string]> = [
  ['POC', 'MVP'],
  ['MVP', 'Alpha'],
  ['Alpha', 'Beta'],
  ['Beta', 'Production'],
];

const VALID_AGENT_PATHS: Array<[string, string]> = [
  ['human_only', 'agent_assisted'],
  ['agent_assisted', 'agent_autonomous'],
];

const PROJECT_LEVELS = ['POC', 'MVP', 'Alpha', 'Beta', 'Production'];
const AGENT_LEVELS = ['human_only', 'agent_assisted', 'agent_autonomous'];

/**
 * Upgrade Planner
 * 
 * Creates upgrade plans based on current and target levels.
 */
export class UpgradePlanner {
  private checklistProvider = new UpgradeChecklistProvider();

  /**
   * Create an upgrade plan from simplified from/to/specs interface
   */
  plan(from: string, to: string, specs: SpecRef[]): UpgradePlan {
    if (!this.isValidTransition(from, to)) {
      throw new Error('No upgrade path defined');
    }

    const isProject = PROJECT_LEVELS.includes(from) && PROJECT_LEVELS.includes(to);
    const isAgent = AGENT_LEVELS.includes(from) && AGENT_LEVELS.includes(to);

    const parsedSpec: ParsedSpec = {
      metadata: {
        id: specs[0]?.id || 'unknown',
        ...(isProject ? { project_level: from } : {}),
        ...(isAgent ? { agent_support: from } : {}),
      },
    };

    const target: UpgradeTarget = {
      ...(isProject ? { project_level: to as any } : {}),
      ...(isAgent ? { agent_support: to as any } : {}),
    };

    const plan = this.createPlan(parsedSpec, target);
    plan.specs = specs;
    plan.from = from;
    plan.to = to;
    return plan;
  }

  /**
   * Run transition checks for a given from/to/spec
   */
  check(from: string, to: string, spec: SpecRef): Array<{ check: TransitionCheck; passed: boolean; message: string }> {
    const isProject = PROJECT_LEVELS.includes(from) && PROJECT_LEVELS.includes(to);
    const isAgent = AGENT_LEVELS.includes(from) && AGENT_LEVELS.includes(to);

    const checklists: any[] = [];
    if (isProject) {
      checklists.push(...this.checklistProvider.getProjectLevelChecklists(from, to));
    }
    if (isAgent) {
      checklists.push(...this.checklistProvider.getAgentSupportChecklists(from, to));
    }

    const results: Array<{ check: TransitionCheck; passed: boolean; message: string }> = [];
    for (const checklist of checklists) {
      for (const check of checklist.checks) {
        results.push({
          check,
          passed: true,
          message: check.automated ? 'Check passed' : 'Manual check: ' + check.description,
        });
      }
    }
    return results;
  }

  /**
   * Check if a transition path is valid
   */
  isValidTransition(from: string, to: string): boolean {
    for (const [f, t] of VALID_PROJECT_PATHS) {
      if (f === from && t === to) return true;
    }
    for (const [f, t] of VALID_AGENT_PATHS) {
      if (f === from && t === to) return true;
    }
    return false;
  }

  /**
   * List all available transition paths
   */
  listTransitionPaths(): Array<{ from: string; to: string; type: string }> {
    return [
      ...VALID_PROJECT_PATHS.map(([from, to]) => ({ from, to, type: 'project_level' })),
      ...VALID_AGENT_PATHS.map(([from, to]) => ({ from, to, type: 'agent_support' })),
    ];
  }

  /**
   * Create an upgrade plan for a spec (internal)
   */
  createPlan(
    spec: ParsedSpec,
    target: UpgradeTarget,
    options?: { skipValidation?: boolean }
  ): UpgradePlan {
    const current = this.extractCurrentTarget(spec);
    const type = getUpgradeType(current, target);
    const checklists = this.getChecklists(current, target);
    const checks = this.flattenChecklists(checklists);
    
    const from = current.project_level || current.agent_support || 'unknown';
    const to = target.project_level || target.agent_support || 'unknown';
    
    return {
      from,
      to,
      specs: [{ id: spec.metadata.id || 'unknown' }],
      checks,
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
   * Flatten checklists into flat checks array
   */
  private flattenChecklists(checklists: any[]): Array<{ check: TransitionCheck; passed: boolean; message: string }> {
    const results: Array<{ check: TransitionCheck; passed: boolean; message: string }> = [];
    for (const checklist of checklists) {
      for (const check of checklist.checks) {
        results.push({
          check,
          passed: true,
          message: check.automated ? 'Check passed' : 'Manual check: ' + check.description,
        });
      }
    }
    return results;
  }
  
  /**
   * Estimate duration based on checklists
   */
  private estimateDuration(checklists: any[]): number {
    const totalChecks = checklists.reduce((sum, list) => sum + list.checks.length, 0);
    return totalChecks * 5 * 60 * 1000;
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
    
    if (!plan.from) {
      errors.push('Missing from level');
    }
    
    if (!plan.to) {
      errors.push('Missing to level');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}