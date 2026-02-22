/**
 * SPECLANG-GENERATED: CLI main entry point
 * Source: @speclang/mcp.cli
 */

import { Command } from 'commander';
import { searchCommand, SearchOptions } from './commands/search.js';
import { getCommand, GetOptions } from './commands/get.js';
import { listCommand, ListOptions } from './commands/list.js';
import { validateCommand, ValidateOptions } from './commands/validate.js';
import { generateCommand, GenerateOptions } from './commands/generate.js';
import { serverCommand, ServerOptions } from './commands/server.js';
import { indexCommand, IndexOptions } from './commands/index.js';
import { cascadeCommand, CascadeOptions } from './commands/cascade.js';

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
// VALIDATE COMMAND
// ============================================================================

program
  .command('validate')
  .description('Validate specs')
  .option('--fix', 'Attempt to fix errors')
  .option('--json', 'JSON output')
  .option('--verbose', 'Show warnings')
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
  .option('--json', 'JSON output')
  .action(async (specId: string, options: CascadeOptions) => {
    await cascadeCommand('trigger', specId, options);
  });

cascade
  .command('abort')
  .description('Abort active cascade')
  .option('--json', 'JSON output')
  .action(async (options: CascadeOptions) => {
    await cascadeCommand('abort', undefined, options);
  });

// ============================================================================
// PARSE AND EXECUTE
// ============================================================================

program.parse();
