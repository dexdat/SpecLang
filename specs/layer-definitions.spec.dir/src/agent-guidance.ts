/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer-definitions.spec.dir/abstraction.spec.md
 * Generated: 2026-03-20T17:45:00.000Z
 * 
 * Edit the spec, not this file.
 */

import { LayerDepth, LAYER_OWNERS } from './types.js';

/**
 * Agent role types in the system
 */
export type AgentRole = 
  | 'north-star'
  | 'spec-writer'
  | 'code-gen'
  | 'test-writer'
  | 'ops-agent';

/**
 * Agent guidance for a specific layer
 */
export interface LayerGuidance {
  layer: number;
  roles: AgentRole[];
  shouldCreate: string[];
  shouldReference: string[];
  validationFocus: string[];
  commonPitfalls: string[];
}

/**
 * Detailed guidance for each layer
 */
export const LAYER_GUIDANCE: Record<number, LayerGuidance> = {
  [LayerDepth.NORTH_STAR]: {
    layer: LayerDepth.NORTH_STAR,
    roles: ['north-star'],
    shouldCreate: ['project.scl', 'architecture diagrams'],
    shouldReference: [],
    validationFocus: ['Goals are clear', 'Architecture is sound'],
    commonPitfalls: [
      'Too detailed - should stay at high level',
      'Missing key architectural decisions',
    ],
  },

  [LayerDepth.FEATURE]: {
    layer: LayerDepth.FEATURE,
    roles: ['spec-writer'],
    shouldCreate: ['feature specs', 'user stories', 'high-level requirements'],
    shouldReference: ['project.scl (north-star)'],
    validationFocus: [
      'Features align with north star',
      'Clear user value',
    ],
    commonPitfalls: [
      'Too implementation-focused',
      'Missing edge cases',
    ],
  },

  [LayerDepth.COMPONENT]: {
    layer: LayerDepth.COMPONENT,
    roles: ['spec-writer'],
    shouldCreate: ['entities', 'interfaces', 'data models', 'operations'],
    shouldReference: ['parent feature spec'],
    validationFocus: [
      'Complete entity definitions',
      'Clear relationships',
    ],
    commonPitfalls: [
      'Incomplete entity fields',
      'Missing validations',
    ],
  },

  [LayerDepth.DETAIL]: {
    layer: LayerDepth.DETAIL,
    roles: ['spec-writer', 'code-gen'],
    shouldCreate: [
      'detailed designs',
      'pseudocode',
      'algorithms',
      'diagrams',
    ],
    shouldReference: ['component specs', 'entities'],
    validationFocus: [
      'Algorithm correctness',
      'Edge cases covered',
    ],
    commonPitfalls: [
      'Over-optimizing early',
      'Missing error handling',
    ],
  },

  [LayerDepth.IMPLEMENTATION]: {
    layer: LayerDepth.IMPLEMENTATION,
    roles: ['code-gen'],
    shouldCreate: [
      'API definitions',
      'function signatures',
      'data transformations',
    ],
    shouldReference: ['detail specs', 'component specs'],
    validationFocus: [
      'API consistency',
      'Type safety',
    ],
    commonPitfalls: [
      'Inconsistent naming',
      'Missing error types',
    ],
  },

  [LayerDepth.CODE_SPEC]: {
    layer: LayerDepth.CODE_SPEC,
    roles: ['code-gen'],
    shouldCreate: [
      'language-specific code specs',
      'direct mappings to target language',
    ],
    shouldReference: ['implementation specs'],
    validationFocus: [
      'Correct syntax',
      'Idiomatic code',
    ],
    commonPitfalls: [
      'Copy-paste from other languages',
      'Missing imports',
    ],
  },

  [LayerDepth.TEST_SPEC]: {
    layer: LayerDepth.TEST_SPEC,
    roles: ['test-writer'],
    shouldCreate: [
      'natural language tests',
      'Given/When/Then scenarios',
    ],
    shouldReference: ['feature specs', 'implementation specs'],
    validationFocus: [
      'Complete coverage',
      'Clear scenarios',
    ],
    commonPitfalls: [
      'Missing edge cases',
      'Unclear test names',
    ],
  },

  [LayerDepth.TEST_CODE_SPEC]: {
    layer: LayerDepth.TEST_CODE_SPEC,
    roles: ['test-writer'],
    shouldCreate: ['test code specs', 'test utilities'],
    shouldReference: ['test specs', 'code specs'],
    validationFocus: [
      'Test structure',
      'Assertions',
    ],
    commonPitfalls: [
      'Weak assertions',
      'Test interdependence',
    ],
  },

  [LayerDepth.DEPLOYMENT]: {
    layer: LayerDepth.DEPLOYMENT,
    roles: ['ops-agent'],
    shouldCreate: [
      'deployment configs',
      'infrastructure specs',
      'Dockerfiles',
      'Kubernetes manifests',
    ],
    shouldReference: ['generated code', 'test specs'],
    validationFocus: [
      'Security hardening',
      'Resource limits',
    ],
    commonPitfalls: [
      'Hardcoded credentials',
      'Missing health checks',
    ],
  },
};

/**
 * Get guidance for a specific layer
 */
export function getLayerGuidance(layer: number): LayerGuidance | null {
  return LAYER_GUIDANCE[layer] ?? null;
}

/**
 * Get all roles that can operate at a layer
 */
export function getRolesForLayer(layer: number): AgentRole[] {
  const guidance = getLayerGuidance(layer);
  return guidance?.roles ?? [];
}

/**
 * Check if a role can operate at a layer
 */
export function canRoleOperateAtLayer(role: AgentRole, layer: number): boolean {
  const roles = getRolesForLayer(layer);
  return roles.includes(role);
}

/**
 * Get validation focus areas for a layer
 */
export function getValidationFocus(layer: number): string[] {
  const guidance = getLayerGuidance(layer);
  return guidance?.validationFocus ?? [];
}

/**
 * Get common pitfalls for a layer
 */
export function getCommonPitfalls(layer: number): string[] {
  const guidance = getLayerGuidance(layer);
  return guidance?.commonPitfalls ?? [];
}

/**
 * Get guidance for a role across all applicable layers
 */
export function getGuidanceForRole(role: AgentRole): LayerGuidance[] {
  return Object.values(LAYER_GUIDANCE).filter((g) => g.roles.includes(role));
}
