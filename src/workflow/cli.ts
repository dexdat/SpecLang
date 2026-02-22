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

import { Command } from 'commander';
import { initProject, InitOptions } from './setup.js';
import { showStatus } from './review.js';
import { downloadSkills, listSkills, SkillsOptions } from './commands.js';

/**
 * CLI entry point for speclang commands
 * 
 * @block:workflow/commands @kind:code
 */
export function createCLI(): Command {
  const program = new Command();
  
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
    .action(async (path: string | undefined, options) => {
      const opts: InitOptions = {
        mode: options.mode as 'light' | 'enterprise',
        dryRun: options.dryRun,
        path: path || '.'
      };
      
      try {
        await initProject(opts);
      } catch (error) {
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
        await showStatus(options.json);
      } catch (error) {
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
      const opts: SkillsOptions = {
        overwrite: options.overwrite
      };
      
      try {
        await downloadSkills(opts);
      } catch (error) {
        console.error('Error downloading skills:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
  
  skillsCmd
    .command('list')
    .description('List installed skills')
    .action(async () => {
      try {
        await listSkills();
      } catch (error) {
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
export async function main(): Promise<void> {
  const program = createCLI();
  await program.parseAsync(process.argv);
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
