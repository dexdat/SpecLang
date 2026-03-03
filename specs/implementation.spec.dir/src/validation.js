"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecValidator = exports.SpecFormatValidator = exports.ReferenceValidator = exports.HeaderValidator = void 0;
exports.validateFile = validateFile;
exports.validateHeader = validateHeader;
exports.validateReferences = validateReferences;
#;
speclang - header;
lines: 3;
#;
target: src / validation.ts;
// speclang-header lines:20
// id: @generated/validation-system
// target: typescript
// produces: validation.ts
// layer: 10
// refs: [@ref:specs/validation]
// ---
// @block:validation/main @kind:code
/**
 * Validation System
 *
 * Spec validation rules. Checked on every write.
 *
 * Location: validation.ts
 * Version: 0.1.0
 *
 * Generated from @ref:specs/validation
 */
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
// ============================================================================
// Header Validator
// ============================================================================
class HeaderValidator {
    static validateHeader(content) {
        const errors = [];
        const warnings = [];
        const lines = content.split('\n');
        // Line 1 validation
        if (lines.length > 0) {
            const line1 = lines[0].trim();
            if (line1 !== '' && !line1.startsWith('#')) {
                warnings.push('Line 1 should be a comment or blank');
            }
        }
        // Line 2 validation
        if (lines.length > 1) {
            const line2 = lines[1].trim();
            if (!line2.includes('speclang-header')) {
                errors.push('Line 2 must contain "speclang-header"');
            }
            const match = line2.match(/speclang-header lines:(\d+)/);
            if (!match) {
                errors.push('Line 2 must declare line count: "speclang-header lines:N"');
            }
            else {
                const headerLines = parseInt(match[1], 10);
                if (headerLines < 3 || headerLines > 100) {
                    errors.push(`Header line count ${headerLines} is out of range (3-100)`);
                }
            }
        }
        else {
            errors.push('File must have at least 2 lines');
        }
        // Parse YAML header
        if (lines.length >= 3) {
            const headerLines = lines.slice(1, lines.length).join('\n');
            const yamlEnd = headerLines.indexOf('---');
            if (yamlEnd === -1) {
                errors.push('Missing YAML separator "---"');
            }
            else {
                const yamlText = headerLines.substring(0, yamlEnd);
                try {
                    const parsed = yaml_1.default.parse(yamlText);
                    // Required fields
                    if (!parsed.id) {
                        errors.push('Missing required field: id');
                    }
                    else if (!parsed.id.startsWith('@')) {
                        errors.push('Field id must start with "@"');
                    }
                    if (!parsed.version) {
                        errors.push('Missing required field: version');
                    }
                    else if (!/^\d+\.\d+\.\d+$/.test(parsed.version)) {
                        warnings.push('Version should follow semver (x.y.z)');
                    }
                    // Optional fields validation
                    if (parsed.layer !== undefined && (parsed.layer < 0 || parsed.layer > 10)) {
                        errors.push('Layer must be between 0 and 10');
                    }
                    if (parsed.tags && !Array.isArray(parsed.tags)) {
                        errors.push('Tags must be an array');
                    }
                    if (parsed.short && typeof parsed.short !== 'string') {
                        errors.push('Short description must be a string');
                    }
                }
                catch (e) {
                    errors.push(`YAML parsing error: ${e.message}`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
exports.HeaderValidator = HeaderValidator;
// ============================================================================
// Reference Validator
// ============================================================================
class ReferenceValidator {
    specIndex;
    constructor(specIndex) {
        this.specIndex = specIndex;
    }
    validateReferences(content) {
        const errors = [];
        const warnings = [];
        // Find all @ref: patterns
        const refRegex = /@ref:([^\s]+)/g;
        const matches = content.matchAll(refRegex);
        for (const match of matches) {
            const ref = match[1];
            // Check if reference exists in index
            if (!this.specIndex.has(ref)) {
                errors.push(`Reference not found: @ref:${ref}`);
            }
            else {
                // Check if reference points to a block (#block)
                if (ref.includes('#')) {
                    const [file, block] = ref.split('#');
                    // For now, just warn about block validation
                    warnings.push(`Block reference validation not implemented: ${block}`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
exports.ReferenceValidator = ReferenceValidator;
// ============================================================================
// Spec Format Validator
// ============================================================================
class SpecFormatValidator {
    static validateFileExtension(filePath) {
        const errors = [];
        const warnings = [];
        const ext = path_1.default.extname(filePath);
        const base = path_1.default.basename(filePath);
        // Check naming conventions
        if (ext === '.spec.md' || ext === '.spec.yaml' || ext === '.spec.yml') {
            // Valid spec file
        }
        else if (ext === '.scl') {
            // Project file
            if (base !== 'project.scl') {
                warnings.push('.scl extension should only be used for project.scl');
            }
        }
        else if (ext.match(/\.(go|ts|py|rs|js)\.spec$/)) {
            // Code spec file
        }
        else {
            errors.push(`Invalid file extension for spec: ${ext}`);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    static validateBlockSyntax(content) {
        const errors = [];
        const warnings = [];
        // Check for block markers
        const blockRegex = /^# @block:([^\s]+) @kind:([^\s]+)/gm;
        const matches = [...content.matchAll(blockRegex)];
        if (matches.length === 0) {
            warnings.push('No block markers found (optional for some spec types)');
        }
        for (const match of matches) {
            const blockId = match[1];
            const kind = match[2];
            // Validate block ID format
            if (!blockId.match(/^[a-z0-9\-]+\/[a-z0-9\-]+$/)) {
                errors.push(`Invalid block ID format: ${blockId}`);
            }
            // Validate kind
            const validKinds = ['note', 'entity', 'operation', 'code', 'diagram', 'table', 'example'];
            if (!validKinds.includes(kind)) {
                warnings.push(`Unknown block kind: ${kind}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
exports.SpecFormatValidator = SpecFormatValidator;
// ============================================================================
// Main Validator
// ============================================================================
class SpecValidator {
    specIndex;
    constructor(specIndex) {
        this.specIndex = specIndex || new Map();
    }
    async validateFile(filePath) {
        const content = await promises_1.default.readFile(filePath, 'utf-8');
        const headerResult = HeaderValidator.validateHeader(content);
        const referenceResult = new ReferenceValidator(this.specIndex).validateReferences(content);
        const formatResult = SpecFormatValidator.validateFileExtension(filePath);
        const blockResult = SpecFormatValidator.validateBlockSyntax(content);
        // Combine format and block results
        const combinedFormatResult = {
            valid: formatResult.valid && blockResult.valid,
            errors: [...formatResult.errors, ...blockResult.errors],
            warnings: [...formatResult.warnings, ...blockResult.warnings],
        };
        // Dependency validation (placeholder)
        const dependencyResult = {
            valid: true,
            errors: [],
            warnings: [],
        };
        return {
            header: headerResult,
            references: referenceResult,
            format: combinedFormatResult,
            dependencies: dependencyResult,
        };
    }
    async validateSpec(spec) {
        // Validate a spec object (from index)
        const errors = [];
        const warnings = [];
        if (!spec.id) {
            errors.push('Missing id');
        }
        if (!spec.version) {
            errors.push('Missing version');
        }
        if (spec.layer !== undefined && (spec.layer < 0 || spec.layer > 10)) {
            errors.push('Layer out of range (0-10)');
        }
        if (spec.tags && !Array.isArray(spec.tags)) {
            errors.push('Tags must be array');
        }
        if (spec.depends_on && !Array.isArray(spec.depends_on)) {
            warnings.push('depends_on should be array');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
exports.SpecValidator = SpecValidator;
// ============================================================================
// Utility Functions
// ============================================================================
async function validateFile(filePath) {
    const validator = new SpecValidator();
    return validator.validateFile(filePath);
}
function validateHeader(content) {
    return HeaderValidator.validateHeader(content);
}
function validateReferences(content, specIndex) {
    const validator = new ReferenceValidator(specIndex);
    return validator.validateReferences(content);
}
//# sourceMappingURL=validation.js.map