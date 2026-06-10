#!/usr/bin/env node

/**
 * Speclangd CLI - Command-line interface for the chokidar daemon
 */

import { Command } from 'commander';
import { SpeclangDaemon, FileChangeEvent, ConvergenceEvent } from './daemon/index.js';

const program = new Command();

program
  .name('speclangd')
  .description('Speclang reactive file watcher daemon')
  .version('0.1.0');

program
  .command('start')
  .description('Start the daemon')
  .option('-d, --daemon', 'Run in background')
  .option('-w, --watch <path>', 'Path to watch', 'specs/')
  .action(async (options) => {
    const daemon = new SpeclangDaemon(options.watch);

    daemon.on('started', () => {
      console.log('[CLI] Daemon started');
    });

    daemon.on('file_change', (e: FileChangeEvent) => {
      console.log(`[speclangd] ${e.kind}: ${e.path} (${e.dependentSpecs.length} dependents)`);
    });

    daemon.on('convergence', (e: ConvergenceEvent) => {
      console.log(`[speclangd] Convergence: ${e.queueDepth} items in queue`);
    });

    await daemon.start();

    if (!options.daemon) {
      console.log('[CLI] Running in foreground. Press Ctrl+C to stop.');
      process.on('SIGINT', async () => {
        console.log('\\n[CLI] Shutting down...');
        await daemon.stop();
        process.exit(0);
      });
    }
  });

program
  .command('status')
  .description('Show daemon status')
  .action(async () => {
    console.log('Status: chokidar daemon (SpeclangDaemon)');
    console.log('  Run with: speclangd start -w <watch-path>');
  });

program.parse(process.argv);
