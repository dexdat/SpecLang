/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer-definitions.spec.dir/abstraction.spec.md
 * Generated: 2026-03-20T17:45:00.000Z
 * 
 * Edit the spec, not this file.
 */

import { LayerDepth } from './types.js';
import { validateLayerConsistency, validateDependsOnLayers } from './semantics.js';

/**
 * Cross-field validation context
 */
export interface ValidationContext {
  id: string;
  layer: number;
  parent?: string;
  parentLayer?: number;
  dependsOn: Array<{ id: string; layer: number }>;
  projectLevel?: string;
  agentSupport?: string;
  status?: string;
}

/**
 * Cross-field validation rule
 */
export interface CrossFieldRule {
  name: string;
  description: string;
  validate: (context: ValidationContext) => ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Rule: Parent layer must be less than or equal to child layer
 */
export const PARENT_LAYER_RULE: CrossFieldRule = {
  name: 'parent-layer-valid',
  description: 'Child spec must have layer >= parent layer',
  validate: (context: ValidationContext): ValidationResult => {
    if (!context.parent || context.parentLayer === undefined) {
      return { passed: true, errors: [], warnings: [] };
    }

    const result = validateLayerConsistency(context.parentLayer, context.layer);
    return {
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    };
  },
};

/**
 * Rule: Depends on layers should be within ±2 of current layer
 */
export const DEPENDS_ON_LAYER_RULE: CrossFieldRule = {
  name: 'depends-on-layer-range',
  description: 'Dependencies should have similar layer values',
  validate: (context: ValidationContext): ValidationResult => {
    if (context.dependsOn.length === 0) {
      return { passed: true, errors: [], warnings: [] };
    }

    const depLayers = context.dependsOn.map((d) => d.layer);
    const result = validateDependsOnLayers(context.layer, depLayers);
    return {
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    };
  },
};

/**
 * Rule: project_level requires specific agent_support
 */
export const PROJECT_LEVEL_AGENT_SUPPORT_RULE: CrossFieldRule = {
  name: 'project-level-agent-support',
  description: 'Higher project levels require autonomous agent support',
  validate: (context: ValidationContext): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!context.projectLevel) {
      return { passed: true, errors: [], warnings: [] };
    }

    const levelHierarchy = ['POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'];
    const levelIndex = levelHierarchy.indexOf(context.projectLevel);

    if (context.agentSupport === 'human_only' && levelIndex >= 3) {
      warnings.push(
        `${context.projectLevel} typically requires agent_assisted or agent_autonomous, not human_only`
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  },
};

/**
 * Rule: Layer 5+ specs must reference implementation specs
 */
export const CODE_SPEC_REFERENCE_RULE: CrossFieldRule = {
  name: 'code-spec-references',
  description: 'Code specs (layer 5+) must reference implementation specs',
  validate: (context: ValidationContext): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (context.layer < LayerDepth.CODE_SPEC) {
      return { passed: true, errors: [], warnings: [] };
    }

    // Check if any dependency is at implementation layer or below
    const hasImplementationRef = context.dependsOn.some(
      (d) => d.layer >= LayerDepth.IMPLEMENTATION && d.layer < LayerDepth.CODE_SPEC
    );

    if (!hasImplementationRef && context.dependsOn.length > 0) {
      warnings.push(
        'Code specs should reference implementation specs (layer 3-4)'
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  },
};

/**
 * Rule: Status must be appropriate for layer
 */
export const LAYER_STATUS_RULE: CrossFieldRule = {
  name: 'layer-status-consistency',
  description: 'Status should be appropriate for layer maturity',
  validate: (context: ValidationContext): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!context.status) {
      return { passed: true, errors: [], warnings: [] };
    }

    const statusLower = context.status.toLowerCase();

    // Early layers (0-2) can have 'planning', 'active'
    if (context.layer <= LayerDepth.COMPONENT) {
      if (statusLower === 'deprecated' || statusLower === 'completed') {
        warnings.push(
          `${context.status} may be premature for early-layer specs`
        );
      }
    }

    // Later layers should have more final status
    if (context.layer >= LayerDepth.GENERATED_CODE) {
      if (statusLower === 'planning' || statusLower === 'draft') {
        warnings.push(
          'Generated code should have stable/active/completed status'
        );
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  },
};

/**
 * All cross-field validation rules
 */
export const CROSS_FIELD_RULES: CrossFieldRule[] = [
  PARENT_LAYER_RULE,
  DEPENDS_ON_LAYER_RULE,
  PROJECT_LEVEL_AGENT_SUPPORT_RULE,
  CODE_SPEC_REFERENCE_RULE,
  LAYER_STATUS_RULE,
];

/**
 * Run all cross-field validations
 */
export function validateCrossField(context: ValidationContext): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const rule of CROSS_FIELD_RULES) {
    const result = rule.validate(context);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    passed: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Run specific cross-field validation rule
 */
export function validateWithRule(
  ruleName: string,
  context: ValidationContext
): ValidationResult {
  const rule = CROSS_FIELD_RULES.find((r) => r.name === ruleName);
  if (!rule) {
    return {
      passed: false,
      errors: [`Unknown rule: ${ruleName}`],
      warnings: [],
    };
  }
  return rule.validate(context);
}
