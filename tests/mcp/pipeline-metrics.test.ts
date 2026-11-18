/**
 * OBS-2: pipeline outcome counters for the Prometheus /metrics endpoint.
 *
 * The pipeline executor, the recovery executor and the daemon that drives them
 * run in a different process from the MCP HTTP server that serves `/metrics`,
 * so the outcome counters live in a small JSON ledger on disk (see
 * `specs/pipeline.spec.dir/src/metrics-ledger.ts`) and are merged into the
 * scrape at render time. These tests cover that whole path:
 *
 * - the three counter families (stage results, recovery, convergence) plus the
 *   stage-duration gauge are declared even when nothing has run yet;
 * - a producer write becomes a visible sample delta in the scrape;
 * - the delta survives a real process boundary (a child process increments,
 *   the parent renders);
 * - a malformed / hostile ledger reads as the zero state and never throws;
 * - counters are monotonic;
 * - an unwritable ledger is a silent no-op and does not change pipeline
 *   control flow.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { renderMetrics, collectMetrics } from '../../src/mcp/metrics.js';
import {
  CONVERGENCE_FAMILY,
  LEDGER_ENV_VAR,
  RECOVERY_FAMILY,
  STAGE_DURATION_FAMILY,
  STAGE_RESULTS_FAMILY,
  decodeSeriesKey,
  encodeSeriesKey,
  readLedger,
  recordConvergenceOutcome,
  recordCounter,
  recordRecoveryOutcome,
  recordStageOutcome,
  resolveLedgerPath
} from '../../src/pipeline/metrics-ledger.js';

interface ParsedSample {
  labels: Record<string, string>;
  value: number;
}

const tmpDirs: string[] = [];
const restoreFns: Array<() => void> = [];

/** Create a scratch directory that `afterEach` removes. */
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-pipeline-metrics-'));
  tmpDirs.push(dir);
  return dir;
}

/** Parse the sample lines of one family out of an exposition payload. */
function parseSamples(payload: string, family: string): ParsedSample[] {
  const samples: ParsedSample[] = [];

  for (const line of payload.split('\n')) {
    if (!line.startsWith(family) || line.startsWith('# ')) continue;

    const rest = line.slice(family.length);
    if (rest.startsWith('{')) {
      const close = rest.indexOf('}');
      const labelText = rest.slice(1, close);
      const labels: Record<string, string> = {};
      for (const pair of labelText.split(',')) {
        const separator = pair.indexOf('=');
        if (separator === -1) continue;
        labels[pair.slice(0, separator)] = pair.slice(separator + 1).replace(/^"|"$/g, '');
      }
      samples.push({ labels, value: Number(rest.slice(close + 1).trim()) });
    } else {
      samples.push({ labels: {}, value: Number(rest.trim()) });
    }
  }

  return samples;
}

/** The value of one labelled series, or NaN when the series is absent. */
function seriesValue(payload: string, family: string, expected: Record<string, string>): number {
  const match = parseSamples(payload, family).find(sample =>
    Object.entries(expected).every(([key, value]) => sample.labels[key] === value)
  );
  return match ? match.value : Number.NaN;
}

afterEach(() => {
  while (restoreFns.length > 0) {
    const restore = restoreFns.pop();
    if (restore) restore();
  }
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('pipeline outcome families (OBS-2)', () => {
  it('declares the stage/stage-duration/recovery/convergence families with no ledger', () => {
    const dir = makeTmpDir();
    const payload = renderMetrics(dir, path.join(dir, 'metrics-outcomes.json'));

    for (const family of [STAGE_RESULTS_FAMILY, RECOVERY_FAMILY, CONVERGENCE_FAMILY]) {
      expect(payload).toContain(`# HELP ${family} `);
      expect(payload).toContain(`# TYPE ${family} counter`);
      // Declared, but no series until a producer records one.
      expect(parseSamples(payload, family)).toEqual([]);
    }

    expect(payload).toContain(`# TYPE ${STAGE_DURATION_FAMILY} gauge`);
    expect(parseSamples(payload, STAGE_DURATION_FAMILY)).toEqual([]);
  });

  it('renders one series per (stage, status) and the last stage duration', () => {
    const dir = makeTmpDir();
    const ledger = path.join(dir, 'metrics-outcomes.json');

    expect(recordStageOutcome('build', 'success', 1250, ledger)).toBe(true);
    expect(recordStageOutcome('build', 'success', 750, ledger)).toBe(true);
    expect(recordStageOutcome('test', 'failure', 500, ledger)).toBe(true);
    expect(recordStageOutcome('lint', 'skipped', 0, ledger)).toBe(true);

    const payload = renderMetrics(dir, ledger);

    expect(seriesValue(payload, STAGE_RESULTS_FAMILY, { stage: 'build', status: 'success' })).toBe(2);
    expect(seriesValue(payload, STAGE_RESULTS_FAMILY, { stage: 'test', status: 'failure' })).toBe(1);
    expect(seriesValue(payload, STAGE_RESULTS_FAMILY, { stage: 'lint', status: 'skipped' })).toBe(1);
    // Same stage, different status => different series.
    expect(seriesValue(payload, STAGE_RESULTS_FAMILY, { stage: 'build', status: 'failure' })).toBeNaN();

    // Gauge carries the LAST execution of the stage, in seconds.
    expect(seriesValue(payload, STAGE_DURATION_FAMILY, { stage: 'build' })).toBeCloseTo(0.75, 6);
    expect(seriesValue(payload, STAGE_DURATION_FAMILY, { stage: 'test' })).toBeCloseTo(0.5, 6);
    expect(seriesValue(payload, STAGE_DURATION_FAMILY, { stage: 'lint' })).toBe(0);
  });

  it('renders recovery and convergence outcomes as separate series', () => {
    const dir = makeTmpDir();
    const ledger = path.join(dir, 'metrics-outcomes.json');

    recordRecoveryOutcome('succeeded', ledger);
    recordRecoveryOutcome('succeeded', ledger);
    recordRecoveryOutcome('failed', ledger);
    recordConvergenceOutcome('converged', ledger);
    recordConvergenceOutcome('not_converged', ledger);
    recordConvergenceOutcome('not_converged', ledger);

    const payload = renderMetrics(dir, ledger);

    expect(seriesValue(payload, RECOVERY_FAMILY, { outcome: 'succeeded' })).toBe(2);
    expect(seriesValue(payload, RECOVERY_FAMILY, { outcome: 'failed' })).toBe(1);
    expect(seriesValue(payload, CONVERGENCE_FAMILY, { outcome: 'converged' })).toBe(1);
    expect(seriesValue(payload, CONVERGENCE_FAMILY, { outcome: 'not_converged' })).toBe(2);
  });

  it('carries a delta across a real process boundary', () => {
    const dir = makeTmpDir();
    const ledger = path.join(dir, 'metrics-outcomes.json');

    recordStageOutcome('parent-stage', 'success', 100, ledger);
    const before = renderMetrics(dir, ledger);
    expect(seriesValue(before, STAGE_RESULTS_FAMILY, { stage: 'parent-stage', status: 'success' })).toBe(1);

    // A separate node process — exactly the daemon-vs-scrape split the ledger
    // exists for. `npm test` builds first (pretest), so dist/ is current.
    const distLedger = path.resolve(process.cwd(), 'dist', 'specs', 'pipeline.spec.dir', 'src', 'metrics-ledger.js');
    expect(fs.existsSync(distLedger)).toBe(true);

    const childScript = `
      const ledger = require(${JSON.stringify(distLedger)});
      const target = ${JSON.stringify(ledger)};
      ledger.recordStageOutcome('child-stage', 'success', 250, target);
      ledger.recordRecoveryOutcome('succeeded', target);
      ledger.recordConvergenceOutcome('converged', target);
    `;
    execFileSync(process.execPath, ['-e', childScript], { encoding: 'utf-8' });

    const after = renderMetrics(dir, ledger);

    // The parent's own series is untouched, the child's series appeared.
    expect(seriesValue(after, STAGE_RESULTS_FAMILY, { stage: 'parent-stage', status: 'success' })).toBe(1);
    expect(seriesValue(after, STAGE_RESULTS_FAMILY, { stage: 'child-stage', status: 'success' })).toBe(1);
    expect(seriesValue(after, RECOVERY_FAMILY, { outcome: 'succeeded' })).toBe(1);
    expect(seriesValue(after, CONVERGENCE_FAMILY, { outcome: 'converged' })).toBe(1);
  });

  it('is monotonic: repeat increments only ever add', () => {
    const dir = makeTmpDir();
    const ledger = path.join(dir, 'metrics-outcomes.json');
    const readings: number[] = [];

    for (let i = 0; i < 4; i++) {
      recordCounter(CONVERGENCE_FAMILY, { outcome: 'converged' }, 1, ledger);
      readings.push(seriesValue(renderMetrics(dir, ledger), CONVERGENCE_FAMILY, { outcome: 'converged' }));
    }

    expect(readings).toEqual([1, 2, 3, 4]);
    // A recorded but non-positive delta still counts as one observation.
    recordCounter(CONVERGENCE_FAMILY, { outcome: 'converged' }, 0, ledger);
    expect(seriesValue(renderMetrics(dir, ledger), CONVERGENCE_FAMILY, { outcome: 'converged' })).toBe(5);
  });

  it('reads a malformed ledger as the zero state and never throws', () => {
    const dir = makeTmpDir();
    const ledger = path.join(dir, 'metrics-outcomes.json');

    fs.writeFileSync(ledger, '{ this is not json', 'utf-8');
    expect(() => renderMetrics(dir, ledger)).not.toThrow();
    expect(parseSamples(renderMetrics(dir, ledger), STAGE_RESULTS_FAMILY)).toEqual([]);
    expect(readLedger(ledger).families).toEqual({});

    // Wrongly shaped counters (negative, non-numeric) are dropped, not trusted.
    fs.writeFileSync(
      ledger,
      JSON.stringify({
        version: 1,
        families: { [STAGE_RESULTS_FAMILY]: { 'stage=build,status=success': -7, 'stage=test,status=failure': 'NaN' } },
        stageDurationMs: 'not-an-object',
      }),
      'utf-8'
    );
    const payload = renderMetrics(dir, ledger);
    expect(seriesValue(payload, STAGE_RESULTS_FAMILY, { stage: 'build', status: 'success' })).toBe(0);
    expect(seriesValue(payload, STAGE_RESULTS_FAMILY, { stage: 'test', status: 'failure' })).toBe(0);
    expect(parseSamples(payload, STAGE_DURATION_FAMILY)).toEqual([]);

    // Recording over a corrupt file starts from zero rather than throwing.
    fs.writeFileSync(ledger, 'garbage', 'utf-8');
    expect(recordStageOutcome('build', 'success', 100, ledger)).toBe(true);
    expect(seriesValue(renderMetrics(dir, ledger), STAGE_RESULTS_FAMILY, { stage: 'build', status: 'success' })).toBe(1);
  });

  it('honours $SPECLANG_METRICS_LEDGER when no explicit path is given', () => {
    const dir = makeTmpDir();
    const envLedger = path.join(dir, 'env-ledger.json');
    const previous = process.env[LEDGER_ENV_VAR];
    restoreFns.push(() => {
      if (previous === undefined) delete process.env[LEDGER_ENV_VAR];
      else process.env[LEDGER_ENV_VAR] = previous;
    });

    process.env[LEDGER_ENV_VAR] = envLedger;

    expect(resolveLedgerPath()).toBe(path.resolve(envLedger));
    expect(recordRecoveryOutcome('failed')).toBe(true);
    expect(fs.existsSync(envLedger)).toBe(true);
    // The scraper resolves the same path, so the write shows up with no wiring.
    expect(seriesValue(renderMetrics(dir), RECOVERY_FAMILY, { outcome: 'failed' })).toBe(1);
  });

  it('round-trips label sets containing separators', () => {
    const labels = { stage: 'build,all=1', status: 'success' };
    expect(decodeSeriesKey(encodeSeriesKey(labels))).toEqual(labels);
  });

  it('is a silent no-op when the ledger path is unwritable', () => {
    const dir = makeTmpDir();
    const blocker = path.join(dir, 'blocker');
    fs.writeFileSync(blocker, 'not a directory', 'utf-8');
    const unwritable = path.join(blocker, 'metrics-outcomes.json');

    expect(() => recordStageOutcome('build', 'success', 10, unwritable)).not.toThrow();
    expect(recordStageOutcome('build', 'success', 10, unwritable)).toBe(false);
    expect(recordRecoveryOutcome('succeeded', unwritable)).toBe(false);
    expect(recordConvergenceOutcome('converged', unwritable)).toBe(false);
    // An unreadable ledger renders as the zero state, not an error.
    expect(parseSamples(renderMetrics(dir, unwritable), STAGE_RESULTS_FAMILY)).toEqual([]);
  });

  it('leaves pipeline control flow untouched when the ledger is unwritable', async () => {
    const dir = makeTmpDir();
    const projectDir = path.join(dir, 'project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, 'build.yaml'),
      ['pipeline:', '  on_converge:', '    - name: probe', '      run: "echo obs2"', ''].join('\n'),
      'utf-8'
    );

    const blocker = path.join(dir, 'blocker');
    fs.writeFileSync(blocker, 'not a directory', 'utf-8');
    const unwritable = path.join(blocker, 'metrics-outcomes.json');

    const previousEnv = process.env[LEDGER_ENV_VAR];
    const previousCwd = process.cwd();
    restoreFns.push(() => {
      process.chdir(previousCwd);
      if (previousEnv === undefined) delete process.env[LEDGER_ENV_VAR];
      else process.env[LEDGER_ENV_VAR] = previousEnv;
    });

    process.env[LEDGER_ENV_VAR] = unwritable;
    process.chdir(projectDir);

    const { PipelineExecutor } = await import('../../src/pipeline/executor.js');
    const executor = new PipelineExecutor({ configPath: 'build.yaml' });
    const result = await executor.execute();

    expect(result.success).toBe(true);
    expect(result.stages.map(stage => stage.name)).toEqual(['probe']);
    expect(result.stages[0].success).toBe(true);
  });
});

describe('pipeline outcome wiring (OBS-2)', () => {
  it('counts a real pipeline run: stage results and the triggering convergence outcome', async () => {
    const dir = makeTmpDir();
    const projectDir = path.join(dir, 'project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, 'build.yaml'),
      ['pipeline:', '  on_converge:', '    - name: probe', '      run: "echo obs2"', ''].join('\n'),
      'utf-8'
    );

    const ledger = path.join(dir, 'metrics-outcomes.json');
    const previousEnv = process.env[LEDGER_ENV_VAR];
    const previousCwd = process.cwd();
    restoreFns.push(() => {
      process.chdir(previousCwd);
      if (previousEnv === undefined) delete process.env[LEDGER_ENV_VAR];
      else process.env[LEDGER_ENV_VAR] = previousEnv;
    });

    process.env[LEDGER_ENV_VAR] = ledger;
    process.chdir(projectDir);

    const { PipelineExecutor } = await import('../../src/pipeline/executor.js');
    const executor = new PipelineExecutor({ configPath: 'build.yaml' });

    const convergence = {
      converged: false,
      timestamp: new Date().toISOString(),
      cascadeDepth: 1,
      filesChanged: [],
      duration: 0,
    } as unknown as Parameters<typeof executor.execute>[0];

    const result = await executor.execute(convergence);
    expect(result.success).toBe(true);

    // The scraper resolves its ledger path the same way the producer did.
    const payload = renderMetrics(process.cwd());
    expect(seriesValue(payload, STAGE_RESULTS_FAMILY, { stage: 'probe', status: 'success' })).toBe(1);
    expect(seriesValue(payload, CONVERGENCE_FAMILY, { outcome: 'not_converged' })).toBe(1);
    expect(seriesValue(payload, STAGE_DURATION_FAMILY, { stage: 'probe' })).not.toBeNaN();

    // collectMetrics exposes the same families to in-process callers.
    const families = collectMetrics(process.cwd()).getFamilies().map(family => family.name);
    expect(families).toContain(STAGE_RESULTS_FAMILY);
    expect(families).toContain(CONVERGENCE_FAMILY);
  });
});
