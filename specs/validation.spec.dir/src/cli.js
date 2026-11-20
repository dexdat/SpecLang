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
const fs = __importStar(require("fs"));
const header_1 = require("../parser/header");
const engine_1 = require("./engine");
const reporter_1 = require("./reporter");
/**
 * Report for a spec file that failed BEFORE validation could run (parseSpec
 * threw — malformed speclang-header, bad lines: declaration, playbook error).
 *
 * Such a file is a validated-and-failed spec, not a skipped one: omitting it
 * from `reports` made a machine consumer counting reports see a clean array
 * (and `reports.length` disagree with `totalFiles`) while the process exited 1
 * (DF-SPECLANG-9).
 */
function parseFailureReport(file, error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
        file,
        errors: [
            {
                rule: '@validation/parse',
                level: 'error',
                location: { file, line: 'header' },
                message: `Failed to parse spec: ${message}`,
            },
        ],
        warnings: [],
        passed: false,
        timestamp: new Date(),
    };
}
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
    // Dedupe by realpath: glob traverses directory symlinks (e.g.
    // specs/project-layout.spec.dir/config -> ../config.spec.dir/src), so a
    // file reachable through both the real and the symlinked path is matched
    // twice. The shell's `find` (no -L) does not follow dir symlinks, so
    // realpath-deduping keeps the validate count in lockstep with
    // `speclang status` and `find specs ... | wc -l` (SL-GAP-038).
    const seenRealPaths = new Set();
    const uniqueFiles = [];
    for (const file of allFiles) {
        let realPath;
        try {
            realPath = fs.realpathSync(file);
        }
        catch {
            realPath = file;
        }
        if (!seenRealPaths.has(realPath)) {
            seenRealPaths.add(realPath);
            uniqueFiles.push(file);
        }
    }
    if (uniqueFiles.length === 0) {
        console.warn("⚠️ No spec files found matching specs/**/*.spec.md. Run 'speclang new <name>' to create a project.");
    }
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
                // DF-SPECLANG-5-R4: the default text output is a SUMMARY. A block per
                // file drowned the signal — 452 files produced ~1900 lines of
                // "✓ Passed" before the reader reached the summary, and a new user has
                // no reason to page through it. Files that FAILED are still printed in
                // full (their errors are the actionable part); clean files contribute
                // nothing, and warning detail moves to `--verbose`.
                if (format === 'minimal') {
                    console.log(reporter.formatMinimal([report]));
                }
                else if (verbose || report.errors.length > 0) {
                    console.log(reporter.format(report));
                }
            }
        }
        catch (error) {
            console.error(`Error validating ${file}:`, error.message);
            // Keep the failing spec in the report array so `--format json`
            // consumers see it (and reports.length === totalFiles) instead of a
            // silently short, all-clean array (DF-SPECLANG-9).
            const report = parseFailureReport(file, error);
            reports.push(report);
            totalErrors += report.errors.length;
        }
    }
    const result = {
        success: totalErrors === 0 && uniqueFiles.length > 0,
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
        // DF-SPECLANG-5-R4: a raw count of 535 tells the reader nothing about
        // WHERE the warnings are or which ones to fix first. Print a compact
        // grouped breakdown next to the count; `--verbose` lists every warning.
        if (totalWarnings > 0) {
            console.log('');
            console.log(reporter.formatWarningSummary(reports));
        }
    }
    return result;
}
exports.default = validateCommand;
//# sourceMappingURL=cli.js.map