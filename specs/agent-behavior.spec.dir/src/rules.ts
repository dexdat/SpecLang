/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/agent-behavior.spec.dir/behavior-matrix.spec.md
 * Generated: 2026-03-21T12:00:00Z
 *
 * Edit the spec, not this file.
 */

import type { BehaviorPermissions, ProjectLevel, AgentSupportLevel, AgentRole } from './behavior-matrix.js';

/**
 * Behavior rule definition
 */
export interface BehaviorRule {
  id: string;
  name: string;
  description: string;
  condition: (permissions: BehaviorPermissions, config: RuleContext) => boolean;
  action: (permissions: BehaviorPermissions, config: RuleContext) => BehaviorPermissions;
  priority: number;
}

/**
 * Context for rule evaluation
 */
export interface RuleContext {
  projectLevel: ProjectLevel;
  agentSupport: AgentSupportLevel;
  role: AgentRole;
  layer: number;
  isBreakingChange: boolean;
  isSecurityCritical: boolean;
  hasTests: boolean;
}

/**
 * Default behavior rules
 */
export const DEFAULT_BEHAVIOR_RULES: BehaviorRule[] = [
  {
    id: 'human-only-readonly',
    name: 'Human Only Read Only',
    description: 'Human-only agents can only read, never write',
    condition: (perm, ctx) => ctx.agentSupport === 'human_only',
    action: (perm) => ({
      ...perm,
      canWrite: false,
      canCommit: false,
      canGenerateCode: false,
      canRunTests: false,
      canAutoSplit: false,
    }),
    priority: 100,
  },
  {
    id: 'poc-restricted',
    name: 'POC Restricted',
    description: 'POC projects have maximum restrictions',
    condition: (perm, ctx) => ctx.projectLevel === 'POC',
    action: (perm) => ({
      ...perm,
      canWrite: false,
      canCommit: false,
      canGenerateCode: false,
      canRunTests: false,
      canAutoSplit: false,
      requiresApproval: true,
      requiresReview: true,
      humanInvolvement: 'full',
    }),
    priority: 90,
  },
  {
    id: 'security-critical-review',
    name: 'Security Critical Review',
    description: 'Security-critical changes always require review',
    condition: (perm, ctx) => ctx.isSecurityCritical,
    action: (perm) => ({
      ...perm,
      requiresReview: true,
      requiresApproval: true,
      humanInvolvement: perm.humanInvolvement === 'none' ? 'review' : perm.humanInvolvement,
    }),
    priority: 80,
  },
  {
    id: 'breaking-change-approval',
    name: 'Breaking Change Approval',
    description: 'Breaking changes require approval regardless of level',
    condition: (perm, ctx) => ctx.isBreakingChange,
    action: (perm) => ({
      ...perm,
      requiresApproval: true,
      humanInvolvement: perm.humanInvolvement === 'none' ? 'approval' : perm.humanInvolvement,
    }),
    priority: 70,
  },
  {
    id: 'no-tests-review',
    name: 'No Tests Review',
    description: 'Changes without tests require review',
    condition: (perm, ctx) => !ctx.hasTests && perm.canCommit,
    action: (perm) => ({
      ...perm,
      requiresReview: true,
    }),
    priority: 60,
  },
  {
    id: 'layer-depth-restrictions',
    name: 'Layer Depth Restrictions',
    description: 'Higher layers have more restrictions',
    condition: (perm, ctx) => ctx.layer > 7,
    action: (perm) => ({
      ...perm,
      requiresReview: true,
    }),
    priority: 50,
  },
];

/**
 * Rules engine for behavior modification
 */
export class BehaviorRulesEngine {
  private rules: BehaviorRule[];

  constructor(rules: BehaviorRule[] = DEFAULT_BEHAVIOR_RULES) {
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add a custom rule
   */
  addRule(rule: BehaviorRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Apply all rules to permissions
   */
  applyRules(
    permissions: BehaviorPermissions,
    context: RuleContext
  ): BehaviorPermissions {
    let modified = { ...permissions };

    for (const rule of this.rules) {
      if (rule.condition(modified, context)) {
        modified = rule.action(modified, context);
      }
    }

    return modified;
  }

  /**
   * Get all rules
   */
  getRules(): BehaviorRule[] {
    return [...this.rules];
  }
}

/**
 * Default rules engine instance
 */
export const defaultRulesEngine = new BehaviorRulesEngine();
