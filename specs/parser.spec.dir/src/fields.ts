/**
 * SPECLANG-GENERATED: Header field definitions registry
 * Source: @speclang/headers Phase 0.17 - Header Field Definitions
 * DO NOT EDIT MANUALLY
 */

import type {
  FieldDefinition,
  FieldCategory,
} from './field-types';
import type {
  ProjectLevel,
  AgentSupport,
  SpecStatus,
} from './types';

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

/** Pattern for spec IDs: @domain/path or @domain/path#block */
export const ID_PATTERN = /^@[a-z0-9][a-z0-9_-]*\/[a-z0-9_\-/.]+$/i;

/** Pattern for semantic versioning */
export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** Pattern for @ref: references */
export const REF_PATTERN = /^@ref:[a-z0-9][a-z0-9_\-/.#]*$/i;

/** Pattern for part field e.g. "2/5" */
export const PART_PATTERN = /^\d+\/\d+$/;

/** Pattern for UUID session IDs */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pattern for commit hashes */
export const COMMIT_PATTERN = /^@commit:[a-f0-9]{8,40}$/i;

/** Pattern for cascade IDs */
export const CASCADE_PATTERN = /^@cascade:\d{8}-\d{3}$/;

// ============================================================================
// ENUM VALUE SETS
// ============================================================================

export const PROJECT_LEVELS: readonly ProjectLevel[] = [
  'POC',
  'MVP',
  'Alpha',
  'Beta',
  'Production',
  'Startup',
  'SMB',
  'MSB',
  'Enterprise',
] as const;

export const AGENT_SUPPORTS: readonly AgentSupport[] = [
  'human_only',
  'agent_assisted',
  'agent_autonomous',
] as const;

export const SPEC_STATUSES: readonly SpecStatus[] = [
  'draft',
  'stable',
  'deprecated',
  'active',
  'generated',
] as const;

// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

/**
 * Complete registry of all known header fields.
 * Keyed by field name for O(1) lookup.
 */
export const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  // --- Identity fields (required) ---
  id: {
    name: 'id',
    type: 'id',
    required: true,
    description: 'Unique identifier in @domain/path format',
    example: '@specs/auth/login',
    pattern: ID_PATTERN,
    category: 'identity',
  },
  version: {
    name: 'version',
    type: 'semver',
    required: true,
    description: 'Semantic version (major.minor.patch)',
    example: '1.0.0',
    pattern: SEMVER_PATTERN,
    category: 'identity',
  },

  // --- Relationship fields ---
  depends_on: {
    name: 'depends_on',
    type: 'ref[]',
    required: false,
    description: 'List of @ref: dependency references',
    example: '@ref:specs/auth#login',
    pattern: REF_PATTERN,
    category: 'relationship',
  },
  refs: {
    name: 'refs',
    type: 'ref[]',
    required: false,
    description: 'Outgoing reference links',
    example: '@ref:stdlib/Result',
    pattern: REF_PATTERN,
    category: 'relationship',
  },
  children: {
    name: 'children',
    type: 'ref[]',
    required: false,
    description: 'Sub-spec children for index specs',
    example: '@ref:specs/auth/flows',
    pattern: REF_PATTERN,
    category: 'relationship',
  },
  parent: {
    name: 'parent',
    type: 'ref',
    required: false,
    description: 'Parent spec ID for sub-specs',
    example: '@ref:specs/auth',
    pattern: REF_PATTERN,
    category: 'relationship',
  },

  // --- Metadata fields ---
  layer: {
    name: 'layer',
    type: 'number',
    required: true,
    description: 'Depth in dependency tree (0=root/north star, increasing for deeper nodes)',
    example: '5',
    range: { min: 0, max: 10 },
    category: 'metadata',
  },
  project_level: {
    name: 'project_level',
    type: 'enum',
    required: true,
    description: 'Project maturity level',
    example: 'Alpha',
    enumValues: PROJECT_LEVELS,
    category: 'metadata',
  },
  agent_support: {
    name: 'agent_support',
    type: 'enum',
    required: true,
    description: 'Agent autonomy support level',
    example: 'agent_autonomous',
    enumValues: AGENT_SUPPORTS,
    category: 'metadata',
  },
  tags: {
    name: 'tags',
    type: 'string[]',
    required: false,
    description: 'Keywords for search and categorization',
    example: 'auth, security, jwt',
    category: 'metadata',
  },
  short: {
    name: 'short',
    type: 'string',
    required: true,
    description: 'One-line description',
    example: 'JWT authentication handler',
    category: 'metadata',
  },
  target: {
    name: 'target',
    type: 'string',
    required: false,
    description: 'Output target language',
    example: 'typescript',
    category: 'metadata',
  },
  status: {
    name: 'status',
    type: 'enum',
    required: false,
    description: 'Spec lifecycle status',
    example: 'draft',
    enumValues: SPEC_STATUSES,
    category: 'metadata',
  },
  part: {
    name: 'part',
    type: 'part',
    required: false,
    description: 'Part number for split specs',
    example: '2/5',
    pattern: PART_PATTERN,
    category: 'metadata',
  },

  // --- Ownership fields ---
  owned_by: {
    name: 'owned_by',
    type: 'string',
    required: false,
    description: 'Agent that owns this spec',
    example: 'codegen-agent',
    category: 'ownership',
  },
  session_id: {
    name: 'session_id',
    type: 'string',
    required: false,
    description: 'Session UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    pattern: UUID_PATTERN,
    category: 'ownership',
  },
  caused_by: {
    name: 'caused_by',
    type: 'string',
    required: false,
    description: 'Commit hash that triggered this change',
    example: '@commit:abc123def',
    pattern: COMMIT_PATTERN,
    category: 'ownership',
  },
  change_id: {
    name: 'change_id',
    type: 'string',
    required: false,
    description: 'This commit\'s hash',
    example: '@commit:def456ghi',
    pattern: COMMIT_PATTERN,
    category: 'ownership',
  },
  part_of: {
    name: 'part_of',
    type: 'string',
    required: false,
    description: 'Cascade ID this change belongs to',
    example: '@cascade:20250222-001',
    pattern: CASCADE_PATTERN,
    category: 'ownership',
  },

  // --- Efficiency fields ---
  lines: {
    name: 'lines',
    type: 'number',
    required: false,
    description: 'Declared header line count for fast parsing',
    example: '12',
    range: { min: 1, max: 200 },
    category: 'efficiency',
  },
};

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/** Get all required field names */
export function getRequiredFieldNames(): string[] {
  return Object.values(FIELD_DEFINITIONS)
    .filter((f) => f.required)
    .map((f) => f.name);
}

/** Get field definitions by category */
export function getFieldsByCategory(
  category: FieldCategory,
): FieldDefinition[] {
  return Object.values(FIELD_DEFINITIONS).filter(
    (f) => f.category === category,
  );
}

/** Check if a field name is known */
export function isKnownField(name: string): boolean {
  return name in FIELD_DEFINITIONS;
}

/** Get a field definition by name, or undefined */
export function getFieldDefinition(
  name: string,
): FieldDefinition | undefined {
  return FIELD_DEFINITIONS[name];
}

/** Get all known field names */
export function getAllFieldNames(): string[] {
  return Object.keys(FIELD_DEFINITIONS);
}
