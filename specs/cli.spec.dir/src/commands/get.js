"use strict";
/**
 * SPECLANG-GENERATED: Get command
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const utils_js_1 = require("../utils.js");
/**
 * Get command implementation
 */
async function getCommand(specId, options) {
    const index = (0, utils_js_1.loadIndex)();
    const specsDir = (0, utils_js_1.getSpecsDir)();
    // Find spec in index
    const spec = index.specs[specId];
    if (!spec) {
        console.error(`Spec not found: ${specId}`);
        process.exit(1);
    }
    if (options.json) {
        console.log(JSON.stringify(spec, null, 2));
        return;
    }
    // Display spec header info
    console.log(`# ${spec.id}`);
    console.log(`Version: ${spec.version}`);
    console.log(`Layer: ${spec.layer}`);
    console.log(`Project Level: ${spec.project_level || 'unknown'}`);
    console.log(`Agent Support: ${spec.agent_support || 'unknown'}`);
    console.log(`Status: ${spec.status || 'draft'}`);
    console.log(`File: ${spec.file}`);
    console.log(`\n${spec.short || 'No description'}\n`);
    // Display tags
    if (spec.tags && spec.tags.length > 0) {
        console.log(`Tags: ${spec.tags.join(', ')}`);
    }
    // Display dependencies
    if (spec.depends_on && spec.depends_on.length > 0) {
        console.log(`\nDepends on:`);
        spec.depends_on.forEach(dep => console.log(`  - ${dep}`));
    }
    // Display full content if requested
    if (options.content) {
        console.log('\n---\n');
        const content = (0, utils_js_1.readSpecContent)(spec.file);
        console.log(content);
    }
    // Display blocks if requested
    if (options.blocks) {
        console.log('\nBlocks:');
        if (spec.blocks && spec.blocks.length > 0) {
            spec.blocks.forEach(block => {
                console.log(`  - ${block}`);
            });
        }
        else {
            console.log('  (none)');
        }
    }
}
exports.default = getCommand;
//# sourceMappingURL=get.js.map