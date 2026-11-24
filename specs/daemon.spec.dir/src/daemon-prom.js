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
exports.renderDaemonProm = renderDaemonProm;
exports.writeDaemonPromMetrics = writeDaemonPromMetrics;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const STATUS_CODES = {
    idle: 0,
    cascading: 1,
    converged: 2,
    paused: 3,
    error: 4,
};
function renderDaemonProm(metrics, now = Date.now()) {
    const statusCode = STATUS_CODES[metrics.status];
    if (statusCode === undefined) {
        throw new Error(`Unknown daemon status: ${metrics.status}`);
    }
    // Preserve millisecond precision so two events in one second remain visible.
    const lastEventSeconds = (metrics.lastEventAt ?? now) / 1000;
    return [
        '# HELP speclang_daemon_up Whether the SpecLang daemon is running.',
        '# TYPE speclang_daemon_up gauge',
        `speclang_daemon_up ${metrics.up ? 1 : 0}`,
        '# HELP speclang_daemon_status Current daemon status (idle=0, cascading=1, converged=2, paused=3, error=4).',
        '# TYPE speclang_daemon_status gauge',
        `speclang_daemon_status ${statusCode}`,
        '# HELP speclang_daemon_last_event_timestamp_seconds Unix timestamp of the last daemon event.',
        '# TYPE speclang_daemon_last_event_timestamp_seconds gauge',
        `speclang_daemon_last_event_timestamp_seconds ${lastEventSeconds}`,
        '# HELP speclang_daemon_errors_total Total pipeline execution errors.',
        '# TYPE speclang_daemon_errors_total counter',
        `speclang_daemon_errors_total ${Math.max(0, Math.floor(metrics.errors))}`,
        '',
    ].join('\n');
}
/** Write to a same-directory temporary file, then atomically replace the target. */
const pendingWrites = new Map();
async function writeDaemonPromMetrics(projectDir, metrics, now = Date.now(), renameFile = fs.rename) {
    const directory = path.join(projectDir, '.speclang');
    const target = path.join(directory, 'daemon.prom');
    const previous = pendingWrites.get(target) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(async () => {
        const temporary = path.join(directory, `.daemon.prom.${process.pid}.${(0, crypto_1.randomUUID)()}.tmp`);
        await fs.mkdir(directory, { recursive: true });
        try {
            await fs.writeFile(temporary, renderDaemonProm(metrics, now), { encoding: 'utf8', flag: 'wx' });
            await renameFile(temporary, target);
        }
        finally {
            await fs.rm(temporary, { force: true });
        }
    });
    pendingWrites.set(target, current);
    try {
        await current;
    }
    finally {
        if (pendingWrites.get(target) === current)
            pendingWrites.delete(target);
    }
}
//# sourceMappingURL=daemon-prom.js.map