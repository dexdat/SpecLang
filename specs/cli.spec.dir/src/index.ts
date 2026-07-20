/**
 * SPECLANG-GENERATED: CLI main entry point
 * Source: @speclang/mcp.cli
 */

import { Command } from 'commander';
import { searchCommand, SearchOptions } from './commands/search.js';
import { getCommand, GetOptions } from './commands/get.js';
import { listCommand, ListOptions } from './commands/list.js';
import { validateCommand, ValidateOptions } from './commands/validate.js';
import { initCommand, InitOptions } from './commands/init.js';
import { generateCommand, GenerateOptions } from './commands/generate.js';
import { serverCommand, ServerOptions } from './commands/server.js';
import { indexCommand, IndexOptions } from './commands/index.js';
import { cascadeCommand, CascadeOptions } from './commands/cascade.js';
import { guardCommand, GuardOptions } from './commands/guard.js';
import { mcpCommand } from './commands/mcp.js';
import { metaGenerateCommand, metaValidateCommand, metaBootstrapCommand, metaCheckCommand, MetaCLIOptions } from './commands/meta.js';
import { autonomousTestCommand, autonomousValidateCommand, autonomousReportCommand, autonomousVerifyCommand, AutonomousTestOptions, AutonomousValidateOptions, AutonomousReportOptions, AutonomousVerifyOptions } from './commands/autonomous.js';
import { maturityCommand, MaturityOptions } from './commands/maturity.js';
import { configureDaemonCommand } from '../../../src/daemon/index.js';

const program = new Command();

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
  .action(async (query: string, options: SearchOptions & { tags?: string }) => {
    const opts: SearchOptions = {
      ...options,
      tags: options.tags ? options.tags.split(',') : undefined
    };
    await searchCommand(query, opts);
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
  .action(async (specId: string, options: GetOptions) => {
    await getCommand(specId, options);
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
  .action(async (options: ListOptions & { tags?: string }) => {
    const opts: ListOptions = {
      ...options,
      tags: options.tags ? options.tags.split(',') : undefined
    };
    await listCommand(opts);
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
  .action(async (name: string | undefined, options: InitOptions & { dir?: string; git?: boolean; targets?: string }) => {
    const opts: InitOptions = {
      name: name || 'my-project',
      targetDir: options.dir || process.cwd(),
      initGit: options.git !== false,
      force: options.force || false,
      targets: options.targets ? options.targets.split(',') : ['typescript'],
      description: options.description,
      version: options.version,
      json: options.json
    };
    await initCommand(opts);
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
  .option('--type <type>', 'Validation type (basic, language-blocks, autonomous)', 'basic')
  .action(async (options: ValidateOptions) => {
    await validateCommand(options);
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
  .action(async (options: GenerateOptions) => {
    await generateCommand(options);
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
  .action(async (options: ServerOptions) => {
    await serverCommand(options);
  });

// ============================================================================
// INDEX COMMAND
// ============================================================================

program
  .command('index')
  .description('Manage spec index')
  .option('--refresh', 'Refresh the index')
  .option('--json', 'JSON output')
  .action(async (options: IndexOptions) => {
    await indexCommand(options);
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
  .action(async (options: CascadeOptions) => {
    await cascadeCommand('status', undefined, options);
  });

cascade
  .command('trigger <spec-id>')
  .description('Trigger cascade for a spec')
  .option('--thinking <mapping>', 'Thinking levels by agent or phase (agent:level,...)')
  .option('--json', 'JSON output')
  .action(async (
    specId: string,
    options: CascadeOptions & { thinking?: string }
  ) => {
    let thinking: CascadeOptions['thinking'];
    if (options.thinking) {
      const { parseThinkingOverrides } = await import(
        'cascade.spec.dir/src/provider-adapter.js'
      );
      thinking = parseThinkingOverrides(options.thinking);
    }
    const opts: CascadeOptions = {
      ...options,
      thinking,
    };
    await cascadeCommand('trigger', specId, opts);
  });

cascade
  .command('abort')
  .description('Abort active cascade')
  .option('--json', 'JSON output')
  .action(async (options: CascadeOptions) => {
    await cascadeCommand('abort', undefined, options);
  });

// ============================================================================
// AGENT COMMAND
// ============================================================================

program
  .command('agent [agent]')
  .description('Run a cascade agent for a trigger')
  .requiredOption('--trigger <path>', 'Trigger path used for agent selection')
  .option('--thinking <level>', 'Thinking level (none, low, medium, high)', 'medium')
  .option('--params <json>', 'Agent parameters as JSON')
  .option('--provider <provider>', 'LLM provider')
  .option('--model <model>', 'Provider model name')
  .option('--base-url <url>', 'Provider API base URL')
  .option('--api-key <key>', 'Provider API key')
  .option('--dry-run', 'Map the request without calling the provider')
  .option('--json', 'JSON output')
  .action(async (agent: string | undefined, options: any) => {
    const { runAgent } = await import('cascade.spec.dir/src/agent.js');
    let params: Record<string, unknown> | undefined;
    if (options.params) {
      params = JSON.parse(options.params);
    }
    const result = await runAgent({
      agent,
      trigger: options.trigger,
      thinking: options.thinking,
      params,
      provider: options.provider,
      model: options.model,
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
      dryRun: options.dryRun || false,
    });

    if (options.json || result.dryRun) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.content) {
      console.log(result.content);
    }
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
  .action(async (filepath: string, options: GuardOptions & { agent?: string }) => {
    await guardCommand('check', filepath, options);
  });

guard
  .command('rules')
  .description('List all ownership rules')
  .option('--agent <agent>', 'Filter by agent')
  .option('--json', 'JSON output')
  .action(async (options: GuardOptions & { agent?: string }) => {
    await guardCommand('rules', undefined, options);
  });

guard
  .command('violations')
  .description('Show violations')
  .option('--unresolved', 'Show only unresolved')
  .option('--agent <agent>', 'Filter by agent')
  .option('--json', 'JSON output')
  .action(async (options: GuardOptions & { unresolved?: boolean; agent?: string }) => {
    await guardCommand('violations', undefined, options);
  });

guard
  .command('override <filepath>')
  .description('Override ownership for a file')
  .option('--agent <agent>', 'Agent to assign ownership to', 'code-gen')
  .option('--reason <reason>', 'Reason for override')
  .option('--expires <ms>', 'Expiration in milliseconds', parseInt)
  .option('--json', 'JSON output')
  .action(async (filepath: string, options: GuardOptions & { agent: string; reason: string; expires?: number }) => {
    await guardCommand('override', filepath, options);
  });

guard
  .command('stats')
  .description('Show guard statistics')
  .option('--json', 'JSON output')
  .action(async (options: GuardOptions) => {
    await guardCommand('stats', undefined, options);
  });

// ============================================================================
// MCP COMMAND
// ============================================================================

const mcp = program
  .command('mcp')
  .description('MCP server operations');

mcp
  .command('start')
  .description('Start MCP server')
  .option('--remote', 'Start in remote (HTTP) mode')
  .option('--port <n>', 'Port number for remote mode', parseInt, 3000)
  .option('--auth <type>', 'Auth type (none, basic, token)', 'none')
  .option('--user <name>', 'Username for basic auth')
  .option('--pass <password>', 'Password for basic auth')
  .option('--token <token>', 'Token for token auth')
  .option('--config <path>', 'Config file path')
  .option('--json', 'JSON output')
  .action(async (options: any) => {
    await mcpCommand('start', options);
  });

mcp
  .command('serve')
  .description('Serve MCP server in daemon mode')
  .option('--config <path>', 'Config file path')
  .option('--json', 'JSON output')
  .action(async (options: any) => {
    await mcpCommand('serve', options);
  });

mcp
  .command('status')
  .description('Show MCP server status')
  .option('--json', 'JSON output')
  .action(async (options: any) => {
    await mcpCommand('status', options);
  });

mcp
  .command('stop')
  .description('Stop MCP server')
  .option('--json', 'JSON output')
  .action(async (options: any) => {
    await mcpCommand('stop', options);
  });

mcp
  .command('test')
  .description('Test subcommand')
  .option('--json', 'JSON output')
  .action(async (options: any) => {
    console.log('test subcommand');
  });

mcp
  .command('generate-openapi')
  .description('Generate MCP server from OpenAPI spec')
  .requiredOption('-i, --input <path>', 'Path or URL to OpenAPI spec (YAML/JSON)')
  .requiredOption('-o, --output <dir>', 'Output directory for generated MCP project')
  .option('-t, --transport <mode>', 'Transport mode (stdio, web, streamable-http)', 'stdio')
  .option('-p, --port <number>', 'Port for web-based transports', '3000')
  .option('-n, --server-name <name>', 'Name of MCP server')
  .option('-b, --base-url <url>', 'Base URL for API requests')
  .option('--force', 'Overwrite existing files')
  .option('--register', 'Automatically register with SpecLang MCP server')
  .option('--json', 'JSON output')
  .action(async (options: any) => {
    await mcpCommand('generate-openapi', options);
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
  .action(async (options: MetaCLIOptions) => {
    await metaGenerateCommand(options);
  });

meta
  .command('validate')
  .description('Validate self-consistency')
  .option('--fix', 'Attempt to fix issues')
  .option('--verbose', 'Show warnings')
  .option('--json', 'JSON output')
  .action(async (options: MetaCLIOptions) => {
    await metaValidateCommand(options);
  });

meta
  .command('bootstrap')
  .description('Run full bootstrap sequence')
  .option('--dry-run', 'Show what would happen')
  .option('--verbose', 'Verbose output')
  .option('--json', 'JSON output')
  .action(async (options: MetaCLIOptions) => {
    await metaBootstrapCommand(options);
  });

meta
  .command('check')
  .description('Check if system is self-specifying')
  .option('--verbose', 'Verbose output')
  .option('--json', 'JSON output')
  .action(async (options: MetaCLIOptions) => {
    await metaCheckCommand(options);
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
  .action(async (options: AutonomousTestOptions) => {
    await autonomousTestCommand('test', options);
  });

autonomous
  .command('validate')
  .description('Validate autonomous readiness')
  .option('--fix', 'Attempt to fix issues')
  .option('--verbose', 'Verbose output')
  .option('--json', 'JSON output')
  .action(async (options: AutonomousValidateOptions) => {
    await autonomousValidateCommand(options);
  });

autonomous
  .command('report')
  .description('Generate autonomous test report')
  .option('--format <format>', 'Output format (text|json|html)', 'text')
  .option('--output <file>', 'Output file path')
  .action(async (options: AutonomousReportOptions) => {
    await autonomousReportCommand(options);
  });

autonomous
  .command('verify')
  .description('Run full autonomous verification')
  .option('--verbose', 'Verbose output')
  .option('--json', 'JSON output')
  .option('--timeout <ms>', 'Timeout in milliseconds', parseInt)
  .action(async (options: AutonomousVerifyOptions) => {
    await autonomousVerifyCommand(options);
  });

// ============================================================================
// MATURITY COMMAND
// ============================================================================

program
  .command('maturity [spec]')
  .description('Show maturity level info or validate a spec')
  .option('--level <level>', 'Show info for specific level')
  .option('--json', 'JSON output')
  .option('--verbose', 'Show detailed criteria')
  .action(async (spec: string | undefined, options: MaturityOptions & { level?: string }) => {
    await maturityCommand({
      spec,
      level: options.level,
      json: options.json,
      verbose: options.verbose,
    });
  });

// ============================================================================
// DAEMON COMMAND
// ============================================================================

configureDaemonCommand(program);

// ============================================================================
// PARSE AND EXECUTE
// ============================================================================

program.parse();
