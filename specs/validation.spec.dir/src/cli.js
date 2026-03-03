"use strict";
/**
 * SPECLANG-GENERATED: Validation CLI
 * Source: @speclang/validation/cli
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
exports.validateCommand = validateCommand;
const glob_1 = require("glob");
const path = __importStar(require("path"));
const header_1 = require("../parser/header");
const engine_1 = require("./engine");
const reporter_1 = require("./reporter");
async function validateCommand(options) {
    const { files, projectDir, strict = false, verbose = false, format = 'text' } = options;
    const engine = new engine_1.ValidationEngine({ strict });
    const reporter = new reporter_1.ValidationReporter(verbose);
    const allFiles = [];
    for (const pattern of files) {
        const resolvedPattern = path.isAbsolute(pattern)
            ? pattern
            : path.join(projectDir, pattern);
        const matched = await (0, glob_1.glob)(resolvedPattern, {
            ignore: ['**/.backup_spec_files/**', '**/node_modules/**']
        });
        allFiles.push(...matched);
    }
    const uniqueFiles = [...new Set(allFiles)];
    const reports = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    let passedFiles = 0;
    for (const file of uniqueFiles) {
        try {
            const parsed = (0, header_1.parseSpec)(file);
            const report = await engine.validate(parsed);
            reports.push(report);
            if (report.passed) {
                passedFiles++;
            }
            totalErrors += report.errors.length;
            totalWarnings += report.warnings.length;
            if (format === 'text' || format === 'minimal') {
                const output = format === 'minimal'
                    ? reporter.formatMinimal([report])
                    : reporter.format(report);
                console.log(output);
            }
        }
        catch (error) {
            console.error(`Error validating ${file}:`, error.message);
            totalErrors++;
        }
    }
    const result = {
        success: totalErrors === 0,
        totalFiles: uniqueFiles.length,
        passedFiles,
        failedFiles: uniqueFiles.length - passedFiles,
        errors: totalErrors,
        warnings: totalWarnings,
        reports: format === 'json' ? reports : undefined
    };
    if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log('\n────────────────────────────────────────');
        console.log(`Validation Summary: ${uniqueFiles.length} files`);
        console.log(`  ✅ Passed: ${passedFiles}`);
        console.log(`  ❌ Failed: ${uniqueFiles.length - passedFiles}`);
        console.log(`  Errors: ${totalErrors}`);
        console.log(`  Warnings: ${totalWarnings}`);
    }
    return result;
}
exports.default = validateCommand;
//# sourceMappingURL=cli.js.map