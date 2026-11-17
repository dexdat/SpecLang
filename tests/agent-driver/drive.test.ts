/**
 * Agent-driver loop — the contract an agent session relies on.
 *
 * `speclang cascade` exits 0 even when it generates nothing, and an artifact
 * that carries only the auto-generated banner is still a non-empty file. Those
 * two facts are why the driver exists: these tests pin that `drive.mjs` fails
 * closed on both, and that the happy path leaves generated files + a per-stage
 * progress record behind.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DRIVER = path.join(REPO_ROOT, 'scripts', 'agent-driver', 'drive.mjs');
const EXAMPLE_SEED = path.join(REPO_ROOT, 'scripts', 'agent-driver', 'seed.example.spec.md');

const HEADER = `# speclang-header lines:6
id: "@agent-driver/test-seed"
version: 0.1.0
layer: 1
target_lang: ts
---

# Driver test seed
`;

const tempDirs: string[] = [];

function makeDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-driver-'));
  tempDirs.push(dir);
  return dir;
}

function writeSeed(body: string): { seed: string; runDir: string; seedDir: string } {
  const seedDir = makeDir();
  const seed = path.join(seedDir, 'seed.spec.md');
  fs.writeFileSync(seed, body);
  const runDir = path.join(seedDir, 'progress');
  return { seed, runDir, seedDir };
}

function drive(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [DRIVER, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
    env: process.env,
    timeout: 120_000,
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort — TMPDIR is scratch space
    }
  }
});

describe('agent-driver loop', () => {
  it('runs the shipped example seed end to end and records every stage', () => {
    const runDir = path.join(makeDir(), 'progress');
    const { status, stdout } = drive([
      '--seed',
      EXAMPLE_SEED,
      '--run-dir',
      runDir,
    ]);

    expect(status).toBe(0);
    expect(stdout).toContain('PASS');

    const progress = JSON.parse(fs.readFileSync(path.join(runDir, 'progress.json'), 'utf-8'));
    expect(progress.ok).toBe(true);
    expect(progress.artifacts.length).toBeGreaterThan(0);
    for (const artifact of progress.artifacts) {
      expect(artifact.exists).toBe(true);
      expect(artifact.bytes).toBeGreaterThan(0);
      // Banner-only artifacts are non-empty files with no code — the failure
      // mode a byte-count check cannot see.
      expect(artifact.body_bytes).toBeGreaterThan(0);
    }

    const stageNames = progress.stages.map((s: { name: string }) => s.name);
    expect(stageNames).toEqual(['preflight', 'validate', 'cascade', 'verify', 'recheck']);
    for (const stage of progress.stages) {
      expect(stage.exit_code).toBe(0);
      expect(typeof stage.command).toBe('string');
    }

    // The machine-readable record is one JSON line per completed run.
    const lines = fs
      .readFileSync(path.join(runDir, 'progress.jsonl'), 'utf-8')
      .trim()
      .split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).artifacts.length).toBe(progress.artifacts.length);
    expect(fs.existsSync(path.join(runDir, 'progress.md'))).toBe(true);
  });

  it('emits only JSON on stdout when --json is set', () => {
    const runDir = path.join(makeDir(), 'progress');
    const { status, stdout } = drive(['--seed', EXAMPLE_SEED, '--run-dir', runDir, '--json']);

    expect(status).toBe(0);
    // A machine reader must be able to parse the whole stream.
    const record = JSON.parse(stdout);
    expect(record.ok).toBe(true);
    expect(record.artifacts.length).toBeGreaterThan(0);
  });

  it('fails closed when the cascade exits 0 but generates nothing', () => {
    const { seed, runDir } = writeSeed(`${HEADER}
## Endpoints

### @block::health @kind:endpoint
GET /health - health check

### @block::note @kind:code
No fenced body here, so this block is skipped.
`);
    const { status, stderr, stdout } = drive(['--seed', seed, '--run-dir', runDir]);

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toContain('reported no artifacts');
    const progress = JSON.parse(fs.readFileSync(path.join(runDir, 'progress.json'), 'utf-8'));
    expect(progress.ok).toBe(false);
    expect(progress.stages.find((s: { name: string }) => s.name === 'verify').exit_code).toBe(1);
  });

  it('fails closed on an artifact that is only the generated banner', () => {
    const { seed, runDir } = writeSeed(`${HEADER}
## Implementation

### @block::hollow @kind:code
\`\`\`ts
\`\`\`
`);
    const { status, stderr, stdout } = drive(['--seed', seed, '--run-dir', runDir]);

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toContain('no body');
    const progress = JSON.parse(fs.readFileSync(path.join(runDir, 'progress.json'), 'utf-8'));
    expect(progress.artifacts[0].bytes).toBeGreaterThan(0);
    expect(progress.artifacts[0].body_bytes).toBe(0);
  });

  it('treats a 0/0 "Converged: Yes" as a failure when the seed declares a test block', () => {
    // Outside tests/** the generated test is never collected by vitest, yet
    // the cascade still reports convergence on testsRun === 0.
    const { seed, runDir } = writeSeed(`${HEADER}
## Implementation

### @block::thing @kind:code
\`\`\`ts
export const thing = 1;
\`\`\`

### @block::thing-test @kind:test
\`\`\`ts
import { describe, it, expect } from 'vitest';
import { thing } from './thing';

describe('thing', () => {
  it('is one', () => {
    expect(thing).toBe(1);
  });
});
\`\`\`
`);
    const { status, stderr, stdout } = drive(['--seed', seed, '--run-dir', runDir]);

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toContain('0 tests executed');
  });

  it('exits 2 when the seed is missing', () => {
    const { status, stderr } = drive(['--seed', path.join(makeDir(), 'nope.spec.md')]);
    expect(status).toBe(2);
    expect(stderr).toContain('seed not found');
  });
});
