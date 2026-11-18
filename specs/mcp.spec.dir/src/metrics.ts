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

import os from 'os';
import fs from 'fs';
import process from 'process';

/** Exact Content-Type Prometheus expects for the text exposition format. */
export const PROMETHEUS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8';

/** Server version reported by `speclang_server_info` (matches MCP serverInfo). */
const SERVER_VERSION = '1.0.0';

export type MetricType = 'counter' | 'gauge';

export interface MetricSample {
  /** Optional label set; values are stringified and escaped at render time. */
  labels?: Record<string, string | number>;
  value: number;
}

export interface MetricFamily {
  name: string;
  help: string;
  type: MetricType;
  samples: MetricSample[];
}

/**
 * Render a numeric sample the way the text exposition format expects.
 * Non-finite values have dedicated spellings; everything else is emitted in
 * plain decimal (Prometheus accepts exponent notation for large magnitudes).
 */
function formatValue(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return '+Inf';
  if (value === -Infinity) return '-Inf';
  if (!Number.isFinite(value)) return 'NaN';
  return String(value);
}

/**
 * Escape a label value: backslash, double quote and line feed are the only
 * characters the format requires escaping.
 */
function escapeLabelValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * Render a label set as `{k="v",k2="v2"}`, or '' when there is nothing to
 * render. Keys are sorted so output is stable scrape-to-scrape.
 */
function renderLabels(labels?: Record<string, string | number>): string {
  if (!labels) return '';
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
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
export class MetricsRegistry {
  private readonly families = new Map<string, MetricFamily>();

  /**
   * Add one sample to a family, declaring the family on first use.
   * A repeated declaration with a different help/type is a programming error,
   * so the first declaration wins (and stays stable in the output).
   */
  add(
    name: string,
    help: string,
    type: MetricType,
    value: number,
    labels?: Record<string, string | number>
  ): void {
    let family = this.families.get(name);
    if (!family) {
      family = { name, help, type, samples: [] };
      this.families.set(name, family);
    }
    family.samples.push(labels ? { labels, value } : { value });
  }

  /** Convenience for a family with a single unlabelled sample. */
  set(name: string, help: string, type: MetricType, value: number): void {
    this.add(name, help, type, value);
  }

  /** Snapshot of the declared families (sorted by name). */
  getFamilies(): MetricFamily[] {
    return [...this.families.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Render the whole registry in Prometheus text exposition format. */
  render(): string {
    const lines: string[] = [];

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

/** Aggregate CPU utilisation since boot as a percentage (0-100). */
function cpuUsagePercent(): number {
  let idle = 0;
  let total = 0;

  for (const cpu of os.cpus()) {
    for (const type of Object.keys(cpu.times) as Array<keyof typeof cpu.times>) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }

  if (total <= 0) return 0;
  return Math.round((1 - idle / total) * 10000) / 100;
}

interface NetworkTotals {
  interface: string;
  receivedBytes: number;
  transmittedBytes: number;
}

/**
 * Read per-interface byte counters from /proc/net/dev (Linux). Returns null on
 * any other platform or if the file cannot be read — the caller reports the
 * collector as unavailable rather than inventing zeros.
 */
function readLinuxNetworkTotals(): NetworkTotals[] | null {
  let raw: string;
  try {
    raw = fs.readFileSync('/proc/net/dev', 'utf-8');
  } catch {
    return null;
  }

  const totals: NetworkTotals[] = [];
  for (const line of raw.split('\n')) {
    const match = /^\s*([^:]+):\s*(.+)$/.exec(line);
    if (!match) continue;

    const iface = match[1].trim();
    const fields = match[2].trim().split(/\s+/);
    // Layout after the interface name: rx bytes is field 0, tx bytes field 8.
    if (fields.length < 9) continue;

    const receivedBytes = Number(fields[0]);
    const transmittedBytes = Number(fields[8]);
    if (!Number.isFinite(receivedBytes) || !Number.isFinite(transmittedBytes)) continue;

    totals.push({ interface: iface, receivedBytes, transmittedBytes });
  }

  return totals;
}

interface DiskTotals {
  path: string;
  totalBytes: number;
  freeBytes: number;
  availableBytes: number;
}

/**
 * Disk capacity for the filesystem backing `path`. Uses fs.statfsSync (Node
 * >= 18.15); returns null when the platform or runtime cannot answer.
 */
function readDiskTotals(path: string): DiskTotals | null {
  const statfsSync = (fs as unknown as {
    statfsSync?: (p: string) => { bsize: number; blocks: number; bfree: number; bavail: number };
  }).statfsSync;

  if (typeof statfsSync !== 'function') return null;

  try {
    const stats = statfsSync(path);
    const blockSize = Number(stats.bsize);
    return {
      path,
      totalBytes: Number(stats.blocks) * blockSize,
      freeBytes: Number(stats.bfree) * blockSize,
      availableBytes: Number(stats.bavail) * blockSize
    };
  } catch {
    return null;
  }
}

/**
 * Build a registry populated with the current Tier-1 system families plus
 * process and uptime series. Called per scrape — all values are point-in-time
 * reads, so the endpoint never serves stale numbers.
 */
export function collectMetrics(diskPath: string = process.cwd()): MetricsRegistry {
  const registry = new MetricsRegistry();
  const memoryTotal = os.totalmem();
  const memoryFree = os.freemem();
  const memoryUsed = memoryTotal - memoryFree;

  // --- cpu -----------------------------------------------------------------
  registry.set(
    'speclang_cpu_usage_percent',
    'Aggregate CPU utilisation since boot, as a percentage (1 - idle/total ticks).',
    'gauge',
    cpuUsagePercent()
  );
  registry.set('speclang_cpu_cores', 'Number of logical CPU cores visible to the process.', 'gauge', os.cpus().length);

  const [load1, load5, load15] = os.loadavg();
  registry.add(
    'speclang_cpu_load_average',
    'System load average over 1m, 5m and 15m (zeros on platforms without loadavg).',
    'gauge',
    load1,
    { period: '1m' }
  );
  registry.add(
    'speclang_cpu_load_average',
    'System load average over 1m, 5m and 15m (zeros on platforms without loadavg).',
    'gauge',
    load5,
    { period: '5m' }
  );
  registry.add(
    'speclang_cpu_load_average',
    'System load average over 1m, 5m and 15m (zeros on platforms without loadavg).',
    'gauge',
    load15,
    { period: '15m' }
  );

  // --- memory --------------------------------------------------------------
  registry.set('speclang_memory_total_bytes', 'Total physical memory in bytes.', 'gauge', memoryTotal);
  registry.set('speclang_memory_free_bytes', 'Free physical memory in bytes.', 'gauge', memoryFree);
  registry.set('speclang_memory_used_bytes', 'Used physical memory in bytes (total - free).', 'gauge', memoryUsed);
  registry.set(
    'speclang_memory_used_percent',
    'Used physical memory as a percentage of total.',
    'gauge',
    memoryTotal > 0 ? Math.round((memoryUsed / memoryTotal) * 10000) / 100 : 0
  );

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
    registry.add(
      'speclang_disk_available_bytes',
      'Filesystem bytes available to unprivileged users.',
      'gauge',
      disk.availableBytes,
      { path: disk.path }
    );
    registry.add('speclang_disk_used_bytes', 'Filesystem used bytes (total - free).', 'gauge', usedBytes, {
      path: disk.path
    });
    registry.add(
      'speclang_disk_used_percent',
      'Filesystem used capacity as a percentage of total.',
      'gauge',
      disk.totalBytes > 0 ? Math.round((usedBytes / disk.totalBytes) * 10000) / 100 : 0,
      { path: disk.path }
    );
    registry.set('speclang_disk_collector_available', 'Whether the disk collector could read capacity (1) or not (0).', 'gauge', 1);
  } else {
    // Never fabricate a capacity reading: declare the family and report the
    // collector as unavailable instead.
    registry.set('speclang_disk_collector_available', 'Whether the disk collector could read capacity (1) or not (0).', 'gauge', 0);
  }

  // --- network -------------------------------------------------------------
  const network = readLinuxNetworkTotals();
  if (network && network.length > 0) {
    for (const iface of network) {
      registry.add(
        'speclang_network_receive_bytes_total',
        'Bytes received per network interface since boot.',
        'counter',
        iface.receivedBytes,
        { interface: iface.interface }
      );
      registry.add(
        'speclang_network_transmit_bytes_total',
        'Bytes transmitted per network interface since boot.',
        'counter',
        iface.transmittedBytes,
        { interface: iface.interface }
      );
    }
    registry.set(
      'speclang_network_collector_available',
      'Whether the network collector could read interface counters (1) or not (0).',
      'gauge',
      1
    );
  } else {
    registry.set(
      'speclang_network_collector_available',
      'Whether the network collector could read interface counters (1) or not (0).',
      'gauge',
      0
    );
  }

  // --- uptime / self-observation ------------------------------------------
  registry.set('speclang_uptime_seconds', 'Host uptime in seconds.', 'gauge', os.uptime());

  const usage = process.cpuUsage();
  registry.set(
    'speclang_process_uptime_seconds',
    'Seconds since this process started.',
    'gauge',
    Math.round(process.uptime() * 1000) / 1000
  );
  registry.set(
    'speclang_process_resident_memory_bytes',
    'Resident set size of the server process in bytes.',
    'gauge',
    process.memoryUsage().rss
  );
  registry.set(
    'speclang_process_heap_used_bytes',
    'V8 heap currently used by the server process in bytes.',
    'gauge',
    process.memoryUsage().heapUsed
  );
  registry.set(
    'speclang_process_cpu_user_seconds_total',
    'Total user CPU time consumed by the server process in seconds.',
    'counter',
    usage.user / 1e6
  );
  registry.set(
    'speclang_process_cpu_system_seconds_total',
    'Total system CPU time consumed by the server process in seconds.',
    'counter',
    usage.system / 1e6
  );
  registry.add('speclang_server_info', 'Static server identity (always 1).', 'gauge', 1, {
    version: SERVER_VERSION,
    runtime: 'mcp-http'
  });

  return registry;
}

/**
 * Render the current scrape payload. This is what the `/metrics` route sends.
 */
export function renderMetrics(diskPath: string = process.cwd()): string {
  return collectMetrics(diskPath).render();
}
