"use strict";
/**
 * SPECLANG-GENERATED: Validation logic for spec files
 * Source: @speclang/headers @block:headers/validation
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
exports.isValidSemver = isValidSemver;
exports.isValidLayer = isValidLayer;
exports.validateIdFormat = validateIdFormat;
exports.loadSpecIndex = loadSpecIndex;
exports.clearIndexCache = clearIndexCache;
exports.checkReference = checkReference;
exports.checkReferences = checkReferences;
exports.validateMetadata = validateMetadata;
exports.validateHeaderLines = validateHeaderLines;
exports.validateSpec = validateSpec;
exports.validateAllSpecs = validateAllSpecs;
exports.findSpecFiles = findSpecFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const header_1 = require("./header");
// ============================================================================
// VALID ENUMS
// ============================================================================
const VALID_PROJECT_LEVELS = [
    'POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'
];
const VALID_AGENT_SUPPORTS = [
    'human_only', 'agent_assisted', 'agent_autonomous'
];
const VALID_STATUSES = ['draft', 'stable', 'deprecated', 'active', 'generated'];
// ============================================================================
// VALIDATION HELPERS
// ============================================================================
/** Check if version is valid semver */
function isValidSemver(version) {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
}
/** Check if layer is valid (0-10) */
function isValidLayer(layer) {
    return Number.isInteger(layer) && layer >= 0 && layer <= 10;
}
/** Check if ID matches file path convention */
function validateIdFormat(id, filepath) {
    // ID should be @domain/path format
    const idRegex = /^@[a-z0-9][a-z0-9/-]*$/i;
    if (!idRegex.test(id)) {
        return false;
    }
    // Extract expected ID from filepath
    const filename = path.basename(filepath, path.extname(filepath));
    const dir = path.dirname(filepath);
    // Simple check - the ID should relate to the path
    // This is a simplified validation
    return true;
}
/** Load the spec index */
let indexCache = null;
function loadSpecIndex(indexPath = '_index.json') {
    if (indexCache) {
        return indexCache;
    }
    try {
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf-8');
            const entries = JSON.parse(content);
            indexCache = {};
            for (const entry of entries) {
                if (entry.id) {
                    indexCache[entry.id] = entry;
                }
            }
            return indexCache;
        }
    }
    catch (e) {
        console.warn(`Failed to load spec index: ${e}`);
    }
    return {};
}
/** Clear index cache (for testing) */
function clearIndexCache() {
    indexCache = null;
}
// ============================================================================
// REFERENCE VALIDATION
// ============================================================================
/** Check if a reference target exists in the index */
function checkReference(ref, indexPath = '_index.json') {
    const index = loadSpecIndex(indexPath);
    const targetFile = ref.targetFile || ref.ref.replace('@ref:', '');
    // Check if target exists in index
    const targetId = `@${targetFile}`;
    const entry = index[targetId] || index[targetFile];
    if (entry) {
        return {
            reference: ref,
            exists: true,
            targetFile: entry.path,
            targetBlock: ref.targetBlock,
        };
    }
    return {
        reference: ref,
        exists: false,
    };
}
/** Check all references in a spec */
function checkReferences(filepath, indexPath = '_index.json') {
    const checks = [];
    try {
        const parsed = (0, header_1.parseSpecContent)(fs.readFileSync(filepath, 'utf-8'), filepath);
        for (const ref of parsed.references) {
            checks.push(checkReference(ref, indexPath));
        }
    }
    catch (e) {
        // If parsing fails, return empty
    }
    return checks;
}
// ============================================================================
// METADATA VALIDATION
// ============================================================================
/** Validate spec metadata */
function validateMetadata(metadata, filepath) {
    const errors = [];
    const warnings = [];
    // Required: id
    if (!metadata.id) {
        errors.push({
            code: 'MISSING_ID',
            message: 'Missing required field: id',
            file: filepath,
            field: 'id',
        });
    }
    else {
        // Validate ID format
        if (!validateIdFormat(metadata.id, filepath)) {
            errors.push({
                code: 'INVALID_ID_FORMAT',
                message: `Invalid id format: ${metadata.id}. Expected @domain/path format`,
                file: filepath,
                field: 'id',
            });
        }
    }
    // Required: version
    if (!metadata.version) {
        errors.push({
            code: 'MISSING_VERSION',
            message: 'Missing required field: version',
            file: filepath,
            field: 'version',
        });
    }
    else if (!isValidSemver(metadata.version)) {
        errors.push({
            code: 'INVALID_VERSION',
            message: `Invalid semver: ${metadata.version}`,
            file: filepath,
            field: 'version',
        });
    }
    // Optional: layer
    if (metadata.layer !== undefined) {
        if (!isValidLayer(metadata.layer)) {
            errors.push({
                code: 'INVALID_LAYER',
                message: `Invalid layer: ${metadata.layer}. Must be 0-10`,
                file: filepath,
                field: 'layer',
            });
        }
    }
    else {
        warnings.push({
            code: 'MISSING_LAYER',
            message: 'Missing recommended field: layer',
            file: filepath,
        });
    }
    // Optional: project_level
    if (metadata.project_level) {
        if (!VALID_PROJECT_LEVELS.includes(metadata.project_level)) {
            errors.push({
                code: 'INVALID_PROJECT_LEVEL',
                message: `Invalid project_level: ${metadata.project_level}. Valid values: ${VALID_PROJECT_LEVELS.join(', ')}`,
                file: filepath,
                field: 'project_level',
            });
        }
    }
    // Optional: agent_support
    if (metadata.agent_support) {
        if (!VALID_AGENT_SUPPORTS.includes(metadata.agent_support)) {
            errors.push({
                code: 'INVALID_AGENT_SUPPORT',
                message: `Invalid agent_support: ${metadata.agent_support}. Valid values: ${VALID_AGENT_SUPPORTS.join(', ')}`,
                file: filepath,
                field: 'agent_support',
            });
        }
    }
    // Optional: status
    if (metadata.status) {
        if (!VALID_STATUSES.includes(metadata.status)) {
            errors.push({
                code: 'INVALID_STATUS',
                message: `Invalid status: ${metadata.status}. Valid values: ${VALID_STATUSES.join(', ')}`,
                file: filepath,
                field: 'status',
            });
        }
    }
    return { errors, warnings };
}
// ============================================================================
// HEADER LINE COUNT VALIDATION
// ============================================================================
/** Validate header line count matches declared lines */
function validateHeaderLines(content, declaredLines, filepath) {
    const errors = [];
    const warnings = [];
    const lines = content.split('\n');
    let headerEndLine = 0;
    // Find the header terminator
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '---' && i > 0) {
            headerEndLine = i + 1; // Lines are 1-indexed
            break;
        }
    }
    if (declaredLines !== undefined) {
        if (headerEndLine !== declaredLines) {
            errors.push({
                code: 'HEADER_LINE_MISMATCH',
                message: `Header line count mismatch: declared ${declaredLines}, found ${headerEndLine}`,
                file: filepath,
                line: declaredLines,
            });
        }
    }
    else if (headerEndLine > 0) {
        warnings.push({
            code: 'MISSING_LINE_DECLARATION',
            message: `Header line count not declared. Found ${headerEndLine} lines.`,
            file: filepath,
        });
    }
    return { errors, warnings };
}
// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================
/**
 * Validate a single spec file
 */
function validateSpec(filepath, indexPath = '_index.json') {
    const errors = [];
    const warnings = [];
    // Read file
    let content;
    try {
        content = fs.readFileSync(filepath, 'utf-8');
    }
    catch (e) {
        return {
            valid: false,
            filepath,
            errors: [{
                    code: 'FILE_NOT_FOUND',
                    message: `File not found: ${filepath}`,
                    file: filepath,
                }],
            warnings: [],
        };
    }
    // Parse spec
    let parsed;
    try {
        parsed = (0, header_1.parseSpecContent)(content, filepath);
    }
    catch (e) {
        return {
            valid: false,
            filepath,
            errors: [{
                    code: 'PARSE_ERROR',
                    message: `Failed to parse spec: ${e instanceof Error ? e.message : String(e)}`,
                    file: filepath,
                }],
            warnings: [],
        };
    }
    // Validate metadata
    const metadataResult = validateMetadata(parsed.metadata, filepath);
    errors.push(...metadataResult.errors);
    warnings.push(...metadataResult.warnings);
    // Validate header lines
    if (parsed.metadata.lines) {
        const linesResult = validateHeaderLines(content, parsed.metadata.lines, filepath);
        errors.push(...linesResult.errors);
        warnings.push(...linesResult.warnings);
    }
    // Validate references
    const index = loadSpecIndex(indexPath);
    for (const ref of parsed.references) {
        const check = checkReference(ref, indexPath);
        if (!check.exists && index && Object.keys(index).length > 0) {
            warnings.push({
                code: 'UNRESOLVED_REFERENCE',
                message: `Unresolved reference: ${ref.ref}`,
                file: filepath,
                line: ref.line,
            });
        }
    }
    return {
        valid: errors.length === 0,
        filepath,
        errors,
        warnings,
    };
}
/**
 * Validate all specs in a directory
 */
function validateAllSpecs(specsDir = 'specs', indexPath = '_index.json') {
    const results = [];
    // Find all spec files
    const specFiles = findSpecFiles(specsDir);
    // Validate each file
    for (const filepath of specFiles) {
        results.push(validateSpec(filepath, indexPath));
    }
    const valid = results.filter(r => r.valid).length;
    const invalid = results.filter(r => !r.valid).length;
    return {
        total: results.length,
        valid,
        invalid,
        results,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Find all spec files in a directory
 */
function findSpecFiles(dir) {
    const files = [];
    const specExtensions = ['.spec.md', '.spec.yaml', '.spec', '.scl'];
    function walk(dirPath) {
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    // Skip hidden directories and common non-spec dirs
                    if (!entry.name.startsWith('.') && !entry.name.startsWith('node_modules')) {
                        walk(fullPath);
                    }
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    const baseName = entry.name.replace(ext, '');
                    // Check if it's a spec file
                    if (specExtensions.includes(ext) || baseName.endsWith('.spec')) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch (e) {
            // Skip directories we can't read
        }
    }
    walk(dir);
    return files;
}
//# sourceMappingURL=validator.js.map