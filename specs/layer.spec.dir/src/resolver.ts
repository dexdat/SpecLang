/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer.spec.md
 * Generated: 2026-03-31T00:00:00.000Z
 * 
 * Edit the spec, not this file.
 */

import { Layer } from './types';

/**
 * File path patterns for layer auto-detection
 */
const LAYER_PATH_PATTERNS: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /^project\.scl$/, layer: Layer.NORTH_STAR },
  { pattern: /^project\.yaml$/, layer: Layer.NORTH_STAR },
  { pattern: /components?\.scl$/, layer: Layer.COMPONENT_ARCHITECTURE },
  { pattern: /components?\.spec\.md$/, layer: Layer.COMPONENT_ARCHITECTURE },
  { pattern: /entities?\.spec\.(md|yaml)$/, layer: Layer.DOMAIN_MODELS },
  { pattern: /models?\.spec\.(md|yaml)$/, layer: Layer.DOMAIN_MODELS },
  { pattern: /api\.spec\.(md|yaml)$/, layer: Layer.INTERFACE_SPECIFICATIONS },
  { pattern: /interface.*\.spec\.(md|yaml)$/, layer: Layer.INTERFACE_SPECIFICATIONS },
  { pattern: /workflows?\.spec\.(md|yaml)$/, layer: Layer.BUSINESS_LOGIC },
  { pattern: /business.*\.spec\.(md|yaml)$/, layer: Layer.BUSINESS_LOGIC },
  { pattern: /\.ts\.spec$/, layer: Layer.CODE_MAPPING },
  { pattern: /\.go\.spec$/, layer: Layer.CODE_MAPPING },
  { pattern: /\.py\.spec$/, layer: Layer.CODE_MAPPING },
  { pattern: /\.rs\.spec$/, layer: Layer.CODE_MAPPING },
  { pattern: /\/src\/.*\.(ts|go|py|rs)$/, layer: Layer.GENERATED_IMPLEMENTATION },
  { pattern: /.*\.test\.spec\.(md|yaml)$/, layer: Layer.TEST_SPECIFICATIONS },
  { pattern: /.*\.spec\.test\.(md|yaml)$/, layer: Layer.TEST_SPECIFICATIONS },
  { pattern: /\/tests\/.*\.(ts|go|py|rs)$/, layer: Layer.GENERATED_TESTS },
  { pattern: /pipeline\.yaml$/, layer: Layer.PIPELINE_CONFIGURATION },
  { pattern: /build\.yaml$/, layer: Layer.PIPELINE_CONFIGURATION },
  { pattern: /deploy.*\.yaml$/, layer: Layer.PIPELINE_CONFIGURATION },
];

/**
 * Content keywords for layer detection
 */
const LAYER_KEYWORDS: Array<{ keywords: string[]; layer: Layer }> = [
  { keywords: ['northstar', 'intent', 'vision', 'goals'], layer: Layer.NORTH_STAR },
  { keywords: ['component', 'service', 'module'], layer: Layer.COMPONENT_ARCHITECTURE },
  { keywords: ['entity', 'value object', 'aggregate', 'domain model'], layer: Layer.DOMAIN_MODELS },
  { keywords: ['api', 'interface', 'endpoint', 'rest', 'graphql'], layer: Layer.INTERFACE_SPECIFICATIONS },
  { keywords: ['business', 'workflow', 'use case', 'rule'], layer: Layer.BUSINESS_LOGIC },
  { keywords: ['test', 'scenario', 'given', 'when', 'then'], layer: Layer.TEST_SPECIFICATIONS },
  { keywords: ['build', 'deploy', 'pipeline', 'ci', 'cd'], layer: Layer.PIPELINE_CONFIGURATION },
];

/**
 * Resolve a layer from a file path
 */
export function resolveLayerFromPath(filePath: string): Layer | undefined {
  const fileName = filePath.split('/').pop() ?? '';
  
  for (const { pattern, layer } of LAYER_PATH_PATTERNS) {
    if (pattern.test(fileName)) {
      return layer;
    }
  }
  
  return undefined;
}

/**
 * Resolve a layer from file content
 */
export function resolveLayerFromContent(content: string): Layer | undefined {
  const lowerContent = content.toLowerCase();
  
  for (const { keywords, layer } of LAYER_KEYWORDS) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        return layer;
      }
    }
  }
  
  return undefined;
}

/**
 * Resolve a layer from dependencies
 * The minimum layer is determined by the minimum dependency layer + 1
 */
export function resolveLayerFromDependencies(dependencyLayers: Layer[]): Layer | undefined {
  if (dependencyLayers.length === 0) {
    return Layer.NORTH_STAR;
  }
  
  const minDep = Math.min(...dependencyLayers);
  return (minDep + 1) as Layer;
}

/**
 * Resolve the layer for a spec with all available information
 */
export function resolveLayer(options: {
  explicitLayer?: number;
  filePath?: string;
  content?: string;
  dependencyLayers?: Layer[];
}): Layer | undefined {
  // 1. If layer is explicitly provided, use it
  if (options.explicitLayer !== undefined) {
    return options.explicitLayer as Layer;
  }
  
  // 2. Try to resolve from file path
  if (options.filePath) {
    const pathLayer = resolveLayerFromPath(options.filePath);
    if (pathLayer !== undefined) {
      return pathLayer;
    }
  }
  
  // 3. Try to resolve from content
  if (options.content) {
    const contentLayer = resolveLayerFromContent(options.content);
    if (contentLayer !== undefined) {
      return contentLayer;
    }
  }
  
  // 4. Try to resolve from dependencies
  if (options.dependencyLayers && options.dependencyLayers.length > 0) {
    const depLayer = resolveLayerFromDependencies(options.dependencyLayers);
    if (depLayer !== undefined) {
      return depLayer;
    }
  }
  
  return undefined;
}

/**
 * Get the default layer for new specs
 */
export function getDefaultLayer(): Layer {
  return Layer.COMPONENT_ARCHITECTURE;
}
