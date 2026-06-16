"use strict";
/**
 * SPECLANG-GENERATED: Init command
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const init_ts_1 = require("../../../project-layout.spec.dir/src/init.ts");
/**
 * Init command implementation
 */
async function initCommand(options) {
    const { name = 'my-project', targetDir = process.cwd(), initGit = true, force = false, targets = ['typescript'], description = 'Project created with speclang init', version = '0.1.0', json = false } = options;
    try {
        const result = await (0, init_ts_1.initProject)({
            name,
            targetDir,
            initGit,
            force,
            targets,
            description,
            version,
            json
        });
        console.log((0, init_ts_1.formatInitResult)(result, json));
        if (!result.success) {
            process.exit(1);
        }
    }
    catch (error) {
        if (json) {
            console.log(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
        else {
            console.error('❌ Failed to initialize project:', error);
        }
        process.exit(1);
    }
}
exports.default = initCommand;
//# sourceMappingURL=init.js.map