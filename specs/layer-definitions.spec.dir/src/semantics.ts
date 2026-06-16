/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer-definitions.spec.dir/abstraction.spec.md
 * Generated: 2026-03-20T17:45:00.000Z
 * 
 * Edit the spec, not this file.
 */

import {
  LayerDepth,
  LAYER_NAMES,
  LAYER_DESCRIPTIONS,
  LAYER_EXTENSIONS,
  LAYER_OWNERS,
  LayerValidationResult,
  LayerTransition,
} from './types.js';

/**
 * Get layer name for a depth value
 */
export function getLayerName(depth: number): string {
  const layer = depth as LayerDepth;
  return LAYER_NAMES[layer] ?? `Layer ${depth}`;
}

/**
 * Get layer description for a depth value
 */
export function getLayerDescription(depth: number): string {
  const layer = depth as LayerDepth;
  return LAYER_DESCRIPTIONS[layer] ?? 'Custom layer';
}

/**
 * Get valid file extensions for a layer
 */
export function getLayerExtensions(depth: number): string[] {
  const layer = depth as LayerDepth;
  return LAYER_EXTENSIONS[layer] ?? [];
}

/**
 * Get agent owners for a layer
 */
export function getLayerOwners(depth: number): string[] {
  const layer = depth as LayerDepth;
  return LAYER_OWNERS[layer] ?? [];
}

/**
 * Get all valid layer depths
 */
export function getAllLayerDepths(): number[] {
  return Object.values(LayerDepth).filter(
    (v): v is LayerDepth => typeof v === 'number'
  );
}

/**
 * Check if a layer value is valid
 */
export function isValidLayer(depth: number): boolean {
  return depth >= 0 && depth <= 10 && Number.isInteger(depth);
}

/**
 * Validate layer consistency between parent and child specs
 */
export function validateLayerConsistency(
  parentLayer: number,
  childLayer: number
): LayerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Child must have layer >= parent
  if (childLayer < parentLayer) {
    errors.push(
      `Child spec layer (${childLayer}) must be >= parent layer (${parentLayer})`
    );
  }

  // Warn if layer difference is too large
  if (childLayer - parentLayer > 2) {
    warnings.push(
      `Large layer gap (${parentLayer} -> ${childLayer}). Consider intermediate layers.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate depends_on layer consistency
 */
export function validateDependsOnLayers(
  currentLayer: number,
  dependsOnLayers: number[]
): LayerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const depLayer of dependsOnLayers) {
    const diff = Math.abs(currentLayer - depLayer);
    if (diff > 2) {
      warnings.push(
        `Dependency layer ${depLayer} differs by ${diff} from current layer ${currentLayer}. Consider more similar layers.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a layer transition is valid
 */
export function isValidLayerTransition(
  from: number,
  to: number
): LayerTransition {
  // Allow any forward transition
  if (to >= from) {
    return {
      from: from as LayerDepth,
      to: to as LayerDepth,
      isValid: true,
    };
  }

  // Backward transitions need special handling
  return {
    from: from as LayerDepth,
    to: to as LayerDepth,
    isValid: false,
    reason: `Backward transition from layer ${from} to layer ${to} is not recommended`,
  };
}

/**
 * Get recommended next layer for evolution
 */
export function getNextRecommendedLayer(current: number): number | null {
  if (current < 0 || current >= 10) {
    return null;
  }
  return current + 1;
}

/**
 * Get all possible layer paths from current to target
 */
export function getLayerPaths(
  from: number,
  to: number
): number[][] {
  if (to <= from) {
    return [];
  }

  const paths: number[][] = [];
  const path: number[] = [from];

  function findPaths(current: number): void {
    if (current === to) {
      paths.push([...path]);
      return;
    }

    // Can skip 1 or 2 layers
    for (let next = current + 1; next <= Math.min(current + 2, to); next++) {
      path.push(next);
      findPaths(next);
      path.pop();
    }
  }

  findPaths(from);
  return paths;
}
