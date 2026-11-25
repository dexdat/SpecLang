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
    // QA-SPECLANG-016: the coverage surface must match the tsc-build surface.
    // tsconfig.json type-checks src/** minus a set of excludes, so coverage
    // mirrors exactly that set: include 'src/**' and exclude every path that
    // tsconfig.json excludes from the build. The previous include
    // ['src/dashboard/**'] presented the ONE subtree tsc never type-checks as
    // the project's coverage — inverted, and misleading in CI.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        // Same file globs tsconfig.json includes for the build: only the
        // type-checked TypeScript surface is reported as project coverage.
        // NOTE: these globs are unanchored in Istanbul's matcher, so
        // 'src/**/*.ts' also matches specs/<x>.spec.dir/src/**/*.ts — the
        // specs/** exclude below prunes all spec dirs except mcp.spec.dir,
        // the only one tsconfig.json checks (its include line).
        'src/**/*.ts',
        'src/**/*.tsx'
      ],
      // Mirror of tsconfig.json's exclude list restricted to src/, plus the
      // spec-dir correction described above (tsconfig's root index.ts and its
      // .py excludes are moot/unrepresentable for TS coverage globs and are
      // left out of the reported surface).
      exclude: [
        'src/dashboard/**',
        'src/codegen.ts',
        'src/ralph-loop.ts',
        'src/ralph-loop/**',
        'src/speclang-mcp.ts',
        'src/validation-system.ts',
        'src/validation.ts',
        'src/cli/**',
        'src/mcp/**',
        'src/indexer/**',
        'src/parser/**',
        'src/codegen/**',
        'src/generated/**',
        'src/lsp/**',
        // Spec-dir corpus: none of specs/*.spec.dir/src is part of the
        // vitest-reported surface. tsconfig.json checks only mcp.spec.dir
        // (of 86 spec dirs) plus root src/**; picomatch's `ignore` in the
        // coverage matcher does not support '!specs/mcp...' negation (proven:
        // any negated ignore pattern silences ALL instrumentation), so the
        // spec dirs are excluded wholesale — 9 mcp.spec.dir files drop from
        // the report, keeping it a strict subset of the tsc-checked tree.
        './specs/**',
        '**/*.spec.ts',
        '**/*.test.ts'
      ],
      // QA-SPECLANG-016: measured-floor thresholds. Measured floor on the new
      // surface at commit time (full `vitest run --coverage`, 2123 tests,
      // exit 0): statements 23.68, branches 19.83, functions 24.21,
      // lines 23.81. Thresholds sit ~4-5 points below that floor so the gate
      // is stable under day-to-day drift but still fails a substantive
      // regression.
      thresholds: {
        statements: 19,
        branches: 15,
        functions: 19,
        lines: 19
      }
    }
  }
});