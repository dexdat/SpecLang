/**
 * SPECLANG-GENERATED: Main parser module exports
 * Source: @speclang/headers @block:headers/parsing
 */
export * from './types';
export type { FieldValueType, FieldDefinition, FieldCategory, IdentityFields, RelationshipFields, MetadataFields, OwnershipFields, EfficiencyFields, HeaderFields, ValidationSeverity, FieldValidationResult, FieldLevelHeaderValidationResult, } from './field-types';
export { FIELD_DEFINITIONS, ID_PATTERN, SEMVER_PATTERN, REF_PATTERN, PART_PATTERN, PROJECT_LEVELS, AGENT_SUPPORTS, SPEC_STATUSES, getRequiredFieldNames, getFieldsByCategory, isKnownField, getFieldDefinition, getAllFieldNames, } from './fields';
export { validateField, validateHeaderFields, } from './field-validator';
export { parseHeader, parseSpec, parseSpecContent, extractBlocks, extractReferences, extractMetadataReferences, } from './header';
export { isValidSemver, isValidLayer, validateIdFormat, validateMetadata, validateHeaderLines, validateSpec, validateAllSpecs, checkReference, checkReferences, findSpecFiles, loadSpecIndex, clearIndexCache, } from './validator';
export { ERROR_CODES, WARNING_CODES, INFO_CODES, createError, createWarning, createInfo, formatMessages, getMessageSummary, type ValidationMessage, } from './validation-messages';
export { suggestMissingField, suggestInvalidId, suggestInvalidVersion, suggestInvalidLayer, suggestInvalidEnum, suggestMissingRecommended, suggestUnresolvedRef, suggestMissingLines, collectFixSuggestions, attemptAutoFix, executeRecovery, type RecoveryActions, type FixSuggestion, DEFAULT_RECOVERY_ACTIONS, } from './validation-recovery';
export { validateHeader, validateHeaderFile, validateHeaders, validateAndAttemptRecovery, validateRequiredFields, validateIdField, validateVersionField, validateLayerField, validateEnumFields, validateTagsField, validateRefFields, validatePartField, validateLinesField, validateUnknownFields, DEFAULT_VALIDATION_CONFIG, type HeaderValidationConfig, type HeaderValidationResult, type ReferenceValidationResult, } from './header-validator';
//# sourceMappingURL=index.d.ts.map