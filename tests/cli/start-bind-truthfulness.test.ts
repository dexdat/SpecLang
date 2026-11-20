/**
 * Regression test for DF-SPECLANG-022: `speclang start` must verify its own bind
 * and report MCP truthfully.
 *
 * Reported defect: with port 3000 already owned by another listener, `start`
 * printed "SpecLang Daemon Started" plus "Dashboard: http://localhost:3000" and
 * kept running — the announced URL answered 401 from the OTHER process. Also
 * `mcp status` said "Not running" while the banner implied a watcher + MCP
 * server was up.
 *
 * The arms below drive the shipped CLI with the port occupied by a listener the
 * TEST owns (no fleet services, no DuckBrain):
 *   1. wildcard listener on the port → start exits non-zero, names the port and
 *      EADDRINUSE, and never claims a dashboard/started banner;
 *   2. a 401 stranger on the port (the reported shape) → same non-claim, and the
 *      stranger is not displaced or advertised for;
 *   3. a healthy start → the ANNOUNCED port answers /api/status 200, the banner
 *      says MCP is not started (`mcp status` agrees), and `stop` still tears the
 *      daemon down quickly with `status` reporting not running afterwards.
 *
 * ch:trace row=DF-SPECLANG-022 spec=specs/daemon.spec.dir wave=none:serial-worker test=tests/cli/start-bind-truthfulness.test.ts doc=README.md evidence=none:worker-local-until-foreman-verifies witness=none:worker-worktree verdict=none:foreman-must-run-judge commit=none:worker-commit memory=none:foreman-writes
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawn, execFile, type ChildProcess } from "child_process";
import { createServer as createNetServer, type Server as NetServer } from "net";
import { createServer as createHttpServer, request, type Server } from "http";
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
    const srv = createNetServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

/** Occupy a port with a listener the test owns (wildcard, like a real squatter). */
function occupyPort(): Promise<{ server: NetServer; port: number }> {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server, port });
    });
  });
}

/**
 * Occupy a port with an HTTP server that answers 401 — the exact shape the
 * defect reported ("the announced URL actually answers 401 from the OTHER
 * process").
 */
function occupyPortWith401(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = createHttpServer((_req, res) => {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server, port });
    });
  });
}

function runCli(
  args: string[],
  cwd: string,
  timeoutMs = 30_000,
): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    execFile(
      "node",
      [SPECLANG, ...args],
      { cwd, env: { ...process.env, NODE_OPTIONS: "" }, timeout: timeoutMs },
      (err, stdout, stderr) => {
        const exitCode =
          err && typeof (err as any).code === "number" ? (err as any).code : 0;
        resolve({
          stdout: stdout?.toString() ?? "",
          stderr: stderr?.toString() ?? "",
          exitCode,
          durationMs: Date.now() - startedAt,
        });
      },
    );
  });
}

function httpGet(
  port: number,
  urlPath: string,
  timeoutMs = 5_000,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", port, path: urlPath, timeout: timeoutMs },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`timeout GET ${urlPath} on ${port}`));
    });
    req.on("error", reject);
    req.end();
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

interface StartSession {
  output: () => string;
  exited: Promise<number | null>;
  child: ChildProcess;
}

function spawnStart(args: string[], sandbox: string): StartSession {
  let out = "";
  const child = spawn(process.execPath, [SPECLANG, "start", ...args, "-d", sandbox], {
    cwd: sandbox,
    env: { ...process.env, NODE_OPTIONS: "" },
  });
  child.stdout!.on("data", (d) => (out += d.toString()));
  child.stderr!.on("data", (d) => (out += d.toString()));
  const exited = new Promise<number | null>((resolve) =>
    child.on("exit", (code) => resolve(code)),
  );
  return { output: () => out, exited, child };
}

async function settle(
  exited: Promise<number | null>,
  timeoutMs: number,
): Promise<{ code: number | null } | { timedOut: true }> {
  return Promise.race([
    exited.then((code) => ({ code })),
    new Promise<{ timedOut: true }>((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), timeoutMs),
    ),
  ]);
}

describe.skipIf(!distBuilt)("DF-SPECLANG-022 start must verify its bind", () => {
  let sandbox = "";
  let liveChild: ChildProcess | null = null;
  let squatter: NetServer | Server | null = null;

  const newSandbox = () => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-df022-"));
    fs.mkdirpSync(path.join(sandbox, ".speclang"));
    return sandbox;
  };

  afterEach(async () => {
    if (sandbox) await runCli(["stop", "-d", sandbox], sandbox);
    if (liveChild && liveChild.exitCode === null && liveChild.signalCode === null) {
      try {
        liveChild.kill("SIGKILL");
      } catch {}
    }
    liveChild = null;
    if (squatter) {
      await new Promise<void>((resolve) => squatter!.close(() => resolve()));
      squatter = null;
    }
    if (sandbox) await fs.remove(sandbox);
    sandbox = "";
  });

  it(
    "a port taken by another listener → start exits non-zero, names the port, claims no dashboard",
    async () => {
      const dir = newSandbox();
      const occupied = await occupyPort();
      squatter = occupied.server;
      const port = occupied.port;

      const session = spawnStart(["--port", String(port)], dir);
      liveChild = session.child;

      const result = await settle(session.exited, 30_000);
      expect(result, `start kept running with port ${port} occupied`).not.toEqual({
        timedOut: true,
      });
      const code = (result as { code: number | null }).code;
      const out = session.output();

      expect(code).not.toBeNull();
      expect(code).not.toBe(0);
      // Names the port and the reason.
      expect(out).toMatch(/EADDRINUSE/);
      expect(out).toContain(String(port));
      // And never claims a dashboard it does not serve, nor a successful start.
      expect(out).not.toMatch(new RegExp(`Dashboard: http://localhost:${port}`));
      expect(out).not.toMatch(/Daemon Started/i);
      // A failed start must not leave a PID file behind claiming a live daemon.
      expect(fs.existsSync(path.join(dir, ".speclang", "daemon.pid"))).toBe(false);
      const status = await runCli(["status", "-d", dir], dir);
      expect(status.stdout).toMatch(/Daemon: Not running/);
    },
    60_000,
  );

  it(
    "a 401 stranger on the port → start never advertises or adopts that endpoint",
    async () => {
      const dir = newSandbox();
      const occupied = await occupyPortWith401();
      squatter = occupied.server;
      const port = occupied.port;

      const session = spawnStart(["--port", String(port)], dir);
      liveChild = session.child;

      const result = await settle(session.exited, 30_000);
      expect(result, `start kept running with a 401 stranger on port ${port}`).not.toEqual({
        timedOut: true,
      });
      const code = (result as { code: number | null }).code;
      const out = session.output();

      expect(code).not.toBe(0);
      expect(out).toContain(String(port));
      expect(out).toMatch(/EADDRINUSE|another process/i);
      expect(out).not.toMatch(new RegExp(`Dashboard: http://localhost:${port}`));
      expect(out).not.toMatch(/Daemon Started/i);

      // The stranger is still the one answering on the announced host: the
      // daemon must neither displace it nor speak for it.
      const probe = await httpGet(port, "/api/status");
      expect(probe.status).toBe(401);
    },
    60_000,
  );

  it(
    "a healthy start announces only a verified port: /api/status 200, MCP truth, fast stop",
    async () => {
      const dir = newSandbox();
      const port = await freePort();

      const session = spawnStart(["--port", String(port)], dir);
      liveChild = session.child;

      await waitFor(
        () => new RegExp(`Dashboard: http://localhost:${port}`).test(session.output()),
        30_000,
        "verified dashboard URL in start output",
      );

      // Acceptance 2: the announced URL answers. /api/status (not just a TCP
      // accept) proves the endpoint belongs to this daemon.
      const status = await httpGet(port, "/api/status");
      expect(status.status).toBe(200);
      expect(() => JSON.parse(status.body)).not.toThrow();

      const health = await httpGet(port, "/health");
      expect(health.status).toBe(200);
      const healthBody = JSON.parse(health.body);
      expect(healthBody.status).toBe("ok");
      expect(typeof healthBody.pid).toBe("number");

      // Acceptance 3: the banner stops calling `start` an MCP server, and says
      // where MCP actually comes from — matching what `mcp status` reports.
      await waitFor(() => /Daemon Started/i.test(session.output()), 15_000, "start banner");
      expect(session.output()).toMatch(/MCP: not started/);
      const mcpStatus = await runCli(["mcp", "status", "-d", dir], dir);
      expect(mcpStatus.exitCode).toBe(0);
      expect(mcpStatus.stdout).toMatch(/Status: Not running/);

      // Acceptance 4: stop still stops what start launched, and stays fast.
      const stop = await runCli(["stop", "-d", dir], dir);
      expect(stop.exitCode).toBe(0);
      expect(stop.durationMs).toBeLessThan(5_000);

      const exited = await settle(session.exited, 30_000);
      expect(exited).not.toEqual({ timedOut: true });
      expect((exited as { code: number | null }).code).toBe(0);

      const after = await runCli(["status", "-d", dir], dir);
      expect(after.stdout).toMatch(/Daemon: Not running/);
    },
    90_000,
  );
});

describe.skipIf(!distBuilt)("DF-SPECLANG-022 CLI/doc claims about `start`", () => {
  it("help text does not promise an MCP server from `start`", async () => {
    const help = await runCli(["--help"], REPO_ROOT);
    expect(help.exitCode).toBe(0);
    expect(help.stdout).not.toMatch(/file watcher \+ MCP server/i);

    // Commander wraps the global command list at the terminal width, so assert
    // the description on its own help screen where it is printed verbatim.
    const startHelp = await runCli(["start", "--help"], REPO_ROOT);
    expect(startHelp.exitCode).toBe(0);
    expect(startHelp.stdout).toMatch(/file watcher \+ dashboard/i);
    expect(startHelp.stdout).not.toMatch(/MCP server/i);
  });

  it("README and GETTING-STARTED do not claim `start` runs the MCP server", () => {
    for (const doc of ["README.md", "GETTING-STARTED.md"]) {
      const text = fs.readFileSync(path.join(REPO_ROOT, doc), "utf-8");
      expect(text, `${doc} still claims start = watcher + MCP`).not.toMatch(
        /watcher \+ MCP/i,
      );
    }
  });
});
