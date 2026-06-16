/**
 * Daemon CLI commands
 * 
 * Generated from: @speclang/daemon
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Daemon start options
 */
export interface DaemonStartOptions {
  projectDir?: string;
  port?: number;
  dashboard?: boolean;
  foreground?: boolean;
}

/**
 * Daemon stop options  
 */
export interface DaemonStopOptions {
  pid?: number;
}

/**
 * Daemon status options
 */
export interface DaemonStatusOptions {
  json?: boolean;
}

/**
 * Start the daemon
 */
export async function daemonStartCommand(options: DaemonStartOptions): Promise<void> {
  const projectDir = options.projectDir || process.cwd();
  const port = options.port || 3000;

  console.log('\n🚀 Starting SpecLang Daemon...\n');
  console.log(`   Project: ${projectDir}`);
  console.log(`   Port: ${port}`);

  // Check if already running
  const pidFile = path.join(projectDir, '.speclang', 'daemon.pid');
  if (await fs.pathExists(pidFile)) {
    const pid = parseInt(await fs.readFile(pidFile, 'utf-8'));
    try {
      process.kill(pid, 0);
      console.error(`\n❌ Daemon already running (PID: ${pid})`);
      console.error(`   Use 'speclang daemon stop' to stop it first\n`);
      process.exit(1);
    } catch {
      // Process not running, remove stale PID file
      await fs.remove(pidFile);
    }
  }

  // Dynamic import to avoid issues
  const { startDaemon } = await import('./index.js');
  await startDaemon({ projectDir, port, dashboard: options.dashboard ?? false });
}

/**
 * Stop the daemon
 */
export async function daemonStopCommand(options: DaemonStopOptions): Promise<void> {
  const projectDir = process.cwd();
  const pidFile = path.join(projectDir, '.speclang', 'daemon.pid');

  let pid: number | undefined;

  if (options.pid) {
    pid = options.pid;
  } else if (await fs.pathExists(pidFile)) {
    pid = parseInt(await fs.readFile(pidFile, 'utf-8'));
  }

  if (!pid) {
    console.log('\n⚠️  Daemon not running\n');
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`\n✅ Sent stop signal to daemon (PID: ${pid})\n`);
    
    // Wait for process to stop
    let attempts = 0;
    while (attempts < 10) {
      try {
        process.kill(pid, 0);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      } catch {
        // Process stopped
        await fs.remove(pidFile);
        console.log('✅ Daemon stopped\n');
        return;
      }
    }

    // Force kill if still running
    try {
      process.kill(pid, 'SIGKILL');
      await fs.remove(pidFile);
      console.log('✅ Daemon force stopped\n');
    } catch {
      console.log('⚠️  Could not force stop daemon\n');
    }
  } catch (error) {
    console.error(`\n❌ Failed to stop daemon: ${error}\n`);
    process.exit(1);
  }
}

/**
 * Get daemon status
 */
export async function daemonStatusCommand(options: DaemonStatusOptions): Promise<void> {
  const projectDir = process.cwd();
  const pidFile = path.join(projectDir, '.speclang', 'daemon.pid');
  const stateFile = path.join(projectDir, '.speclang', 'daemon-state.json');

  // Check if running
  let isRunning = false;
  let pid: number | undefined;

  if (await fs.pathExists(pidFile)) {
    pid = parseInt(await fs.readFile(pidFile, 'utf-8'));
    try {
      process.kill(pid, 0);
      isRunning = true;
    } catch {
      // Process not running, stale PID file
      await fs.remove(pidFile);
    }
  }

  if (!isRunning) {
    if (options.json) {
      console.log(JSON.stringify({ running: false, pid: null, status: 'stopped' }));
    } else {
      console.log('\n🔴 Daemon: Stopped\n');
    }
    return;
  }

  // Get state
  let state: Record<string, unknown> | null = null;
  if (await fs.pathExists(stateFile)) {
    try {
      state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
    } catch {
      // Ignore state read errors
    }
  }

  if (options.json) {
    console.log(JSON.stringify({
      running: true,
      pid,
      status: (state?.status as string) || 'unknown',
      cascadeDepth: (state?.cascadeDepth as number) || 0,
      filesChanged: ((state?.filesChanged as string[])?.length) || 0,
      startedAt: state?.startedAt || null
    }));
  } else {
    console.log('\n🟢 Daemon: Running');
    console.log(`   PID: ${pid}`);
    console.log(`   Status: ${(state?.status as string) || 'unknown'}`);
    console.log(`   Cascade Depth: ${(state?.cascadeDepth as number) || 0}`);
    console.log(`   Files Changed: ${((state?.filesChanged as string[])?.length) || 0}`);
    console.log('');
  }
}

/**
 * Configure daemon command
 */
export function configureDaemonCommand(program: Command): void {
  const daemon = program
    .command('daemon')
    .description('Manage SpecLang daemon');

  daemon
    .command('start')
    .description('Start the daemon')
    .option('-p, --project-dir <dir>', 'Project directory', process.cwd())
    .option('--port <n>', 'Port for dashboard', (val) => parseInt(val, 10), 3000)
    .option('--dashboard', 'Enable dashboard')
    .option('-f, --foreground', 'Run in foreground')
    .action(async (options) => {
      await daemonStartCommand(options as DaemonStartOptions);
    });

  daemon
    .command('stop')
    .description('Stop the daemon')
    .option('--pid <n>', 'PID to stop', (val) => parseInt(val, 10))
    .action(async (options) => {
      await daemonStopCommand(options as DaemonStopOptions);
    });

  daemon
    .command('status')
    .description('Show daemon status')
    .option('--json', 'JSON output')
    .action(async (options) => {
      await daemonStatusCommand(options as DaemonStatusOptions);
    });

  daemon
    .command('restart')
    .description('Restart the daemon')
    .action(async () => {
      await daemonStopCommand({});
      await daemonStartCommand({});
    });
}
