"use strict";
/**
 * SPECLANG-GENERATED: Validate command
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommand = validateCommand;
const validator_js_1 = require("../../../parser.spec.dir/src/validator.js");
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
    // Find and validate all specs
    const report = (0, validator_js_1.validateAllSpecs)(specsDir);
    const results = report.results || [];
    const errors = results.filter(r => r.errors && r.errors.length > 0);
    const warnings = results.filter(r => r.warnings && r.warnings.length > 0 && (!r.errors || r.errors.length === 0));
    const valid = results.filter(r => (!r.errors || r.errors.length === 0) && (!r.warnings || r.warnings.length === 0));
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
                warnings: warnings.length,
                errors: errors.length,
                details: results.map(r => ({
                    filepath: r.filepath,
                    errors: r.errors.map(e => e.message),
                    warnings: r.warnings.map(w => w.message),
                })),
            }
        }, null, 2));
    }
    else {
        console.log(`Total spec files: ${report.total || 0}`);
        console.log(`Valid: ${valid.length}`);
        console.log(`Warnings: ${warnings.length}`);
        console.log(`Errors: ${errors.length}`);
        if (errors.length > 0) {
            console.log('\n❌ Errors:');
            errors.forEach(r => {
                console.log(`\n  ${r.filepath}:`);
                r.errors.forEach(e => console.log(`    - ${e.message}`));
            });
        }
        if (options.verbose && warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            warnings.forEach(r => {
                console.log(`\n  ${r.filepath}:`);
                r.warnings.forEach(w => console.log(`    - ${w.message}`));
            });
        }
        // Summary
        if (errors.length === 0 && warnings.length === 0) {
            console.log('\n✅ All specs valid');
        }
        else if (errors.length === 0) {
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