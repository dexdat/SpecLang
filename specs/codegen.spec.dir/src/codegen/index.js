"use strict";
/**
 * SPECLANG-GENERATED: Main codegen module
 * Source: @speclang/codegen @block:main
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
exports.Writer = exports.codeWriter = exports.CodeWriter = exports.getAllGenerators = exports.getSupportedTargets = exports.isTargetSupported = exports.getGenerator = exports.generateForSpec = exports.targetRegistry = exports.clearExternalTemplates = exports.getExternalTemplates = exports.loadExternalTemplate = exports.createBlockMarker = exports.TEMPLATES = exports.listTemplates = exports.getTemplateNames = exports.getTemplate = exports.renderTemplate = exports.TYPE_MAPPINGS = exports.getTypeMapping = exports.isStdlibType = exports.getStdlibTypes = exports.mapType = exports.specHasCodeBlocks = exports.findCodeSpecFiles = exports.parseCodeSpecContent = exports.parseCodeSpec = void 0;
exports.generate = generate;
exports.generateAll = generateAll;
exports.generateFromDir = generateFromDir;
// Types
__exportStar(require("./types"), exports);
// Parser
var parser_1 = require("./parser");
Object.defineProperty(exports, "parseCodeSpec", { enumerable: true, get: function () { return parser_1.parseCodeSpec; } });
Object.defineProperty(exports, "parseCodeSpecContent", { enumerable: true, get: function () { return parser_1.parseCodeSpecContent; } });
Object.defineProperty(exports, "findCodeSpecFiles", { enumerable: true, get: function () { return parser_1.findCodeSpecFiles; } });
Object.defineProperty(exports, "specHasCodeBlocks", { enumerable: true, get: function () { return parser_1.specHasCodeBlocks; } });
// Mapper
var mapper_1 = require("./mapper");
Object.defineProperty(exports, "mapType", { enumerable: true, get: function () { return mapper_1.mapType; } });
Object.defineProperty(exports, "getStdlibTypes", { enumerable: true, get: function () { return mapper_1.getStdlibTypes; } });
Object.defineProperty(exports, "isStdlibType", { enumerable: true, get: function () { return mapper_1.isStdlibType; } });
Object.defineProperty(exports, "getTypeMapping", { enumerable: true, get: function () { return mapper_1.getTypeMapping; } });
Object.defineProperty(exports, "TYPE_MAPPINGS", { enumerable: true, get: function () { return mapper_1.TYPE_MAPPINGS; } });
// Templates
var templates_1 = require("./templates");
Object.defineProperty(exports, "renderTemplate", { enumerable: true, get: function () { return templates_1.renderTemplate; } });
Object.defineProperty(exports, "getTemplate", { enumerable: true, get: function () { return templates_1.getTemplate; } });
Object.defineProperty(exports, "getTemplateNames", { enumerable: true, get: function () { return templates_1.getTemplateNames; } });
Object.defineProperty(exports, "listTemplates", { enumerable: true, get: function () { return templates_1.listTemplates; } });
Object.defineProperty(exports, "TEMPLATES", { enumerable: true, get: function () { return templates_1.TEMPLATES; } });
Object.defineProperty(exports, "createBlockMarker", { enumerable: true, get: function () { return templates_1.createBlockMarker; } });
Object.defineProperty(exports, "loadExternalTemplate", { enumerable: true, get: function () { return templates_1.loadExternalTemplate; } });
Object.defineProperty(exports, "getExternalTemplates", { enumerable: true, get: function () { return templates_1.getExternalTemplates; } });
Object.defineProperty(exports, "clearExternalTemplates", { enumerable: true, get: function () { return templates_1.clearExternalTemplates; } });
// Targets
var targets_1 = require("./targets");
Object.defineProperty(exports, "targetRegistry", { enumerable: true, get: function () { return targets_1.targetRegistry; } });
Object.defineProperty(exports, "generateForSpec", { enumerable: true, get: function () { return targets_1.generateForSpec; } });
Object.defineProperty(exports, "getGenerator", { enumerable: true, get: function () { return targets_1.getGenerator; } });
Object.defineProperty(exports, "isTargetSupported", { enumerable: true, get: function () { return targets_1.isTargetSupported; } });
Object.defineProperty(exports, "getSupportedTargets", { enumerable: true, get: function () { return targets_1.getSupportedTargets; } });
Object.defineProperty(exports, "getAllGenerators", { enumerable: true, get: function () { return targets_1.getAllGenerators; } });
// Writer
var writer_1 = require("./writer");
Object.defineProperty(exports, "CodeWriter", { enumerable: true, get: function () { return writer_1.CodeWriter; } });
Object.defineProperty(exports, "codeWriter", { enumerable: true, get: function () { return writer_1.codeWriter; } });
// ============================================================================
// MAIN CODE GENERATION FUNCTION
// ============================================================================
const parser_2 = require("./parser");
const targets_2 = require("./targets");
const writer_2 = require("./writer");
Object.defineProperty(exports, "Writer", { enumerable: true, get: function () { return writer_2.CodeWriter; } });
/**
 * Generate code from a spec file
 */
function generate(filepath, options) {
    const timestamp = new Date().toISOString();
    try {
        // Parse spec
        const spec = (0, parser_2.parseCodeSpec)(filepath);
        // Override target if specified
        if (options?.target) {
            spec.target.language = options.target;
        }
        if (options?.outputDir) {
            spec.target.outputPath = options.outputDir;
        }
        // Generate code
        const files = (0, targets_2.generateForSpec)(spec);
        // Write files
        const writeResult = writer_2.codeWriter.write(files, { dryRun: options?.dryRun });
        return {
            generated: files,
            skipped: writeResult.skipped,
            errors: writeResult.errors,
            timestamp,
        };
    }
    catch (error) {
        return {
            generated: [],
            skipped: [],
            errors: [{
                    file: filepath,
                    error: error instanceof Error ? error.message : 'Unknown error',
                }],
            timestamp,
        };
    }
}
/**
 * Generate code for multiple spec files
 */
function generateAll(filepaths, options) {
    const allFiles = [];
    const allErrors = [];
    const allSkipped = [];
    for (const filepath of filepaths) {
        const result = generate(filepath, options);
        allFiles.push(...result.generated);
        allErrors.push(...result.errors);
        allSkipped.push(...result.skipped);
    }
    // Write all files at once
    if (!options?.dryRun && allFiles.length > 0) {
        const writeResult = writer_2.codeWriter.write(allFiles);
        return {
            generated: allFiles,
            skipped: [...allSkipped, ...writeResult.skipped],
            errors: [...allErrors, ...writeResult.errors],
            timestamp: new Date().toISOString(),
        };
    }
    return {
        generated: allFiles,
        skipped: allSkipped,
        errors: allErrors,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Generate code for all specs in a directory
 */
function generateFromDir(dir, options) {
    const { findCodeSpecFiles } = require('./parser');
    const files = findCodeSpecFiles(dir, options?.recursive ?? true);
    return generateAll(files, options);
}
//# sourceMappingURL=index.js.map