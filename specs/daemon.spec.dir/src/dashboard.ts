/**
 * Dashboard listener + self-verification for `speclang start`.
 *
 * DF-SPECLANG-022: `start` used to announce `http://localhost:<port>` before the
 * HTTP server had bound anything, so with the port already owned by another
 * process the banner claimed a dashboard that answered 401 from the stranger,
 * and the daemon kept running as if it were serving. Two defects, one seam:
 *
 *  1. `app.listen(port, cb)` was fire-and-forget. An EADDRINUSE 'error' event
 *     never reached the caller, so the process could not tell "bound" from
 *     "port taken".
 *  2. Even a successful bind does not prove the ANNOUNCED URL reaches US. On
 *     Linux, a wildcard bind (`0.0.0.0:<port>`) can succeed while another
 *     process already holds `127.0.0.1:<port>`; connections to localhost then
 *     go to the stranger. So the listener is probed over HTTP on the announced
 *     host and must answer with this process's PID before anything is printed.
 *
 * Both helpers are exported so tests can drive them without a full daemon.
 */
import * as http from 'http';

/** Anything with express-shaped `listen()` — kept structural so tests can stub it. */
export interface Listenable {
  listen(port: number, callback?: () => void): http.Server;
}

export interface DashboardBinding {
  server: http.Server;
  /** The port actually bound (differs from the request only when 0 was asked for). */
  port: number;
}

/**
 * Bind the dashboard and resolve only once the socket is listening.
 *
 * Rejects with the underlying error (EADDRINUSE for a taken port, EACCES for a
 * privileged one, ...) instead of leaving the caller to guess from silence.
 */
export function listenDashboard(
  app: Listenable,
  port: number,
): Promise<DashboardBinding> {
  return new Promise<DashboardBinding>((resolve, reject) => {
    let server: http.Server;
    try {
      server = app.listen(port);
    } catch (err) {
      reject(err as Error);
      return;
    }

    const onError = (err: Error) => {
      server.removeListener('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      const address = server.address();
      const boundPort =
        address && typeof address === 'object' ? address.port : port;
      resolve({ server, port: boundPort });
    };

    server.once('error', onError);
    server.once('listening', onListening);
  });
}

export interface DashboardProbeResult {
  ok: boolean;
  /** Short human-readable reason, e.g. `HTTP 401` or `served by PID 4242`. */
  detail: string;
}

/**
 * Ask the ANNOUNCED endpoint who it is.
 *
 * `ok` requires HTTP 200 from `/health` AND the PID this process wrote into the
 * response — a stranger answering 401, a proxy, or another SpecLang instance
 * all read false. Never throws: a failed probe is a reported result, not a
 * crash.
 */
export function probeDashboard(
  port: number,
  expectedPid: number = process.pid,
  timeoutMs = 2_000,
): Promise<DashboardProbeResult> {
  return new Promise<DashboardProbeResult>((resolve) => {
    let settled = false;
    const finish = (result: DashboardProbeResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const req = http.get(
      { host: '127.0.0.1', port, path: '/health', timeout: timeoutMs },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            finish({ ok: false, detail: `HTTP ${res.statusCode} from port ${port}` });
            return;
          }
          let parsed: any = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            finish({ ok: false, detail: `non-JSON response from port ${port}` });
            return;
          }
          if (!parsed || typeof parsed.pid !== 'number') {
            finish({ ok: false, detail: `non-SpecLang response from port ${port}` });
            return;
          }
          if (parsed.pid !== expectedPid) {
            finish({
              ok: false,
              detail: `port ${port} is served by PID ${parsed.pid}, not this process (PID ${expectedPid})`,
            });
            return;
          }
          finish({ ok: true, detail: `HTTP 200 from PID ${parsed.pid}` });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy();
      finish({ ok: false, detail: `probe of port ${port} timed out after ${timeoutMs}ms` });
    });
    req.on('error', (err: NodeJS.ErrnoException) => {
      finish({ ok: false, detail: `probe of port ${port} failed: ${err.message}` });
    });
  });
}
