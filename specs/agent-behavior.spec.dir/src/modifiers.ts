/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/agent-behavior.spec.dir/behavior-matrix.spec.md
 * Generated: 2026-03-21T12:00:00Z
 *
 * Edit the spec, not this file.
 */

import type { BehaviorPermissions, ProjectLevel, AgentSupportLevel, AgentRole } from './behavior-matrix.js';

/**
 * Metadata-based behavior modifier
 */
export interface BehaviorModifier {
  id: string;
  name: string;
  description: string;
  matches: (metadata: SpecMetadata) => boolean;
  modify: (permissions: BehaviorPermissions) => BehaviorPermissions;
}

/**
 * Spec metadata for matching modifiers
 */
export interface SpecMetadata {
  id: string;
  version: string;
  layer: number;
  project_level?: ProjectLevel;
  agent_support?: AgentSupportLevel;
  tags?: string[];
  status?: string;
  parent?: string;
}

/**
 * Built-in modifiers based on metadata
 */
export const METADATA_MODIFIERS: BehaviorModifier[] = [
  {
    id: 'modifier-draft',
    name: 'Draft Status Modifier',
    description: 'Reduce permissions for draft specs',
    matches: (meta) => meta.status === 'draft',
    modify: (perm) => ({
      ...perm,
      canCommit: false,
      requiresApproval: true,
      requiresReview: true,
      humanInvolvement: perm.humanInvolvement === 'none' ? 'review' : perm.humanInvolvement,
    }),
  },
  {
    id: 'modifier-deprecated',
    name: 'Deprecated Modifier',
    description: 'Read-only for deprecated specs',
    matches: (meta) => meta.status === 'deprecated',
    modify: (perm) => ({
      canWrite: false,
      canCommit: false,
      canGenerateCode: false,
      canRunTests: false,
      canAutoSplit: false,
      requiresApproval: true,
      requiresReview: true,
      humanInvolvement: 'full',
    }),
  },
  {
    id: 'modifier-security',
    name: 'Security Tag Modifier',
    description: 'Extra restrictions for security-related specs',
    matches: (meta) => meta.tags?.includes('security') ?? false,
    modify: (perm) => ({
      ...perm,
      requiresReview: true,
      requiresApproval: true,
      humanInvolvement: perm.humanInvolvement === 'none' ? 'review' : perm.humanInvolvement,
    }),
  },
  {
    id: 'modifier-core',
    name: 'Core Layer Modifier',
    description: 'Higher restrictions for core (layer 0-1) specs',
    matches: (meta) => meta.layer <= 1,
    modify: (perm) => ({
      ...perm,
      requiresReview: true,
      requiresApproval: true,
      humanInvolvement: perm.humanInvolvement === 'none' ? 'approval' : perm.humanInvolvement,
    }),
  },
  {
    id: 'modifier-production',
    name: 'Production Stability Modifier',
    description: 'Stability-focused restrictions for production',
    matches: (meta) => meta.project_level === 'Production' || meta.project_level === 'Enterprise',
    modify: (perm) => ({
      ...perm,
      canCommit: perm.canCommit && perm.canRunTests,
      requiresReview: true,
    }),
  },
];

/**
 * Modifier application result
 */
export interface ModifierResult {
  original: BehaviorPermissions;
  modified: BehaviorPermissions;
  appliedModifiers: string[];
}

/**
 * Apply metadata-based modifiers to permissions
 */
export function applyModifiers(
  permissions: BehaviorPermissions,
  metadata: SpecMetadata,
  modifiers: BehaviorModifier[] = METADATA_MODIFIERS
): ModifierResult {
  const appliedModifiers: string[] = [];
  let modified = { ...permissions };

  for (const modifier of modifiers) {
    if (modifier.matches(metadata)) {
      modified = modifier.modify(modified);
      appliedModifiers.push(modifier.id);
    }
  }

  return {
    original: permissions,
    modified,
    appliedModifiers,
  };
}

/**
 * Get all matching modifiers for metadata
 */
export function getMatchingModifiers(
  metadata: SpecMetadata,
  modifiers: BehaviorModifier[] = METADATA_MODIFIERS
): BehaviorModifier[] {
  return modifiers.filter(m => m.matches(metadata));
}
