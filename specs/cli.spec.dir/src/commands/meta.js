"use strict";
// SPECLANG-GENERATED
// CLI command for meta operations
// Source: @speclang/meta-cli
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaGenerateCommand = metaGenerateCommand;
exports.metaValidateCommand = metaValidateCommand;
exports.metaBootstrapCommand = metaBootstrapCommand;
exports.metaCheckCommand = metaCheckCommand;
const index_js_1 = require("../../../meta.spec.dir/src/index.js");
/**
 * Execute meta generate command
 */
async function metaGenerateCommand(options) {
    const result = await (0, index_js_1.executeMetaCommand)("generate", options);
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log(`Generated ${result.specsGenerated} specs`);
    }
}
/**
 * Execute meta validate command
 */
async function metaValidateCommand(options) {
    const result = await (0, index_js_1.executeMetaCommand)("validate", options);
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log(`Validation: ${result.passed ? "PASSED" : "FAILED"}`);
        console.log(`Total specs: ${result.totalSpecs}`);
        console.log(`Passed: ${result.passed}`);
        console.log(`Failed: ${result.failed}`);
        if (options.verbose && result.issues?.length > 0) {
            console.log("\nIssues:");
            for (const issue of result.issues) {
                console.log(`  - [${issue.severity}] ${issue.message}`);
            }
        }
    }
}
/**
 * Execute meta bootstrap command
 */
async function metaBootstrapCommand(options) {
    const result = await (0, index_js_1.executeMetaCommand)("bootstrap", options);
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log(`Bootstrap: ${result.success ? "SUCCESS" : "FAILED"}`);
        console.log(`Specs generated: ${result.specsGenerated}`);
        console.log(`Validation passed: ${result.validationPassed}`);
        console.log(`Code generated: ${result.codeGenerated}`);
        console.log(`Equivalence verified: ${result.equivalenceVerified}`);
        console.log(`Duration: ${result.duration}ms`);
        if (result.errors.length > 0) {
            console.log("\nErrors:");
            for (const error of result.errors) {
                console.log(`  - ${error}`);
            }
        }
    }
}
/**
 * Execute meta check command
 */
async function metaCheckCommand(options) {
    const result = await (0, index_js_1.executeMetaCommand)("check", options);
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log(`Self-specifying: ${result.isSelfSpecifying ? "YES" : "NO"}`);
        console.log("\nDetails:");
        for (const detail of result.details) {
            console.log(`  ${detail}`);
        }
    }
}
//# sourceMappingURL=meta.js.map