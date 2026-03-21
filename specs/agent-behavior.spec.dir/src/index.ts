/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/agent-behavior.spec.dir/behavior-matrix.spec.md
 * Generated: 2026-03-21T12:00:00Z
 *
 * Edit the spec, not this file.
 */

// Re-export all types and functions from submodules
export * from './behavior-matrix.js';
export * from './rules.js';
export * from './modifiers.js';
export * from './constraints.js';
export * from './validators.js';

// Main entry point - combine all functionality
import { getBehaviorPermissions, getResourceBudget, getFallbackLevel, getBehaviorMatrixEntry, type AgentBehaviorConfig, type BehaviorMatrixEntry } from './behavior-matrix.js';
import { BehaviorRulesEngine, defaultRulesEngine, type RuleContext } from './rules.js';
import { applyModifiers, getMatchingModifiers, type SpecMetadata, type ModifierResult } from './modifiers.js';
import { ConstraintsEngine, defaultConstraintsEngine, type ExtendedConstraintContext } from './constraints.js';
import { validateBehavior, validateAction, createValidationContext, type ValidationResult, type ValidationContext } from './validators.js';

/**
 * Complete behavior analysis result
 */
export interface BehaviorAnalysis {
  config: AgentBehaviorConfig;
  permissions: ReturnType<typeof getBehaviorPermissions>;
  resourceBudget: ReturnType<typeof getResourceBudget>;
  fallbackLevel: ReturnType<typeof getFallbackLevel>;
  validation: ValidationResult;
  appliedModifiers: string[];
}

/**
 * Analyze agent behavior based on configuration
 */
export function analyzeBehavior(
  config: AgentBehaviorConfig,
  specMetadata?: SpecMetadata,
  validationContext?: Partial<ValidationContext>
): BehaviorAnalysis {
  // Get base permissions from matrix
  const permissions = getBehaviorPermissions(
    config.projectLevel,
    config.agentSupport,
    config.role
  );

  // Get resource budget
  const resourceBudget = getResourceBudget(
    config.projectLevel,
    config.agentSupport
  );

  // Get fallback level
  const fallbackLevel = getFallbackLevel(config.agentSupport, 0);

  // Apply metadata modifiers if provided
  let appliedModifiers: string[] = [];
  let modifiedPermissions = permissions;
  if (specMetadata) {
    const modifierResult = applyModifiers(permissions, specMetadata);
    modifiedPermissions = modifierResult.modified;
    appliedModifiers = modifierResult.appliedModifiers;
  }

  // Build full validation context
  const fullValidationContext: ValidationContext = {
    projectLevel: config.projectLevel,
    agentSupport: config.agentSupport,
    role: config.role,
    layer: config.layer,
    isNewFile: validationContext?.isNewFile ?? false,
    approvalObtained: validationContext?.approvalObtained,
    reviewObtained: validationContext?.reviewObtained,
    testsRun: validationContext?.testsRun,
    isHumanInvolved: validationContext?.isHumanInvolved,
    ...validationContext,
  };

  // Validate the behavior
  const validation = validateBehavior(modifiedPermissions, fullValidationContext);

  return {
    config,
    permissions: modifiedPermissions,
    resourceBudget,
    fallbackLevel,
    validation,
    appliedModifiers,
  };
}

/**
 * Default instance for convenience
 */
export const agentBehavior = {
  analyze: analyzeBehavior,
  getPermissions: getBehaviorPermissions,
  getResourceBudget,
  getFallbackLevel,
  validate: validateBehavior,
  validateAction,
  createContext: createValidationContext,
  rulesEngine: defaultRulesEngine,
  constraintsEngine: defaultConstraintsEngine,
  applyModifiers,
  getMatchingModifiers,
};
