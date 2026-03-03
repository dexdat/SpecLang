"use strict";
/**
 * SPECLANG-GENERATED: Header field definitions registry
 * Source: @speclang/headers Phase 0.17 - Header Field Definitions
 * DO NOT EDIT MANUALLY
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIELD_DEFINITIONS = exports.SPEC_STATUSES = exports.AGENT_SUPPORTS = exports.PROJECT_LEVELS = exports.CASCADE_PATTERN = exports.COMMIT_PATTERN = exports.UUID_PATTERN = exports.PART_PATTERN = exports.REF_PATTERN = exports.SEMVER_PATTERN = exports.ID_PATTERN = void 0;
exports.getRequiredFieldNames = getRequiredFieldNames;
exports.getFieldsByCategory = getFieldsByCategory;
exports.isKnownField = isKnownField;
exports.getFieldDefinition = getFieldDefinition;
exports.getAllFieldNames = getAllFieldNames;
// ============================================================================
// VALIDATION PATTERNS
// ============================================================================
/** Pattern for spec IDs: @domain/path or @domain/path#block */
exports.ID_PATTERN = /^@[a-z0-9][a-z0-9_-]*\/[a-z0-9_\-/.]+$/i;
/** Pattern for semantic versioning */
exports.SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
/** Pattern for @ref: references */
exports.REF_PATTERN = /^@ref:[a-z0-9][a-z0-9_\-/.#]*$/i;
/** Pattern for part field e.g. "2/5" */
exports.PART_PATTERN = /^\d+\/\d+$/;
/** Pattern for UUID session IDs */
exports.UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Pattern for commit hashes */
exports.COMMIT_PATTERN = /^@commit:[a-f0-9]{8,40}$/i;
/** Pattern for cascade IDs */
exports.CASCADE_PATTERN = /^@cascade:\d{8}-\d{3}$/;
// ============================================================================
// ENUM VALUE SETS
// ============================================================================
exports.PROJECT_LEVELS = [
    'POC',
    'MVP',
    'Alpha',
    'Beta',
    'Production',
    'Startup',
    'SMB',
    'MSB',
    'Enterprise',
];
exports.AGENT_SUPPORTS = [
    'human_only',
    'agent_assisted',
    'agent_autonomous',
];
exports.SPEC_STATUSES = [
    'draft',
    'stable',
    'deprecated',
    'active',
    'generated',
];
// ============================================================================
// FIELD DEFINITIONS
// ============================================================================
/**
 * Complete registry of all known header fields.
 * Keyed by field name for O(1) lookup.
 */
exports.FIELD_DEFINITIONS = {
    // --- Identity fields (required) ---
    id: {
        name: 'id',
        type: 'id',
        required: true,
        description: 'Unique identifier in @domain/path format',
        example: '@specs/auth/login',
        pattern: exports.ID_PATTERN,
        category: 'identity',
    },
    version: {
        name: 'version',
        type: 'semver',
        required: true,
        description: 'Semantic version (major.minor.patch)',
        example: '1.0.0',
        pattern: exports.SEMVER_PATTERN,
        category: 'identity',
    },
    // --- Relationship fields ---
    depends_on: {
        name: 'depends_on',
        type: 'ref[]',
        required: false,
        description: 'List of @ref: dependency references',
        example: '@ref:specs/auth#login',
        pattern: exports.REF_PATTERN,
        category: 'relationship',
    },
    refs: {
        name: 'refs',
        type: 'ref[]',
        required: false,
        description: 'Outgoing reference links',
        example: '@ref:stdlib/Result',
        pattern: exports.REF_PATTERN,
        category: 'relationship',
    },
    children: {
        name: 'children',
        type: 'ref[]',
        required: false,
        description: 'Sub-spec children for index specs',
        example: '@ref:specs/auth/flows',
        pattern: exports.REF_PATTERN,
        category: 'relationship',
    },
    parent: {
        name: 'parent',
        type: 'ref',
        required: false,
        description: 'Parent spec ID for sub-specs',
        example: '@ref:specs/auth',
        pattern: exports.REF_PATTERN,
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
        enumValues: exports.PROJECT_LEVELS,
        category: 'metadata',
    },
    agent_support: {
        name: 'agent_support',
        type: 'enum',
        required: true,
        description: 'Agent autonomy support level',
        example: 'agent_autonomous',
        enumValues: exports.AGENT_SUPPORTS,
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
        enumValues: exports.SPEC_STATUSES,
        category: 'metadata',
    },
    part: {
        name: 'part',
        type: 'part',
        required: false,
        description: 'Part number for split specs',
        example: '2/5',
        pattern: exports.PART_PATTERN,
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
        pattern: exports.UUID_PATTERN,
        category: 'ownership',
    },
    caused_by: {
        name: 'caused_by',
        type: 'string',
        required: false,
        description: 'Commit hash that triggered this change',
        example: '@commit:abc123def',
        pattern: exports.COMMIT_PATTERN,
        category: 'ownership',
    },
    change_id: {
        name: 'change_id',
        type: 'string',
        required: false,
        description: 'This commit\'s hash',
        example: '@commit:def456ghi',
        pattern: exports.COMMIT_PATTERN,
        category: 'ownership',
    },
    part_of: {
        name: 'part_of',
        type: 'string',
        required: false,
        description: 'Cascade ID this change belongs to',
        example: '@cascade:20250222-001',
        pattern: exports.CASCADE_PATTERN,
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
function getRequiredFieldNames() {
    return Object.values(exports.FIELD_DEFINITIONS)
        .filter((f) => f.required)
        .map((f) => f.name);
}
/** Get field definitions by category */
function getFieldsByCategory(category) {
    return Object.values(exports.FIELD_DEFINITIONS).filter((f) => f.category === category);
}
/** Check if a field name is known */
function isKnownField(name) {
    return name in exports.FIELD_DEFINITIONS;
}
/** Get a field definition by name, or undefined */
function getFieldDefinition(name) {
    return exports.FIELD_DEFINITIONS[name];
}
/** Get all known field names */
function getAllFieldNames() {
    return Object.keys(exports.FIELD_DEFINITIONS);
}
//# sourceMappingURL=fields.js.map