/**
 * DF-SPECLANG-026: `speclang mcp start` never wrote `.speclang/mcp.pid`, so
 * `mcp status` could only ever answer "Not running" for a live server.
 *
 * Repro measured against the pre-fix CLI (bin/speclang at 81df3ecd) in a
 * scratch project created by `speclang new probe --no-git -d <P>`:
 *
 *   ( sleep 25 | node bin/speclang mcp start -d "$P" ) &   # stdio, stdin open
 *   ls "$P/.speclang/mcp.pid"        -> No such file or directory
 *   node bin/speclang mcp status -d "$P"
 *   -> "📊 SpecLang MCP Status / Project: ... / Status: Not running"   EXIT=0
 *
 * …while that server process was alive and answering. `mcp stop` read the same
 * pid file, so it could not signal the server either.
 *
 * The fix makes `mcp start` the writer of the pid (and, in HTTP mode, the port)
 * for the process `mcp stop` signals, and makes `status` consult the process
 * table: a pid file left behind by a SIGKILL/crash is stale state, reported as
 * not running — never a false "Running". These tests drive the real CLI in
 * scratch projects (the CLI paths are only integration-testable: the pid
 * helpers live inside bin/speclang, which is plain CommonJS run by node).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const CLI = join(REPO_ROOT, "bin", "speclang");

/** Scratch project with a real `.speclang` scaffold — never the repo root. */
function newProject(dir: string): void {
  const res = spawnSync(process.execPath, [CLI, "new", "probe", "--no-git", "-d", dir], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    timeout: 60_000,
  });
  expect(res.status, `speclang new failed: ${res.stderr}`).toBe(0);
  // `speclang new` does not create the state dir until something runs; the
  // tests that pre-seed state (dead pid, corrupt DB) need it to exist.
  mkdirSync(join(dir, ".speclang"), { recursive: true });
}

function runCli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const res = spawnSync(process.execPath, [CLI, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    timeout: 30_000,
  });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

async function waitFor(predicate: () => boolean, label: string, timeoutMs = 20_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${label}`);
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** One allocation of a port nothing is listening on right now. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => (port ? resolve(port) : reject(new Error("no port"))));
    });
  });
}

/**
 * A pid that really existed and is really gone: spawn a trivial process, reap
 * it synchronously, then hand its pid to the test. This is the stale-pidfile
 * shape (SIGKILL, crash before the unlink), not a fabricated number.
 */
function deadPid(): number {
  const dead = spawnSync(process.execPath, ["-e", "0"], { timeout: 30_000 });
  const pid = dead.pid;
  expect(pid, "the probe process must have a pid").toBeGreaterThan(0);
  expect(isAlive(pid!), "the probe process must already be reaped").toBe(false);
  return pid!;
}

describe("speclang mcp pidfile lifecycle (DF-SPECLANG-026)", () => {
  let scratch: string;
  let dir: string;
  const children: ChildProcessWithoutNullStreams[] = [];

  /** `mcp start` in a scratch project, stdin held open like a stdio client. */
  function startMcp(extraArgs: string[] = []): { child: ChildProcessWithoutNullStreams; log: () => string } {
    const child = spawn(process.execPath, [CLI, "mcp", "start", "-d", dir, ...extraArgs], {
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stderr: string[] = [];
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk.toString()));
    child.stdout.on("data", () => {});
    children.push(child);
    return { child, log: () => stderr.join("") };
  }

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    // `speclang new` refuses an existing target, so the scratch container is
    // created and the project dir is the (not yet existing) child of it.
    scratch = mkdtempSync(join(REPO_ROOT, ".tmp", "mcp-pidfile-test-"));
    dir = join(scratch, "probe");
    newProject(dir);
  });

  afterEach(() => {
    for (const child of children.splice(0)) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
    rmSync(scratch, { recursive: true, force: true });
  });

  it("writes a pid for the live server, reports Running, and stop clears both", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");
    const { child, log } = startMcp();

    await waitFor(() => existsSync(pidFile), "mcp.pid to be written");

    // The pid must be THIS server process — the one `mcp stop` signals — not a
    // placeholder or a parent wrapper.
    expect(Number(readFileSync(pidFile, "utf-8").trim())).toBe(child.pid);
    expect(isAlive(child.pid!)).toBe(true);

    const running = runCli(["mcp", "status", "-d", dir]);
    expect(running.status, running.stderr).toBe(0);
    expect(running.stdout).toContain(`Status: Running (PID ${child.pid})`);

    const stopped = runCli(["mcp", "stop", "-d", dir]);
    expect(stopped.status, stopped.stderr).toBe(0);
    expect(stopped.stdout).toContain("MCP server stopped");

    // stop removes the claim and the server exits; status must not keep
    // answering for a pid file it no longer has.
    expect(existsSync(pidFile)).toBe(false);
    await waitFor(() => !isAlive(child.pid!), `server ${child.pid} to exit (stderr: ${log()})`);
    expect(runCli(["mcp", "status", "-d", dir]).stdout).toContain("Status: Not running");
  }, 60_000);

  it("reports Not running for a stale pid (dead process) and drops the file", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");

    // A pid that really existed and is really gone (see deadPid).
    const dead = { pid: deadPid() };

    writeFileSync(pidFile, String(dead.pid));

    const status = runCli(["mcp", "status", "-d", dir]);
    expect(status.status, status.stderr).toBe(0);
    expect(status.stdout).toContain("Status: Not running");
    expect(status.stdout, "a dead pid must never be reported as Running").not.toContain("Status: Running");
    expect(status.stdout).toContain(`stale PID ${dead.pid}`);

    // Stale state is dropped, so the next start/status begins from the truth.
    expect(existsSync(pidFile)).toBe(false);
  }, 60_000);

  it("HTTP mode publishes the port alongside the pid and clears both on stop", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");
    const portFile = join(dir, ".speclang", "mcp.port");
    const port = await freePort();
    const { child, log } = startMcp(["--remote", "--port", String(port)]);

    await waitFor(() => existsSync(pidFile) && existsSync(portFile), `mcp.pid+mcp.port (stderr: ${log()})`);
    expect(Number(readFileSync(pidFile, "utf-8").trim())).toBe(child.pid);
    expect(readFileSync(portFile, "utf-8").trim()).toBe(String(port));

    const status = runCli(["mcp", "status", "-d", dir]);
    expect(status.stdout).toContain(`Status: Running (PID ${child.pid})`);
    expect(status.stdout).toContain(`Port: ${port}`);

    runCli(["mcp", "stop", "-d", dir]);
    expect(existsSync(pidFile)).toBe(false);
    expect(existsSync(portFile)).toBe(false);
  }, 60_000);

  it("a start that fails after claiming releases the pid file", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");
    const portFile = join(dir, ".speclang", "mcp.port");
    const port = await freePort();

    // A state database that is not a SQLite database: the server's own
    // initDatabase() throws AFTER the pid was claimed, which is exactly the
    // failure path that must hand the claim back. A pid file surviving a start
    // that never came up would make `status` report a dead server as Running.
    writeFileSync(join(dir, ".speclang", "speclang.db"), randomBytes(4096));

    const { child, log } = startMcp(["--remote", "--port", String(port)]);
    await waitFor(
      () => child.exitCode !== null || child.signalCode !== null,
      `the failed start to exit (stderr: ${log()})`,
      20_000
    );
    expect(child.exitCode, `stderr: ${log()}`).not.toBe(0);
    expect(existsSync(pidFile), "pid file left behind by a failed start").toBe(false);
    expect(existsSync(portFile)).toBe(false);
    // `status` still refuses to answer for the unreadable DB (QA-SPECLANG-5-R6):
    // the point here is that it is failing on the DATABASE, not finding a pid.
    const status = runCli(["mcp", "status", "-d", dir]);
    expect(status.status).toBe(1);
    expect(status.stdout).not.toContain("Status: Running");
  }, 60_000);

  it("stop on a stale pid file clears the claim instead of failing", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");
    const portFile = join(dir, ".speclang", "mcp.port");

    writeFileSync(pidFile, String(deadPid()));
    // A port left next to a pid whose process is gone is stale too — `stop`
    // must not leave it behind for the next `status` to print.
    writeFileSync(portFile, "3000");

    const stopped = runCli(["mcp", "stop", "-d", dir]);
    expect(stopped.status, stopped.stderr).toBe(0);
    expect(stopped.stdout).toContain("MCP server not running (stale PID file removed)");
    expect(existsSync(pidFile)).toBe(false);
    expect(existsSync(portFile)).toBe(false);

    // Idempotent: the second stop has nothing to clear and still exits 0.
    const again = runCli(["mcp", "stop", "-d", dir]);
    expect(again.status, again.stderr).toBe(0);
    expect(again.stdout).toContain("MCP server not running");
  }, 60_000);

  it("an unreadable pid file is stale state, never a process to signal", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");
    writeFileSync(pidFile, "not-a-pid\n");

    const status = runCli(["mcp", "status", "-d", dir]);
    expect(status.status, status.stderr).toBe(0);
    expect(status.stdout).toContain("Status: Not running (unreadable PID file removed)");
    expect(status.stdout, "garbage must never be reported as Running").not.toContain("Status: Running");
    expect(existsSync(pidFile)).toBe(false);

    // Same file, `stop` side: nothing to signal, so nothing may be killed and
    // no uncaught error may escape (a thrown action would exit non-zero).
    writeFileSync(pidFile, "");
    const stopped = runCli(["mcp", "stop", "-d", dir]);
    expect(stopped.status, stopped.stderr).toBe(0);
    expect(stopped.stdout).toContain("MCP server not running (unreadable PID file removed)");
    expect(existsSync(pidFile)).toBe(false);
  }, 60_000);

  it("stdio start drops a port file left by an earlier HTTP run", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");
    const portFile = join(dir, ".speclang", "mcp.port");
    // Stale port with no live claim, as after a killed `--remote` server.
    writeFileSync(portFile, "3000");

    const { log } = startMcp();
    await waitFor(() => existsSync(pidFile), `mcp.pid to be written (stderr: ${log()})`);

    // A stdio server binds no port: reporting the previous run's port next to
    // this run's pid would be a second silent lie in the same report line.
    expect(existsSync(portFile), "stale port file survived a stdio start").toBe(false);
    const status = runCli(["mcp", "status", "-d", dir]);
    expect(status.stdout).toContain("Status: Running (PID ");
    expect(status.stdout).not.toContain("Port:");
  }, 60_000);

  it("the lifecycle repeats: start, stop, start publishes the new live pid", async () => {
    const pidFile = join(dir, ".speclang", "mcp.pid");

    const first = startMcp();
    await waitFor(() => existsSync(pidFile), "first mcp.pid");
    const firstPid = Number(readFileSync(pidFile, "utf-8").trim());
    expect(firstPid).toBe(first.child.pid);

    expect(runCli(["mcp", "stop", "-d", dir]).stdout).toContain("MCP server stopped");
    expect(existsSync(pidFile)).toBe(false);
    await waitFor(() => !isAlive(firstPid), `first server ${firstPid} to exit`);

    // The release path must have left the state dir usable: a second start has
    // to claim the same file again and be reported by pid, not by a leftover.
    const second = startMcp();
    await waitFor(() => existsSync(pidFile), `second mcp.pid (stderr: ${second.log()})`);
    const secondPid = Number(readFileSync(pidFile, "utf-8").trim());
    expect(secondPid).toBe(second.child.pid);
    expect(secondPid).not.toBe(firstPid);
    expect(isAlive(secondPid)).toBe(true);

    const status = runCli(["mcp", "status", "-d", dir]);
    expect(status.stdout).toContain(`Status: Running (PID ${secondPid})`);
  }, 60_000);
});
