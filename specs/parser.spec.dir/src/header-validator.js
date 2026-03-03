"use strict";
/**
 * SPECLANG-GENERATED: Full header validation implementation
 * Source: Phase 0.18 - Header Validation Rules
 * DO NOT EDIT MANUALLY
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RECOVERY_ACTIONS = exports.DEFAULT_VALIDATION_CONFIG = void 0;
exports.validateRequiredFields = validateRequiredFields;
exports.validateIdField = validateIdField;
exports.validateVersionField = validateVersionField;
exports.validateLayerField = validateLayerField;
exports.validateEnumFields = validateEnumFields;
exports.validateTagsField = validateTagsField;
exports.validateRefFields = validateRefFields;
exports.validatePartField = validatePartField;
exports.validateOwnershipFields = validateOwnershipFields;
exports.validateLinesField = validateLinesField;
exports.validateUnknownFields = validateUnknownFields;
exports.validateHeader = validateHeader;
exports.validateHeaderFile = validateHeaderFile;
exports.validateHeaders = validateHeaders;
exports.validateAndAttemptRecovery = validateAndAttemptRecovery;
const fs = __importStar(require("fs"));
const fields_1 = require("./fields");
const validation_messages_1 = require("./validation-messages");
const validation_recovery_1 = require("./validation-recovery");
Object.defineProperty(exports, "DEFAULT_RECOVERY_ACTIONS", { enumerable: true, get: function () { return validation_recovery_1.DEFAULT_RECOVERY_ACTIONS; } });
const header_1 = require("./header");
/** Default validation configuration */
exports.DEFAULT_VALIDATION_CONFIG = {
    checks: [
        'required_fields_present',
        'id_format_valid',
        'version_semver',
        'depends_on_refs_exist',
        'unknown_fields',
        'enum_values_valid',
    ],
    onFailure: ['log_error'],
    recovery: ['suggest_fixes'],
};
// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================
/**
 * Validate required fields are present
 */
function validateRequiredFields(metadata) {
    const messages = [];
    const required = (0, fields_1.getRequiredFieldNames)();
    for (const field of required) {
        const value = metadata[field];
        if (value === undefined || value === null || value === '') {
            messages.push((0, validation_messages_1.createError)('E002', validation_messages_1.ERROR_CODES.E002, {
                field,
                suggestion: (0, validation_recovery_1.suggestMissingField)(field).suggestion,
            }));
        }
    }
    return messages;
}
/**
 * Validate ID format
 */
function validateIdField(metadata) {
    const messages = [];
    if (!metadata.id)
        return messages;
    if (!fields_1.ID_PATTERN.test(metadata.id)) {
        const suggestion = (0, validation_recovery_1.suggestInvalidId)(metadata.id);
        messages.push((0, validation_messages_1.createError)('E004', validation_messages_1.ERROR_CODES.E004, {
            field: 'id',
            value: metadata.id,
            suggestion: suggestion.suggestion,
        }));
    }
    return messages;
}
/**
 * Validate version format (semver)
 */
function validateVersionField(metadata) {
    const messages = [];
    if (!metadata.version)
        return messages;
    if (!fields_1.SEMVER_PATTERN.test(metadata.version)) {
        const suggestion = (0, validation_recovery_1.suggestInvalidVersion)(metadata.version);
        messages.push((0, validation_messages_1.createError)('E005', validation_messages_1.ERROR_CODES.E005, {
            field: 'version',
            value: metadata.version,
            suggestion: suggestion.suggestion,
        }));
    }
    return messages;
}
/**
 * Validate layer field (0-10)
 */
function validateLayerField(metadata) {
    const messages = [];
    if (metadata.layer === undefined) {
        messages.push((0, validation_messages_1.createWarning)('W001', validation_messages_1.WARNING_CODES.W001, {
            field: 'layer',
            suggestion: (0, validation_recovery_1.suggestMissingRecommended)('layer', 5).suggestion,
        }));
        return messages;
    }
    if (!Number.isInteger(metadata.layer) || metadata.layer < 0 || metadata.layer > 10) {
        const suggestion = (0, validation_recovery_1.suggestInvalidLayer)(metadata.layer);
        messages.push((0, validation_messages_1.createError)('E006', validation_messages_1.ERROR_CODES.E006, {
            field: 'layer',
            value: metadata.layer,
            suggestion: suggestion.suggestion,
        }));
    }
    return messages;
}
/**
 * Validate enum fields
 */
function validateEnumFields(metadata) {
    const messages = [];
    // project_level
    if (metadata.project_level && !fields_1.PROJECT_LEVELS.includes(metadata.project_level)) {
        const suggestion = (0, validation_recovery_1.suggestInvalidEnum)('project_level', metadata.project_level, fields_1.PROJECT_LEVELS);
        messages.push((0, validation_messages_1.createError)('E007', validation_messages_1.ERROR_CODES.E007, {
            field: 'project_level',
            value: metadata.project_level,
            suggestion: suggestion.suggestion,
        }));
    }
    else if (!metadata.project_level) {
        messages.push((0, validation_messages_1.createWarning)('W002', validation_messages_1.WARNING_CODES.W002, {
            field: 'project_level',
            suggestion: (0, validation_recovery_1.suggestMissingRecommended)('project_level', 'Alpha').suggestion,
        }));
    }
    // agent_support
    if (metadata.agent_support && !fields_1.AGENT_SUPPORTS.includes(metadata.agent_support)) {
        const suggestion = (0, validation_recovery_1.suggestInvalidEnum)('agent_support', metadata.agent_support, fields_1.AGENT_SUPPORTS);
        messages.push((0, validation_messages_1.createError)('E008', validation_messages_1.ERROR_CODES.E008, {
            field: 'agent_support',
            value: metadata.agent_support,
            suggestion: suggestion.suggestion,
        }));
    }
    else if (!metadata.agent_support) {
        messages.push((0, validation_messages_1.createWarning)('W003', validation_messages_1.WARNING_CODES.W003, {
            field: 'agent_support',
            suggestion: (0, validation_recovery_1.suggestMissingRecommended)('agent_support', 'agent_assisted').suggestion,
        }));
    }
    // status
    if (metadata.status && !fields_1.SPEC_STATUSES.includes(metadata.status)) {
        const suggestion = (0, validation_recovery_1.suggestInvalidEnum)('status', metadata.status, fields_1.SPEC_STATUSES);
        messages.push((0, validation_messages_1.createError)('E009', validation_messages_1.ERROR_CODES.E009, {
            field: 'status',
            value: metadata.status,
            suggestion: suggestion.suggestion,
        }));
    }
    return messages;
}
/**
 * Validate tags field
 */
function validateTagsField(metadata) {
    const messages = [];
    if (metadata.tags !== undefined) {
        if (!Array.isArray(metadata.tags)) {
            messages.push((0, validation_messages_1.createError)('E010', validation_messages_1.ERROR_CODES.E010, {
                field: 'tags',
                suggestion: 'Tags should be an array of strings',
            }));
        }
        else if (metadata.tags.length === 0) {
            messages.push((0, validation_messages_1.createWarning)('W050', validation_messages_1.WARNING_CODES.W050, {
                field: 'tags',
                suggestion: 'Add tags for better searchability',
            }));
        }
    }
    return messages;
}
/**
 * Validate reference fields (depends_on, refs, children, parent)
 */
function validateRefFields(metadata) {
    const messages = [];
    const refFields = ['depends_on', 'refs', 'children', 'parent'];
    for (const field of refFields) {
        const value = metadata[field];
        if (value === undefined)
            continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                const refStr = typeof item === 'string' ? item : item.ref || '';
                if (refStr && !fields_1.REF_PATTERN.test(refStr.replace('@ref:', '@ref:'))) {
                    messages.push((0, validation_messages_1.createError)('E011', validation_messages_1.ERROR_CODES.E011, {
                        field,
                        suggestion: `Invalid reference format: ${refStr}`,
                    }));
                }
            }
        }
        else if (typeof value === 'string') {
            if (!fields_1.REF_PATTERN.test(value.replace('@ref:', '@ref:'))) {
                messages.push((0, validation_messages_1.createError)('E018', validation_messages_1.ERROR_CODES.E018, {
                    field,
                    suggestion: `Invalid reference format: ${value}`,
                }));
            }
        }
    }
    return messages;
}
/**
 * Validate part field format
 */
function validatePartField(metadata) {
    const messages = [];
    if (metadata.part && !fields_1.PART_PATTERN.test(metadata.part)) {
        messages.push((0, validation_messages_1.createError)('E012', validation_messages_1.ERROR_CODES.E012, {
            field: 'part',
            suggestion: 'Part should be in format N/M (e.g., 2/5)',
        }));
    }
    return messages;
}
/**
 * Validate ownership fields (caused_by, change_id, part_of)
 */
function validateOwnershipFields(metadata) {
    const messages = [];
    // caused_by - should match @commit:HASH format
    if (metadata.caused_by && !fields_1.COMMIT_PATTERN.test(metadata.caused_by)) {
        messages.push((0, validation_messages_1.createError)('E024', validation_messages_1.ERROR_CODES.E024, {
            field: 'caused_by',
            value: metadata.caused_by,
            suggestion: 'caused_by should be in format @commit:HASH (e.g., @commit:abc123def)',
        }));
    }
    // change_id - should match @commit:HASH format
    if (metadata.change_id && !fields_1.COMMIT_PATTERN.test(metadata.change_id)) {
        messages.push((0, validation_messages_1.createError)('E025', validation_messages_1.ERROR_CODES.E025, {
            field: 'change_id',
            value: metadata.change_id,
            suggestion: 'change_id should be in format @commit:HASH (e.g., @commit:def456ghi)',
        }));
    }
    // part_of - should match @cascade:DATE-ID format
    if (metadata.part_of && !fields_1.CASCADE_PATTERN.test(metadata.part_of)) {
        messages.push((0, validation_messages_1.createError)('E026', validation_messages_1.ERROR_CODES.E026, {
            field: 'part_of',
            value: metadata.part_of,
            suggestion: 'part_of should be in format @cascade:DATE-ID (e.g., @cascade:20250222-001)',
        }));
    }
    return messages;
}
/**
 * Validate lines field
 */
function validateLinesField(metadata, content) {
    const messages = [];
    // Calculate actual header lines
    const lines = content.split('\n');
    let actualLines = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---' && i > 0) {
            actualLines = i + 1;
            break;
        }
    }
    if (metadata.lines === undefined && actualLines > 10) {
        messages.push((0, validation_messages_1.createWarning)('W010', validation_messages_1.WARNING_CODES.W010, {
            field: 'lines',
            suggestion: (0, validation_recovery_1.suggestMissingLines)(actualLines).suggestion,
        }));
    }
    else if (metadata.lines !== undefined) {
        if (typeof metadata.lines !== 'number' || metadata.lines < 1) {
            messages.push((0, validation_messages_1.createError)('E016', validation_messages_1.ERROR_CODES.E016, {
                field: 'lines',
                suggestion: 'Lines should be a positive integer',
            }));
        }
        else if (metadata.lines !== actualLines && actualLines > 0) {
            messages.push((0, validation_messages_1.createWarning)('W011', validation_messages_1.WARNING_CODES.W011, {
                field: 'lines',
                suggestion: `Declared ${metadata.lines} but found ${actualLines}`,
            }));
        }
    }
    return messages;
}
/**
 * Check for unknown fields
 */
function validateUnknownFields(metadata) {
    const messages = [];
    const knownFields = new Set([
        'id', 'version', 'layer', 'project_level', 'agent_support',
        'tags', 'short', 'target', 'status', 'depends_on', 'refs',
        'children', 'parent', 'part', 'owned_by', 'session_id', 'lines',
        'siblings', 'generated', 'caused_by', 'change_id', 'part_of',
    ]);
    for (const key of Object.keys(metadata)) {
        if (!knownFields.has(key)) {
            const fieldDef = (0, fields_1.getFieldDefinition)(key);
            if (!fieldDef) {
                messages.push((0, validation_messages_1.createError)('E040', validation_messages_1.ERROR_CODES.E040, {
                    field: key,
                    suggestion: `Remove unknown field or add to field definitions`,
                }));
            }
        }
    }
    return messages;
}
// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================
/**
 * Validate a spec header
 */
function validateHeader(content, filepath = 'unknown', config = exports.DEFAULT_VALIDATION_CONFIG) {
    const errors = [];
    const warnings = [];
    const info = [];
    const suggestions = [];
    let metadata;
    let declaredLines;
    let actualLines = 0;
    // Parse header
    try {
        const parseResult = (0, header_1.parseHeader)(content);
        metadata = parseResult.metadata;
        declaredLines = metadata.lines;
        // Calculate actual header lines
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '---' && i > 0) {
                actualLines = i + 1;
                break;
            }
        }
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push((0, validation_messages_1.createError)('E020', `Header parse error: ${message}`));
        return {
            valid: false,
            filepath,
            errors,
            warnings,
            info,
            suggestions,
            lineCount: {
                declared: declaredLines,
                actual: actualLines,
                matches: false,
            },
        };
    }
    // Run validation checks
    if (config.checks.includes('required_fields_present')) {
        errors.push(...validateRequiredFields(metadata));
    }
    if (config.checks.includes('id_format_valid')) {
        errors.push(...validateIdField(metadata));
    }
    if (config.checks.includes('version_semver')) {
        errors.push(...validateVersionField(metadata));
    }
    if (config.checks.includes('enum_values_valid')) {
        const enumResults = validateEnumFields(metadata);
        errors.push(...enumResults.filter(m => m.severity === 'error'));
        warnings.push(...enumResults.filter(m => m.severity === 'warning'));
        const tagResults = validateTagsField(metadata);
        errors.push(...tagResults.filter(m => m.severity === 'error'));
        warnings.push(...tagResults.filter(m => m.severity === 'warning'));
        const refResults = validateRefFields(metadata);
        errors.push(...refResults.filter(m => m.severity === 'error'));
        warnings.push(...refResults.filter(m => m.severity === 'warning'));
        const partResults = validatePartField(metadata);
        errors.push(...partResults.filter(m => m.severity === 'error'));
        warnings.push(...partResults.filter(m => m.severity === 'warning'));
        const ownershipResults = validateOwnershipFields(metadata);
        errors.push(...ownershipResults.filter(m => m.severity === 'error'));
        warnings.push(...ownershipResults.filter(m => m.severity === 'warning'));
        const layerResults = validateLayerField(metadata);
        errors.push(...layerResults.filter(m => m.severity === 'error'));
        warnings.push(...layerResults.filter(m => m.severity === 'warning'));
    }
    if (config.checks.includes('unknown_fields')) {
        errors.push(...validateUnknownFields(metadata));
    }
    if (config.checks.includes('lines_matches_actual')) {
        warnings.push(...validateLinesField(metadata, content));
    }
    // Generate suggestions
    const errorObjs = errors.map(e => ({ code: e.code, field: e.field, value: metadata?.[e.field] }));
    const warningObjs = warnings.map(w => ({ code: w.code, field: w.field, value: metadata?.[w.field] }));
    suggestions.push(...(0, validation_recovery_1.collectFixSuggestions)(errorObjs, warningObjs, metadata));
    // Add success info if valid
    if (errors.length === 0) {
        info.push((0, validation_messages_1.createInfo)('I001', validation_messages_1.INFO_CODES.I001));
    }
    return {
        valid: errors.length === 0,
        filepath,
        metadata,
        errors,
        warnings,
        info,
        suggestions,
        lineCount: {
            declared: declaredLines,
            actual: actualLines,
            matches: declaredLines === actualLines || (declaredLines === undefined && actualLines > 0),
        },
    };
}
/**
 * Validate a spec file
 */
function validateHeaderFile(filepath, config = exports.DEFAULT_VALIDATION_CONFIG) {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        return validateHeader(content, filepath, config);
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
            valid: false,
            filepath,
            errors: [(0, validation_messages_1.createError)('E020', `Failed to read file: ${message}`)],
            warnings: [],
            info: [],
            suggestions: [],
        };
    }
}
// ============================================================================
// BATCH VALIDATION
// ============================================================================
/**
 * Validate multiple spec files
 */
function validateHeaders(filepaths, config = exports.DEFAULT_VALIDATION_CONFIG) {
    const results = [];
    for (const filepath of filepaths) {
        results.push(validateHeaderFile(filepath, config));
    }
    return {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        results,
    };
}
// ============================================================================
// VALIDATION WITH RECOVERY
// ============================================================================
/**
 * Validate header with automatic recovery attempts
 */
function validateAndAttemptRecovery(content, filepath = 'unknown', config = exports.DEFAULT_VALIDATION_CONFIG, recoveryActions = validation_recovery_1.DEFAULT_RECOVERY_ACTIONS) {
    const result = validateHeader(content, filepath, config);
    // If valid, no recovery needed
    if (result.valid) {
        return { result };
    }
    // Attempt auto-fix
    if (config.recovery.includes('auto_format_if_possible')) {
        const { fixed, applied } = (0, validation_recovery_1.attemptAutoFix)(result.metadata, result.suggestions);
        if (applied.length > 0) {
            // Re-validate with fixed metadata
            const revalidated = validateHeader(content, filepath, config);
            return {
                result: revalidated,
                recovered: {
                    metadata: fixed,
                    applied,
                },
            };
        }
    }
    // Execute recovery actions
    (0, validation_recovery_1.executeRecovery)({ errors: result.errors, warnings: result.warnings }, recoveryActions);
    return { result };
}
//# sourceMappingURL=header-validator.js.map