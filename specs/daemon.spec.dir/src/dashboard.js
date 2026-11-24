"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenDashboard = listenDashboard;
exports.probeDashboard = probeDashboard;
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
const http = __importStar(require("http"));
/**
 * Bind the dashboard and resolve only once the socket is listening.
 *
 * Rejects with the underlying error (EADDRINUSE for a taken port, EACCES for a
 * privileged one, ...) instead of leaving the caller to guess from silence.
 */
function listenDashboard(app, port) {
    return new Promise((resolve, reject) => {
        let server;
        try {
            server = app.listen(port);
        }
        catch (err) {
            reject(err);
            return;
        }
        const onError = (err) => {
            server.removeListener('listening', onListening);
            reject(err);
        };
        const onListening = () => {
            server.removeListener('error', onError);
            const address = server.address();
            const boundPort = address && typeof address === 'object' ? address.port : port;
            resolve({ server, port: boundPort });
        };
        server.once('error', onError);
        server.once('listening', onListening);
    });
}
/**
 * Ask the ANNOUNCED endpoint who it is.
 *
 * `ok` requires HTTP 200 from `/health` AND the PID this process wrote into the
 * response — a stranger answering 401, a proxy, or another SpecLang instance
 * all read false. Never throws: a failed probe is a reported result, not a
 * crash.
 */
function probeDashboard(port, expectedPid = process.pid, timeoutMs = 2_000) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled)
                return;
            settled = true;
            resolve(result);
        };
        const req = http.get({ host: '127.0.0.1', port, path: '/health', timeout: timeoutMs }, (res) => {
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
                let parsed = null;
                try {
                    parsed = JSON.parse(body);
                }
                catch {
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
        });
        req.on('timeout', () => {
            req.destroy();
            finish({ ok: false, detail: `probe of port ${port} timed out after ${timeoutMs}ms` });
        });
        req.on('error', (err) => {
            finish({ ok: false, detail: `probe of port ${port} failed: ${err.message}` });
        });
    });
}
//# sourceMappingURL=dashboard.js.map