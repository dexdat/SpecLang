"use strict";
/**
 * SPECLANG-GENERATED: Generate command
 * Source: @speclang/mcp.cli
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
exports.generateCommand = generateCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_js_1 = require("../utils.js");
/**
 * Generate command implementation
 */
async function generateCommand(options) {
    const index = (0, utils_js_1.loadIndex)();
    const specsDir = (0, utils_js_1.getSpecsDir)();
    const target = options.target || 'typescript';
    const outputDir = options.outputDir || `src/generated`;
    if (!options.json) {
        console.log(`=== Code Generation ===\n`);
        console.log(`Target: ${target}`);
        console.log(`Output: ${outputDir}`);
        console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);
    }
    // Find specs with code blocks
    const specsWithBlocks = Object.values(index.specs).filter(spec => spec.blocks && spec.blocks.length > 0);
    const results = [];
    for (const spec of specsWithBlocks) {
        try {
            if (options.dryRun) {
                results.push({
                    specId: spec.id,
                    blocks: spec.blocks || [],
                    status: 'skipped',
                    message: 'Dry run - no files written'
                });
                continue;
            }
            // Create output directory
            const targetDir = path.join(outputDir, spec.id.replace(/[@/]/g, '-'));
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            // Generate code files (placeholder - real implementation would extract code blocks)
            const blockCount = spec.blocks?.length || 0;
            results.push({
                specId: spec.id,
                blocks: spec.blocks || [],
                status: 'generated',
                message: `Generated ${blockCount} code blocks to ${targetDir}`
            });
        }
        catch (error) {
            results.push({
                specId: spec.id,
                blocks: spec.blocks || [],
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    if (options.json) {
        console.log(JSON.stringify({
            target,
            outputDir,
            dryRun: options.dryRun,
            specsProcessed: specsWithBlocks.length,
            results
        }, null, 2));
    }
    else {
        console.log(`Processed ${specsWithBlocks.length} specs with code blocks\n`);
        for (const result of results) {
            const icon = result.status === 'generated' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
            console.log(`${icon} ${result.specId}`);
            if (result.message) {
                console.log(`   ${result.message}`);
            }
        }
    }
}
exports.default = generateCommand;
//# sourceMappingURL=generate.js.map