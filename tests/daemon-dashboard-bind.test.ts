/**
 * Unit test for DF-SPECLANG-022: the dashboard bind/probe seam.
 *
 * `speclang start` used `app.listen(port, cb)` fire-and-forget, so an occupied
 * port produced no signal at all and the CLI announced a URL owned by another
 * process. `listenDashboard` awaits the 'listening' event and surfaces
 * EADDRINUSE; `probeDashboard` asks the ANNOUNCED endpoint to identify itself
 * (HTTP 200 + this PID) so a stranger answering 401, or another SpecLang
 * instance, can never be advertised as ours.
 */
import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "net";
import { createServer as createHttpServer, type Server as HttpServer } from "http";
import { listenDashboard, probeDashboard } from "../src/daemon/dashboard";

/** Minimal express-shaped app: `listen(port)` returns a net/http server. */
const fakeApp = {
  listen(port: number, _callback?: () => void) {
    const server = createHttpServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", pid: process.pid }));
    });
    server.listen(port);
    return server;
  },
};

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

describe("listenDashboard (DF-SPECLANG-022)", () => {
  let blocker: Server | null = null;
  let httpServer: HttpServer | null = null;

  afterEach(async () => {
    if (blocker) {
      await new Promise<void>((resolve) => blocker!.close(() => resolve()));
      blocker = null;
    }
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
      httpServer = null;
    }
  });

  it("rejects with EADDRINUSE instead of silently never binding", async () => {
    const occupied = await new Promise<{ server: Server; port: number }>(
      (resolve, reject) => {
        const server = createServer();
        server.once("error", reject);
        server.listen(0, () => {
          const addr = server.address();
          resolve({
            server,
            port: typeof addr === "object" && addr ? addr.port : 0,
          });
        });
      },
    );
    blocker = occupied.server;

    let caught: NodeJS.ErrnoException | null = null;
    try {
      await listenDashboard(fakeApp, occupied.port);
    } catch (err) {
      caught = err as NodeJS.ErrnoException;
    }

    expect(caught).not.toBeNull();
    expect(caught!.code).toBe("EADDRINUSE");
  });

  it("resolves with the bound port once the socket is listening", async () => {
    const port = await freePort();
    const binding = await listenDashboard(fakeApp, port);
    httpServer = binding.server as unknown as HttpServer;
    expect(binding.port).toBe(port);
    expect(binding.server.listening).toBe(true);
  });
});

describe("probeDashboard (DF-SPECLANG-022)", () => {
  let stranger: HttpServer | null = null;

  afterEach(async () => {
    if (stranger) {
      await new Promise<void>((resolve) => stranger!.close(() => resolve()));
      stranger = null;
    }
  });

  const serve = (
    handler: Parameters<typeof createHttpServer>[1],
  ): Promise<number> =>
    new Promise((resolve, reject) => {
      const server = createHttpServer(handler);
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        stranger = server;
        resolve(typeof addr === "object" && addr ? addr.port : 0);
      });
    });

  it("accepts OUR endpoint (HTTP 200 carrying this PID)", async () => {
    const port = await serve((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", pid: process.pid }));
    });

    const result = await probeDashboard(port);
    expect(result.ok).toBe(true);
    expect(result.detail).toContain(String(process.pid));
  });

  it("rejects the reported shape: a 401 from the OTHER process", async () => {
    const port = await serve((_req, res) => {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
    });

    const result = await probeDashboard(port);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("HTTP 401");
    expect(result.detail).toContain(String(port));
  });

  it("rejects a SpecLang-looking endpoint owned by another PID", async () => {
    const port = await serve((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", pid: process.pid + 1 }));
    });

    const result = await probeDashboard(port);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("served by PID");
  });

  it("reports a dead port instead of throwing", async () => {
    const port = await freePort();
    const result = await probeDashboard(port, process.pid, 1_000);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain(`port ${port}`);
  });
});
