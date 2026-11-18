import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface DaemonPromMetrics {
  up: boolean;
  status: string;
  lastEventAt?: number;
  errors: number;
}

const STATUS_CODES: Record<string, number> = {
  idle: 0,
  cascading: 1,
  converged: 2,
  paused: 3,
  error: 4,
};

export function renderDaemonProm(metrics: DaemonPromMetrics, now = Date.now()): string {
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
const pendingWrites = new Map<string, Promise<void>>();

export async function writeDaemonPromMetrics(
  projectDir: string,
  metrics: DaemonPromMetrics,
  now = Date.now(),
  renameFile: typeof fs.rename = fs.rename,
): Promise<void> {
  const directory = path.join(projectDir, '.speclang');
  const target = path.join(directory, 'daemon.prom');
  const previous = pendingWrites.get(target) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => {
    const temporary = path.join(directory, `.daemon.prom.${process.pid}.${randomUUID()}.tmp`);
    await fs.mkdir(directory, { recursive: true });
    try {
      await fs.writeFile(temporary, renderDaemonProm(metrics, now), { encoding: 'utf8', flag: 'wx' });
      await renameFile(temporary, target);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  });
  pendingWrites.set(target, current);
  try {
    await current;
  } finally {
    if (pendingWrites.get(target) === current) pendingWrites.delete(target);
  }
}
