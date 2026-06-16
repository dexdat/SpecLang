/**
 * SPECLANG-GENERATED: TypeScript types for header field definitions
 * Source: @speclang/headers Phase 0.17 - Header Field Definitions
 * DO NOT EDIT MANUALLY
 */
import type { ProjectLevel, AgentSupport, SpecStatus } from './types';
/** Types a field value can be */
export type FieldValueType = 'string' | 'number' | 'boolean' | 'string[]' | 'ref' | 'ref[]' | 'semver' | 'id' | 'enum' | 'part';
/** A single field definition */
export interface FieldDefinition {
    /** Field name */
    name: string;
    /** Value type */
    type: FieldValueType;
    /** Whether field is required */
    required: boolean;
    /** Description */
    description: string;
    /** Example value */
    example: string;
    /** Regex pattern for validation (optional) */
    pattern?: RegExp;
    /** Valid enum values (for enum type) */
    enumValues?: readonly string[];
    /** Numeric range (for number type) */
    range?: {
        min: number;
        max: number;
    };
    /** Default value if not provided */
    defaultValue?: unknown;
    /** Category grouping */
    category: FieldCategory;
}
/** Field categories for grouping */
export type FieldCategory = 'identity' | 'relationship' | 'metadata' | 'ownership' | 'efficiency';
/** Identity fields - required for every spec */
export interface IdentityFields {
    /** Unique identifier @domain/path */
    id: string;
    /** Semantic version */
    version: string;
}
/** Relationship fields - connect specs together */
export interface RelationshipFields {
    /** Dependencies - @ref: references */
    depends_on?: string[];
    /** Outgoing references */
    refs?: string[];
    /** Sub-spec children */
    children?: string[];
    /** Parent spec ID */
    parent?: string;
}
/** Metadata fields - describe the spec */
export interface MetadataFields {
    /** Abstraction layer 0-10 */
    layer: number;
    /** Project maturity level */
    project_level: ProjectLevel;
    /** Agent support level */
    agent_support: AgentSupport;
    /** Tags for search */
    tags?: string[];
    /** One-line description */
    short: string;
    /** Target language */
    target?: string;
    /** Spec status */
    status?: SpecStatus;
    /** Part number for split specs e.g. "2/5" */
    part?: string;
}
/** Ownership fields - track who manages the spec */
export interface OwnershipFields {
    /** Agent that owns this file */
    owned_by?: string;
    /** Current session ID */
    session_id?: string;
    /** Commit that triggered this change */
    caused_by?: string;
    /** This commit's hash */
    change_id?: string;
    /** Cascade ID this belongs to */
    part_of?: string;
}
/** Efficiency fields - for fast parsing */
export interface EfficiencyFields {
    /** Declared header line count */
    lines?: number;
}
/** Complete header fields - union of all groups */
export interface HeaderFields extends IdentityFields, RelationshipFields, MetadataFields, OwnershipFields, EfficiencyFields {
    /** Allow additional custom fields */
    [key: string]: unknown;
}
/** Severity of a validation issue */
export type ValidationSeverity = 'error' | 'warning' | 'info';
/** Result of validating a single field */
export interface FieldValidationResult {
    /** Field name */
    field: string;
    /** Whether the field is valid */
    valid: boolean;
    /** Severity if not valid */
    severity?: ValidationSeverity;
    /** Error/warning code */
    code?: string;
    /** Human-readable message */
    message?: string;
    /** The value that was validated */
    value?: unknown;
}
/** Result of validating all header fields (field-level) */
export interface FieldLevelHeaderValidationResult {
    /** Whether all required fields are valid */
    valid: boolean;
    /** Individual field results */
    fields: FieldValidationResult[];
    /** Convenience: just the errors */
    errors: FieldValidationResult[];
    /** Convenience: just the warnings */
    warnings: FieldValidationResult[];
}
//# sourceMappingURL=field-types.d.ts.map