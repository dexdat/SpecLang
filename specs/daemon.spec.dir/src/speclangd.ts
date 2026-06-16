/**
speclang-header lines:5
id: @specs/daemon
version: 1.0.0
layer: 5
 */

#!/usr/bin/env node

/**
 * Speclangd CLI - Command-line interface for the daemon
 * 
 * Usage:
 *   speclangd                    Start daemon in foreground
 *   speclangd --daemon           Start daemon in background
 *   speclangd status             Check daemon status
 *   speclangd pause              Pause cascade
 *   speclangd resume             Resume cascade
 *   speclangd abort              Abort current cascade
 *   speclangd trigger <file>    Manually trigger an event
 *   speclangd converge           Wait for convergence, then exit
 */

import { Command } from 'commander';
import { Daemon, DaemonCommandKind } from './daemon/index.js';

const program = new Command();

program
  .name('speclangd')
  .description('Speclang reactive file watcher daemon')
  .version('0.1.0');

program
  .command('start')
  .description('Start the daemon')
  .option('-d, --daemon', 'Run in background')
  .option('-c, --config <path>', 'Config file path', '.speclangrc')
  .action(async (options) => {
    const daemon = new Daemon(options.config);
    
    daemon.on('started', () => {
      console.log('[CLI] Daemon started');
    });
    
    daemon.on('converged', (result) => {
      console.log('[CLI] Cascade converged:', result);
    });
    
    daemon.on('task', (task) => {
      console.log('[CLI] Task generated:', task.kind, task.trigger);
    });
    
    await daemon.start();
    
    if (!options.daemon) {
      // Keep running in foreground
      console.log('[CLI] Running in foreground. Press Ctrl+C to stop.');
      process.on('SIGINT', async () => {
        console.log('\n[CLI] Shutting down...');
        await daemon.stop();
        process.exit(0);
      });
    }
  });

program
  .command('status')
  .description('Show daemon status')
  .action(async () => {
    const daemon = new Daemon();
    await daemon.start();
    const status = daemon.getStatus();
    console.log(JSON.stringify(status, null, 2));
    await daemon.stop();
  });

program
  .command('pause')
  .description('Pause the cascade')
  .action(async () => {
    const daemon = new Daemon();
    await daemon.start();
    await daemon.processCommand({ kind: DaemonCommandKind.Pause });
    console.log('Daemon paused');
    await daemon.stop();
  });

program
  .command('resume')
  .description('Resume the cascade')
  .action(async () => {
    const daemon = new Daemon();
    await daemon.start();
    await daemon.processCommand({ kind: DaemonCommandKind.Resume });
    console.log('Daemon resumed');
    await daemon.stop();
  });

program
  .command('abort')
  .description('Abort current cascade')
  .action(async () => {
    const daemon = new Daemon();
    await daemon.start();
    await daemon.processCommand({ kind: DaemonCommandKind.Abort });
    console.log('Cascade aborted');
    await daemon.stop();
  });

program
  .command('trigger <file>')
  .description('Manually trigger an event for a file')
  .action(async (file: string) => {
    const daemon = new Daemon();
    await daemon.start();
    await daemon.processCommand({ kind: DaemonCommandKind.Trigger, path: file });
    console.log(`Triggered: ${file}`);
    await daemon.stop();
  });

program
  .command('converge')
  .description('Wait for convergence then exit')
  .option('-t, --timeout <seconds>', 'Timeout in seconds', '60')
  .action(async (options) => {
    const daemon = new Daemon();
    await daemon.start();
    
    try {
      const result = await daemon.getConvergence().waitForConvergence(parseInt(options.timeout) * 1000);
      console.log('Converged:', result);
    } catch (error) {
      console.error('Convergence timeout');
    }
    
    await daemon.stop();
  });

// Default command - start daemon
program.parse(process.argv);
