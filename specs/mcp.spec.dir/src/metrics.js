"use strict";
/**
 * SPECLANG-GENERATED: MCP Server Prometheus Metrics
 * Source: @speclang/mcp
 *
 * Dependency-free Prometheus text-exposition (version 0.0.4) registry for the
 * MCP HTTP server's public `/metrics` scrape endpoint.
 *
 * Tier-1 families (see specs/ui.spec.dir/components/system-metrics.spec.md —
 * SystemMetricsPanel: cpu, memory, disk, network) are all emitted, plus host
 * uptime and process-level self-observation series.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsRegistry = exports.PROMETHEUS_CONTENT_TYPE = void 0;
exports.collectMetrics = collectMetrics;
exports.renderMetrics = renderMetrics;
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const process_1 = __importDefault(require("process"));
const metrics_ledger_1 = require("../../pipeline.spec.dir/src/metrics-ledger");
/** Exact Content-Type Prometheus expects for the text exposition format. */
exports.PROMETHEUS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8';
/** Server version reported by `speclang_server_info` (matches MCP serverInfo). */
const SERVER_VERSION = '1.0.0';
/**
 * Render a numeric sample the way the text exposition format expects.
 * Non-finite values have dedicated spellings; everything else is emitted in
 * plain decimal (Prometheus accepts exponent notation for large magnitudes).
 */
function formatValue(value) {
    if (Number.isNaN(value))
        return 'NaN';
    if (value === Infinity)
        return '+Inf';
    if (value === -Infinity)
        return '-Inf';
    if (!Number.isFinite(value))
        return 'NaN';
    return String(value);
}
/**
 * Escape a label value: backslash, double quote and line feed are the only
 * characters the format requires escaping.
 */
function escapeLabelValue(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
}
/**
 * Render a label set as `{k="v",k2="v2"}`, or '' when there is nothing to
 * render. Keys are sorted so output is stable scrape-to-scrape.
 */
function renderLabels(labels) {
    if (!labels)
        return '';
    const keys = Object.keys(labels).sort();
    if (keys.length === 0)
        return '';
    const pairs = keys.map(key => `${key}="${escapeLabelValue(String(labels[key]))}"`);
    return `{${pairs.join(',')}}`;
}
/**
 * A tiny metrics registry that renders Prometheus text exposition.
 *
 * Families are declared with HELP/TYPE and accumulate samples; rendering is
 * deterministic (families and label keys sorted) and always ends with exactly
 * one trailing LF, so repeated scrapes diff cleanly.
 */
class MetricsRegistry {
    families = new Map();
    /**
     * Add one sample to a family, declaring the family on first use.
     * A repeated declaration with a different help/type is a programming error,
     * so the first declaration wins (and stays stable in the output).
     */
    add(name, help, type, value, labels) {
        let family = this.families.get(name);
        if (!family) {
            family = { name, help, type, samples: [] };
            this.families.set(name, family);
        }
        family.samples.push(labels ? { labels, value } : { value });
    }
    /** Convenience for a family with a single unlabelled sample. */
    set(name, help, type, value) {
        this.add(name, help, type, value);
    }
    /**
     * Declare a family without a sample, so HELP/TYPE appear in the scrape even
     * when nothing has been observed yet (a fresh install, or a counter whose
     * label values are only known once work happens). Prometheus accepts a family
     * with no series; it simply has no samples to select.
     */
    declare(name, help, type) {
        if (this.families.has(name))
            return;
        this.families.set(name, { name, help, type, samples: [] });
    }
    /** Snapshot of the declared families (sorted by name). */
    getFamilies() {
        return [...this.families.values()].sort((a, b) => a.name.localeCompare(b.name));
    }
    /** Render the whole registry in Prometheus text exposition format. */
    render() {
        const lines = [];
        for (const family of this.getFamilies()) {
            lines.push(`# HELP ${family.name} ${family.help}`);
            lines.push(`# TYPE ${family.name} ${family.type}`);
            for (const sample of family.samples) {
                lines.push(`${family.name}${renderLabels(sample.labels)} ${formatValue(sample.value)}`);
            }
        }
        return lines.length > 0 ? `${lines.join('\n')}\n` : '';
    }
}
exports.MetricsRegistry = MetricsRegistry;
/** Aggregate CPU utilisation since boot as a percentage (0-100). */
function cpuUsagePercent() {
    let idle = 0;
    let total = 0;
    for (const cpu of os_1.default.cpus()) {
        for (const type of Object.keys(cpu.times)) {
            total += cpu.times[type];
        }
        idle += cpu.times.idle;
    }
    if (total <= 0)
        return 0;
    return Math.round((1 - idle / total) * 10000) / 100;
}
/**
 * Read per-interface byte counters from /proc/net/dev (Linux). Returns null on
 * any other platform or if the file cannot be read — the caller reports the
 * collector as unavailable rather than inventing zeros.
 */
function readLinuxNetworkTotals() {
    let raw;
    try {
        raw = fs_1.default.readFileSync('/proc/net/dev', 'utf-8');
    }
    catch {
        return null;
    }
    const totals = [];
    for (const line of raw.split('\n')) {
        const match = /^\s*([^:]+):\s*(.+)$/.exec(line);
        if (!match)
            continue;
        const iface = match[1].trim();
        const fields = match[2].trim().split(/\s+/);
        // Layout after the interface name: rx bytes is field 0, tx bytes field 8.
        if (fields.length < 9)
            continue;
        const receivedBytes = Number(fields[0]);
        const transmittedBytes = Number(fields[8]);
        if (!Number.isFinite(receivedBytes) || !Number.isFinite(transmittedBytes))
            continue;
        totals.push({ interface: iface, receivedBytes, transmittedBytes });
    }
    return totals;
}
/**
 * Disk capacity for the filesystem backing `path`. Uses fs.statfsSync (Node
 * >= 18.15); returns null when the platform or runtime cannot answer.
 */
function readDiskTotals(path) {
    const statfsSync = fs_1.default.statfsSync;
    if (typeof statfsSync !== 'function')
        return null;
    try {
        const stats = statfsSync(path);
        const blockSize = Number(stats.bsize);
        return {
            path,
            totalBytes: Number(stats.blocks) * blockSize,
            freeBytes: Number(stats.bfree) * blockSize,
            availableBytes: Number(stats.bavail) * blockSize
        };
    }
    catch {
        return null;
    }
}
/**
 * Build a registry populated with the current Tier-1 system families plus
 * process and uptime series. Called per scrape — all values are point-in-time
 * reads, so the endpoint never serves stale numbers.
 *
 * OBS-2: pipeline outcome counters live in a cross-process ledger (the pipeline
 * runs under the daemon, the scrape is served here), so they are declared
 * unconditionally and filled from `ledgerPath` — `$SPECLANG_METRICS_LEDGER`
 * when set, else `<cwd>/.speclang/metrics-outcomes.json`.
 */
function collectMetrics(diskPath = process_1.default.cwd(), ledgerPath) {
    const registry = new MetricsRegistry();
    const memoryTotal = os_1.default.totalmem();
    const memoryFree = os_1.default.freemem();
    const memoryUsed = memoryTotal - memoryFree;
    // --- cpu -----------------------------------------------------------------
    registry.set('speclang_cpu_usage_percent', 'Aggregate CPU utilisation since boot, as a percentage (1 - idle/total ticks).', 'gauge', cpuUsagePercent());
    registry.set('speclang_cpu_cores', 'Number of logical CPU cores visible to the process.', 'gauge', os_1.default.cpus().length);
    const [load1, load5, load15] = os_1.default.loadavg();
    registry.add('speclang_cpu_load_average', 'System load average over 1m, 5m and 15m (zeros on platforms without loadavg).', 'gauge', load1, { period: '1m' });
    registry.add('speclang_cpu_load_average', 'System load average over 1m, 5m and 15m (zeros on platforms without loadavg).', 'gauge', load5, { period: '5m' });
    registry.add('speclang_cpu_load_average', 'System load average over 1m, 5m and 15m (zeros on platforms without loadavg).', 'gauge', load15, { period: '15m' });
    // --- memory --------------------------------------------------------------
    registry.set('speclang_memory_total_bytes', 'Total physical memory in bytes.', 'gauge', memoryTotal);
    registry.set('speclang_memory_free_bytes', 'Free physical memory in bytes.', 'gauge', memoryFree);
    registry.set('speclang_memory_used_bytes', 'Used physical memory in bytes (total - free).', 'gauge', memoryUsed);
    registry.set('speclang_memory_used_percent', 'Used physical memory as a percentage of total.', 'gauge', memoryTotal > 0 ? Math.round((memoryUsed / memoryTotal) * 10000) / 100 : 0);
    // --- disk ----------------------------------------------------------------
    const disk = readDiskTotals(diskPath);
    if (disk) {
        const usedBytes = disk.totalBytes - disk.freeBytes;
        registry.add('speclang_disk_total_bytes', 'Filesystem capacity in bytes.', 'gauge', disk.totalBytes, {
            path: disk.path
        });
        registry.add('speclang_disk_free_bytes', 'Filesystem free bytes (including root-reserved).', 'gauge', disk.freeBytes, {
            path: disk.path
        });
        registry.add('speclang_disk_available_bytes', 'Filesystem bytes available to unprivileged users.', 'gauge', disk.availableBytes, { path: disk.path });
        registry.add('speclang_disk_used_bytes', 'Filesystem used bytes (total - free).', 'gauge', usedBytes, {
            path: disk.path
        });
        registry.add('speclang_disk_used_percent', 'Filesystem used capacity as a percentage of total.', 'gauge', disk.totalBytes > 0 ? Math.round((usedBytes / disk.totalBytes) * 10000) / 100 : 0, { path: disk.path });
        registry.set('speclang_disk_collector_available', 'Whether the disk collector could read capacity (1) or not (0).', 'gauge', 1);
    }
    else {
        // Never fabricate a capacity reading: declare the family and report the
        // collector as unavailable instead.
        registry.set('speclang_disk_collector_available', 'Whether the disk collector could read capacity (1) or not (0).', 'gauge', 0);
    }
    // --- network -------------------------------------------------------------
    const network = readLinuxNetworkTotals();
    if (network && network.length > 0) {
        for (const iface of network) {
            registry.add('speclang_network_receive_bytes_total', 'Bytes received per network interface since boot.', 'counter', iface.receivedBytes, { interface: iface.interface });
            registry.add('speclang_network_transmit_bytes_total', 'Bytes transmitted per network interface since boot.', 'counter', iface.transmittedBytes, { interface: iface.interface });
        }
        registry.set('speclang_network_collector_available', 'Whether the network collector could read interface counters (1) or not (0).', 'gauge', 1);
    }
    else {
        registry.set('speclang_network_collector_available', 'Whether the network collector could read interface counters (1) or not (0).', 'gauge', 0);
    }
    // --- uptime / self-observation ------------------------------------------
    registry.set('speclang_uptime_seconds', 'Host uptime in seconds.', 'gauge', os_1.default.uptime());
    const usage = process_1.default.cpuUsage();
    registry.set('speclang_process_uptime_seconds', 'Seconds since this process started.', 'gauge', Math.round(process_1.default.uptime() * 1000) / 1000);
    registry.set('speclang_process_resident_memory_bytes', 'Resident set size of the server process in bytes.', 'gauge', process_1.default.memoryUsage().rss);
    registry.set('speclang_process_heap_used_bytes', 'V8 heap currently used by the server process in bytes.', 'gauge', process_1.default.memoryUsage().heapUsed);
    registry.set('speclang_process_cpu_user_seconds_total', 'Total user CPU time consumed by the server process in seconds.', 'counter', usage.user / 1e6);
    registry.set('speclang_process_cpu_system_seconds_total', 'Total system CPU time consumed by the server process in seconds.', 'counter', usage.system / 1e6);
    registry.add('speclang_server_info', 'Static server identity (always 1).', 'gauge', 1, {
        version: SERVER_VERSION,
        runtime: 'mcp-http'
    });
    // --- pipeline outcomes (OBS-2) ------------------------------------------
    collectPipelineOutcomes(registry, ledgerPath);
    return registry;
}
/**
 * Declare the pipeline outcome families and fill them from the cross-process
 * ledger.
 *
 * The three counters are declared unconditionally: their label values only
 * exist once a pipeline actually ran, and a scrape of a fresh install must still
 * expose (and document) the families. A ledger that cannot be read is not an
 * error — it is the zero state, already implied by the declarations.
 */
function collectPipelineOutcomes(registry, ledgerPath) {
    registry.declare(metrics_ledger_1.STAGE_RESULTS_FAMILY, 'Pipeline stage executions by stage and terminal status (success, failure, skipped).', 'counter');
    registry.declare(metrics_ledger_1.RECOVERY_FAMILY, 'Recovery actions executed after a stage failure, by outcome (succeeded, failed).', 'counter');
    registry.declare(metrics_ledger_1.CONVERGENCE_FAMILY, 'Convergence outcomes observed by the pipeline executor, by outcome (converged, not_converged).', 'counter');
    registry.declare(metrics_ledger_1.STAGE_DURATION_FAMILY, 'Duration in seconds of the most recent execution of each pipeline stage.', 'gauge');
    const ledger = (0, metrics_ledger_1.readLedger)(ledgerPath);
    for (const [family, series] of Object.entries(ledger.families)) {
        const help = family === metrics_ledger_1.STAGE_RESULTS_FAMILY
            ? 'Pipeline stage executions by stage and terminal status (success, failure, skipped).'
            : family === metrics_ledger_1.RECOVERY_FAMILY
                ? 'Recovery actions executed after a stage failure, by outcome (succeeded, failed).'
                : family === metrics_ledger_1.CONVERGENCE_FAMILY
                    ? 'Convergence outcomes observed by the pipeline executor, by outcome (converged, not_converged).'
                    : `Pipeline ledger family ${family}.`;
        for (const [seriesKey, value] of Object.entries(series)) {
            const numeric = Number(value);
            if (!Number.isFinite(numeric))
                continue;
            registry.add(family, help, 'counter', numeric, (0, metrics_ledger_1.decodeSeriesKey)(seriesKey));
        }
    }
    for (const [stage, duration] of Object.entries(ledger.stageDurationMs)) {
        if (!Number.isFinite(duration.last))
            continue;
        registry.add(metrics_ledger_1.STAGE_DURATION_FAMILY, 'Duration in seconds of the most recent execution of each pipeline stage.', 'gauge', Math.round((duration.last / 1000) * 1e6) / 1e6, { stage });
    }
}
/**
 * Render the current scrape payload. This is what the `/metrics` route sends.
 */
function renderMetrics(diskPath = process_1.default.cwd(), ledgerPath) {
    return collectMetrics(diskPath, ledgerPath).render();
}
//# sourceMappingURL=metrics.js.map