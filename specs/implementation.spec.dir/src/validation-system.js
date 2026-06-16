"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationGuard = exports.ValidationEngine = void 0;
exports.validateCommand = validateCommand;
#;
speclang - header;
lines: 3;
#;
target: src / validation - system.ts;
// Generated from validation system implementation spec
// DO NOT EDIT MANUALLY
// Block: implementation/validation/engine
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const promises_1 = require("fs/promises");
const yaml_1 = require("yaml");
const path = __importStar(require("path"));
const glob_1 = require("glob");
class ValidationEngine {
    db;
    constructor(db) {
        this.db = db;
    }
    async validateSpec(filePath) {
        const errors = [];
        const warnings = [];
        try {
            const content = await (0, promises_1.readFile)(filePath, 'utf-8');
            const lines = content.split('\n');
            // Header validation
            const headerErrors = await this.validateHeader(filePath, lines);
            errors.push(...headerErrors);
            // Parse metadata
            const metadata = await this.extractMetadata(filePath, lines);
            if (metadata) {
                // ID validation
                const idErrors = this.validateId(metadata.id, filePath);
                errors.push(...idErrors);
                // Layer validation
                const layerErrors = this.validateLayer(metadata.layer);
                errors.push(...layerErrors);
                // Tag validation
                const tagErrors = this.validateTags(metadata.tags);
                errors.push(...tagErrors);
                // Reference validation
                const refErrors = await this.validateReferences(metadata.refs, filePath);
                errors.push(...refErrors);
                // Import validation
                const importErrors = await this.validateImports(metadata.imports);
                errors.push(...importErrors);
            }
            // File naming validation
            const namingErrors = this.validateFileName(filePath);
            errors.push(...namingErrors);
            // Block syntax validation
            const blockErrors = this.validateBlockSyntax(content);
            errors.push(...blockErrors);
        }
        catch (error) {
            errors.push({
                code: 'READ_ERROR',
                message: `Failed to read file: ${error.message}`,
                filePath
            });
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    async validateHeader(filePath, lines) {
        const errors = [];
        // Find speclang-header line
        const headerLineIndex = lines.findIndex(line => line.includes('speclang-header'));
        if (headerLineIndex === -1) {
            errors.push({
                code: 'MISSING_HEADER',
                message: 'Missing speclang-header declaration',
                filePath,
                line: 1
            });
            return errors;
        }
        // Check line count format
        const headerLine = lines[headerLineIndex];
        const lineCountMatch = headerLine.match(/lines:\s*(\d+)/);
        if (!lineCountMatch) {
            errors.push({
                code: 'HEADER_LINES_MISSING',
                message: 'Header must declare line count with "lines:N"',
                filePath,
                line: headerLineIndex + 1
            });
        }
        else {
            const expectedLines = parseInt(lineCountMatch[1]);
            // Check that there are enough lines
            if (lines.length < headerLineIndex + expectedLines) {
                errors.push({
                    code: 'HEADER_LINES_MISMATCH',
                    message: `Header declares ${expectedLines} lines but file has fewer lines`,
                    filePath,
                    line: headerLineIndex + 1
                });
            }
            // Check for separator
            const separatorIndex = lines.findIndex((line, idx) => idx >= headerLineIndex && line.trim() === '---');
            if (separatorIndex === -1 || separatorIndex !== headerLineIndex + expectedLines - 1) {
                errors.push({
                    code: 'HEADER_SEPARATOR_MISMATCH',
                    message: 'Header separator "---" not found at expected line',
                    filePath,
                    line: headerLineIndex + 1
                });
            }
        }
        return errors;
    }
    async extractMetadata(filePath, lines) {
        try {
            const headerLineIndex = lines.findIndex(line => line.includes('speclang-header'));
            if (headerLineIndex === -1)
                return null;
            const headerLine = lines[headerLineIndex];
            const lineCountMatch = headerLine.match(/lines:\s*(\d+)/);
            if (!lineCountMatch)
                return null;
            const expectedLines = parseInt(lineCountMatch[1]);
            const yamlStart = headerLineIndex + 1;
            const yamlEnd = yamlStart + expectedLines - 2; // exclude header line and separator
            const yamlLines = lines.slice(yamlStart, yamlEnd);
            const yamlText = yamlLines.join('\n');
            return (0, yaml_1.parse)(yamlText);
        }
        catch (error) {
            return null;
        }
    }
    validateId(id, filePath) {
        const errors = [];
        if (!id) {
            errors.push({
                code: 'MISSING_ID',
                message: 'ID field is required',
                filePath
            });
            return errors;
        }
        if (!id.startsWith('@')) {
            errors.push({
                code: 'ID_FORMAT',
                message: 'ID must start with @',
                filePath
            });
        }
        const parts = id.slice(1).split('/');
        if (parts.length < 2) {
            errors.push({
                code: 'ID_FORMAT',
                message: 'ID must follow @domain/path format',
                filePath
            });
        }
        const domain = parts[0];
        if (!/^[a-z0-9-]+$/.test(domain)) {
            errors.push({
                code: 'ID_DOMAIN',
                message: 'Domain must be lowercase with hyphens',
                filePath
            });
        }
        return errors;
    }
    validateLayer(layer) {
        const errors = [];
        if (layer === undefined || layer === null) {
            errors.push({
                code: 'MISSING_LAYER',
                message: 'Layer field is required',
                filePath: '' // will be filled by caller
            });
            return errors;
        }
        const layerNum = parseInt(layer);
        if (isNaN(layerNum) || layerNum < 0 || layerNum > 10) {
            errors.push({
                code: 'LAYER_RANGE',
                message: 'Layer must be integer 0-10',
                filePath: ''
            });
        }
        return errors;
    }
    validateTags(tags) {
        const errors = [];
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            errors.push({
                code: 'TAGS_EMPTY',
                message: 'Tags must be non-empty array',
                filePath: ''
            });
            return errors;
        }
        for (const tag of tags) {
            if (typeof tag !== 'string' || tag.trim() === '') {
                errors.push({
                    code: 'TAG_FORMAT',
                    message: 'Tag must be non-empty string',
                    filePath: ''
                });
            }
        }
        return errors;
    }
    async validateReferences(refs, filePath) {
        const errors = [];
        if (!refs || !Array.isArray(refs)) {
            return errors;
        }
        for (const ref of refs) {
            if (typeof ref !== 'string') {
                errors.push({
                    code: 'REF_FORMAT',
                    message: 'Reference must be string',
                    filePath
                });
                continue;
            }
            if (!ref.startsWith('@ref:')) {
                errors.push({
                    code: 'REF_PREFIX',
                    message: 'Reference must start with @ref:',
                    filePath
                });
                continue;
            }
            // Check if referenced spec exists in SQLite
            const refPath = ref.substring(5); // Remove '@ref:'
            const stmtCheckRef = this.db.prepare(`SELECT COUNT(*) as count FROM specs WHERE id = ? OR file_path LIKE ?`);
            const exists = stmtCheckRef.get(refPath, `%${refPath}%`);
            if (exists.count === 0) {
                errors.push({
                    code: 'REF_NOT_FOUND',
                    message: `Referenced spec not found: ${refPath}`,
                    filePath
                });
            }
        }
        return errors;
    }
    async validateImports(imports) {
        const errors = [];
        if (!imports || !Array.isArray(imports)) {
            return errors;
        }
        for (const imp of imports) {
            if (typeof imp !== 'string') {
                errors.push({
                    code: 'IMPORT_FORMAT',
                    message: 'Import must be string',
                    filePath: ''
                });
                continue;
            }
            // Check if imported spec exists
            const stmtCheckImport = this.db.prepare(`SELECT COUNT(*) as count FROM specs WHERE id = ?`);
            const exists = stmtCheckImport.get(imp);
            if (exists.count === 0) {
                errors.push({
                    code: 'IMPORT_NOT_FOUND',
                    message: `Imported spec not found: ${imp}`,
                    filePath: ''
                });
            }
        }
        return errors;
    }
    validateFileName(filePath) {
        const errors = [];
        const fileName = path.basename(filePath);
        // Check extension
        if (!fileName.endsWith('.spec.md') && !fileName.endsWith('.spec.yaml') && !fileName.endsWith('.scl')) {
            // Check for .{ext}.spec pattern
            const extSpecPattern = /\.[a-z]+\.spec$/;
            if (!extSpecPattern.test(fileName)) {
                errors.push({
                    code: 'FILE_EXTENSION',
                    message: 'File must have .spec.md, .spec.yaml, .scl, or .{ext}.spec extension',
                    filePath
                });
            }
        }
        // Check naming conventions
        if (fileName.includes(' ')) {
            errors.push({
                code: 'FILE_NAME_SPACES',
                message: 'File name must not contain spaces',
                filePath
            });
        }
        return errors;
    }
    validateBlockSyntax(content) {
        const errors = [];
        // Check for block syntax: '''speclang followed by # @block:
        const blockRegex = /```speclang\n# @block:([^\s]+) @kind:([^\s]+)/g;
        const matches = Array.from(content.matchAll(blockRegex));
        for (const match of matches) {
            const blockId = match[1];
            const kind = match[2];
            if (!blockId.match(/^[a-z0-9-]+\/[a-z0-9-]+$/)) {
                errors.push({
                    code: 'BLOCK_ID_FORMAT',
                    message: `Block ID must follow domain/name format: ${blockId}`,
                    filePath: '' // will be filled by caller
                });
            }
            const validKinds = ['note', 'code', 'entity', 'diagram', 'schema', 'api'];
            if (!validKinds.includes(kind)) {
                errors.push({
                    code: 'BLOCK_KIND',
                    message: `Block kind must be one of: ${validKinds.join(', ')}`,
                    filePath: ''
                });
            }
        }
        return errors;
    }
}
exports.ValidationEngine = ValidationEngine;
// Block: implementation/validation/cli
async function validateCommand(args) {
    const db = new better_sqlite3_1.default('.speclang/speclang.db');
    const engine = new ValidationEngine(db);
    const patterns = args.length > 0 ? args : ['specs/**/*.spec.md'];
    // @ts-ignore - glob types mismatch
    const files = (await glob_1.glob(patterns, { ignore: '**/.backup_spec_files/**' }));
    let totalErrors = 0;
    let totalFiles = 0;
    for (const file of files) {
        const result = await engine.validateSpec(file);
        totalFiles++;
        if (!result.valid) {
            console.error(`\n❌ ${file}`);
            for (const error of result.errors) {
                console.error(`  ${error.code}: ${error.message}`);
                if (error.line) {
                    console.error(`    Line ${error.line}`);
                }
            }
            totalErrors += result.errors.length;
        }
        else {
            console.log(`✅ ${file}`);
        }
    }
    console.log(`\nValidation complete: ${totalFiles} files, ${totalErrors} errors`);
    if (totalErrors > 0) {
        process.exit(1);
    }
}
// Block: implementation/validation/opencode-integration
// Integration with OpenCode plugin guard system
class ValidationGuard {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    async beforeFileWrite(filePath, content) {
        // Write content to temp file for validation
        const tempPath = `${filePath}.tmp`;
        await (0, promises_1.writeFile)(tempPath, content);
        const result = await this.engine.validateSpec(tempPath);
        await (0, promises_1.unlink)(tempPath);
        if (!result.valid) {
            // Send validation errors to agent
            this.sendValidationErrors(result.errors);
            return false;
        }
        return true;
    }
    sendValidationErrors(errors) {
        // Send errors via MCP or OpenCode event system
        errors.forEach(error => {
            console.error(`Validation error in ${error.filePath}: ${error.message}`);
        });
    }
}
exports.ValidationGuard = ValidationGuard;
//# sourceMappingURL=validation-system.js.map