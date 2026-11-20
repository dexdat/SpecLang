import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';

const cli = resolve('bin/speclang');
const lanes = ['validate', 'cascade', 'generate', 'index', 'guard'];
const roots: string[] = [];

function project(): string {
  const root = mkdtempSync(join(tmpdir(), 'cli-completion-OBS-4-'));
  roots.push(root);
  return root;
}

function records(root: string) {
  return JSON.parse(readFileSync(join(root, '.speclang/cli-completion.json'), 'utf8'));
}

function run(root: string, ...args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root, encoding: 'utf8', timeout: 30_000,
  });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  return result;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('OBS-4 CLI completion records', () => {
  it('records all five bare lane invocations and increments validate on the second run', () => {
    const root = project();
    mkdirSync(join(root, 'specs'));
    for (const lane of lanes) {
      const result = run(root, lane);
      expect(records(root)[lane]).toEqual({
        lane, exitCode: result.status, durationMs: expect.any(Number), runCount: 1,
      });
      expect(records(root)[lane].durationMs).toBeGreaterThanOrEqual(0);
    }
    const first = records(root);
    expect(Object.keys(first).sort()).toEqual([...lanes].sort());
    const result = run(root, 'validate');
    expect(records(root).validate).toEqual({
      lane: 'validate', exitCode: result.status, durationMs: expect.any(Number), runCount: 2,
    });
    for (const lane of lanes.filter(lane => lane !== 'validate')) {
      expect(records(root)[lane]).toEqual(first[lane]);
    }
    expect(existsSync(join(root, '.speclang/cli-completion.json.lock'))).toBe(false);
  });

  it('serializes concurrent processes updating both identical and distinct lanes', async () => {
    const root = project();
    const invocations = ['validate', 'guard', 'validate', 'index'];
    for (let round = 0; round < 2; round++) {
      await Promise.all(invocations.map(lane => new Promise<void>((resolve, reject) => {
        const child = spawn(process.execPath, [cli, lane, '--OBS-4-invalid-option'], { cwd: root });
        let stderr = '';
        child.stdout.resume();
        child.stderr.on('data', data => { stderr += data; });
        child.on('error', reject);
        child.on('close', code => code === 1 && !stderr.includes('could not record')
          ? resolve() : reject(new Error(`Unexpected exit ${code}: ${stderr}`)));
      })));
    }
    expect(Object.keys(records(root)).sort()).toEqual(['guard', 'index', 'validate']);
    expect(records(root).validate.runCount).toBe(4);
    expect(records(root).guard.runCount).toBe(2);
    expect(records(root).index.runCount).toBe(2);
  });

  it.each(lanes)('records %s even when parsing exits before its action', lane => {
    const root = project();
    const result = run(root, lane, '--OBS-4-invalid-option');
    expect(result.status).toBe(1);
    expect(records(root)[lane]).toEqual({
      lane, exitCode: 1, durationMs: expect.any(Number), runCount: 1,
    });
    expect(records(root)[lane].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('records an explicit nonzero exit from a command action', () => {
    const root = project();
    const result = run(root, 'cascade', 'missing.spec.md');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Spec file not found');
    expect(records(root).cascade).toEqual({
      lane: 'cascade', exitCode: 1, durationMs: expect.any(Number), runCount: 1,
    });
  });

  it('records successful and failed exits exactly once without polluting stdout', () => {
    const root = project();
    writeFileSync(join(root, 'empty.spec.md'), '# No code blocks\n');
    const success = run(root, 'generate', 'empty.spec.md', '--dry-run');
    expect(success.status).toBe(0);
    expect(success.stdout).toContain('Generation complete');
    expect(success.stdout).not.toContain('runCount');
    expect(records(root).generate.exitCode).toBe(0);
    expect(records(root).generate.runCount).toBe(1);
    const failure = run(root, 'generate', '--OBS-4-invalid-option');
    expect(failure.status).toBe(1);
    expect(records(root).generate.exitCode).toBe(1);
    expect(records(root).generate.runCount).toBe(2);
  });

  it.each(['{broken', 'null', '[]'])(
    'preserves malformed state %s, releases the lock, and keeps the CLI exit code', content => {
      const root = project();
      mkdirSync(join(root, '.speclang'));
      const target = join(root, '.speclang/cli-completion.json');
      writeFileSync(target, content);
      writeFileSync(join(root, 'empty.spec.md'), '# No code blocks\n');
      const success = run(root, 'generate', 'empty.spec.md', '--dry-run');
      expect(success.status).toBe(0);
      expect(success.stderr).toContain('could not record CLI completion for generate');
      const failure = run(root, 'generate', '--OBS-4-invalid-option');
      expect(failure.status).toBe(1);
      expect(failure.stderr).toContain('could not record CLI completion for generate');
      expect(readFileSync(target, 'utf8')).toBe(content);
      expect(existsSync(`${target}.lock`)).toBe(false);
    },
  );

  it.each(['"2"', '-1', '9007199254740991'])(
    'preserves an invalid lane counter %s instead of corrupting it', count => {
      const root = project();
      mkdirSync(join(root, '.speclang'));
      const target = join(root, '.speclang/cli-completion.json');
      const content = `{"generate":{"runCount":${count}}}`;
      writeFileSync(target, content);
      expect(run(root, 'generate', '--OBS-4-invalid-option').status).toBe(1);
      expect(readFileSync(target, 'utf8')).toBe(content);
      expect(existsSync(`${target}.lock`)).toBe(false);
    },
  );

  it('warns on an unwritable state path without changing the lane exit code', () => {
    const root = project();
    writeFileSync(join(root, '.speclang'), 'not a directory');
    const result = run(root, 'generate', '--OBS-4-invalid-option');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('could not record CLI completion for generate');
    expect(readFileSync(join(root, '.speclang'), 'utf8')).toBe('not a directory');
  });

  it('does not record unrelated commands', () => {
    const root = project();
    expect(run(root, '--version').status).toBe(0);
    expect(existsSync(join(root, '.speclang/cli-completion.json'))).toBe(false);
  });

  it('reclaims a lock left behind by a killed writer instead of waiting out the deadline', async () => {
    const root = project();
    mkdirSync(join(root, '.speclang'), { recursive: true });
    const dead = spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' });
    const deadPid = dead.pid;
    await new Promise(resolve => dead.once('exit', resolve));
    const lock = join(root, '.speclang/cli-completion.json.lock');
    writeFileSync(lock, String(deadPid));
    const started = Date.now();
    const result = run(root, 'validate');
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(records(root).validate).toEqual({
      lane: 'validate', exitCode: result.status, durationMs: expect.any(Number), runCount: 1,
    });
    expect(existsSync(lock)).toBe(false);
  });

  it('reclaims a fresh 0-byte lock instead of waiting out the completion deadline', () => {
    const root = project();
    mkdirSync(join(root, '.speclang'), { recursive: true });
    const lock = join(root, '.speclang/cli-completion.json.lock');
    writeFileSync(lock, '');
    const spec = resolve('specs/examples.spec.dir/hello-world.spec.md');
    const started = Date.now();
    const result = run(root, 'validate', spec);
    const elapsed = Date.now() - started;
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('Timed out waiting for CLI completion lock');
    expect(result.stderr).not.toContain('could not record');
    expect(elapsed).toBeLessThan(3_000);
    expect(records(root).validate).toEqual({
      lane: 'validate', exitCode: 0, durationMs: expect.any(Number), runCount: 1,
    });
    expect(existsSync(lock)).toBe(false);
  });

  it('reclaims an unreadable lock once it is older than the staleness window', () => {
    const root = project();
    mkdirSync(join(root, '.speclang'), { recursive: true });
    const lock = join(root, '.speclang/cli-completion.json.lock');
    writeFileSync(lock, '');
    const stale = new Date(Date.now() - 10 * 60_000);
    utimesSync(lock, stale, stale);
    const started = Date.now();
    const result = run(root, 'guard');
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(records(root).guard).toEqual({
      lane: 'guard', exitCode: result.status, durationMs: expect.any(Number), runCount: 1,
    });
    expect(existsSync(lock)).toBe(false);
  });

  it('never reclaims a lock whose recorded owner is alive', async () => {
    const root = project();
    mkdirSync(join(root, '.speclang'), { recursive: true });
    const lock = join(root, '.speclang/cli-completion.json.lock');
    const holder = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30_000)'], { stdio: 'ignore' });
    let waiter: ReturnType<typeof spawn> | undefined;
    try {
      writeFileSync(lock, String(holder.pid));
      const started = Date.now();
      waiter = spawn(process.execPath, [cli, 'validate'], { cwd: root, stdio: 'ignore' });
      // Longer than the re-read window a useless body gets, and far below the
      // 60s deadline: a live owner must still be waited out, not reclaimed.
      await new Promise(resolve => setTimeout(resolve, 1_500));
      expect(Date.now() - started).toBeGreaterThanOrEqual(1_400);
      expect(holder.exitCode).toBeNull();
      expect(() => process.kill(holder.pid!, 0)).not.toThrow();
      expect(waiter.exitCode).toBeNull();
      expect(readFileSync(lock, 'utf8')).toBe(String(holder.pid));
      expect(existsSync(lock)).toBe(true);
      expect(existsSync(join(root, '.speclang/cli-completion.json'))).toBe(false);
    } finally {
      waiter?.kill('SIGKILL');
      holder.kill('SIGKILL');
      if (waiter) await new Promise(resolve => waiter!.once('exit', resolve));
    }
  });
});
