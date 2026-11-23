// SPECLANG-GENERATED: UI Testing - Vitest Configuration
// Source: @speclang/ui.testing
// CI-002: Redirect TMPDIR to project-local .tmp/ to avoid /tmp EDQUOT

import { defineConfig } from 'vitest/config';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { availableParallelism } from 'os';

// Set TMPDIR before any compilation or worker spawning happens.
// /tmp is a 30G tmpfs shared across the system and can hit EDQUOT.
// .tmp/ is project-local, gitignored, and on a 1.8T disk with 500G free.
const projectTmp = join(process.cwd(), '.tmp');
mkdirSync(projectTmp, { recursive: true });
process.env.TMPDIR = projectTmp;

// ---------------------------------------------------------------------------
// LOAD-HYGIENE (GAP-003): bound the file-level worker pool.
//
// Vitest's default is `maxWorkers = availableParallelism() - 1` (15 on a
// 16-core host). Every one of those workers is a full Node process, and ~25 of
// the test files spawn OS subprocesses synchronously (`execSync`/`spawnSync`/
// `execFileSync` — see .coding-hermes/evidence/GAP-003-load-audit.md). Sync
// spawns serialize inside a worker but not ACROSS workers, so the suite's peak
// host load is (workers x in-flight CLI child) on a box the rest of the fleet
// shares. Measured on 16 cores: the heaviest single test file peaked at 7
// concurrent descendants, while the unclamped run peaked at 36 descendants
// (25 `node`) — i.e. file-level parallelism, not any one file, dominates.
//
// The pool is therefore derived from CPU count and clamped to the inclusive
// range 2-16 (cpus / 2): enough to keep the full suite fast, low enough that a
// shared host is not saturated. Coverage is unchanged — no test file is
// excluded, skipped, or run in a serial-only mode; only the number of workers
// is bounded. `npm run test:coverage` already pins `--maxWorkers 1` on the CLI,
// which keeps precedence over this value.
const TEST_WORKERS_MIN = 2;
const TEST_WORKERS_MAX = 16;
const maxTestWorkers = Math.min(
  TEST_WORKERS_MAX,
  Math.max(TEST_WORKERS_MIN, Math.floor(availableParallelism() / 2)),
);

export default defineConfig({
  // Redirect Vite's transform cache to project-local .vite-cache/
  cacheDir: join(process.cwd(), '.tmp', 'vite-cache'),
  test: {
    environment: 'node',
    globals: true,
    // LOAD-HYGIENE (GAP-003): bounded file-level parallelism, clamp 2-16.
    // See the block comment above `maxTestWorkers` for the measurements.
    // `maxWorkers` is the single source of truth: vitest resolves it in
    // `resolveMaxWorkers()` before it ever looks at `poolOptions.forks.maxForks`,
    // and a CLI `--maxWorkers` still wins over it.
    maxWorkers: maxTestWorkers,
    // QA-SPECLANG-4: explicit, bounded budgets. A single test, hook or teardown
    // that never settles used to be able to wedge the whole run until an
    // external `timeout` killed it, with no failure report to show for it.
    // Per-test `{ timeout: ... }` declarations (e.g. CI-006's 120s coverage
    // run) still win; these bounds apply to everything that declares nothing.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    teardownTimeout: 20_000,
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup-tmpdir.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx'
    ],
    // QA-SPECLANG-011: tests/e2e/spec-to-code.test.ts is intentionally
    // INCLUDED with npm test (include glob 'tests/**/*.test.ts' picks it up,
    // and the full suite is green with it since the pretest build hook
    // landed). The former exclude pattern 'tests/e2e/**/*.spec.ts' was a
    // no-op: no file under tests/e2e/ matches *.spec.ts. The key is omitted
    // entirely so vitest's DEFAULT excludes (node_modules, dist, .git, ...)
    // stay in force instead of being wiped by an empty array.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/dashboard/**'
      ]
    }
  }
});