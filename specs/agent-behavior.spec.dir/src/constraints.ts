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
 * Extended context with additional check parameters
 */
export interface ExtendedConstraintContext extends ConstraintContext {
  approvalObtained?: boolean;
  reviewObtained?: boolean;
  testsRun?: boolean;
  isHumanInvolved?: boolean;
}

/**
 * Constraint definition
 */
export interface BehaviorConstraint {
  id: string;
  name: string;
  description: string;
  check: (permissions: BehaviorPermissions, context: ExtendedConstraintContext) => ConstraintResult;
}

/**
 * Context for constraint evaluation
 */
export interface ConstraintContext {
  projectLevel: ProjectLevel;
  agentSupport: AgentSupportLevel;
  role: AgentRole;
  layer: number;
  filePath?: string;
  isNewFile: boolean;
  fileSize?: number;
}

/**
 * Constraint check result
 */
export interface ConstraintResult {
  satisfied: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Built-in constraints
 */
export const DEFAULT_CONSTRAINTS: BehaviorConstraint[] = [
  {
    id: 'constraint-write-permission',
    name: 'Write Permission Check',
    description: 'Verifies agent has write permission',
    check: (perm, ctx) => ({
      satisfied: perm.canWrite || ctx.isHumanInvolved === true,
      message: perm.canWrite ? undefined : 'Agent does not have write permission',
      severity: 'error',
    }),
  },
  {
    id: 'constraint-commit-permission',
    name: 'Commit Permission Check',
    description: 'Verifies agent has commit permission',
    check: (perm, ctx) => ({
      satisfied: perm.canCommit || !perm.requiresApproval === false,
      message: perm.canCommit ? undefined : 'Agent does not have commit permission',
      severity: 'error',
    }),
  },
  {
    id: 'constraint-approval-required',
    name: 'Approval Requirement Check',
    description: 'Verifies approval was obtained if required',
    check: (perm, ctx) => ({
      satisfied: !perm.requiresApproval || ctx.approvalObtained === true,
      message: perm.requiresApproval && !ctx.approvalObtained
        ? 'Approval required but not obtained'
        : undefined,
      severity: 'error',
    }),
  },
  {
    id: 'constraint-review-required',
    name: 'Review Requirement Check',
    description: 'Verifies review was completed if required',
    check: (perm, ctx) => ({
      satisfied: !perm.requiresReview || ctx.reviewObtained === true,
      message: perm.requiresReview && !ctx.reviewObtained
        ? 'Review required but not completed'
        : undefined,
      severity: perm.requiresReview && !ctx.reviewObtained ? 'warning' : 'info',
    }),
  },
  {
    id: 'constraint-human-involvement',
    name: 'Human Involvement Check',
    description: 'Verifies appropriate human involvement level',
    check: (perm, ctx) => {
      const minInvolvement: Record<string, number> = {
        'none': 0,
        'monitoring': 1,
        'review': 2,
        'approval': 3,
        'full': 4,
      };

      const required = minInvolvement[perm.humanInvolvement];
      const actual = ctx.isHumanInvolved ? 4 : 0;

      return {
        satisfied: actual >= required,
        message: actual >= required
          ? undefined
          : `Human involvement level ${perm.humanInvolvement} not met`,
        severity: required >= 3 ? 'error' : 'warning',
      };
    },
  },
  {
    id: 'constraint-test-before-commit',
    name: 'Test Before Commit Check',
    description: 'Ensures tests are run before committing',
    check: (perm, ctx) => ({
      satisfied: !perm.canCommit || perm.canRunTests || ctx.testsRun === true,
      message: !perm.canCommit || perm.canRunTests || ctx.testsRun
        ? undefined
        : 'Tests must be run before commit',
      severity: 'warning',
    }),
  },
  {
    id: 'constraint-layer-depth',
    name: 'Layer Depth Constraint',
    description: 'Restricts certain actions based on layer depth',
    check: (perm, ctx) => {
      // Deep layers (8+) have more restrictions
      if (ctx.layer >= 8 && perm.canWrite) {
        return {
          satisfied: perm.requiresReview,
          message: perm.requiresReview
            ? undefined
            : 'Deep layer changes require review',
          severity: 'warning',
        };
      }
      return { satisfied: true, severity: 'info' };
    },
  },
];

/**
 * Constraints engine
 */
export class ConstraintsEngine {
  private constraints: BehaviorConstraint[];

  constructor(constraints: BehaviorConstraint[] = DEFAULT_CONSTRAINTS) {
    this.constraints = constraints;
  }

  /**
   * Add a custom constraint
   */
  addConstraint(constraint: BehaviorConstraint): void {
    this.constraints.push(constraint);
  }

  /**
   * Remove a constraint by ID
   */
  removeConstraint(constraintId: string): void {
    this.constraints = this.constraints.filter(c => c.id !== constraintId);
  }

  /**
   * Check all constraints
   */
  checkAll(
    permissions: BehaviorPermissions,
    context: ExtendedConstraintContext
  ): ConstraintResult[] {
    return this.constraints.map(constraint =>
      constraint.check(permissions, context)
    );
  }

  /**
   * Check constraints and return only failures
   */
  checkFailures(
    permissions: BehaviorPermissions,
    context: ExtendedConstraintContext
  ): ConstraintResult[] {
    return this.checkAll(permissions, context)
      .filter(r => !r.satisfied);
  }

  /**
   * Get all constraints
   */
  getConstraints(): BehaviorConstraint[] {
    return [...this.constraints];
  }
}

/**
 * Default constraints engine instance
 */
export const defaultConstraintsEngine = new ConstraintsEngine();
