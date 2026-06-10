#!/usr/bin/env node

/**
 * Speclangd CLI - Command-line interface for the SpecLang daemon
 *
 * Generated from: @speclang/speclangd
 */

import { Command } from 'commander';
import * as path from 'path';
import { Daemon, DaemonStatus, ConvergenceResult, DaemonStatusKind } from './daemon/index.js';

const program = new Command();

program
  .name('speclangd')
  .description('SpecLang reactive file watcher daemon')
  .version('0.1.0');

program
  .command('start')
  .description('Start the daemon')
  .option('-d, --daemon', 'Run in background')
  .option('-c, --config <path>', 'Path to daemon config')
  .action(async (options) => {
    const configPath = options.config;
    const daemon = new Daemon(configPath);

    daemon.on('started', () => {
      console.log('[speclangd] Daemon started');
    });

    daemon.on('converged', (result: ConvergenceResult) => {
      console.log(`[speclangd] Converged: ${result.filesChanged} files, ${result.cascadeDepth} steps, ${result.duration}ms`);
    });

    daemon.on('task', (task) => {
      console.log(`[speclangd] Task: ${task.kind} - ${task.trigger}`);
    });

    await daemon.start();

    if (!options.daemon) {
      console.log('[speclangd] Running in foreground. Press Ctrl+C to stop.');
      process.on('SIGINT', async () => {
        console.log('\n[speclangd] Shutting down...');
        await daemon.stop();
        process.exit(0);
      });
    }
  });

program
  .command('status')
  .description('Show daemon status')
  .action(async () => {
    console.log('[speclangd] Status: SpecLang Daemon');
    console.log('  Run with: speclangd start');
  });

program.parse(process.argv);
