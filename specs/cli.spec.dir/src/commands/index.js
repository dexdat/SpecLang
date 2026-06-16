"use strict";
/**
 * SPECLANG-GENERATED: Index command
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexCommand = indexCommand;
const utils_js_1 = require("../utils.js");
/**
 * Index command implementation
 */
async function indexCommand(options) {
    if (options.refresh) {
        // Refresh the index
        if (!options.json) {
            console.log('Refreshing spec index...\n');
        }
        try {
            const index = (0, utils_js_1.refreshIndex)();
            if (options.json) {
                console.log(JSON.stringify({
                    success: true,
                    specs: Object.keys(index.specs).length,
                    generated: index.generated
                }, null, 2));
            }
            else {
                console.log(`✅ Index refreshed`);
                console.log(`   Total specs: ${Object.keys(index.specs).length}`);
                console.log(`   Generated: ${index.generated}`);
            }
        }
        catch (error) {
            if (options.json) {
                console.log(JSON.stringify({
                    error: true,
                    message: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
            else {
                console.error('❌ Failed to refresh index:', error);
            }
            process.exit(1);
        }
    }
    else {
        // Show current index stats
        const index = (0, utils_js_1.loadIndex)();
        if (options.json) {
            console.log(JSON.stringify({
                specs: Object.keys(index.specs).length,
                generated: index.generated,
                validation: index.validation,
                cycles: index.cycles,
                orphans: index.orphans
            }, null, 2));
        }
        else {
            console.log('=== Spec Index ===\n');
            console.log(`Total specs: ${Object.keys(index.specs).length}`);
            console.log(`Generated: ${index.generated}`);
            console.log(`\nValidation:`);
            console.log(`  Total refs: ${index.validation?.total_refs || 0}`);
            console.log(`  Missing refs: ${index.validation?.missing_ref_count || 0}`);
            console.log(`  Cycles: ${index.cycles?.length || 0}`);
            console.log(`  Orphans: ${index.orphans?.length || 0}`);
        }
    }
}
exports.default = indexCommand;
//# sourceMappingURL=index.js.map