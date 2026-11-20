# Install-leg `tests` cell: 15 files / 86 tests are a HARNESS artifact, not product failures

Run: `speclang-dogfood-2026-11-20-06-01-48` (dogfood lane, manual loop per `coding-hermes-dogfood`)
Ceiling under test: `origin/main` → fetched upstream head `c0dd9906` (product tree identical to `69abf2ab`; non-`.coding-hermes/` diff empty)
Author: dogfood lane. No product code, board state, visibility or credentials were modified.

## 1. What the battery reported

`bunker-qa.sh launch <clone> --server bunker-mvp`, agent `1f93834b` (`qa-speclang-qa-c2`, full `git clone`, detached at `c0dd9906`).
Evidence row: `/tmp/bunker-qa-evidence-20261120T082245Z-3671662.jsonl`, `{"cell":"tests","status":"FAIL"}`.

Collected log `~/qa-logs-1012287/tests.log` on the agent, summary lines verbatim:

```
Test Files  15 failed | 112 passed | 4 skipped (131)
      Tests  86 failed | 1985 passed | 58 skipped (2129)
```

Other cells in the same battery run: `toolchain-bootstrap` OK (×8), `fresh-install` OK, `lint` OK, `docker_build` N/A, `compose_config` N/A.
So the install leg DID run — no `SKIPPED-install-bunker` row is warranted for this tick.

Failing files (15):

```
tests/ci/ci005-precommit-hook.test.ts        tests/db/ralph-loop-fresh-state.test.ts
tests/cli/history.test.ts                     tests/db/ralph-loop-lifecycle.test.ts
tests/cli.test.ts                             tests/db.test.ts
tests/cli/ts-node-example.test.ts             tests/examples/hello-world-verification.test.ts
tests/db/cascades-migration.test.ts           tests/mcp/bin-path.test.ts
tests/db/corrupt-state-db-surfaces.test.ts    tests/mcp/mcp-status-corrupt-db.test.ts
tests/db/corrupt-state-db.test.ts             tests/mcp.test.ts
tests/db/migrations.test.ts
```

## 2. The root cause, quoted

`grep -ac 'Could not locate the bindings' ~/qa-logs-1012287/tests.log` → **53**

Every failing file is on the SQLite/better-sqlite3 path (db, migrations, cascades, corrupt-state, ralph-loop, mcp*, bin-path, history, hello-world-verification, the cli `index` tests).
The battery never gave the native module a chance to build:

```
bunker-qa.sh:891   DETECT_INSTALL="npm ci --ignore-scripts --no-audit --no-fund"
bunker-qa.sh:894   DETECT_INSTALL="npm ci --ignore-scripts --no-audit --no-fund && cd $tpkg && npm ci --ignore-scripts --no-audit --no-fund"
```

`--ignore-scripts` suppresses `better-sqlite3`'s own `install` script (`prebuild-install || node-gyp rebuild --release`), so `node_modules/better-sqlite3/build/Release/better_sqlite3.node` is never produced. Note this is independent of the npm≥12 `allowScripts` story the README documents: the agent runs npm 10.9.8, where the approval model does not even apply — the flag alone removes the binding.

## 3. Three-regime proof

| Regime | Install | Test invocation | Result |
|---|---|---|---|
| Clean box (bunker agent `1f93834b`, npm 10.9.8) | `npm ci --ignore-scripts --no-audit --no-fund` (battery, line 891) | `npm test` → `vitest run --no-file-parallelism` | **15 files / 86 tests red**, 53× `Could not locate the bindings` |
| Local clone `speclang-qa-c3` @ `c0dd9906`, npm 12.2.3 | `npm ci --ignore-scripts` (same flag, reproduced deliberately) | `npx vitest run --no-file-parallelism` | **12 files / 79 tests red**, 53× `Could not locate the bindings`; `node_modules/better-sqlite3/build` does not exist |
| Local clone `speclang-qa-c4` @ `c0dd9906`, npm 12.2.3 | `npm ci` (the README/documented path) | `npm test` (`pretest: npm run build`, then `TMPDIR=$PWD/.tmp vitest run`) | **GREEN — `Test Files 127 passed \| 4 skipped (131)`, `Tests 2071 passed \| 58 skipped (2129)`, `Test Files`/`Tests` 0 failed, exit 0, Duration 28.72s** |

Checks on the reference clone `speclang-qa-c4` after plain `npm ci`:

```
node_modules/better-sqlite3/build/Release/better_sqlite3.node   → present
npm run check:sqlite-binding → OK: better-sqlite3 native binding loads (SELECT 1 -> {"x":1})
```

Two intermediate false alarms are recorded so nobody re-derives them: `npx vitest run` **without** `pretest`/`npm run build` (no `dist/`) reddens 9 files / 35 tests that load `dist/src/pipeline/executor.js`; and the README's npm≥12 remedy is *not* the cause of the bunker red (that agent is on npm 10.9.8).
One test observed during the serial runs, `tests/cli.test.ts > index > should refresh index with --refresh`, failed 3× (retry x2) in the no-build/serial regime and passes in the documented regime — same missing-`dist`/binding family, not filed separately.

## 4. Why this is worth a row

`DF-SPECLANG-023` is pending on the board with the premise "clean-machine install battery fails its tests cell: cli.test.ts 1 failed …". The collected evidence for the same cell says 15 files / 86 tests — and the whole red disappears with one install flag. Left as-is, a worker wave gets spent "fixing" 86 phantom product failures, and the QA lane keeps reporting a red that says nothing about specLang.

## 5. Performance (Step 2b) — nothing user-noticeably slow

`coding-hermes-perf` gates profiling on the number justifying it. Measured on the reference build (`c0dd9906`, `npx tsc`, `date +%s%N` around each command):

```
TIMING version                 rc=0  ms=55
TIMING validate_run1_cold      rc=0  ms=132
TIMING validate_run2           rc=0  ms=104
TIMING validate_run3           rc=0  ms=118
TIMING generate_dryrun_1       rc=0  ms=73
TIMING generate_dryrun_2       rc=0  ms=65
TIMING generate_dryrun_3       rc=0  ms=<truncated at write time; see d3-converge-and-021-acs.md>
TIMING new_project_cold (p9)   rc=0  ms=<see d3-converge-and-021-acs.md>
```

Cold-vs-warm spread on `validate` is 132 ms → 104-118 ms, i.e. ~20 ms of one-time cost; the headline operations sit an order of magnitude below the ~1 s threshold at which a CLI feels slow, and the daemon's user-visible latency is dominated by the intentional 30 s quiet period, not by compute.
Statement required by the tick: **no measured operation on specLang is slow enough that a user would notice, so no `PERF-<n>` row is filed** and no flamegraph was taken. Filing one here would devalue the real PERF rows (PERF-2, the 60 s stale-lock stall, was real and is closed).

## 6. Reproduction, exactly

```bash
# harness artifact (red)
git clone --no-hardlinks /home/kara/speclang /tmp/sp-red && cd /tmp/sp-red
git fetch origin '+refs/remotes/origin/main:refs/remotes/upstream/main'
git checkout --detach refs/remotes/upstream/main        # c0dd9906
npm ci --ignore-scripts --no-audit --no-fund
npm test                                                  # 15 files / 86 tests red, 53x bindings

# documented path (green)
git clone --no-hardlinks /home/kara/speclang /tmp/sp-green && cd /tmp/sp-green
git fetch origin '+refs/remotes/origin/main:refs/remotes/upstream/main'
git checkout --detach refs/remotes/upstream/main
npm ci
npm run check:sqlite-binding                              # OK
npm test                                                  # 127 passed | 4 skipped, 2071 passed | 58 skipped
```
