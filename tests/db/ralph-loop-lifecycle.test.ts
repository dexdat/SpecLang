/**
 * GAP-004: the Ralph Loop had no exit path.
 *
 * Verified pre-fix state at 94dd3ea8 (`src/ralph-loop.ts`, which is a symlink to
 * `specs/implementation.spec.dir/src/ralph-loop.ts`):
 *
 *   line 203  private isRunning: boolean = false;
 *   line 238  this.isRunning = true;
 *   line 239  while (this.isRunning) { ... await this.sleep(5000) on no task }
 *
 * `isRunning` was assigned nowhere else, no signal listener was ever installed,
 * and nothing looked at the launcher — so the only ways out of the loop were an
 * uncaught error or an external SIGKILL. The measured consequence: 28 live
 * `tsx src/ralph-loop.ts` processes across 7 trees, ~1.6 GB RSS, every one
 * reparented to `systemd --user` after its launching session exited, each still
 * polling its SQLite state DB every 5 seconds forever.
 *
 * These tests pin the three exit paths that were added — signal, launcher loss,
 * bounded idle — plus the two properties that make them safe to rely on: the
 * listeners are removed when the loop ends (no leak, no stacked duplicates), and
 * a pending poll timer is cleared rather than awaited. They never wait a real
 * 5 s poll: the interval and the idle bound are constructor options.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";

import {
  LoopController,
  RALPH_LOOP_POLL_INTERVAL_MS,
  RALPH_LOOP_DEFAULT_MAX_IDLE_POLLS,
  RALPH_LOOP_STOP_SIGNALS,
  isLauncherGone,
  isProcessAlive,
} from "../../src/ralph-loop.js";

const REPO_ROOT = process.cwd();
const TSX = join(REPO_ROOT, "node_modules", ".bin", "tsx");
const RALPH_ENTRY = join(REPO_ROOT, "src", "ralph-loop.ts");

/** A logger that records the loop's stop lines instead of printing them. */
function captureLog(): { lines: string[]; log: (line: string) => void } {
  const lines: string[] = [];
  return { lines, log: (line: string) => lines.push(line) };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll `predicate` until it holds; fail loudly (never silently pass) on timeout. */
async function waitFor(predicate: () => boolean, what: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(2);
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${what}`);
}

/**
 * The pid of a process that has definitely exited (and been reaped), so
 * `process.kill(pid, 0)` reports ESRCH for it.
 */
async function pidOfExitedProcess(): Promise<number> {
  const child = spawn(process.execPath, ["-e", "process.exit(0)"], { stdio: "ignore" });
  const pid = child.pid;
  await new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", () => resolve());
  });
  if (pid === undefined) {
    throw new Error("the probe child process never started, so it has no pid");
  }
  return pid;
}

describe("Ralph Loop exit paths (GAP-004)", () => {
  let dir: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "ralph-lifecycle-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("documents the defaults: a 5s poll and a 30 minute idle bound", () => {
    expect(RALPH_LOOP_POLL_INTERVAL_MS).toBe(5_000);
    expect(RALPH_LOOP_DEFAULT_MAX_IDLE_POLLS).toBe(360);
    expect(RALPH_LOOP_POLL_INTERVAL_MS * RALPH_LOOP_DEFAULT_MAX_IDLE_POLLS).toBe(30 * 60 * 1000);
    // The signals the loop promises to handle.
    expect([...RALPH_LOOP_STOP_SIGNALS]).toEqual(["SIGTERM", "SIGINT", "SIGHUP"]);
  });

  it("stop() ends a running loop, clears its poll timer, and logs reason=stopped", async () => {
    const { lines, log } = captureLog();
    const controller = await LoopController.create(join(dir, "stop.db"), {
      // Long on purpose: a stop that merely set a flag would wait out the sleep,
      // and this assertion would take 5s instead of returning immediately.
      pollIntervalMs: 5_000,
      maxIdlePolls: null,
      exitOnLauncherLoss: false,
      log,
    });

    const running = controller.start();
    await waitFor(
      () => controller.getStatus().idlePolls >= 1 && controller.getStatus().waitingForPoll,
      "the loop to enter its first poll sleep"
    );

    const startedAt = Date.now();
    controller.stop();
    const reason = await running;
    const elapsed = Date.now() - startedAt;

    expect(reason).toBe("stopped");
    // A 5s timer left pending would show up here.
    expect(elapsed).toBeLessThan(2_000);
    expect(controller.getStatus()).toMatchObject({
      running: false,
      waitingForPoll: false,
      exitReason: "stopped",
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Ralph Loop stopped (reason=stopped)");

    // And it stays stopped: nothing polls the state DB behind our back.
    const pollsWhenStopped = controller.getStatus().idlePolls;
    await sleep(25);
    expect(controller.getStatus().idlePolls).toBe(pollsWhenStopped);
  });

  it("stops itself with reason=idle-timeout after maxIdlePolls idle polls", async () => {
    const { lines, log } = captureLog();
    const controller = await LoopController.create(join(dir, "idle.db"), {
      pollIntervalMs: 1,
      maxIdlePolls: 4,
      exitOnLauncherLoss: false,
      log,
    });

    const reason = await controller.start();

    expect(reason).toBe("idle-timeout");
    expect(controller.getStatus().idlePolls).toBe(4);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Ralph Loop stopped (reason=idle-timeout)");
    // The line says why it stopped and which bound fired.
    expect(lines[0]).toContain("4 consecutive idle polls");
    expect(lines[0]).toContain("maxIdlePolls=4");
  });

  it("never stops on idleness when the bound is disabled explicitly", async () => {
    const { log } = captureLog();
    const controller = await LoopController.create(join(dir, "unbounded.db"), {
      pollIntervalMs: 1,
      maxIdlePolls: null,
      exitOnLauncherLoss: false,
      log,
    });

    const running = controller.start();
    await waitFor(() => controller.getStatus().idlePolls >= 6, "six idle polls");

    // Disabled means disabled: no exit, unlike the 4-poll bound above.
    expect(controller.getStatus().running).toBe(true);
    expect(controller.getStatus().exitReason).toBeNull();

    controller.stop();
    expect(await running).toBe("stopped");
  });

  it("stops with reason=launcher-gone when the launching process has exited", async () => {
    const deadPid = await pidOfExitedProcess();
    // Premise: this pid really is dead, otherwise the test proves nothing.
    expect(isProcessAlive(deadPid)).toBe(false);
    expect(isLauncherGone(deadPid, process.ppid)).toBe(true);

    const { lines, log } = captureLog();
    const controller = await LoopController.create(join(dir, "launcher.db"), {
      pollIntervalMs: 1,
      maxIdlePolls: null,
      exitOnLauncherLoss: true,
      launcherPid: deadPid,
      log,
    });

    const reason = await controller.start();

    expect(reason).toBe("launcher-gone");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Ralph Loop stopped (reason=launcher-gone)");
    expect(lines[0]).toContain(`launcher pid ${deadPid}`);
  });

  it("ignores launcher loss when exitOnLauncherLoss is off", async () => {
    const deadPid = await pidOfExitedProcess();
    expect(isProcessAlive(deadPid)).toBe(false);

    const { lines, log } = captureLog();
    const controller = await LoopController.create(join(dir, "daemon.db"), {
      pollIntervalMs: 1,
      maxIdlePolls: 3,
      exitOnLauncherLoss: false,
      launcherPid: deadPid,
      log,
    });

    // An intentionally reparented daemon keeps running: the only bound left is
    // the idle one, which is why this ends on `idle-timeout` and not before.
    const reason = await controller.start();

    expect(reason).toBe("idle-timeout");
    expect(lines[0]).toContain("reason=idle-timeout");
    expect(lines[0]).not.toContain("launcher-gone");
  });

  it("does not mistake a live launcher for a dead one", async () => {
    const { log } = captureLog();
    const controller = await LoopController.create(join(dir, "alive-launcher.db"), {
      pollIntervalMs: 1,
      maxIdlePolls: 3,
      // Default bounds, with the real parent pid watched.
      log,
    });

    expect(await controller.start()).toBe("idle-timeout");
  });

  it("stops on SIGTERM through the handler start() registered, and removes it again", async () => {
    const preexisting = new Map(
      RALPH_LOOP_STOP_SIGNALS.map((s) => [s, process.listeners(s)] as const)
    );
    const countBefore = (signal: (typeof RALPH_LOOP_STOP_SIGNALS)[number]): number =>
      preexisting.get(signal)?.length ?? 0;

    const { lines, log } = captureLog();
    const controller = await LoopController.create(join(dir, "signal.db"), {
      pollIntervalMs: 5_000,
      maxIdlePolls: null,
      exitOnLauncherLoss: false,
      log,
    });

    const running = controller.start();
    await waitFor(() => controller.getStatus().waitingForPoll, "the loop to enter its poll sleep");

    // Exactly one listener was added per handled signal, and no pre-existing
    // listener (vitest's, a host runner's) was disturbed.
    for (const signal of RALPH_LOOP_STOP_SIGNALS) {
      expect(process.listenerCount(signal)).toBe(countBefore(signal) + 1);
    }

    // Deliver SIGTERM the way the OS does: invoke the listener start() added.
    const before = preexisting.get("SIGTERM") ?? [];
    const added = process.listeners("SIGTERM").filter((listener) => !before.includes(listener));
    expect(added).toHaveLength(1);
    (added[0] as () => void)();

    const reason = await running;

    expect(reason).toBe("signal:SIGTERM");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Ralph Loop stopped (reason=signal:SIGTERM)");
    expect(controller.getStatus().exitReason).toBe("signal:SIGTERM");

    // No listener leak: every handled signal is back to its pre-start count.
    for (const signal of RALPH_LOOP_STOP_SIGNALS) {
      expect(process.listenerCount(signal)).toBe(countBefore(signal));
    }
  });

  it("does not stack signal listeners when the loop is started twice", async () => {
    const before = new Map(RALPH_LOOP_STOP_SIGNALS.map((s) => [s, process.listenerCount(s)]));

    for (let run = 0; run < 2; run += 1) {
      const { log } = captureLog();
      const controller = await LoopController.create(join(dir, `restart-${run}.db`), {
        pollIntervalMs: 5_000,
        maxIdlePolls: null,
        exitOnLauncherLoss: false,
        log,
      });

      const running = controller.start();
      await waitFor(() => controller.getStatus().waitingForPoll, `run ${run} to enter its poll sleep`);

      for (const signal of RALPH_LOOP_STOP_SIGNALS) {
        expect(process.listenerCount(signal)).toBe((before.get(signal) ?? 0) + 1);
      }

      controller.stop();
      expect(await running).toBe("stopped");

      for (const signal of RALPH_LOOP_STOP_SIGNALS) {
        expect(process.listenerCount(signal)).toBe(before.get(signal) ?? 0);
      }
    }
  });

  it("the CLI entry exits 0 on a real SIGTERM instead of being SIGKILLed", async () => {
    expect(existsSync(TSX)).toBe(true);
    expect(existsSync(RALPH_ENTRY)).toBe(true);

    const projectDir = join(dir, "cli-project");
    mkdirSync(projectDir, { recursive: true });

    const child = spawn(TSX, [RALPH_ENTRY], { cwd: projectDir, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    let exitCode: number | null | undefined;
    const exited = new Promise<void>((resolve) => {
      child.on("exit", (code) => {
        exitCode = code;
        resolve();
      });
    });

    try {
      // Readiness, not a fixed sleep: the loop is a daemon, so "state DB ready"
      // is the signal that it reached the poll loop. Its launcher (this process)
      // is alive, so the launcher-liveness arm must not fire here.
      await waitFor(
        () => stderr.includes("Ralph Loop state database ready at") || exitCode !== undefined,
        "the CLI entry to bootstrap its state DB",
        30_000
      );
      expect(exitCode).toBeUndefined();
      expect(existsSync(join(projectDir, ".speclang", "speclang.db"))).toBe(true);

      child.kill("SIGTERM");
      await exited;
    } finally {
      if (exitCode === undefined) {
        // Never leave the very orphan this test is about.
        child.kill("SIGKILL");
        await exited;
      }
    }

    expect(stderr).not.toMatch(/SqliteError/);
    expect(stderr).toContain("Ralph Loop stopped (reason=signal:SIGTERM)");
    expect(exitCode).toBe(0);
  }, 40_000);
});
