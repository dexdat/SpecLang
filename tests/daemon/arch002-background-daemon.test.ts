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
 *
 * UX-002 (de-flake): every readiness gate here used to be a fixed
 * `setTimeout(1500)`. On a cold 2-core CI runner the detached child needs
 * longer than that, and the live CI red (run 44046434678 on commit fe1f949d)
 * failed exactly this way — `expected '🔴 Daemon: Stopped' to match
 * /🟢 Daemon: Running/` at what was line 131. A fixed sleep cannot distinguish
 * "still booting" from "dead", so all gates are now bounded polls that either
 * observe the real signal or fail with the pid/log/state evidence attached.
 *
 * The readiness signal matters for order, not just patience: the watcher seeds
 * `fileStates` from an initial directory scan, so a spec written BEFORE that
 * scan is baselined and never emits a change event. Waiting for
 * `daemon-state.json` (written immediately after `Watcher.start()` resolves,
 * i.e. after the initial scan) is what makes the "save a spec → cascading"
 * case deterministic instead of a coin flip.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFile } from "child_process";
import * as fs from "fs-extra";
import * as path from "path";
import {
  daemonTestEnv,
  registerDaemonPid,
  registerSpawnedDaemon,
  stopRegisteredDaemons,
} from "./proc-registry";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SPEclangD = path.join(REPO_ROOT, "bin", "speclangd");
const TEST_PROJECT = path.join(
  REPO_ROOT,
  "tests",
  "daemon",
  "fixtures",
  "arch002-project",
);
const SPECS_DIR = path.join(TEST_PROJECT, "specs");
const PID_FILE = path.join(TEST_PROJECT, ".speclang", "speclangd.pid");
const STATE_FILE = path.join(TEST_PROJECT, ".speclang", "daemon-state.json");
const LOG_FILE = path.join(TEST_PROJECT, ".speclang", "speclangd.log");

// Cheap filesystem probes can run tight; every `status` probe is a node CLI
// spawn (~100ms on an idle box), so give those a coarser cadence.
const FS_POLL_INTERVAL_MS = 50;
const CLI_POLL_INTERVAL_MS = 250;

// Bounded readiness budget for a detached daemon child. Generous enough for a
// cold 2-core CI runner, bounded so a daemon that genuinely never comes up
// FAILS with diagnostics instead of hanging. The per-test budgets below are
// 30s (vitest's configured default) so this deadline — plus one CLI spawn —
// surfaces as the error thrown here, not as vitest's opaque timeout.
const READINESS_DEADLINE_MS = 20_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function speclangPath(cwd: string, name: string): string {
  return path.join(cwd, ".speclang", name);
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function runCli(
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "node",
      [SPEclangD, ...args],
      { cwd, env: { ...daemonTestEnv(cwd), ...extraEnv } },
      (err, stdout, stderr) => {
        // execFile returns null on success (exit 0) — capture both shapes.
        const exitCode =
          err && typeof (err as any).code === "number" ? (err as any).code : 0;
        if (args[0] === "start" && exitCode === 0) {
          const reported = /PID (\d+)/.exec(stdout);
          if (reported) registerDaemonPid(Number(reported[1]), cwd);
        }
        resolve({
          stdout: stdout?.toString() ?? "",
          stderr: stderr?.toString() ?? "",
          exitCode,
        });
      },
    );
    registerSpawnedDaemon(child, cwd);
  });
}

async function readPid(pidPath: string): Promise<number | null> {
  try {
    const pid = parseInt(await fs.readFile(pidPath, "utf-8"), 10);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/**
 * Evidence to attach to a readiness timeout: without it a slow/dead daemon is
 * indistinguishable from a broken assertion, and the child's own failure is
 * only visible in its log file (its stdio is redirected there by `start -d`).
 */
async function daemonDiagnostics(cwd: string): Promise<string> {
  const pidPath = speclangPath(cwd, "speclangd.pid");
  const logPath = speclangPath(cwd, "speclangd.log");
  const statePath = speclangPath(cwd, "daemon-state.json");
  const lines: string[] = [];

  const pid = await readPid(pidPath);
  lines.push(
    `  pid file: ${
      pid === null
        ? `absent or not a pid (${pidPath})`
        : `${pid} (${isAlive(pid) ? "process alive" : "process NOT alive"})`
    }`,
  );

  try {
    lines.push(
      `  state file: ${JSON.stringify(await fs.readFile(statePath, "utf-8"))}`,
    );
  } catch {
    lines.push(`  state file: absent (${statePath})`);
  }

  try {
    const log = (await fs.readFile(logPath, "utf-8")).trimEnd().split("\n");
    const tail = log.slice(-15).join("\n") || "    (empty)";
    lines.push(`  daemon log tail (last ${Math.min(log.length, 15)} lines):\n${tail}`);
  } catch {
    lines.push(`  daemon log: absent (${logPath})`);
  }

  return lines.join("\n");
}

/**
 * Poll `probe` until it returns a non-null value, then return it. Null means
 * "not ready yet"; the deadline throws with `diagnostics()` instead of letting
 * the test hang or fall through to a misleading assertion failure.
 */
async function pollUntil<T>(
  what: string,
  probe: () => Promise<T | null>,
  timeoutMs: number,
  intervalMs: number,
  diagnostics: () => Promise<string>,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== null) return value;
    if (Date.now() >= deadline) {
      throw new Error(
        `timed out after ${timeoutMs}ms waiting for ${what}\n${await diagnostics()}`,
      );
    }
    await sleep(intervalMs);
  }
}

/** Wait until the background daemon has written a usable PID file. */
async function waitForPidFile(
  cwd: string,
  deadlineMs = READINESS_DEADLINE_MS,
): Promise<number> {
  const pidPath = speclangPath(cwd, "speclangd.pid");
  const pid = await pollUntil(
    `the daemon PID file ${pidPath}`,
    () => readPid(pidPath),
    deadlineMs,
    FS_POLL_INTERVAL_MS,
    () => daemonDiagnostics(cwd),
  );
  registerDaemonPid(pid, cwd);
  return pid;
}

/**
 * Wait until `status` reports the daemon as Running, and return that stdout.
 * On deadline the thrown error carries the last status output/exit code plus
 * the pid/log/state evidence, so a future red names its own cause.
 */
async function waitForDaemonRunning(
  cwd: string,
  deadlineMs = READINESS_DEADLINE_MS,
): Promise<string> {
  let last = { stdout: "", stderr: "", exitCode: -1 };
  return pollUntil(
    `'status' to report the daemon Running`,
    async () => {
      last = await runCli(["status"], cwd);
      return /🟢 Daemon: Running/.test(last.stdout) ? last.stdout : null;
    },
    deadlineMs,
    CLI_POLL_INTERVAL_MS,
    async () =>
      `  last status: exit=${last.exitCode} stdout=${JSON.stringify(
        last.stdout,
      )} stderr=${JSON.stringify(last.stderr)}\n${await daemonDiagnostics(cwd)}`,
  );
}

/**
 * Wait until the persisted daemon state satisfies `predicate`, then return the
 * state that satisfied it (a partially written file simply keeps polling).
 */
async function waitForState(
  cwd: string,
  predicate: (state: any) => boolean,
  deadlineMs = READINESS_DEADLINE_MS,
): Promise<any> {
  const statePath = speclangPath(cwd, "daemon-state.json");
  return pollUntil(
    `daemon state satisfying the predicate (${statePath})`,
    async () => {
      try {
        const state = JSON.parse(await fs.readFile(statePath, "utf-8"));
        return predicate(state) ? state : null;
      } catch {
        return null;
      }
    },
    deadlineMs,
    FS_POLL_INTERVAL_MS,
    () => daemonDiagnostics(cwd),
  );
}

describe("ARCH-002 — background daemon mode", () => {
  beforeEach(async () => {
    await fs.remove(TEST_PROJECT);
    await fs.ensureDir(SPECS_DIR);
    // Seed a .speclangrc so Daemon.start() doesn't crash on missing config.
    await fs.writeFile(
      path.join(TEST_PROJECT, ".speclangrc"),
      JSON.stringify(
        { watcher: { specsDir: "specs" }, cascade: { quietPeriod: 100 } },
        null,
        2,
      ),
    );
  });

  afterEach(async () => {
    // Register even a partially-started daemon, then kill its complete tree
    // before deleting the fixture cwd that identifies it in /proc.
    const pid = await readPid(PID_FILE);
    if (pid !== null) registerDaemonPid(pid, TEST_PROJECT);
    await stopRegisteredDaemons();
    await fs.remove(TEST_PROJECT);
  });

  it("start -d forks into background, writes a PID file, parent exits 0", async () => {
    const { stdout, exitCode } = await runCli(["start", "-d"], TEST_PROJECT);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/started in background \(PID \d+\)/);

    // The PID file is written by the detached CHILD (writePidFile in
    // bin/speclangd), not by the parent that just exited, so its appearance is
    // asynchronous — poll it instead of assuming the child won the race.
    const pid = await waitForPidFile(TEST_PROJECT);
    const reported = parseInt(/PID (\d+)/.exec(stdout)![1], 10);
    expect(pid).toBe(reported);

    // The PID should correspond to a live node process.
    expect(isAlive(pid)).toBe(true);
  }, 30000);

  it("teardown kills a daemon's detached children, not only its pidfile PID", async () => {
    const preload = path.join(TEST_PROJECT, "spawn-test-descendant.cjs");
    await fs.writeFile(
      preload,
      [
        'const { spawn } = require("child_process");',
        'const fs = require("fs");',
        'if (process.env.SPECLANGD_CHILD === "1") {',
        "  const child = spawn(process.execPath,",
        '    ["-e", "setInterval(() => {}, 1000)"],',
        "    { detached: true, stdio: \"ignore\", cwd: process.cwd(),",
        '      env: { ...process.env, NODE_OPTIONS: "" } });',
        "  child.unref();",
        '  fs.writeFileSync(".speclang/test-descendant.pid", String(child.pid));',
        "}",
        "",
      ].join("\n"),
    );
    await runCli(["start", "-d"], TEST_PROJECT, {
      NODE_OPTIONS: `--require ${preload}`,
    });
    const daemonPid = await waitForPidFile(TEST_PROJECT);
    const descendantPath = speclangPath(TEST_PROJECT, "test-descendant.pid");
    const descendantPid = await pollUntil(
      `the detached descendant PID file ${descendantPath}`,
      () => readPid(descendantPath),
      READINESS_DEADLINE_MS,
      FS_POLL_INTERVAL_MS,
      () => daemonDiagnostics(TEST_PROJECT),
    );
    expect(isAlive(daemonPid)).toBe(true);
    expect(isAlive(descendantPid)).toBe(true);

    await stopRegisteredDaemons();
    await pollUntil(
      "the daemon and detached descendant to exit",
      async () => (!isAlive(daemonPid) && !isAlive(descendantPid) ? true : null),
      5_000,
      FS_POLL_INTERVAL_MS,
      () => daemonDiagnostics(TEST_PROJECT),
    );
    expect(isAlive(daemonPid)).toBe(false);
    expect(isAlive(descendantPid)).toBe(false);
  }, 30000);

  it("status reports the running daemon without instantiating a new one", async () => {
    await runCli(["start", "-d"], TEST_PROJECT);

    const stdout = await waitForDaemonRunning(TEST_PROJECT);
    expect(stdout).toMatch(/🟢 Daemon: Running/);
    expect(stdout).toMatch(/PID: \d+/);

    // status must NOT have spawned a second daemon — only one PID file entry
    // exists and the daemon is still the same process.
    const pid = await waitForPidFile(TEST_PROJECT);
    expect(isAlive(pid)).toBe(true);
  }, 30000);

  it('saving a spec transition state to "cascading"', async () => {
    await runCli(["start", "-d"], TEST_PROJECT);

    // Readiness gate: daemon-state.json is first written right after
    // Watcher.start() resolves — i.e. once the initial directory scan has
    // baselined the tree. Writing the spec before that point would be folded
    // into the baseline and never produce a change event.
    await waitForState(TEST_PROJECT, (state) => typeof state.status === "string");

    // Save a fresh spec file.
    await fs.writeFile(
      path.join(SPECS_DIR, "arch002-trigger.spec.md"),
      "# triggered\n",
    );

    // The watcher polls once a second, so wait for the change to land instead
    // of sleeping a fixed amount.
    const state = await waitForState(
      TEST_PROJECT,
      (s) =>
        Array.isArray(s.filesChanged) &&
        s.filesChanged.includes("specs/arch002-trigger.spec.md"),
    );

    const stdout = await waitForDaemonRunning(TEST_PROJECT);
    expect(stdout).toMatch(/🟢 Daemon: Running/);

    // The state file should reflect that filesChanged was populated and the
    // daemon entered the cascading phase.
    expect(await fs.pathExists(STATE_FILE)).toBe(true);
    expect(state.filesChanged).toContain("specs/arch002-trigger.spec.md");
    expect(["cascading", "converged", "idle"]).toContain(state.status);
  }, 30000);

  it("stop terminates the background daemon and removes the PID file", async () => {
    await runCli(["start", "-d"], TEST_PROJECT);
    await waitForDaemonRunning(TEST_PROJECT);

    const pid = await waitForPidFile(TEST_PROJECT);
    expect(isAlive(pid)).toBe(true);

    const { stdout, exitCode } = await runCli(["stop"], TEST_PROJECT);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Sent SIGTERM to daemon/);
    expect(stdout).toMatch(/Daemon stopped/);

    // Allow the child up to 2s to actually exit.
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline && isAlive(pid)) {
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(isAlive(pid)).toBe(false);

    // PID file should be gone.
    expect(await fs.pathExists(PID_FILE)).toBe(false);

    // Subsequent status should report Stopped.
    const status = await runCli(["status"], TEST_PROJECT);
    expect(status.stdout).toMatch(/🔴 Daemon: Stopped/);
  }, 30000);
});
