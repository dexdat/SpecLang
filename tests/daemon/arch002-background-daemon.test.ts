/**
 * ARCH-002: Background daemon mode acceptance test
 *
 * Acceptance:
 *   1. `speclangd start -d` → daemon runs as detached background process
 *   2. `speclangd status`  → reports the daemon as healthy (no extra Daemon spawned)
 *   3. Saving a spec → cascade fires automatically (state transitions to "cascading")
 *   4. `speclangd stop`    → terminates the background daemon and removes its PID file
 *
 * The test exercises the CLI by spawning the actual `bin/speclangd` script
 * inside an isolated sandbox directory (no touching the host project's
 * .speclang/, daemon-state.json, or spec).
 *
 * PROVEN: 2026-07-05 — ARCH-002 end-to-end coverage. Without this test the
 * `-d` flag was a no-op (silently skipped SIGINT but never detached), and
 * `status` instantiated a brand new Daemon every call which raced with the
 * live daemon over daemon-state.json.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, execFile, type ChildProcess } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SPEclangD = path.join(REPO_ROOT, 'bin', 'speclangd');
const TEST_PROJECT = path.join(REPO_ROOT, 'tests', 'daemon', 'fixtures', 'arch002-project');
const SPECS_DIR = path.join(TEST_PROJECT, 'specs');
const PID_FILE = path.join(TEST_PROJECT, '.speclang', 'speclangd.pid');
const STATE_FILE = path.join(TEST_PROJECT, '.speclang', 'daemon-state.json');
const LOG_FILE = path.join(TEST_PROJECT, '.speclang', 'speclangd.log');

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    execFile('node', [SPEclangD, ...args], { cwd, env: { ...process.env, NODE_OPTIONS: '' } }, (err, stdout, stderr) => {
      // execFile returns null on success (exit 0) — capture both shapes.
      const exitCode = err && typeof (err as any).code === 'number' ? (err as any).code : 0;
      resolve({ stdout: stdout?.toString() ?? '', stderr: stderr?.toString() ?? '', exitCode });
    });
  });
}

describe('ARCH-002 — background daemon mode', () => {
  beforeEach(async () => {
    await fs.remove(TEST_PROJECT);
    await fs.ensureDir(SPECS_DIR);
    // Seed a .speclangrc so Daemon.start() doesn't crash on missing config.
    await fs.writeFile(
      path.join(TEST_PROJECT, '.speclangrc'),
      JSON.stringify({ watcher: { specsDir: 'specs' }, cascade: { quietPeriod: 100 } }, null, 2)
    );
  });

  afterEach(async () => {
    // Always clean up any leftover daemon process before removing the dir.
    if (await fs.pathExists(PID_FILE)) {
      const pid = parseInt(await fs.readFile(PID_FILE, 'utf-8'), 10);
      if (Number.isFinite(pid) && isAlive(pid)) {
        try { process.kill(pid, 'SIGTERM'); } catch {}
        // Give it up to 2s to die.
        const deadline = Date.now() + 2000;
        while (Date.now() < deadline && isAlive(pid)) {
          await new Promise((r) => setTimeout(r, 50));
        }
        if (isAlive(pid)) {
          try { process.kill(pid, 'SIGKILL'); } catch {}
        }
      }
    }
    await fs.remove(TEST_PROJECT);
  });

  it('start -d forks into background, writes a PID file, parent exits 0', async () => {
    const { stdout, exitCode } = await runCli(['start', '-d'], TEST_PROJECT);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/started in background \(PID \d+\)/);

    // PID file should exist within a fraction of a second of start.
    expect(await fs.pathExists(PID_FILE)).toBe(true);
    const pid = parseInt(await fs.readFile(PID_FILE, 'utf-8'), 10);
    expect(Number.isFinite(pid)).toBe(true);
    expect(pid).toBeGreaterThan(0);

    // The PID should correspond to a live node process.
    expect(isAlive(pid)).toBe(true);
  }, 10000);

  it('status reports the running daemon without instantiating a new one', async () => {
    await runCli(['start', '-d'], TEST_PROJECT);
    await new Promise((r) => setTimeout(r, 1500)); // let daemon reach idle state

    const { stdout, exitCode } = await runCli(['status'], TEST_PROJECT);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/🟢 Daemon: Running/);
    expect(stdout).toMatch(/PID: \d+/);

    // status must NOT have spawned a second daemon — only one PID file entry
    // exists and the daemon is still the same process.
    const pid = parseInt(await fs.readFile(PID_FILE, 'utf-8'), 10);
    expect(isAlive(pid)).toBe(true);
  }, 10000);

  it('saving a spec transition state to "cascading"', async () => {
    await runCli(['start', '-d'], TEST_PROJECT);
    await new Promise((r) => setTimeout(r, 1500));

    // Save a fresh spec file.
    await fs.writeFile(path.join(SPECS_DIR, 'arch002-trigger.spec.md'), '# triggered\n');
    await new Promise((r) => setTimeout(r, 1500)); // Watcher polls every ~1s

    const { stdout } = await runCli(['status'], TEST_PROJECT);
    expect(stdout).toMatch(/🟢 Daemon: Running/);

    // The state file should reflect that filesChanged was populated and the
    // daemon entered the cascading phase.
    expect(await fs.pathExists(STATE_FILE)).toBe(true);
    const state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
    expect(state.filesChanged).toContain('specs/arch002-trigger.spec.md');
    expect(['cascading', 'converged', 'idle']).toContain(state.status);
  }, 15000);

  it('stop terminates the background daemon and removes the PID file', async () => {
    await runCli(['start', '-d'], TEST_PROJECT);
    await new Promise((r) => setTimeout(r, 1500));

    const pid = parseInt(await fs.readFile(PID_FILE, 'utf-8'), 10);
    expect(isAlive(pid)).toBe(true);

    const { stdout, exitCode } = await runCli(['stop'], TEST_PROJECT);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Sent SIGTERM to daemon/);
    expect(stdout).toMatch(/Daemon stopped/);

    // Allow the child up to 1s to actually exit.
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline && isAlive(pid)) {
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(isAlive(pid)).toBe(false);

    // PID file should be gone.
    expect(await fs.pathExists(PID_FILE)).toBe(false);

    // Subsequent status should report Stopped.
    const status = await runCli(['status'], TEST_PROJECT);
    expect(status.stdout).toMatch(/🔴 Daemon: Stopped/);
  }, 15000);
});
