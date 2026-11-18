import { spawn, type ChildProcess } from 'child_process';
import { once } from 'events';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { renderDaemonProm, writeDaemonPromMetrics } from '../../src/daemon/daemon-prom';

describe('daemon Prometheus textfile writer', () => {
  let projectDir: string | undefined;

  afterEach(async () => {
    if (projectDir) await fs.rm(projectDir, { recursive: true, force: true });
    projectDir = undefined;
  });

  it.each([
    ['idle', 0], ['cascading', 1], ['converged', 2], ['paused', 3], ['error', 4],
  ])('renders status %s as gauge value %i', (status, code) => {
    expect(renderDaemonProm({ up: true, status: String(status), errors: 0 }))
      .toContain(`speclang_daemon_status ${code}\n`);
  });

  it('preserves event changes within the same second', () => {
    const first = renderDaemonProm({ up: true, status: 'idle', errors: 0, lastEventAt: 1_700_000_000_001 });
    const second = renderDaemonProm({ up: true, status: 'idle', errors: 0, lastEventAt: 1_700_000_000_002 });
    expect(first).toContain('speclang_daemon_last_event_timestamp_seconds 1700000000.001\n');
    expect(second).toContain('speclang_daemon_last_event_timestamp_seconds 1700000000.002\n');
  });

  it('writes parseable metrics and advances the event timestamp on a state write', async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speclang-daemon-prom-'));
    const metrics = { up: true, status: 'idle', lastEventAt: 1_700_000_000_000, errors: 2 };
    await writeDaemonPromMetrics(projectDir, metrics);

    const target = path.join(projectDir, '.speclang', 'daemon.prom');
    const first = await fs.readFile(target, 'utf8');
    expect(first).toMatch(/^# HELP speclang_daemon_up .*\n# TYPE speclang_daemon_up gauge\nspeclang_daemon_up 1$/m);
    expect(first).toMatch(/^# HELP speclang_daemon_status .*\n# TYPE speclang_daemon_status gauge\nspeclang_daemon_status 0$/m);
    expect(first).toMatch(/^# HELP speclang_daemon_last_event_timestamp_seconds .*\n# TYPE speclang_daemon_last_event_timestamp_seconds gauge\nspeclang_daemon_last_event_timestamp_seconds 1700000000$/m);
    expect(first).toMatch(/^# HELP speclang_daemon_errors_total .*\n# TYPE speclang_daemon_errors_total counter\nspeclang_daemon_errors_total 2$/m);

    await writeDaemonPromMetrics(projectDir, { ...metrics, status: 'cascading', lastEventAt: 1_700_000_001_000 });
    const second = await fs.readFile(target, 'utf8');
    const timestamp = (content: string) => Number(content.match(/^speclang_daemon_last_event_timestamp_seconds (\d+)$/m)?.[1]);
    expect(timestamp(second)).toBeGreaterThan(timestamp(first));
    expect(second).toContain('speclang_daemon_status 1');
  });

  it('replaces the complete textfile by same-directory temp-file rename', async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speclang-daemon-prom-'));
    const target = path.join(projectDir, '.speclang', 'daemon.prom');
    await writeDaemonPromMetrics(projectDir, { up: false, status: 'idle', errors: 0 }, 1_700_000_000_000);
    const previousContent = await fs.readFile(target, 'utf8');
    const realRename = fs.rename.bind(fs);
    let renameCalls = 0;

    await writeDaemonPromMetrics(projectDir, { up: true, status: 'cascading', errors: 1 }, 1_700_000_001_000, async (from, to) => {
      renameCalls++;
      expect(path.dirname(from)).toBe(path.dirname(target));
      expect(path.basename(from)).toMatch(/^\.daemon\.prom\..+\.tmp$/);
      expect(await fs.readFile(from, 'utf8')).toContain('speclang_daemon_status 1');
      expect(await fs.readFile(target, 'utf8')).toBe(previousContent);
      await realRename(from, to);
    });

    expect(renameCalls).toBe(1);
    expect(await fs.readFile(target, 'utf8')).toContain('speclang_daemon_up 1');
    expect((await fs.readdir(path.dirname(target))).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('serializes concurrent updates and preserves the last snapshot', async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speclang-daemon-prom-'));
    await Promise.all(Array.from({ length: 20 }, (_, errors) =>
      writeDaemonPromMetrics(projectDir!, { up: true, status: 'idle', errors }),
    ));
    expect(await fs.readFile(path.join(projectDir, '.speclang/daemon.prom'), 'utf8'))
      .toContain('speclang_daemon_errors_total 19\n');
  });

  it('keeps the previous file and removes the temporary on rename failure, then recovers', async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speclang-daemon-prom-'));
    const metrics = { up: true, status: 'idle', errors: 0 };
    const target = path.join(projectDir, '.speclang/daemon.prom');
    await writeDaemonPromMetrics(projectDir, metrics);
    const previous = await fs.readFile(target, 'utf8');
    await expect(writeDaemonPromMetrics(projectDir, { ...metrics, errors: 1 }, Date.now(), async () => {
      throw new Error('rename refused');
    })).rejects.toThrow('rename refused');
    expect(await fs.readFile(target, 'utf8')).toBe(previous);
    expect(await fs.readdir(path.dirname(target))).toEqual(['daemon.prom']);
    await writeDaemonPromMetrics(projectDir, { ...metrics, errors: 2 });
    expect(await fs.readFile(target, 'utf8')).toContain('speclang_daemon_errors_total 2\n');
  });
});

// Exercise the public, compiled entry point, not only the standalone writer.
// A sandbox CWD keeps watcher/state/pipeline activity inside this worktree's .tmp.
describe('OBS-3 CLI daemon textfile lifecycle', () => {
  let projectDir: string;
  let child: ChildProcess | undefined;
  let output = '';
  const cli = path.resolve('bin/speclang');

  afterEach(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGKILL');
      await exited;
    }
    child = undefined;
    if (projectDir) await fs.rm(projectDir, { recursive: true, force: true });
  });

  it('start writes four series, a watched cascade advances the timestamp, and stop writes up=0', async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speclang-obs3-cli-'));
    await fs.mkdir(path.join(projectDir, 'specs'));
    await fs.writeFile(path.join(projectDir, '.speclangrc'),
      'watch:\n  paths: [specs]\nconvergence:\n  quietPeriod: 1\n  autoCommit: false\n  testOnConverge: false\n');
    output = '';
    child = spawn(process.execPath, [cli, 'start', '--no-dashboard'], {
      cwd: projectDir,
      env: { ...process.env, NODE_OPTIONS: '' },
    });
    child.stdout!.on('data', data => { output += data.toString(); });
    child.stderr!.on('data', data => { output += data.toString(); });
    const exited = once(child, 'exit');
    const target = path.join(projectDir, '.speclang/daemon.prom');
    const readMetrics = () => fs.readFile(target, 'utf8');
    await expect.poll(() => output, { timeout: 15_000 }).toContain('Daemon Started');
    const initial = await readMetrics();
    const samples = initial.split('\n').filter(line => line && !line.startsWith('#'));
    expect(samples).toHaveLength(4);
    expect(new Set(samples.map(line => line.split(' ')[0])).size).toBe(4);
    for (const line of samples) expect(line).toMatch(/^speclang_daemon_\w+ \d+(\.\d+)?$/);
    expect(initial).toContain('speclang_daemon_up 1\n');
    expect(initial).toContain('speclang_daemon_status 0\n');
    expect(initial).toContain('speclang_daemon_errors_total 0\n');
    const timestamp = (text: string) => Number(text.match(/^speclang_daemon_last_event_timestamp_seconds (\S+)$/m)?.[1]);
    await fs.writeFile(path.join(projectDir, 'specs/obs3.spec.md'), '# OBS-3 cascade\n');
    await expect.poll(async () => timestamp(await readMetrics()), { timeout: 15_000 })
      .toBeGreaterThan(timestamp(initial));
    await expect.poll(() => output, { timeout: 15_000 }).toContain('Cascade converged!');
    child.kill('SIGTERM');
    expect((await exited)[0], output).toBe(0);
    expect(await readMetrics()).toContain('speclang_daemon_up 0\n');
    expect((await fs.readdir(path.dirname(target))).filter(name => name.endsWith('.tmp'))).toEqual([]);
  }, 45_000);
});
