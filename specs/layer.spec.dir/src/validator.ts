/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer.spec.md
 * Generated: 2026-03-31T00:00:00.000Z
 * 
 * Edit the spec, not this file.
 */

import { Layer, LayerValidationResult, isValidLayer } from './types';

/**
 * Validation rules for layers
 */
export const LAYER_VALIDATION_RULES = {
  /** Rule 1: No Backward Dependencies */
  NO_BACKWARD_DEPENDENCIES: 'A spec cannot depend on a spec at a higher layer.',
  
  /** Rule 2: Layer Field Required */
  LAYER_FIELD_REQUIRED: 'Every spec must have a valid layer field (0-9).',
  
  /** Rule 3: Parent Chain Valid */
  PARENT_CHAIN_VALID: 'Every dependency chain must end at layer 0.',
  
  /** Rule 4: No Circular Dependencies */
  NO_CIRCULAR_DEPENDENCIES: 'The dependency graph must be acyclic.',
  
  /** Rule 5: Monotonic Growth */
  MONOTONIC_GROWTH: 'When a spec creates children, the children must be at equal or higher layers.',
};

/**
 * Validate a layer value
 */
export function validateLayer(layer: number | undefined): LayerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (layer === undefined) {
    errors.push(LAYER_VALIDATION_RULES.LAYER_FIELD_REQUIRED);
    return { valid: false, errors, warnings };
  }
  
  if (!isValidLayer(layer)) {
    errors.push(`Invalid layer value: ${layer}. Layer must be between 0 and 9.`);
    return { valid: false, errors, warnings };
  }
  
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Validate a layer dependency
 * A spec at layer N can only depend on specs at layers 0 through N
 */
export function validateLayerDependency(
  dependentLayer: Layer,
  dependencyLayer: Layer
): LayerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (dependencyLayer > dependentLayer) {
    errors.push(
      `Layer ${dependentLayer} cannot depend on layer ${dependencyLayer}. ` +
      LAYER_VALIDATION_RULES.NO_BACKWARD_DEPENDENCIES
    );
    return { valid: false, errors, warnings };
  }
  
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Validate a complete layer dependency chain
 */
export function validateLayerChain(
  layer: Layer,
  dependencies: Layer[]
): LayerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check each dependency
  for (const dep of dependencies) {
    const depValidation = validateLayerDependency(layer, dep);
    errors.push(...depValidation.errors);
  }
  
  // Check for circular dependencies (basic check)
  const uniqueDeps = new Set(dependencies);
  if (uniqueDeps.size !== dependencies.length) {
    warnings.push('Potential circular dependency detected.');
  }
  
  // Check that chain ends at layer 0 (if there are dependencies)
  if (dependencies.length > 0 && !dependencies.includes(Layer.NORTH_STAR)) {
    warnings.push('Dependency chain does not include layer 0 (North Star).');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get the maximum allowed layer based on maturity level
 */
export function getMaxLayerForMaturity(maturity: string): Layer {
  const maturityToLayer: Record<string, Layer> = {
    POC: Layer.INTERFACE_SPECIFICATIONS,        // 3
    MVP: Layer.CODE_MAPPING,                    // 5
    ALPHA: Layer.TEST_SPECIFICATIONS,          // 7
    BETA: Layer.GENERATED_TESTS,                // 8
    PRODUCTION: Layer.PIPELINE_CONFIGURATION,  // 9
    STARTUP: Layer.CODE_MAPPING,                // 5
    SMB: Layer.TEST_SPECIFICATIONS,            // 7
    ENTERPRISE: Layer.PIPELINE_CONFIGURATION,  // 9
  };
  
  return maturityToLayer[maturity.toUpperCase()] ?? Layer.CODE_MAPPING;
}
