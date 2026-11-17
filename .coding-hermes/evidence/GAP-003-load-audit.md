# GAP-003 — LOAD-HYGIENE: bound test-suite host load

Row: `GAP-003` — "bound test-suite host load (audit tests for parallel-spawn /
per-assertion subprocess / unbounded-loop patterns; fix the worst offender with bounded
waves or in-process coverage; keep full-suite coverage; NO skip-gates, NO
fleet-scheduling changes)".

Worktree: `/home/kara/worktrees/speclang-GAP-003`, branch `wt/GAP-003`, base
`94dd3ea8` (origin/main).

All numbers below were produced on this host (16 logical CPUs), which is **shared with
the rest of the fleet** — `loadavg` moved between 13 and 64 during the session from
other agents' work. Two consequences for reading this file:

- every process count is sampled **scoped to the suite's own process tree** (a
  descendant walk from the vitest PID), so sibling agents' work is never counted;
- wall-clock is reported as a range across repeated runs, not as a single delta. The
  metric that moved deterministically is process fan-out; wall clock did not regress
  (see §4).

---

## 1. Audit — every test path that spawns OS subprocesses

Command:

```bash
grep -rlE 'execSync|execFileSync|spawnSync|\bspawn\(|execFile\(' tests --include='*.test.ts'   # 24 files
grep -rhoE 'execSync|execFileSync|spawnSync' tests --include='*.test.ts' | wc -l                 # 79 sync sites
grep -rhoE '\bspawn\(|execFile\('            tests --include='*.test.ts' | wc -l                 #  9 async sites
grep -rlE 'it\.concurrent|describe\.concurrent' tests --include='*.test.ts' | wc -l              #  0
```

Totals: **24 test files, 88 spawn call sites (79 synchronous, 9 asynchronous), zero
files using `it.concurrent` / `describe.concurrent`.**

"Sites" = occurrences of the spawn primitive. "Overlap?" = can two or more children of
*that file* be alive at once. "Isolated peak" = peak concurrent descendants measured by
running that file ALONE (`npx vitest run <file>`, 0.1s sampling). A file that only uses
`execSync`/`spawnSync`/`execFileSync` cannot overlap inside itself: the call blocks the
worker's event loop, so one child at a time. Files with the 9 async sites also contain no
`Promise.all`/`it.concurrent` over them, so their children are sequential too — that is a
structural property of the sources (`Promise.all` in `tests/symlinks.test.ts` wraps
in-process `quickRebuild`/`fs` calls, not subprocesses).

| file (under `tests/`) | sync sites | async sites | overlap inside the file? | isolated peak descendants | role in host load |
|---|---|---|---|---|---|
| `e2e/spec-to-code.test.ts` | 11 | 0 | no (all sync; serialized) | 5 | runs the real CLI ~11x sequentially; 1 s wall |
| `cli/history.test.ts` | 11 | 0 | no | 6 | 18 tests driving `node bin/speclang history` + git |
| `ci/ci005-precommit-hook.test.ts` | 9 | 1 | no | 3 | git + hook subprocesses |
| `cli/new-project-runnable.test.ts` | 7 | 0 | no | 4 | `execFileSync` per assertion |
| `ci/ci006-coverage.test.ts` | 5 | 1 | no (one nested run) | **7** | **spawns a nested `npx vitest run --coverage`; worst per-file fan-out (see §5)** |
| `cli/generate-extraction.test.ts` | 5 | 0 | no | n/m | CLI dry-runs |
| `cli/downgrade.test.ts` | 3 | 0 | no | n/m | CLI |
| `cli/expand.test.ts` | 3 | 0 | no | n/m | CLI |
| `cli/pack-contract.test.ts` | 3 | 0 | no | n/m | `npm pack` + bash |
| `daemon/think003-provider-adapter.test.ts` | 3 | 0 | no | n/m | CLI |
| `daemon/pid-file-enoent.test.ts` | 0 | 3 | no | 5 | spawns a live child then kills it |
| `cli/start-dashboard-contract.test.ts` | 0 | 2 | no | 5 | `spawn` + `execFile` for the dashboard |
| `daemon/arch003-parallel-agents.test.ts` | 2 | 0 | no (fake executor, in-process) | n/m | spawns only for git scaffolding |
| `cli/init-cascade-contract.test.ts` | 2 | 0 | no | n/m | CLI |
| `cli/new-cascade-contract.test.ts` | 2 | 0 | no | n/m | CLI |
| `cli/ts-node-example.test.ts` | 2 | 0 | no | n/m | `spawnSync` launcher |
| `db/compiled-artifact-guard.test.ts` | 2 | 0 | no | n/m | git |
| `db/corrupt-state-db.test.ts` | 2 | 0 | no | n/m | git |
| `db/corrupt-state-db-surfaces.test.ts` | 2 | 0 | no | n/m | git |
| `examples/hello-world-verification.test.ts` | 2 | 0 | no | n/m | CLI |
| `mcp/mcp-status-corrupt-db.test.ts` | 2 | 0 | no | n/m | CLI |
| `daemon/arch002-background-daemon.test.ts` | 0 | 1 | no | n/m | daemon child |
| `db/ralph-loop-fresh-state.test.ts` | 0 | 1 | no | 5 | spawns `tsx src/ralph-loop.ts` (leaks an orphan — §5) |
| `poc-e2e.test.ts` | 1 | 0 | no | n/m | CLI |

(`n/m` = not measured individually; every measured file peaked at 3-7 descendants, i.e
none of them is a load source on its own.)

**Conclusion of the audit:** no single test file fans out subprocesses. The worst
isolated file peaks at 7 descendant processes. The load therefore does **not** come from
class (a) — an individual file fanning out. It comes from class (b).

### The named offender: vitest's own file-level worker pool

`vitest.config.ts` declared no `maxWorkers` and no `poolOptions`, so vitest used its
default `maxWorkers = availableParallelism() - 1` — confirmed in the installed binary
(`node_modules/vitest/dist/chunks/cli-api.B0Pz1_R7.js`, `resolveMaxWorkers()`:
`return Math.max(numCpus - 1, 1)`), i.e. **15 worker forks on this 16-core host**.

Each fork is a full Node process, and 24 of the 120 test files shell out to real CLIs.
Sync spawns serialize *inside* a worker but not *across* workers, so peak host load was
`workers x in-flight CLI child`. Measured: the pool, not any file, is the multiplier —
one file alone peaks at 7 descendants; 15 files at once peaked at 36.

---

## 2. Baseline (before) — full suite, unclamped

Command (exactly):

```bash
TMPDIR=$PWD/.tmp npx vitest run --reporter=dot
```

Run at base commit `94dd3ea8` with a clean tree:

```
 Test Files  115 passed | 4 skipped (119)
      Tests  1958 passed | 58 skipped (2016)
   Duration  36.00s (transform 24.68s, setup 4.68s, import 35.37s, tests 187.05s, environment 19ms)
EXIT:0
```

Sampled over that run (0.2 s interval, descendant-scoped):

```
peak_descendants = 36
peak_descendant_kinds = { sh: 7, node: 25, "npm run build": 1, tsc: 1,
                          "npm exec vitest": 1, git: 1 }
```

**before: 36 concurrent child processes (25 of them `node`) and 36.00 s wall clock.**

Baseline count note: the brief predicted "~1826 passed / 58 skipped". The measured
figure at the base commit with an untouched tree is **1958 passed / 58 skipped (2016
tests, 119 files)**. This is pre-existing at `94dd3ea8` — no file was added, removed or
skipped to reach it; the higher number is simply the corpus at this commit. Skips are 58
before and 58 after.

---

## 3. The fix

`vitest.config.ts` (only production file changed):

```ts
import { availableParallelism } from 'os';
...
const TEST_WORKERS_MIN = 2;
const TEST_WORKERS_MAX = 16;
const maxTestWorkers = Math.min(
  TEST_WORKERS_MAX,
  Math.max(TEST_WORKERS_MIN, Math.floor(availableParallelism() / 2)),
);
...
  test: {
    environment: 'node',
    globals: true,
    // LOAD-HYGIENE (GAP-003): bounded file-level parallelism, clamp 2-16.
    maxWorkers: maxTestWorkers,
```

Location: `vitest.config.ts`, module scope (`maxTestWorkers`) and `test.maxWorkers`
inside the exported `defineConfig({...})`. The worker pool is **clamped 2-16**
(inclusive), derived from `availableParallelism() / 2`:

- 16-core host → `maxWorkers = 8` (verified: `node_modules/.bin/tsx` importing the config
  prints `{"maxWorkers": 8}`);
- 64-core host → `16` (upper bound of the clamp);
- 2-core CI runner → `2` (lower bound; `max(2, 1)`).

`maxWorkers` is the single source of truth. It is what `resolveMaxWorkers()` consults
*before* `poolOptions.forks.maxForks`, and a CLI `--maxWorkers` still outranks it, so
`npm run test:coverage`'s existing `--maxWorkers 1` keeps precedence.

Regression guard: `tests/load-hygiene.test.ts` (new, 4 tests) asserts the resolved value
equals the clamp of `availableParallelism()/2`, that it stays in 2-16, that the config
source still carries both bounds and the wiring, and that no `tests/**/*.test.ts(x)` glob
was dropped from `include` / added to `exclude` and `fileParallelism` is not `false`.
RED-proved before committing: setting `maxWorkers: 15` in the config made it fail with
`AssertionError: expected 15 to be 8` plus the missing-wiring assertion (2 failed | 2
passed); restoring the file byte-for-byte (sha256 `23d40830…a03c` before and after) made
it 4 passed.

---

## 4. After — full suite, clamped

Same command, no flags:

```
 Test Files  116 passed | 4 skipped (120)
      Tests  1962 passed | 58 skipped (2020)
   Duration  27.35s (transform 3.79s, setup 1.32s, import 7.31s, tests 115.82s, environment 12ms)
EXIT:0
```

(The 116th file / 1962-1958 = 4 extra tests are the new `tests/load-hygiene.test.ts`
guard. **Skips unchanged: 58.**)

**after: 20-21 concurrent child processes (12-15 of them `node`) and 27.29-33.08 s wall
clock** across three consecutive clamped runs.

### A/B/A control — causality, not drift

The host is shared, so the pool was also forced back to 15 with the CLI while the clamped
config was in place (`--maxWorkers 15` outranks the config). Same tree, same corpus,
minutes apart:

| run | workers | peak descendants | `node` at peak | peak aggregate CPU% | wall clock | tests |
|---|---|---|---|---|---|---|
| **before** (base commit, default pool) | 15 | **36** | 25 | not sampled | **36.00 s** | 1958 P / 58 S |
| control (fix in tree, `--maxWorkers 15`) | 15 | **31** | 21 | — | 27.78 s | 1958 P / 58 S |
| control CPU (`--maxWorkers 15`, full corpus) | 15 | **33** | 22 | **761.2 %** | 28.81 s | 1962 P / 58 S |
| after run 1 (config) | 8 | **21** | 15 | — | 33.08 s | 1958 P / 58 S |
| after run 2 (config) | 8 | **20** | 13 | — | 27.29 s | 1958 P / 58 S |
| after CPU (config, full corpus) | 8 | **20** | 12 | **672.9 %** | 28.27 s | 1962 P / 58 S |

- **before → after peak child processes: 36 → 20-21 (-42 %); `node` children 25 → 12-15
  (-48 %).** Restoring 15 workers puts it straight back to 31-33, so the drop is the pool
  size and not host warm-up.
- **before → after peak aggregate CPU: 761.2 % → 672.9 % (-12 %)**, measured on the
  identical 120-file corpus back to back. This is the honest size of the effect on a
  CPU-bound suite: total CPU work is unchanged (it is the same tests), so what the clamp
  buys is process fan-out (and the fork/memory storm that comes with it), not CPU
  elimination.
- Wall clock did not regress: unclamped runs measured 27.78-36.00 s, clamped runs
  27.29-33.08 s. The paired full-corpus runs are 28.81 s (15 workers) vs 28.27 s (8
  workers). The signal is inside this host's noise band; no timing-sensitive assertion
  was touched and no threshold had to be re-tuned.

Peak CPU% is the interval-over-interval sum of `utime+stime` deltas across the suite's own
descendants, in "percent of one core" units (761 % ≈ 7.6 cores busy).

---

## 5. Findings deliberately NOT fixed here

1. **`tests/ci/ci006-coverage.test.ts`** is the largest per-file fan-out measured (7
   descendants: it spawns a nested `npx vitest run --coverage` for its AC4). It is
   bounded — one file, one nested fork — and its nested invocation is the very thing the
   test exists to prove, so it was left unchanged rather than weakened. It contributes
   the `npm exec vitest` entry in the peak histograms.
2. **Orphaned `src/ralph-loop.ts` processes.** `tests/db/ralph-loop-fresh-state.test.ts`
   and `poc-e2e.test.ts` spawn `tsx src/ralph-loop.ts` and the loop has no exit path, so
   each full-suite run leaves ~2 orphans that live forever (35 were alive during this
   audit). They are **not** a load source: each sits at 0.0 % CPU (18 CPU-seconds total
   across the whole set over ~4 h), which matches the correction already recorded on row
   `GAP-004`. They inflate process counts, not load, and fixing them is `GAP-004`'s scope
   — deliberately untouched here to avoid colliding with that row.
3. No fleet-scheduling, CI-workflow, `package.json` script, or `.coding-hermes/board/`
   change was made.

---

## 6. Coverage statement

**No test file was skipped, excluded, converted to `it.skip`/`describe.skip`, or removed
to win wall clock.** The `include` set is byte-identical
(`tests/**/*.test.ts`, `tests/**/*.test.tsx`); `exclude` still lists only
`tests/e2e/**/*.spec.ts`; `fileParallelism` was not disabled. Pass/skip counts:
**before 1958 passed / 58 skipped (2016 tests, 119 files); after 1962 passed / 58 skipped
(2020 tests, 120 files)** — the only delta is the 4 new assertions in
`tests/load-hygiene.test.ts`, and the 58 skips are the same pre-existing skips.

Verification commands and results:

```
TMPDIR=$PWD/.tmp npx vitest run          → Test Files 116 passed | 4 skipped (120)
                                           Tests 1962 passed | 58 skipped (2020)
                                           EXIT 0
npx tsc --noEmit                         → rc=0
```
