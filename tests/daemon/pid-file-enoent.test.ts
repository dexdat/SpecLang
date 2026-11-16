/**
 * DF-SPECLANG-6: `.speclang/daemon.pid` ENOENT handling.
 *
 * Bug (reproduced pre-fix): `./bin/speclang stop` sends SIGTERM and then unlinks
 * `.speclang/daemon.pid`. The serving process's own SIGTERM handler unlinks the
 * same file, so whichever side loses that race crashed with an uncaught
 * `Error: ENOENT: no such file or directory, unlink '.../daemon.pid'` and the
 * "clean" shutdown exited 1. Two more pid-file holes existed on the CLI side:
 *   - `readFileSync` after `existsSync` (file can vanish in between → ENOENT)
 *   - empty/garbage pid file → `parseInt` yields NaN → `process.kill(NaN)` throws
 *     `ERR_INVALID_ARG_TYPE` instead of a readable no-op.
 *
 * Contract pinned here:
 *   - `stop` when the pid file is absent is a clean no-op (exit 0, no throw)
 *   - `stop` twice is idempotent
 *   - an empty/garbage pid file is treated as stale state, never as a process
 *   - a stale pid for a dead process is removed with exit 0
 *   - `daemon status` clears a stale pid file without throwing
 *   - the serving process exits 0 with NO ENOENT trace when `stop` wins the
 *     unlink race (the board AC harness, as a spawn-based unit test)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn, execFile, type ChildProcess } from "child_process";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SPECLANG = path.join(REPO_ROOT, "bin", "speclang");
const DIST_DAEMON = path.join(REPO_ROOT, "dist", "src", "daemon", "index.js");
const distBuilt = fs.existsSync(DIST_DAEMON);

function runCli(
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    execFile(
      "node",
      [SPECLANG, ...args],
      { cwd, env: { ...process.env, NODE_OPTIONS: "" }, timeout: 30_000 },
      (err, stdout, stderr) => {
        // execFile returns null on success (exit 0) — capture both shapes.
        const exitCode =
          err && typeof (err as any).code === "number" ? (err as any).code : 0;
        resolve({
          stdout: stdout?.toString() ?? "",
          stderr: stderr?.toString() ?? "",
          exitCode,
        });
      },
    );
  });
}

/** A pid that is guaranteed not to belong to a live process. */
async function deadPid(): Promise<number> {
  const child = spawn(process.execPath, ["-p", "0"], { env: { ...process.env, NODE_OPTIONS: "" } });
  const pid = child.pid as number;
  await new Promise<void>((resolve) => child.on("exit", () => resolve()));
  return pid;
}

async function waitFor(predicate: () => boolean, timeoutMs: number, what: string) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`timeout after ${timeoutMs}ms waiting for ${what}`);
}

describe("DF-SPECLANG-6 daemon.pid ENOENT handling", () => {
  let sandbox: string;
  let liveChild: ChildProcess | null = null;

  const pidFile = () => path.join(sandbox, ".speclang", "daemon.pid");
  const writePid = (contents: string) => {
    fs.mkdirpSync(path.join(sandbox, ".speclang"));
    fs.writeFileSync(pidFile(), contents);
  };
  const noNodeError = (text: string) => {
    expect(text).not.toMatch(/ENOENT/);
    expect(text).not.toMatch(/ERR_INVALID_ARG/);
  };

  beforeEach(() => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-df6-"));
    fs.mkdirpSync(path.join(sandbox, ".speclang"));
  });

  afterEach(async () => {
    if (liveChild && liveChild.exitCode === null && liveChild.signalCode === null) {
      liveChild.kill("SIGKILL");
      await new Promise((r) => liveChild!.once("exit", () => r(null)));
    }
    liveChild = null;
    fs.removeSync(sandbox);
  });

  it("stop with no pid file is a clean no-op (exit 0)", async () => {
    const res = await runCli(["stop", "-d", sandbox], sandbox);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toMatch(/Daemon not running/);
    noNodeError(res.stdout + res.stderr);
  });

  it("stopping twice is idempotent (no throw on the second stop)", async () => {
    const first = await runCli(["stop", "-d", sandbox], sandbox);
    const second = await runCli(["stop", "-d", sandbox], sandbox);
    expect(first.exitCode).toBe(0);
    expect(second.exitCode).toBe(0);
    expect(second.stdout).toMatch(/Daemon not running/);
    noNodeError(first.stdout + first.stderr + second.stdout + second.stderr);
  });

  it("an empty pid file is stale state, not a NaN kill", async () => {
    writePid("");
    const res = await runCli(["stop", "-d", sandbox], sandbox);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toMatch(/Daemon not running/);
    noNodeError(res.stdout + res.stderr);
  });

  it("a garbage pid file is stale state, not a NaN kill", async () => {
    writePid("not-a-pid");
    const res = await runCli(["stop", "-d", sandbox], sandbox);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toMatch(/Daemon not running/);
    noNodeError(res.stdout + res.stderr);
  });

  it("a stale pid for a dead process is removed with exit 0", async () => {
    writePid(String(await deadPid()));
    const res = await runCli(["stop", "-d", sandbox], sandbox);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toMatch(/stale PID file removed/);
    expect(fs.existsSync(pidFile())).toBe(false);
    noNodeError(res.stdout + res.stderr);
  });

  it("`daemon stop` (subcommand) is a clean no-op when not running", async () => {
    const res = await runCli(["daemon", "stop"], sandbox);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toMatch(/Daemon not running/);
    noNodeError(res.stdout + res.stderr);
  });

  it("`daemon status` removes a stale pid file without throwing", async () => {
    writePid(String(await deadPid()));
    const res = await runCli(["daemon", "status"], sandbox);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toMatch(/Daemon: Stopped/);
    expect(fs.existsSync(pidFile())).toBe(false);
    noNodeError(res.stdout + res.stderr);
  });

  describe.skipIf(!distBuilt)("serving process shutdown", () => {
    it(
      "exits 0 with no ENOENT trace when `stop` wins the pid-file unlink race",
      async () => {
        let out = "";
        let err = "";
        liveChild = spawn(
          process.execPath,
          [SPECLANG, "start", "--no-dashboard", "--port", "39191", "-d", sandbox],
          { cwd: sandbox, env: { ...process.env, NODE_OPTIONS: "" } },
        );
        const child = liveChild;
        child.stdout!.on("data", (d) => (out += d.toString()));
        child.stderr!.on("data", (d) => (err += d.toString()));
        const exited = new Promise<number | null>((resolve) =>
          child.on("exit", (code) => resolve(code)),
        );

        await waitFor(
          () => /Daemon Started/i.test(out) && fs.existsSync(pidFile()),
          30_000,
          "daemon start banner + pid file",
        );
        expect(fs.readFileSync(pidFile(), "utf-8").trim()).toBe(String(child.pid));

        const stop = await runCli(["stop", "-d", sandbox], sandbox);
        expect(stop).toMatchObject({ exitCode: 0 });
        expect(stop.stdout).toMatch(/Daemon stopped/);
        expect(fs.existsSync(pidFile())).toBe(false);

        const exitCode = await Promise.race([
          exited,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("serving process did not exit after stop")), 30_000),
          ),
        ]);
        expect(exitCode).toBe(0);
        expect(out + err).not.toMatch(/ENOENT/);
        expect(out + err).not.toMatch(/Error:/);

        // Second stop after shutdown: still a clean no-op.
        const again = await runCli(["stop", "-d", sandbox], sandbox);
        expect(again.exitCode).toBe(0);
        expect(again.stdout).toMatch(/Daemon not running/);
      },
      60_000,
    );
  });
});
