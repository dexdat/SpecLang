/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer-definitions.spec.dir/abstraction.spec.md
 * Generated: 2026-03-20T17:45:00.000Z
 * 
 * Edit the spec, not this file.
 */

/**
 * Layer Definitions Module
 * 
 * Provides semantic definitions for spec layer depths,
 * agent guidance, evolution paths, and cross-field validation.
 */

// Types and constants
export * from './types.js';

// Semantic definitions
export * from './semantics.js';

// Agent guidance
export * from './agent-guidance.js';

// Evolution
export * from './evolution.js';

// Cross-field validation
export * from './cross-field.js';

// Re-export commonly used functions
export {
  getLayerName,
  getLayerDescription,
  getLayerExtensions,
  getLayerOwners,
  isValidLayer,
  validateLayerConsistency,
  getNextRecommendedLayer,
  getLayerPaths,
} from './semantics.js';

export {
  getLayerGuidance,
  getRolesForLayer,
  canRoleOperateAtLayer,
  getValidationFocus,
  getCommonPitfalls,
  getGuidanceForRole,
} from './agent-guidance.js';

export {
  getRecommendedPath,
  getEvolutionStage,
  isEvolutionComplete,
  getRemainingSteps,
  estimateEffort,
} from './evolution.js';

export {
  validateCrossField,
  validateWithRule,
  CROSS_FIELD_RULES,
} from './cross-field.js';
