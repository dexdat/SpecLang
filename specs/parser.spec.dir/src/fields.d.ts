/**
 * SPECLANG-GENERATED: Header field definitions registry
 * Source: @speclang/headers Phase 0.17 - Header Field Definitions
 * DO NOT EDIT MANUALLY
 */
import type { FieldDefinition, FieldCategory } from './field-types';
import type { ProjectLevel, AgentSupport, SpecStatus } from './types';
/** Pattern for spec IDs: @domain/path or @domain/path#block */
export declare const ID_PATTERN: RegExp;
/** Pattern for semantic versioning */
export declare const SEMVER_PATTERN: RegExp;
/** Pattern for @ref: references */
export declare const REF_PATTERN: RegExp;
/** Pattern for part field e.g. "2/5" */
export declare const PART_PATTERN: RegExp;
/** Pattern for UUID session IDs */
export declare const UUID_PATTERN: RegExp;
/** Pattern for commit hashes */
export declare const COMMIT_PATTERN: RegExp;
/** Pattern for cascade IDs */
export declare const CASCADE_PATTERN: RegExp;
export declare const PROJECT_LEVELS: readonly ProjectLevel[];
export declare const AGENT_SUPPORTS: readonly AgentSupport[];
export declare const SPEC_STATUSES: readonly SpecStatus[];
/**
 * Complete registry of all known header fields.
 * Keyed by field name for O(1) lookup.
 */
export declare const FIELD_DEFINITIONS: Record<string, FieldDefinition>;
/** Get all required field names */
export declare function getRequiredFieldNames(): string[];
/** Get field definitions by category */
export declare function getFieldsByCategory(category: FieldCategory): FieldDefinition[];
/** Check if a field name is known */
export declare function isKnownField(name: string): boolean;
/** Get a field definition by name, or undefined */
export declare function getFieldDefinition(name: string): FieldDefinition | undefined;
/** Get all known field names */
export declare function getAllFieldNames(): string[];
//# sourceMappingURL=fields.d.ts.map