/**
 * QA-SPECLANG-4: the network-cut preflight in tests/net-guard.ts.
 *
 * The defect this guards against: with a process-wide proxy pointed at a dead
 * endpoint, the suite neither finished nor failed — `timeout 300` killed it
 * while the same suite finishes in ~137s normally. Nothing in the run named the
 * reason, so a CI or hang guard could not tell "slow" from "wedged".
 *
 * The preflight probes every configured proxy over TCP with a hard budget and
 * fails the run in seconds, naming the endpoint. These tests pin that contract:
 * parsing/normalising, NO_PROXY handling, the probe itself, the aggregate
 * decision, and the wiring into the vitest `setupFiles` entry (the seam vitest
 * actually executes before every test file).
 *
 * Every case here is hermetic: the "live proxy" is a loopback listener the test
 * binds itself, and the "dead proxy" is a closed loopback port, so the suite
 * does not depend on outbound network access.
 */
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { createServer, type AddressInfo, type Server } from "net";
import {
  assertProxiesReachable,
  isExcludedByNoProxy,
  parseProxyEndpoint,
  parseProxyEndpoints,
  probeProxy,
  DEFAULT_PROBE_TIMEOUT_MS,
  NET_GUARD_SKIP_VAR,
  NET_GUARD_TIMEOUT_VAR,
  type ProbeResult,
  type ProxyEndpoint,
} from "./net-guard";

const PROXY_VARS = [
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
  "ALL_PROXY",
  "all_proxy",
  "NO_PROXY",
  "no_proxy",
  NET_GUARD_SKIP_VAR,
  NET_GUARD_TIMEOUT_VAR,
];

const savedEnv: Record<string, string | undefined> = {};
for (const name of PROXY_VARS) savedEnv[name] = process.env[name];

function clearProxyEnv(): void {
  for (const name of PROXY_VARS) delete process.env[name];
}

afterEach(() => {
  for (const name of PROXY_VARS) {
    if (savedEnv[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnv[name];
  }
});

/** Bind a loopback TCP listener (the "proxy is up" arm) and return its port. */
async function startListener(): Promise<{ server: Server; port: number }> {
  const server = createServer((socket) => socket.destroy());
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { server, port };
}

/** A loopback port with nothing listening (the "network is cut" arm). */
async function findClosedPort(): Promise<number> {
  const { server, port } = await startListener();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

describe("QA-SPECLANG-4: net guard — proxy endpoint parsing", () => {
  it("parses a full proxy URL", () => {
    expect(parseProxyEndpoint("http://127.0.0.1:9")).toEqual({
      host: "127.0.0.1",
      port: 9,
    });
  });

  it("parses the schemeless host:port spelling", () => {
    expect(parseProxyEndpoint("proxy.internal:3128")).toEqual({
      host: "proxy.internal",
      port: 3128,
    });
  });

  it("accepts socks proxies and drops credentials and paths", () => {
    expect(
      parseProxyEndpoint("socks5://user:pass@proxy.internal:1080/ignored"),
    ).toEqual({ host: "proxy.internal", port: 1080 });
  });

  it("defaults the port from the scheme", () => {
    expect(parseProxyEndpoint("http://proxy.internal")).toEqual({
      host: "proxy.internal",
      port: 80,
    });
    expect(parseProxyEndpoint("https://proxy.internal")).toEqual({
      host: "proxy.internal",
      port: 443,
    });
  });

  it("reports an unparseable value instead of silently disabling the guard", () => {
    const parsed = parseProxyEndpoint("http://");
    expect("error" in parsed).toBe(true);
  });

  it("reports an empty value", () => {
    const parsed = parseProxyEndpoint("   ");
    expect("error" in parsed).toBe(true);
  });
});

describe("QA-SPECLANG-4: net guard — endpoint collection", () => {
  it("merges variables that resolve to the same host:port", () => {
    const { endpoints } = parseProxyEndpoints({
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      ALL_PROXY: "http://127.0.0.1:9",
    });
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].port).toBe(9);
    expect(endpoints[0].sources).toEqual([
      "HTTPS_PROXY",
      "HTTP_PROXY",
      "ALL_PROXY",
    ]);
  });

  it("keeps distinct endpoints apart and honours lower-case spellings", () => {
    const { endpoints } = parseProxyEndpoints({
      HTTPS_PROXY: "http://127.0.0.1:9",
      https_proxy: "http://127.0.0.1:10",
    });
    expect(endpoints.map((endpoint) => endpoint.port).sort()).toEqual([10, 9]);
  });

  it("ignores empty variables", () => {
    const { endpoints, parseErrors } = parseProxyEndpoints({
      HTTP_PROXY: "",
      HTTPS_PROXY: "   ",
    });
    expect(endpoints).toHaveLength(0);
    expect(parseErrors).toHaveLength(0);
  });

  it("collects parse errors", () => {
    const { parseErrors } = parseProxyEndpoints({ HTTP_PROXY: "http://" });
    expect(parseErrors).toHaveLength(1);
    expect(parseErrors[0]).toContain("HTTP_PROXY");
  });
});

describe("QA-SPECLANG-4: net guard — NO_PROXY matching", () => {
  it("matches the wildcard", () => {
    expect(isExcludedByNoProxy("anything.example", "*")).toBe(true);
  });

  it("matches an exact host and a host:port entry", () => {
    expect(isExcludedByNoProxy("127.0.0.1", "127.0.0.1")).toBe(true);
    expect(isExcludedByNoProxy("127.0.0.1", "localhost,127.0.0.1:8080")).toBe(
      true,
    );
  });

  it("matches a domain suffix with a leading dot or wildcard", () => {
    expect(isExcludedByNoProxy("api.corp.example", ".corp.example")).toBe(true);
    expect(isExcludedByNoProxy("api.corp.example", "*.corp.example")).toBe(
      true,
    );
  });

  it("does not match a partial label", () => {
    expect(isExcludedByNoProxy("notcorp.example", "corp.example")).toBe(false);
    expect(isExcludedByNoProxy("corp.example", "api.corp.example")).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(isExcludedByNoProxy("proxy.internal", "")).toBe(false);
  });
});

describe("QA-SPECLANG-4: net guard — TCP probe", () => {
  it("reports a listening endpoint as reachable", async () => {
    const { server, port } = await startListener();
    try {
      const result = await probeProxy(
        { sources: ["HTTP_PROXY"], host: "127.0.0.1", port, raw: `:${port}` },
        2000,
      );
      expect(result.ok, JSON.stringify(result)).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("reports a closed endpoint as unreachable, quickly and by error name", async () => {
    const port = await findClosedPort();
    const startedAt = Date.now();
    const result = await probeProxy(
      { sources: ["ALL_PROXY"], host: "127.0.0.1", port, raw: `:${port}` },
      2000,
    );
    const elapsedMs = Date.now() - startedAt;
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/ECONNREFUSED|ERR|no answer/);
    // A refused loopback connect is immediate; a wedged probe would sit for the
    // full 2000ms budget and this bound would catch a regression to "hang".
    expect(elapsedMs).toBeLessThan(1500);
  });
});

describe("QA-SPECLANG-4: net guard — aggregate decision", () => {
  it("throws NETWORK-UNREACHABLE naming the endpoint when the proxy is dead", async () => {
    const port = await findClosedPort();
    await expect(
      assertProxiesReachable({
        HTTP_PROXY: `http://127.0.0.1:${port}`,
        HTTPS_PROXY: `http://127.0.0.1:${port}`,
        ALL_PROXY: `http://127.0.0.1:${port}`,
      }),
    ).rejects.toThrow(/NETWORK-UNREACHABLE[\s\S]*HTTP_PROXY[\s\S]*127\.0\.0\.1/);
  });

  it("passes when the proxy answers", async () => {
    const { server, port } = await startListener();
    try {
      await expect(
        assertProxiesReachable({
          HTTPS_PROXY: `http://127.0.0.1:${port}`,
        }),
      ).resolves.toBeUndefined();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("passes when nothing is configured", async () => {
    await expect(assertProxiesReachable({})).resolves.toBeUndefined();
  });

  it("does not probe an endpoint excluded by NO_PROXY", async () => {
    let probed = 0;
    await expect(
      assertProxiesReachable(
        {
          HTTP_PROXY: "http://proxy.internal:3128",
          NO_PROXY: "proxy.internal",
        },
        async (): Promise<ProbeResult> => {
          probed += 1;
          return { ok: false, detail: "should not be called", elapsedMs: 0 };
        },
      ),
    ).resolves.toBeUndefined();
    expect(probed).toBe(0);
  });

  it("honours the documented skip switch", async () => {
    await expect(
      assertProxiesReachable({
        HTTP_PROXY: "http://127.0.0.1:9",
        [NET_GUARD_SKIP_VAR]: "1",
      }),
    ).resolves.toBeUndefined();
  });

  it("uses the probe budget from the environment", async () => {
    const budgets: number[] = [];
    await assertProxiesReachable(
      {
        HTTP_PROXY: "http://proxy.internal:3128",
        [NET_GUARD_TIMEOUT_VAR]: "250",
      },
      async (
        _endpoint: ProxyEndpoint,
        timeoutMs: number,
      ): Promise<ProbeResult> => {
        budgets.push(timeoutMs);
        return { ok: true, detail: "stub", elapsedMs: 0 };
      },
    );
    expect(budgets).toEqual([250]);
  });
});

describe("QA-SPECLANG-4: net guard — wired into the vitest setupFiles seam", () => {
  const repoRoot = join(__dirname, "..");

  it("tests/setup-tmpdir.ts awaits the preflight", () => {
    const setupFile = readFileSync(join(repoRoot, "tests", "setup-tmpdir.ts"), "utf8");
    // The import is what pulls the guard into every worker.
    expect(setupFile).toMatch(/from\s+["']\.\/net-guard["']/);
    // And it must be awaited at module scope, i.e. before any test body runs.
    expect(setupFile).toMatch(/^\s*await\s+assertProxiesReachable\(\);/m);
  });

  it("vitest.config.ts registers the setup file and bounded budgets", () => {
    const config = readFileSync(join(repoRoot, "vitest.config.ts"), "utf8");
    expect(config).toMatch(/setupFiles:\s*\[[^\]]*tests\/setup-tmpdir\.ts/);
    expect(config).toMatch(/globalSetup:\s*\[[^\]]*tests\/global-setup\.ts/);
    // QA-SPECLANG-4: explicit budgets so a stuck test/hook/teardown is reported
    // instead of wedging the run.
    expect(config).toMatch(/testTimeout:\s*\d+/);
    expect(config).toMatch(/hookTimeout:\s*\d+/);
    expect(config).toMatch(/teardownTimeout:\s*\d+/);
  });

  it("documents a bounded default budget", () => {
    // A budget in the hundreds of milliseconds is what makes the guard "fail
    // fast"; a multi-second default would eat the CI window it protects.
    expect(DEFAULT_PROBE_TIMEOUT_MS).toBeLessThanOrEqual(3000);
  });

  it("setup() is still the TMPDIR redirect the suite depends on", async () => {
    const { setup } = await import("./global-setup");
    clearProxyEnv();
    setup();
    expect(process.env.TMPDIR).toBe(`${process.cwd()}/.tmp`);
  });
});
