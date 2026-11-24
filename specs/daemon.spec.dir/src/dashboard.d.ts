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
export declare function listenDashboard(app: Listenable, port: number): Promise<DashboardBinding>;
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
export declare function probeDashboard(port: number, expectedPid?: number, timeoutMs?: number): Promise<DashboardProbeResult>;
//# sourceMappingURL=dashboard.d.ts.map