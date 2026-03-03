"use strict";
/**
 * SPECLANG-GENERATED: Main parser module exports
 * Source: @speclang/headers @block:headers/parsing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectFixSuggestions = exports.suggestMissingLines = exports.suggestUnresolvedRef = exports.suggestMissingRecommended = exports.suggestInvalidEnum = exports.suggestInvalidLayer = exports.suggestInvalidVersion = exports.suggestInvalidId = exports.suggestMissingField = exports.getMessageSummary = exports.formatMessages = exports.createInfo = exports.createWarning = exports.createError = exports.INFO_CODES = exports.WARNING_CODES = exports.ERROR_CODES = exports.clearIndexCache = exports.loadSpecIndex = exports.findSpecFiles = exports.checkReferences = exports.checkReference = exports.validateAllSpecs = exports.validateSpec = exports.validateHeaderLines = exports.validateMetadata = exports.validateIdFormat = exports.isValidLayer = exports.isValidSemver = exports.extractMetadataReferences = exports.extractReferences = exports.extractBlocks = exports.parseSpecContent = exports.parseSpec = exports.parseHeader = exports.validateHeaderFields = exports.validateField = exports.getAllFieldNames = exports.getFieldDefinition = exports.isKnownField = exports.getFieldsByCategory = exports.getRequiredFieldNames = exports.SPEC_STATUSES = exports.AGENT_SUPPORTS = exports.PROJECT_LEVELS = exports.PART_PATTERN = exports.REF_PATTERN = exports.SEMVER_PATTERN = exports.ID_PATTERN = exports.FIELD_DEFINITIONS = void 0;
exports.DEFAULT_VALIDATION_CONFIG = exports.validateUnknownFields = exports.validateLinesField = exports.validatePartField = exports.validateRefFields = exports.validateTagsField = exports.validateEnumFields = exports.validateLayerField = exports.validateVersionField = exports.validateIdField = exports.validateRequiredFields = exports.validateAndAttemptRecovery = exports.validateHeaders = exports.validateHeaderFile = exports.validateHeader = exports.DEFAULT_RECOVERY_ACTIONS = exports.executeRecovery = exports.attemptAutoFix = void 0;
// Types
__exportStar(require("./types"), exports);
// Field definitions (Phase 0.17)
var fields_1 = require("./fields");
Object.defineProperty(exports, "FIELD_DEFINITIONS", { enumerable: true, get: function () { return fields_1.FIELD_DEFINITIONS; } });
Object.defineProperty(exports, "ID_PATTERN", { enumerable: true, get: function () { return fields_1.ID_PATTERN; } });
Object.defineProperty(exports, "SEMVER_PATTERN", { enumerable: true, get: function () { return fields_1.SEMVER_PATTERN; } });
Object.defineProperty(exports, "REF_PATTERN", { enumerable: true, get: function () { return fields_1.REF_PATTERN; } });
Object.defineProperty(exports, "PART_PATTERN", { enumerable: true, get: function () { return fields_1.PART_PATTERN; } });
Object.defineProperty(exports, "PROJECT_LEVELS", { enumerable: true, get: function () { return fields_1.PROJECT_LEVELS; } });
Object.defineProperty(exports, "AGENT_SUPPORTS", { enumerable: true, get: function () { return fields_1.AGENT_SUPPORTS; } });
Object.defineProperty(exports, "SPEC_STATUSES", { enumerable: true, get: function () { return fields_1.SPEC_STATUSES; } });
Object.defineProperty(exports, "getRequiredFieldNames", { enumerable: true, get: function () { return fields_1.getRequiredFieldNames; } });
Object.defineProperty(exports, "getFieldsByCategory", { enumerable: true, get: function () { return fields_1.getFieldsByCategory; } });
Object.defineProperty(exports, "isKnownField", { enumerable: true, get: function () { return fields_1.isKnownField; } });
Object.defineProperty(exports, "getFieldDefinition", { enumerable: true, get: function () { return fields_1.getFieldDefinition; } });
Object.defineProperty(exports, "getAllFieldNames", { enumerable: true, get: function () { return fields_1.getAllFieldNames; } });
// Field-level validation (Phase 0.17)
var field_validator_1 = require("./field-validator");
Object.defineProperty(exports, "validateField", { enumerable: true, get: function () { return field_validator_1.validateField; } });
Object.defineProperty(exports, "validateHeaderFields", { enumerable: true, get: function () { return field_validator_1.validateHeaderFields; } });
// Header parsing
var header_1 = require("./header");
Object.defineProperty(exports, "parseHeader", { enumerable: true, get: function () { return header_1.parseHeader; } });
Object.defineProperty(exports, "parseSpec", { enumerable: true, get: function () { return header_1.parseSpec; } });
Object.defineProperty(exports, "parseSpecContent", { enumerable: true, get: function () { return header_1.parseSpecContent; } });
Object.defineProperty(exports, "extractBlocks", { enumerable: true, get: function () { return header_1.extractBlocks; } });
Object.defineProperty(exports, "extractReferences", { enumerable: true, get: function () { return header_1.extractReferences; } });
Object.defineProperty(exports, "extractMetadataReferences", { enumerable: true, get: function () { return header_1.extractMetadataReferences; } });
// Validation
var validator_1 = require("./validator");
Object.defineProperty(exports, "isValidSemver", { enumerable: true, get: function () { return validator_1.isValidSemver; } });
Object.defineProperty(exports, "isValidLayer", { enumerable: true, get: function () { return validator_1.isValidLayer; } });
Object.defineProperty(exports, "validateIdFormat", { enumerable: true, get: function () { return validator_1.validateIdFormat; } });
Object.defineProperty(exports, "validateMetadata", { enumerable: true, get: function () { return validator_1.validateMetadata; } });
Object.defineProperty(exports, "validateHeaderLines", { enumerable: true, get: function () { return validator_1.validateHeaderLines; } });
Object.defineProperty(exports, "validateSpec", { enumerable: true, get: function () { return validator_1.validateSpec; } });
Object.defineProperty(exports, "validateAllSpecs", { enumerable: true, get: function () { return validator_1.validateAllSpecs; } });
Object.defineProperty(exports, "checkReference", { enumerable: true, get: function () { return validator_1.checkReference; } });
Object.defineProperty(exports, "checkReferences", { enumerable: true, get: function () { return validator_1.checkReferences; } });
Object.defineProperty(exports, "findSpecFiles", { enumerable: true, get: function () { return validator_1.findSpecFiles; } });
Object.defineProperty(exports, "loadSpecIndex", { enumerable: true, get: function () { return validator_1.loadSpecIndex; } });
Object.defineProperty(exports, "clearIndexCache", { enumerable: true, get: function () { return validator_1.clearIndexCache; } });
// Validation messages (Phase 0.18)
var validation_messages_1 = require("./validation-messages");
Object.defineProperty(exports, "ERROR_CODES", { enumerable: true, get: function () { return validation_messages_1.ERROR_CODES; } });
Object.defineProperty(exports, "WARNING_CODES", { enumerable: true, get: function () { return validation_messages_1.WARNING_CODES; } });
Object.defineProperty(exports, "INFO_CODES", { enumerable: true, get: function () { return validation_messages_1.INFO_CODES; } });
Object.defineProperty(exports, "createError", { enumerable: true, get: function () { return validation_messages_1.createError; } });
Object.defineProperty(exports, "createWarning", { enumerable: true, get: function () { return validation_messages_1.createWarning; } });
Object.defineProperty(exports, "createInfo", { enumerable: true, get: function () { return validation_messages_1.createInfo; } });
Object.defineProperty(exports, "formatMessages", { enumerable: true, get: function () { return validation_messages_1.formatMessages; } });
Object.defineProperty(exports, "getMessageSummary", { enumerable: true, get: function () { return validation_messages_1.getMessageSummary; } });
// Validation recovery (Phase 0.18)
var validation_recovery_1 = require("./validation-recovery");
Object.defineProperty(exports, "suggestMissingField", { enumerable: true, get: function () { return validation_recovery_1.suggestMissingField; } });
Object.defineProperty(exports, "suggestInvalidId", { enumerable: true, get: function () { return validation_recovery_1.suggestInvalidId; } });
Object.defineProperty(exports, "suggestInvalidVersion", { enumerable: true, get: function () { return validation_recovery_1.suggestInvalidVersion; } });
Object.defineProperty(exports, "suggestInvalidLayer", { enumerable: true, get: function () { return validation_recovery_1.suggestInvalidLayer; } });
Object.defineProperty(exports, "suggestInvalidEnum", { enumerable: true, get: function () { return validation_recovery_1.suggestInvalidEnum; } });
Object.defineProperty(exports, "suggestMissingRecommended", { enumerable: true, get: function () { return validation_recovery_1.suggestMissingRecommended; } });
Object.defineProperty(exports, "suggestUnresolvedRef", { enumerable: true, get: function () { return validation_recovery_1.suggestUnresolvedRef; } });
Object.defineProperty(exports, "suggestMissingLines", { enumerable: true, get: function () { return validation_recovery_1.suggestMissingLines; } });
Object.defineProperty(exports, "collectFixSuggestions", { enumerable: true, get: function () { return validation_recovery_1.collectFixSuggestions; } });
Object.defineProperty(exports, "attemptAutoFix", { enumerable: true, get: function () { return validation_recovery_1.attemptAutoFix; } });
Object.defineProperty(exports, "executeRecovery", { enumerable: true, get: function () { return validation_recovery_1.executeRecovery; } });
Object.defineProperty(exports, "DEFAULT_RECOVERY_ACTIONS", { enumerable: true, get: function () { return validation_recovery_1.DEFAULT_RECOVERY_ACTIONS; } });
// Header validator (Phase 0.18)
var header_validator_1 = require("./header-validator");
Object.defineProperty(exports, "validateHeader", { enumerable: true, get: function () { return header_validator_1.validateHeader; } });
Object.defineProperty(exports, "validateHeaderFile", { enumerable: true, get: function () { return header_validator_1.validateHeaderFile; } });
Object.defineProperty(exports, "validateHeaders", { enumerable: true, get: function () { return header_validator_1.validateHeaders; } });
Object.defineProperty(exports, "validateAndAttemptRecovery", { enumerable: true, get: function () { return header_validator_1.validateAndAttemptRecovery; } });
Object.defineProperty(exports, "validateRequiredFields", { enumerable: true, get: function () { return header_validator_1.validateRequiredFields; } });
Object.defineProperty(exports, "validateIdField", { enumerable: true, get: function () { return header_validator_1.validateIdField; } });
Object.defineProperty(exports, "validateVersionField", { enumerable: true, get: function () { return header_validator_1.validateVersionField; } });
Object.defineProperty(exports, "validateLayerField", { enumerable: true, get: function () { return header_validator_1.validateLayerField; } });
Object.defineProperty(exports, "validateEnumFields", { enumerable: true, get: function () { return header_validator_1.validateEnumFields; } });
Object.defineProperty(exports, "validateTagsField", { enumerable: true, get: function () { return header_validator_1.validateTagsField; } });
Object.defineProperty(exports, "validateRefFields", { enumerable: true, get: function () { return header_validator_1.validateRefFields; } });
Object.defineProperty(exports, "validatePartField", { enumerable: true, get: function () { return header_validator_1.validatePartField; } });
Object.defineProperty(exports, "validateLinesField", { enumerable: true, get: function () { return header_validator_1.validateLinesField; } });
Object.defineProperty(exports, "validateUnknownFields", { enumerable: true, get: function () { return header_validator_1.validateUnknownFields; } });
Object.defineProperty(exports, "DEFAULT_VALIDATION_CONFIG", { enumerable: true, get: function () { return header_validator_1.DEFAULT_VALIDATION_CONFIG; } });
//# sourceMappingURL=index.js.map