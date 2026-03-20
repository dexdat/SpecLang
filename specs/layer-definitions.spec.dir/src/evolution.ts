/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer-definitions.spec.dir/abstraction.spec.md
 * Generated: 2026-03-20T17:45:00.000Z
 * 
 * Edit the spec, not this file.
 */

import { LayerDepth } from './types.js';
import { getNextRecommendedLayer, getLayerPaths } from './semantics.js';

/**
 * Evolution stage in the spec lifecycle
 */
export type EvolutionStage =
  | 'created'
  | 'expanded'
  | 'refined'
  | 'implemented'
  | 'tested'
  | 'deployed'
  | 'deprecated';

/**
 * Evolution event
 */
export interface EvolutionEvent {
  timestamp: number;
  fromLayer: number;
  toLayer: number;
  trigger: string;
  agent: string;
}

/**
 * Evolution path
 */
export interface EvolutionPath {
  specId: string;
  events: EvolutionEvent[];
  currentLayer: number;
  stage: EvolutionStage;
}

/**
 * Standard evolution paths
 */
export const STANDARD_EVOLUTION_PATHS = [
  // Full path from intent to code
  {
    name: 'Full Stack',
    path: [0, 1, 2, 3, 4, 5, 6],
    description: 'Complete spec to generated code',
  },
  // Quick implementation path
  {
    name: 'Fast Track',
    path: [0, 1, 2, 5, 6],
    description: 'Minimal intermediate layers',
  },
  // With testing
  {
    name: 'Tested',
    path: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    description: 'Full path with test generation',
  },
  // With deployment
  {
    name: 'Production',
    path: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    description: 'Complete path to deployment',
  },
];

/**
 * Get recommended evolution path for a new spec
 */
export function getRecommendedPath(
  targetLayer: number,
  includeTests: boolean = false,
  includeDeployment: boolean = false
): number[] {
  // Start from north star
  const path = [LayerDepth.NORTH_STAR];

  // Add intermediate layers based on target
  if (targetLayer >= LayerDepth.FEATURE) {
    path.push(LayerDepth.FEATURE);
  }

  if (targetLayer >= LayerDepth.COMPONENT) {
    // For fast track, skip from feature to component
    if (targetLayer <= LayerDepth.COMPONENT) {
      path.push(LayerDepth.COMPONENT);
    } else if (targetLayer <= LayerDepth.DETAIL) {
      path.push(LayerDepth.COMPONENT);
      path.push(LayerDepth.DETAIL);
    } else {
      path.push(LayerDepth.COMPONENT);
      path.push(LayerDepth.DETAIL);
      path.push(LayerDepth.IMPLEMENTATION);
    }
  }

  // Add code spec and generated code if needed
  if (targetLayer >= LayerDepth.CODE_SPEC) {
    if (!path.includes(LayerDepth.IMPLEMENTATION)) {
      path.push(LayerDepth.IMPLEMENTATION);
    }
    path.push(LayerDepth.CODE_SPEC);
  }

  if (targetLayer >= LayerDepth.GENERATED_CODE) {
    path.push(LayerDepth.GENERATED_CODE);
  }

  // Add testing path if requested
  if (includeTests && targetLayer >= LayerDepth.TEST_SPEC) {
    path.push(LayerDepth.TEST_SPEC);
    path.push(LayerDepth.TEST_CODE_SPEC);
    path.push(LayerDepth.GENERATED_TEST);
  }

  // Add deployment if requested
  if (includeDeployment && targetLayer >= LayerDepth.DEPLOYMENT) {
    path.push(LayerDepth.DEPLOYMENT);
  }

  return path;
}

/**
 * Get evolution stage for a layer
 */
export function getEvolutionStage(layer: number): EvolutionStage {
  if (layer <= LayerDepth.FEATURE) {
    return 'created';
  }
  if (layer <= LayerDepth.DETAIL) {
    return 'expanded';
  }
  if (layer <= LayerDepth.IMPLEMENTATION) {
    return 'refined';
  }
  if (layer <= LayerDepth.GENERATED_CODE) {
    return 'implemented';
  }
  if (layer <= LayerDepth.GENERATED_TEST) {
    return 'tested';
  }
  if (layer === LayerDepth.DEPLOYMENT) {
    return 'deployed';
  }
  return 'deprecated';
}

/**
 * Check if evolution is complete for a path
 */
export function isEvolutionComplete(
  currentLayer: number,
  targetLayer: number
): boolean {
  return currentLayer >= targetLayer;
}

/**
 * Get remaining evolution steps
 */
export function getRemainingSteps(
  currentLayer: number,
  targetLayer: number
): number[] {
  const steps: number[] = [];
  let next = currentLayer + 1;

  while (next <= targetLayer) {
    steps.push(next);
    next++;
  }

  return steps;
}

/**
 * Estimate evolution effort
 */
export function estimateEffort(
  fromLayer: number,
  toLayer: number
): { low: number; medium: number; high: number } {
  const layers = toLayer - fromLayer;
  const baseEffort = layers * 10;

  return {
    low: Math.floor(baseEffort * 0.5),
    medium: Math.floor(baseEffort * 1),
    high: Math.floor(baseEffort * 2),
  };
}
