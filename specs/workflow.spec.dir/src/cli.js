"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/setup.spec.md
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/start, @workflow/commands
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCLI = createCLI;
exports.main = main;
const commander_1 = require("commander");
const setup_js_1 = require("./setup.js");
const review_js_1 = require("./review.js");
const commands_js_1 = require("./commands.js");
/**
 * CLI entry point for speclang commands
 *
 * @block:workflow/commands @kind:code
 */
function createCLI() {
    const program = new commander_1.Command();
    program
        .name('speclang')
        .description('SpecLang - Reactive multi-agent spec system')
        .version('0.1.0');
    // init command
    program
        .command('init [path]')
        .description('Initialize a new Speclang project')
        .option('-m, --mode <mode>', 'Project mode: light (default) or enterprise', 'light')
        .option('-d, --dry-run', 'Show what would be created without creating')
        .action(async (path, options) => {
        const opts = {
            mode: options.mode,
            dryRun: options.dryRun,
            path: path || '.'
        };
        try {
            await (0, setup_js_1.initProject)(opts);
        }
        catch (error) {
            console.error('Error initializing project:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    // status command
    program
        .command('status')
        .description('Show daemon and cascade state')
        .option('-j, --json', 'Output as JSON')
        .action(async (options) => {
        try {
            await (0, review_js_1.showStatus)(options.json);
        }
        catch (error) {
            console.error('Error getting status:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    // skills command group
    const skillsCmd = program
        .command('skills')
        .description('Manage Speclang skills');
    skillsCmd
        .command('download')
        .description('Download skills pack from registry')
        .option('-o, --overwrite', 'Overwrite existing skills')
        .action(async (options) => {
        const opts = {
            overwrite: options.overwrite
        };
        try {
            await (0, commands_js_1.downloadSkills)(opts);
        }
        catch (error) {
            console.error('Error downloading skills:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    skillsCmd
        .command('list')
        .description('List installed skills')
        .action(async () => {
        try {
            await (0, commands_js_1.listSkills)();
        }
        catch (error) {
            console.error('Error listing skills:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    return program;
}
/**
 * Main CLI entry point
 * Run with: bun run src/workflow/cli.ts
 */
async function main() {
    const program = createCLI();
    await program.parseAsync(process.argv);
}
// Allow running directly (CommonJS compatible)
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=cli.js.map