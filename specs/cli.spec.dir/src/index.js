"use strict";
/**
 * SPECLANG-GENERATED: CLI main entry point
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const search_js_1 = require("./commands/search.js");
const get_js_1 = require("./commands/get.js");
const list_js_1 = require("./commands/list.js");
const validate_js_1 = require("./commands/validate.js");
const init_js_1 = require("./commands/init.js");
const generate_js_1 = require("./commands/generate.js");
const server_js_1 = require("./commands/server.js");
const index_js_1 = require("./commands/index.js");
const cascade_js_1 = require("./commands/cascade.js");
const guard_js_1 = require("./commands/guard.js");
const meta_js_1 = require("./commands/meta.js");
const autonomous_js_1 = require("./commands/autonomous.js");
const program = new commander_1.Command();
program
    .name('speclang')
    .description('SpecLang - Specs are source code')
    .version('1.0.0');
// ============================================================================
// SEARCH COMMAND
// ============================================================================
program
    .command('search <query>')
    .description('Search specs by query')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .option('--layer <n>', 'Filter by layer', parseInt)
    .option('--limit <n>', 'Limit results', parseInt)
    .option('--json', 'JSON output')
    .option('--quiet', 'Quiet output (IDs only)')
    .action(async (query, options) => {
    const opts = {
        ...options,
        tags: options.tags ? options.tags.split(',') : undefined
    };
    await (0, search_js_1.searchCommand)(query, opts);
});
// ============================================================================
// GET COMMAND
// ============================================================================
program
    .command('get <spec-id>')
    .description('Get spec by ID')
    .option('--content', 'Show full content')
    .option('--blocks', 'Show block list')
    .option('--json', 'JSON output')
    .option('--quiet', 'Quiet output')
    .action(async (specId, options) => {
    await (0, get_js_1.getCommand)(specId, options);
});
// ============================================================================
// LIST COMMAND
// ============================================================================
program
    .command('list')
    .description('List all specs')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .option('--layer <n>', 'Filter by layer', parseInt)
    .option('--prefix <prefix>', 'Filter by ID prefix')
    .option('--json', 'JSON output')
    .option('--quiet', 'Quiet output (IDs only)')
    .action(async (options) => {
    const opts = {
        ...options,
        tags: options.tags ? options.tags.split(',') : undefined
    };
    await (0, list_js_1.listCommand)(opts);
});
// ============================================================================
// INIT COMMAND
// ============================================================================
program
    .command('init [name]')
    .description('Initialize a new speclang project')
    .option('-d, --dir <path>', 'Target directory', '.')
    .option('--no-git', 'Skip git initialization')
    .option('-f, --force', 'Overwrite existing project')
    .option('--targets <types>', 'Target languages (comma-separated)', 'typescript')
    .option('--description <text>', 'Project description')
    .option('--version <ver>', 'Project version', '0.1.0')
    .option('--json', 'JSON output')
    .action(async (name, options) => {
    const opts = {
        name: name || 'my-project',
        targetDir: options.dir || process.cwd(),
        initGit: options.git !== false,
        force: options.force || false,
        targets: options.targets ? options.targets.split(',') : ['typescript'],
        description: options.description,
        version: options.version,
        json: options.json
    };
    await (0, init_js_1.initCommand)(opts);
});
// ============================================================================
// VALIDATE COMMAND
// ============================================================================
program
    .command('validate')
    .description('Validate specs')
    .option('--fix', 'Attempt to fix errors')
    .option('--json', 'JSON output')
    .option('--verbose', 'Show warnings')
    .action(async (options) => {
    await (0, validate_js_1.validateCommand)(options);
});
// ============================================================================
// GENERATE COMMAND
// ============================================================================
program
    .command('generate')
    .description('Generate code from specs')
    .option('--target <type>', 'Target language (typescript|go|python)', 'typescript')
    .option('--output-dir <dir>', 'Output directory', 'src/generated')
    .option('--dry-run', 'Show what would be generated')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, generate_js_1.generateCommand)(options);
});
// ============================================================================
// SERVER COMMAND
// ============================================================================
program
    .command('server')
    .description('Start MCP server')
    .option('--port <n>', 'Port number', parseInt, 3000)
    .option('--daemon', 'Run in daemon mode')
    .option('--http', 'Run in HTTP mode')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, server_js_1.serverCommand)(options);
});
// ============================================================================
// INDEX COMMAND
// ============================================================================
program
    .command('index')
    .description('Manage spec index')
    .option('--refresh', 'Refresh the index')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, index_js_1.indexCommand)(options);
});
// ============================================================================
// CASCADE COMMAND
// ============================================================================
const cascade = program
    .command('cascade')
    .description('Manage cascade operations');
cascade
    .command('status')
    .description('Show cascade status')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, cascade_js_1.cascadeCommand)('status', undefined, options);
});
cascade
    .command('trigger <spec-id>')
    .description('Trigger cascade for a spec')
    .option('--json', 'JSON output')
    .action(async (specId, options) => {
    await (0, cascade_js_1.cascadeCommand)('trigger', specId, options);
});
cascade
    .command('abort')
    .description('Abort active cascade')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, cascade_js_1.cascadeCommand)('abort', undefined, options);
});
// ============================================================================
// GUARD COMMAND
// ============================================================================
const guard = program
    .command('guard')
    .description('Manage file ownership guard');
guard
    .command('check <filepath>')
    .description('Check ownership of a file')
    .option('--agent <agent>', 'Agent to check as', 'north-star')
    .option('--json', 'JSON output')
    .action(async (filepath, options) => {
    await (0, guard_js_1.guardCommand)('check', filepath, options);
});
guard
    .command('rules')
    .description('List all ownership rules')
    .option('--agent <agent>', 'Filter by agent')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, guard_js_1.guardCommand)('rules', undefined, options);
});
guard
    .command('violations')
    .description('Show violations')
    .option('--unresolved', 'Show only unresolved')
    .option('--agent <agent>', 'Filter by agent')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, guard_js_1.guardCommand)('violations', undefined, options);
});
guard
    .command('override <filepath>')
    .description('Override ownership for a file')
    .option('--agent <agent>', 'Agent to assign ownership to', 'code-gen')
    .option('--reason <reason>', 'Reason for override')
    .option('--expires <ms>', 'Expiration in milliseconds', parseInt)
    .option('--json', 'JSON output')
    .action(async (filepath, options) => {
    await (0, guard_js_1.guardCommand)('override', filepath, options);
});
guard
    .command('stats')
    .description('Show guard statistics')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, guard_js_1.guardCommand)('stats', undefined, options);
});
// ============================================================================
// META COMMAND
// ============================================================================
const meta = program
    .command('meta')
    .description('Self-specifying system operations');
meta
    .command('generate')
    .description('Generate specs from code')
    .option('--dry-run', 'Show what would be generated')
    .option('--verbose', 'Verbose output')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, meta_js_1.metaGenerateCommand)(options);
});
meta
    .command('validate')
    .description('Validate self-consistency')
    .option('--fix', 'Attempt to fix issues')
    .option('--verbose', 'Show warnings')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, meta_js_1.metaValidateCommand)(options);
});
meta
    .command('bootstrap')
    .description('Run full bootstrap sequence')
    .option('--dry-run', 'Show what would happen')
    .option('--verbose', 'Verbose output')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, meta_js_1.metaBootstrapCommand)(options);
});
meta
    .command('check')
    .description('Check if system is self-specifying')
    .option('--verbose', 'Verbose output')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, meta_js_1.metaCheckCommand)(options);
});
// ============================================================================
// AUTONOMOUS COMMAND
// ============================================================================
const autonomous = program
    .command('autonomous')
    .description('Autonomous testing and validation operations');
autonomous
    .command('test')
    .description('Run autonomous tests')
    .option('--scenario <name>', 'Run specific test scenario')
    .option('--verbose', 'Verbose output')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, autonomous_js_1.autonomousTestCommand)('test', options);
});
autonomous
    .command('validate')
    .description('Validate autonomous readiness')
    .option('--fix', 'Attempt to fix issues')
    .option('--verbose', 'Verbose output')
    .option('--json', 'JSON output')
    .action(async (options) => {
    await (0, autonomous_js_1.autonomousValidateCommand)(options);
});
autonomous
    .command('report')
    .description('Generate autonomous test report')
    .option('--format <format>', 'Output format (text|json|html)', 'text')
    .option('--output <file>', 'Output file path')
    .action(async (options) => {
    await (0, autonomous_js_1.autonomousReportCommand)(options);
});
autonomous
    .command('verify')
    .description('Run full autonomous verification')
    .option('--verbose', 'Verbose output')
    .option('--json', 'JSON output')
    .option('--timeout <ms>', 'Timeout in milliseconds', parseInt)
    .action(async (options) => {
    await (0, autonomous_js_1.autonomousVerifyCommand)(options);
});
// ============================================================================
// PARSE AND EXECUTE
// ============================================================================
program.parse();
//# sourceMappingURL=index.js.map