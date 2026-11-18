import { execFileSync, spawn } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { describe, expect, it } from 'vitest';
import { getPipelineExecutorCandidates } from '../src/daemon/daemon';

const repoRoot = resolve(__dirname, '..');
const requireCompiled = createRequire(resolve(repoRoot, 'package.json'));

describe('OBS-7 daemon executor resolution', () => {
  it.each([
    'src/daemon/daemon.ts',
    'specs/daemon.spec.dir/src/daemon.ts',
    'dist/src/daemon/daemon.js',
  ])('resolves an existing executor at runtime from %s', (layout) => {
    const daemonPath = resolve(repoRoot, layout);
    expect(existsSync(daemonPath), `Missing daemon layout: ${daemonPath}`).toBe(true);
    const candidates = getPipelineExecutorCandidates(pathToFileURL(daemonPath));
    const executor = candidates.find(candidate => existsSync(new URL(candidate)));
    expect(executor, `No executor exists among: ${candidates.join(', ')}`).toBeDefined();
    const expectedExecutor = layout.startsWith('dist/')
      ? 'dist/src/pipeline/executor.js'
      : 'src/pipeline/executor.ts';
    expect(realpathSync(fileURLToPath(executor!))).toBe(realpathSync(resolve(repoRoot, expectedExecutor)));
  });

  it('uses the source module location, not the project working directory', () => {
    const candidates = getPipelineExecutorCandidates();
    expect(candidates.some(candidate => existsSync(new URL(candidate)))).toBe(true);
    expect(candidates.every(candidate => candidate.endsWith('.ts'))).toBe(true);
  });

  it.each([
    'src/daemon/daemon.ts',
    'specs/daemon.spec.dir/src/daemon.ts',
    'dist/src/daemon/daemon.js',
  ])('executes a stage through %s from a scratch project', (layout) => {
    const project = mkdtempSync(join(tmpdir(), 'obs7-executor-'));
    try {
      writeFileSync(join(project, 'build.yaml'), 'pipeline:\n  on_converge:\n    - name: obs7-stage\n      run: "echo OBS7_STAGE_RAN"\n');
      const script = `
        const { Daemon } = require(${JSON.stringify(resolve(repoRoot, layout))});
        const daemon = new Daemon();
        let succeeded = false;
        daemon.on('pipeline_success', result => {
          succeeded = result.stages.some(stage => stage.output.includes('OBS7_STAGE_RAN'));
        });
        daemon.executePipeline({ converged: true, filesChanged: [], cascadeDepth: 1 })
          .then(() => process.exit(succeeded ? 0 : 1))
          .catch(error => { console.error(error); process.exit(1); });
      `;
      const loaderArgs = layout.endsWith('.ts')
        ? ['--import', pathToFileURL(requireCompiled.resolve('tsx')).href]
        : [];
      const stdout = execFileSync(process.execPath, [...loaderArgs, '-e', script], {
        cwd: project,
        env: { ...process.env, SPECLANG_METRICS_LEDGER: '' },
        encoding: 'utf8',
        timeout: 120_000,
      });
      expect(stdout).toContain('[StageExecutor] Executing stage: obs7-stage');
      expect(stdout).toContain('[Daemon] Pipeline succeeded!');
      const ledger = JSON.parse(readFileSync(join(project, '.speclang/metrics-outcomes.json'), 'utf8'));
      expect(ledger.families.speclang_pipeline_stage_results_total['stage=obs7-stage,status=success']).toBe(1);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  }, 180_000);

  it('runs the compiled CLI watcher cascade and records stage outcomes while alive', async () => {
    const project = mkdtempSync(join(tmpdir(), 'obs7-cli-'));
    const ledgerPath = join(project, '.speclang/metrics-outcomes.json');
    for (const directory of ['specs', 'tests', 'generated']) {
      mkdirSync(join(project, directory));
    }
    writeFileSync(join(project, '.speclangrc'), 'convergence:\n  quietPeriod: 1\n  testOnConverge: false\n');
    writeFileSync(join(project, 'build.yaml'), 'pipeline:\n  on_converge:\n    - name: obs7-cli-stage\n      run: "echo OBS7_CLI_STAGE_RAN"\n');
    const child = spawn(process.execPath, [join(repoRoot, 'bin/speclang'), 'start', '--no-dashboard'], {
      cwd: project,
      env: { ...process.env, SPECLANG_METRICS_LEDGER: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    child.stdout.on('data', chunk => { log += chunk.toString(); });
    child.stderr.on('data', chunk => { log += chunk.toString(); });
    const closed = new Promise<number | null>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });
    try {
      await expect.poll(() => log, { timeout: 15_000 }).toContain('[Daemon] Started successfully');
      expect(existsSync(ledgerPath)).toBe(false);
      // Inject only after the initial scan: this must be a real watched event.
      writeFileSync(join(project, 'specs/obs7.spec.md'), '# OBS-7 watcher cascade\n');
      await expect.poll(() => log, { timeout: 15_000 }).toContain('[Daemon] Pipeline succeeded!');
      expect(log).toMatch(/\[Daemon\] File event: create - specs[\\/]obs7\.spec\.md/);
      expect(log).toContain('[Daemon] Cascade converged!');
      expect(log).toContain('[StageExecutor] Executing stage: obs7-cli-stage');
      expect(log).toContain('OBS7_CLI_STAGE_RAN');
      expect(log).not.toMatch(/Cannot find module|Pipeline execution error/);
      const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
      expect(ledger.families.speclang_pipeline_stage_results_total['stage=obs7-cli-stage,status=success']).toBe(1);
      expect(child.exitCode).toBeNull();
      expect(child.signalCode).toBeNull();
      process.kill(child.pid!, 0);
    } finally {
      child.kill('SIGTERM');
      try {
        expect(await closed).toBe(0);
      } finally {
        rmSync(project, { recursive: true, force: true });
      }
    }
  }, 40_000);

  it('loads the compiled executor selected by the compiled daemon itself', async () => {
    // Native require avoids Vite redirecting the compiled module to TS sources.
    const compiledDaemon = requireCompiled('./dist/src/daemon/daemon.js');
    const candidates: string[] = compiledDaemon.getPipelineExecutorCandidates();
    const executor = candidates.find(candidate => existsSync(new URL(candidate)));
    expect(executor).toBe(pathToFileURL(resolve(repoRoot, 'dist/src/pipeline/executor.js')).href);
    const module = await import(executor!);
    expect(typeof module.PipelineExecutor).toBe('function');
  });
});
