"use strict";
/**
 * SPECLANG-GENERATED: Validate command
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommand = validateCommand;
const promises_1 = require("fs/promises");
const header_1 = require("../../../parser.spec.dir/src/header");
const validator_1 = require("../../../parser.spec.dir/src/validator");
const autonomous_1 = require("../../../validation.spec.dir/src/rules/autonomous");
const index_js_1 = require("../../../indexer.spec.dir/src/index.js");
const utils_js_1 = require("../utils.js");
/**
 * Load index from file or generate
 */
function loadIndex() {
    try {
        return (0, index_js_1.generateIndex)({ rootDir: (0, utils_js_1.getSpecsDir)() });
    }
    catch {
        return (0, index_js_1.generateIndex)({ rootDir: (0, utils_js_1.getSpecsDir)() });
    }
}
/**
 * Validate command implementation
 */
async function validateCommand(options) {
    const specsDir = (0, utils_js_1.getSpecsDir)();
    // Validate index first
    const index = loadIndex();
    const indexValid = (0, index_js_1.validateIndexCmd)(index);
    if (!options.json) {
        console.log('\n=== Spec File Validation ===\n');
    }
    // Find and validate all specs with basic validation
    const report = (0, validator_1.validateAllSpecs)(specsDir);
    const results = report.results || [];
    const errors = results.filter(r => r.errors && r.errors.length > 0);
    const warnings = results.filter(r => r.warnings && r.warnings.length > 0 && (!r.errors || r.errors.length === 0));
    const valid = results.filter(r => (!r.errors || r.errors.length === 0) && (!r.warnings || r.warnings.length === 0));
    // If type includes autonomous, run autonomous validation
    let autonomousErrors = [];
    let autonomousWarnings = [];
    if (options.type === 'autonomous') {
        // Parse all specs for autonomous validation
        const specFiles = (0, validator_1.findSpecFiles)(specsDir);
        for (const filepath of specFiles) {
            try {
                const content = await (0, promises_1.readFile)(filepath, 'utf-8');
                const parsed = (0, header_1.parseSpecContent)(content, filepath);
                // Run autonomous rule
                const autonomousResults = autonomous_1.autonomousRule.check(parsed);
                autonomousResults.forEach(result => {
                    if (result.level === 'error') {
                        autonomousErrors.push({ filepath, message: result.message });
                    }
                    else {
                        autonomousWarnings.push({ filepath, message: result.message });
                    }
                });
            }
            catch (error) {
                console.error(`Failed to parse ${filepath}:`, error);
            }
        }
    }
    // Combine results
    const allErrors = [...errors, ...autonomousErrors];
    const allWarnings = [...warnings, ...autonomousWarnings];
    if (options.json) {
        console.log(JSON.stringify({
            index: {
                valid: indexValid,
                total_specs: index.validation?.total_specs || 0,
                missing_refs: index.validation?.missing_refs || [],
                cycles: index.cycles || [],
            },
            specs: {
                total: report.total || 0,
                valid: valid.length,
                warnings: allWarnings.length,
                errors: allErrors.length,
                details: results.map(r => ({
                    filepath: r.filepath,
                    errors: r.errors.map(e => e.message),
                    warnings: r.warnings.map(w => w.message),
                })),
            },
            autonomous: options.type === 'autonomous' ? {
                errors: autonomousErrors.map(e => ({ filepath: e.filepath, message: e.message })),
                warnings: autonomousWarnings.map(w => ({ filepath: w.filepath, message: w.message })),
            } : undefined,
        }, null, 2));
    }
    else {
        console.log(`Total spec files: ${report.total || 0}`);
        console.log(`Valid: ${valid.length}`);
        console.log(`Warnings: ${allWarnings.length}`);
        console.log(`Errors: ${allErrors.length}`);
        if (allErrors.length > 0) {
            console.log('\n❌ Errors:');
            allErrors.forEach(e => {
                console.log(`\n  ${e.filepath}:`);
                console.log(`    - ${e.message}`);
            });
        }
        if (options.verbose && allWarnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            allWarnings.forEach(w => {
                console.log(`\n  ${w.filepath}:`);
                console.log(`    - ${w.message}`);
            });
        }
        // Summary
        if (allErrors.length === 0 && allWarnings.length === 0) {
            console.log('\n✅ All specs valid');
        }
        else if (allErrors.length === 0) {
            console.log('\n⚠️  Specs valid with warnings');
        }
        else {
            console.log('\n❌ Validation failed');
            process.exit(1);
        }
    }
}
exports.default = validateCommand;
//# sourceMappingURL=validate.js.map