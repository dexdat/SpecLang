/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/agent-behavior.spec.dir/behavior-matrix.spec.md
 * Generated: 2026-03-21T12:00:00Z
 *
 * Edit the spec, not this file.
 */

import type { BehaviorPermissions, ProjectLevel, AgentSupportLevel, AgentRole } from './behavior-matrix.js';
import { ConstraintResult, ExtendedConstraintContext, defaultConstraintsEngine } from './constraints.js';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  constraint?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  constraint?: string;
}

/**
 * Validation info
 */
export interface ValidationInfo {
  code: string;
  message: string;
}

/**
 * Validation context
 */
export interface ValidationContext {
  projectLevel: ProjectLevel;
  agentSupport: AgentSupportLevel;
  role: AgentRole;
  layer: number;
  filePath?: string;
  isNewFile: boolean;
  fileSize?: number;
  approvalObtained?: boolean;
  reviewObtained?: boolean;
  testsRun?: boolean;
  isHumanInvolved?: boolean;
}

/**
 * Validate agent behavior permissions
 */
export function validateBehavior(
  permissions: BehaviorPermissions,
  context: ValidationContext
): ValidationResult {
  // Build extended context for constraints
  const extendedContext: ExtendedConstraintContext = {
    ...context,
    approvalObtained: context.approvalObtained,
    reviewObtained: context.reviewObtained,
    testsRun: context.testsRun,
    isHumanInvolved: context.isHumanInvolved,
  };

  // Run all constraint checks
  const constraintResults = defaultConstraintsEngine.checkAll(permissions, extendedContext);

  // Convert constraint results to validation results
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const info: ValidationInfo[] = [];

  for (const result of constraintResults) {
    if (result.severity === 'error' && !result.satisfied) {
      errors.push({
        code: 'CONSTRAINT_VIOLATION',
        message: result.message || 'Constraint violation',
      });
    } else if (result.severity === 'warning' && !result.satisfied) {
      warnings.push({
        code: 'CONSTRAINT_WARNING',
        message: result.message || 'Constraint warning',
      });
    } else if (result.severity === 'info') {
      info.push({
        code: 'CONSTRAINT_INFO',
        message: result.message || '',
      });
    }
  }

  // Additional validation checks
  validateProjectLevel(permissions, context, errors, warnings);
  validateAgentSupport(permissions, context, errors, warnings);
  validatePermissions(permissions, context, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

function validateProjectLevel(
  permissions: BehaviorPermissions,
  context: ValidationContext,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // POC projects should have minimal permissions
  if (context.projectLevel === 'POC' && permissions.canGenerateCode) {
    warnings.push({
      code: 'POC_GENERATION',
      message: 'Code generation is restricted for POC projects',
    });
  }
}

function validateAgentSupport(
  permissions: BehaviorPermissions,
  context: ValidationContext,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Human-only should never have write permissions
  if (context.agentSupport === 'human_only' && permissions.canWrite) {
    errors.push({
      code: 'HUMAN_ONLY_WRITE',
      message: 'Human-only agents should not have write permissions',
    });
  }
}

function validatePermissions(
  permissions: BehaviorPermissions,
  context: ValidationContext,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Can't commit without tests unless explicitly allowed
  if (permissions.canCommit && !permissions.canRunTests && !context.testsRun) {
    warnings.push({
      code: 'COMMIT_WITHOUT_TESTS',
      message: 'Committing without test capability may cause issues',
    });
  }

  // Auto-split requires write permission
  if (permissions.canAutoSplit && !permissions.canWrite) {
    errors.push({
      code: 'AUTO_SPLIT_WITHOUT_WRITE',
      message: 'Cannot auto-split without write permission',
    });
  }
}

/**
 * Validate if action is allowed
 */
export function validateAction(
  action: 'write' | 'commit' | 'generate' | 'test' | 'autosplit',
  permissions: BehaviorPermissions,
  context: ValidationContext
): ValidationResult {
  let allowed = false;

  switch (action) {
    case 'write':
      allowed = permissions.canWrite;
      break;
    case 'commit':
      allowed = permissions.canCommit;
      break;
    case 'generate':
      allowed = permissions.canGenerateCode;
      break;
    case 'test':
      allowed = permissions.canRunTests;
      break;
    case 'autosplit':
      allowed = permissions.canAutoSplit;
      break;
  }

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const info: ValidationInfo[] = [];

  if (!allowed) {
    errors.push({
      code: 'ACTION_NOT_ALLOWED',
      message: `Action '${action}' is not allowed with current permissions`,
    });
  }

  // Check approval requirements
  if (allowed && permissions.requiresApproval && !context.approvalObtained) {
    warnings.push({
      code: 'APPROVAL_RECOMMENDED',
      message: 'Approval is recommended but not obtained',
    });
  }

  // Check review requirements
  if (allowed && permissions.requiresReview && !context.reviewObtained) {
    warnings.push({
      code: 'REVIEW_RECOMMENDED',
      message: 'Review is recommended but not completed',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

/**
 * Create a validation context from spec metadata
 */
export function createValidationContext(
  projectLevel: ProjectLevel,
  agentSupport: AgentSupportLevel,
  role: AgentRole,
  layer: number,
  options?: Partial<ValidationContext>
): ValidationContext {
  return {
    projectLevel,
    agentSupport,
    role,
    layer,
    isNewFile: false,
    ...options,
  };
}
