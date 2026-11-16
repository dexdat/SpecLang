/**
 * Regression test for DF-SPECLANG-3-R5: `speclang start --no-dashboard` must not
 * advertise a dashboard it never serves.
 *
 * The `start` action printed `Dashboard: http://localhost:<port>` before the
 * daemon was even asked to start, so `--no-dashboard` (no HTTP server bound at
 * all) still handed the user a dead URL. The banner now follows the same flag
 * the daemon honours, and this test drives the shipped CLI both ways: no line
 * and no listener with `--no-dashboard`, URL plus a real listening socket
 * without it.
 *
 * ch:trace row=DF-SPECLANG-3-R5 spec=none:cli-banner wave=none:serial-worker test=tests/cli/start-dashboard-contract.test.ts doc=none:code-task evidence=none:worker-local-until-foreman-verifies witness=none:worker-worktree verdict=none:foreman-must-run-judge commit=none:worker-commit memory=none:foreman-writes
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawn, execFile, type ChildProcess } from "child_process";
import { createServer, connect } from "net";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SPECLANG = path.join(REPO_ROOT, "bin", "speclang");
const DIST_DAEMON = path.join(REPO_ROOT, "dist", "src", "daemon", "index.js");

// `bin/speclang start` loads the compiled daemon from dist/.
const distBuilt = fs.existsSync(DIST_DAEMON);

/** Reserve an ephemeral port and hand it back free for the daemon to bind. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

function isListening(port: number, timeoutMs = 1_000): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = connect({ host: "127.0.0.1", port });
    const done = (result: boolean) => {
      sock.destroy();
      resolve(result);
    };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once("connect", () => done(true));
    sock.once("error", () => done(false));
  });
}

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

async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs: number,
  what: string,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`timeout after ${timeoutMs}ms waiting for ${what}`);
}

describe.skipIf(!distBuilt)("DF-SPECLANG-3-R5 start banner ↔ dashboard listener", () => {
  let sandbox: string;
  let liveChild: ChildProcess | null = null;

  const startIn = async (args: string[]) => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-df3-"));
    fs.mkdirpSync(path.join(sandbox, ".speclang"));
    let out = "";
    const child = spawn(process.execPath, [SPECLANG, "start", ...args, "-d", sandbox], {
      cwd: sandbox,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    liveChild = child;
    child.stdout!.on("data", (d) => (out += d.toString()));
    child.stderr!.on("data", (d) => (out += d.toString()));
    const exited = new Promise<number | null>((resolve) =>
      child.on("exit", (code) => resolve(code)),
    );
    await waitFor(() => /Daemon Started/i.test(out), 30_000, "daemon start banner");
    return { out: () => out, exited, child };
  };

  const stopAndAwaitExit = async (exited: Promise<number | null>) => {
    const stop = await runCli(["stop", "-d", sandbox], sandbox);
    expect(stop.exitCode).toBe(0);
    const exitCode = await Promise.race([
      exited,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("daemon did not exit after stop")), 30_000),
      ),
    ]);
    expect(exitCode).toBe(0);
  };

  afterEach(async () => {
    if (sandbox) await runCli(["stop", "-d", sandbox], sandbox);
    if (liveChild && liveChild.exitCode === null && liveChild.signalCode === null) {
      try {
        liveChild.kill("SIGKILL");
      } catch {}
    }
    liveChild = null;
    if (sandbox) await fs.remove(sandbox);
  });

  it(
    "`--no-dashboard` prints no dashboard URL and binds no port",
    async () => {
      const port = await freePort();
      const { out, exited } = await startIn(["--no-dashboard", "--port", String(port)]);

      // The daemon has announced itself, so a buggy unconditional banner would
      // already be in the output by now.
      expect(out()).not.toMatch(new RegExp(`Dashboard: http://localhost:${port}`));
      expect(out()).toMatch(/Dashboard: disabled \(--no-dashboard\)/);

      // Nothing may be listening on that port — give a hypothetical listener a
      // moment to bind before calling it absent.
      await new Promise((r) => setTimeout(r, 750));
      expect(await isListening(port)).toBe(false);

      await stopAndAwaitExit(exited);
    },
    60_000,
  );

  it(
    "without the flag the URL is printed and the port really listens",
    async () => {
      const port = await freePort();
      const { out, exited } = await startIn(["--port", String(port)]);

      await waitFor(
        () => new RegExp(`Dashboard: http://localhost:${port}`).test(out()),
        15_000,
        "dashboard URL in start output",
      );
      expect(await isListening(port)).toBe(true);

      await stopAndAwaitExit(exited);
    },
    60_000,
  );
});
