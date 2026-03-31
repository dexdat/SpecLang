/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer.spec.md
 * Generated: 2026-03-31T00:00:00.000Z
 * 
 * Edit the spec, not this file.
 */

export {
  Layer,
  LAYER_NAMES,
  LAYER_DESCRIPTIONS,
  LAYER_EXTENSIONS,
  LAYER_OWNERS,
  LayerValidationResult,
  LayerTransition,
  isValidLayer,
  getMinValidLayer,
} from './types';

export { validateLayer, validateLayerDependency, validateLayerChain } from './validator';
export { resolveLayer, resolveLayerFromPath, resolveLayerFromContent } from './resolver';
