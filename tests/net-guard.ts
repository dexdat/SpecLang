/**
 * QA-SPECLANG-4: a cut network must FAIL the run in seconds, not wedge it.
 *
 * The chaos condition is a process-wide proxy pointed at a dead endpoint
 * (`HTTP_PROXY=http://127.0.0.1:9 HTTPS_PROXY=... ALL_PROXY=...`). Tests in this
 * repository spawn child processes with `execSync`/`execFileSync`/`spawnSync`
 * (59 call sites, none of which pass a `timeout`), and a synchronous spawn
 * BLOCKS the worker's event loop — so vitest's own `testTimeout` can never fire
 * while a child waits on the unreachable network. The symptom is not a failure:
 * the run prints its `RUN` header and then sits until an external `timeout`
 * kills it (measured: `timeout 304` killed the suite on the QA agent while the
 * same suite finishes in ~137s normally). A CI job in that state cannot be
 * distinguished from a slow suite, and no test names the network as the reason.
 *
 * The preflight below removes the ambiguity: every configured proxy is
 * TCP-probed with a hard budget before a test file runs. If one answers nothing
 * changes. If none answers, the probe throws — the file is reported FAILED with
 * the exact endpoint named, and the run exits non-zero within a couple of
 * seconds instead of hanging.
 *
 * It is wired from `tests/setup-tmpdir.ts` (a `setupFiles` entry, so the failure
 * is counted in vitest's own test-file summary) rather than from the global
 * setup, because a global-setup throw prints no "N failed" line and a CI guard
 * that parses the summary would read the run as "never ran".
 *
 * Escape hatches, both deliberate:
 *   - a proxy host listed in NO_PROXY is not probed (tests that only talk to
 *     loopback can legitimately run behind a dead egress proxy);
 *   - SPECLANG_SKIP_NET_GUARD=1 skips the preflight entirely.
 */
import { connect, type Socket } from "net";

/**
 * Proxy variables probed, in reporting order. The lower-case spellings are the
 * curl/BSD convention and are honoured by the same consumers as the upper-case
 * ones, so a cut configured with either must be detected.
 */
export const PROXY_ENV_VARS = [
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
  "ALL_PROXY",
  "all_proxy",
] as const;

/** Hard per-endpoint budget for the TCP probe (overridable for slow hosts). */
export const DEFAULT_PROBE_TIMEOUT_MS = 2000;

/** Set to `1` to skip the preflight (documented escape hatch). */
export const NET_GUARD_SKIP_VAR = "SPECLANG_SKIP_NET_GUARD";

/** Overrides the per-endpoint probe budget in milliseconds. */
export const NET_GUARD_TIMEOUT_VAR = "SPECLANG_NET_PROBE_TIMEOUT_MS";

export interface ProxyEndpoint {
  /** Env var name(s) that configured this endpoint, e.g. ["HTTPS_PROXY"]. */
  sources: string[];
  /** Host the probe connects to. */
  host: string;
  /** Port the probe connects to. */
  port: number;
  /** The value as configured, for error messages. */
  raw: string;
}

export interface ProbeResult {
  ok: boolean;
  detail: string;
  elapsedMs: number;
}

export type Probe = (
  endpoint: ProxyEndpoint,
  timeoutMs: number,
) => Promise<ProbeResult>;

/**
 * Normalise a proxy env value into `{host, port}`. Accepts `http://host:port`,
 * `socks5://host:port`, credentials and paths (all ignored for the probe) and
 * the schemeless `host:port` spelling. Returns a reason string on failure so a
 * typo'd proxy is reported instead of silently disabling the guard.
 */
export function parseProxyEndpoint(
  raw: string,
): { host: string; port: number } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: "empty value" };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { error: "unparseable proxy URL" };
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host) return { error: "proxy URL has no host" };
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return { error: `proxy URL has an invalid port "${url.port}"` };
  }
  return { host, port };
}

/**
 * Collect the configured proxy endpoints, merging variables that resolve to the
 * same `host:port` so a cut configured on all three variables is probed once.
 * `parseErrors` carries variables that were set but could not be parsed.
 */
export function parseProxyEndpoints(env: NodeJS.ProcessEnv = process.env): {
  endpoints: ProxyEndpoint[];
  parseErrors: string[];
} {
  const endpoints: ProxyEndpoint[] = [];
  const parseErrors: string[] = [];
  const seen = new Map<string, ProxyEndpoint>();

  for (const name of PROXY_ENV_VARS) {
    const raw = env[name];
    if (raw === undefined || raw.trim() === "") continue;
    const parsed = parseProxyEndpoint(raw);
    if ("error" in parsed) {
      parseErrors.push(`${name}=${raw.trim()} (${parsed.error})`);
      continue;
    }
    const key = `${parsed.host.toLowerCase()}:${parsed.port}`;
    const existing = seen.get(key);
    if (existing) {
      existing.sources.push(name);
      continue;
    }
    const endpoint: ProxyEndpoint = {
      sources: [name],
      host: parsed.host,
      port: parsed.port,
      raw: raw.trim(),
    };
    seen.set(key, endpoint);
    endpoints.push(endpoint);
  }

  return { endpoints, parseErrors };
}

/**
 * True when NO_PROXY excludes `host`. Supports `*`, exact hosts, `host:port`
 * and domain suffixes with or without a leading dot or `*.`.
 */
export function isExcludedByNoProxy(host: string, noProxy: string): boolean {
  const target = host.toLowerCase();
  for (const raw of noProxy.split(/[,\s]+/)) {
    const entry = raw.trim().toLowerCase();
    if (!entry) continue;
    if (entry === "*") return true;
    const withoutPort = entry.replace(/:\d+$/, "");
    const bare = withoutPort.replace(/^\*\.?/, "").replace(/^\./, "");
    if (!bare) continue;
    if (target === bare) return true;
    if (target.endsWith(`.${bare}`)) return true;
  }
  return false;
}

/**
 * TCP-connect probe with a hard budget. Resolves (never rejects) so the caller
 * can report every failing endpoint in one message.
 */
export function probeProxy(
  endpoint: ProxyEndpoint,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ProbeResult> {
  const startedAt = Date.now();
  return new Promise<ProbeResult>((resolve) => {
    let socket: Socket | undefined;
    let settled = false;
    const finish = (ok: boolean, detail: string): void => {
      if (settled) return;
      settled = true;
      socket?.destroy();
      resolve({ ok, detail, elapsedMs: Date.now() - startedAt });
    };

    socket = connect({ host: endpoint.host, port: endpoint.port });
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true, "tcp connect accepted"));
    socket.once("timeout", () =>
      finish(false, `no answer within ${timeoutMs}ms`),
    );
    socket.once("error", (err: NodeJS.ErrnoException) =>
      finish(false, `${err.code ?? "ERR"}: ${err.message}`),
    );
  });
}

/**
 * Throw a single, readable `NETWORK-UNREACHABLE` error when any configured
 * proxy endpoint does not answer. Returns silently when every endpoint answers,
 * when nothing is configured, or when the escape hatches apply.
 */
export async function assertProxiesReachable(
  env: NodeJS.ProcessEnv = process.env,
  probe: Probe = probeProxy,
): Promise<void> {
  if (env[NET_GUARD_SKIP_VAR] === "1") return;

  const configuredTimeout = Number.parseInt(
    env[NET_GUARD_TIMEOUT_VAR] ?? "",
    10,
  );
  const timeoutMs =
    Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : DEFAULT_PROBE_TIMEOUT_MS;

  const noProxy = env.NO_PROXY ?? env.no_proxy ?? "";
  const { endpoints, parseErrors } = parseProxyEndpoints(env);
  const failures: string[] = parseErrors.map(
    (entry) => `${entry} — cannot be probed`,
  );

  for (const endpoint of endpoints) {
    if (isExcludedByNoProxy(endpoint.host, noProxy)) continue;
    const result = await probe(endpoint, timeoutMs);
    if (result.ok) continue;
    failures.push(
      `${endpoint.sources.join("/")}=${endpoint.raw} → ${result.detail} (${result.elapsedMs}ms)`,
    );
  }

  if (failures.length === 0) return;

  throw new Error(
    [
      "NETWORK-UNREACHABLE: a proxy is configured but nothing answered it — the network is cut.",
      ...failures.map((failure) => `  - ${failure}`),
      "Refusing to run the suite: spawned children (execSync) that wait on an unreachable",
      "proxy block the worker's event loop, so vitest's own timeouts can never fire and the run",
      "hangs with no failure report (QA-SPECLANG-4).",
      "If these tests do not need the network, unset the proxy variables or add the host to",
      `NO_PROXY; to skip this preflight deliberately set ${NET_GUARD_SKIP_VAR}=1.`,
    ].join("\n"),
  );
}
