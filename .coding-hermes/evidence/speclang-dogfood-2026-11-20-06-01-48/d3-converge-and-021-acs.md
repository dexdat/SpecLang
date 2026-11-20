# Delivery 3 — speclang-dogfood-2026-11-20-06-01-48

Ceiling: `origin/main` = **c0dd9906** (verified `git fetch origin main`). The product code tree is
**identical** across `69abf2ab..c0dd9906` — `git diff --name-only 69abf2ab..origin/main | grep -v '^\.coding-hermes/'`
returns nothing, so measurements taken at 69abf2ab hold for the tip. Only the board moved (two sibling
foreman commits: f3681c33, c0dd9906).

Everything below was produced as a real user would, with no product edits: detached worktree
`/home/kara/.hermes/cache/scratch/speclang-df-d3` (built with `npx tsc`), runtime state confined to
`.speclang/`, `.tmp/` and scratch projects under `/home/kara/.hermes/cache/scratch/`.

## Step 1 — headline timings (visible output, `/home/kara/.hermes/cache/scratch/d3-timing.sh`)

    TIMING version                            rc=0 ms=55
    TIMING validate_run1_cold                 rc=0 ms=132
    TIMING validate_run2                      rc=0 ms=104
    TIMING validate_run3                      rc=0 ms=118
    TIMING generate_dryrun_1                  rc=0 ms=73
    TIMING generate_dryrun_2                  rc=0 ms=65
    TIMING generate_dryrun_3                  rc=0 ms=67
    TIMING status                             rc=0 ms=73
    TIMING new_project_cold                   rc=0 ms=62
    TIMING validate_in_new_project            rc=0 ms=110

Command form: `cd <project> && node /home/kara/.hermes/cache/scratch/speclang-df-d3/bin/speclang <cmd>`.
Nothing here is user-feelable; every CLI subcommand is 55–132 ms.

**Perf verdict (Step 2b):** no PERF row filed. The only large number in this product is the
save→converge floor, and it is a configured debounce, not a hot path — see below. Filing it as a new
perf row would duplicate what DF-SPECLANG-020's reasoning and DF-SPECLANG-021 AC-4 already record.

## Step 2 — the real user path: create, save, converge (`d3-daemon.sh`, `d3-ac-capture.sh`)

`node bin/speclang new p3` → **62 ms**, writes package.json, specs/main.spec.md, .speclangrc,
scripts/speclang.cjs, README — **no build.yaml** (DF-SPECLANG-020 still live, still `pending`).

Daemon up on :3739 (banner ready in 2 polls). One spec save, verbatim converge block:

    [Daemon] File event: modify - specs/main.spec.md
    [Convergence] Event received: modify - specs/main.spec.md
    [Convergence] Files changed: 1, Depth: 1
    [Daemon] Routed to agent: spec-agent
    [Daemon] Cascade converged! {
      converged: true,
      filesChanged: 1,
      duration: 30927,
      cascadeDepth: 1,
      timestamp: 1795163071073
    }
    [Convergence] Cascade complete! Files: 1, Duration: 30927ms
    [Daemon] Executing pipeline...
    [Pipeline] No config file found at build.yaml, using defaults
    [PipelineExecutor] No pipeline stages configured (build.yaml missing or empty on_converge) — nothing to run.
    [Daemon] Pipeline failed (consecutive failure 1): No pipeline stages configured: add a build.yaml with pipeline.on_converge stages to this project.
    [Daemon] Cascade NOT complete — pipeline did not succeed.
    [Daemon] Auto-recascade enabled — armed for next cascade

Save analysed: wall **31,817 ms**, converge `duration: 30927` — the scaffold's own
`.speclangrc` sets `cascade.quietPeriod: 30`, so ~30.0 s of the 30.9 s is the quiet window. Actual
cascade work ≈ 0.9 s. Generated outputs afterwards:
`find . -path ./node_modules -prune -o -name '*.ts' -newer package.json -print` → **0**;
`src/generated` does not exist. A `generate --dry-run` immediately before said
`Would generate: src/generated/main.spec-main.ts` and wrote nothing.

## Step 3 — the finding (filed as DF-SPECLANG-024)

DF-SPECLANG-021 is `status: complete`, `commit_hash: cc7d28a8`, `evidence_run_id: null`,
`review_notes: null` — yet 4 of its 5 acceptance criteria fail on the tip:

| AC | requirement | observed at c0dd9906 |
|----|-------------|----------------------|
| 1 | must not count the triggering spec; `Files: 1` with 0 outputs is the before-state | still prints `Files changed: 1` / `Files: 1` with 0 outputs → **FAIL** |
| 2 | falsifiable from the log: output paths, or a separate `generated` count | summary carries only converged/filesChanged/duration/cascadeDepth/timestamp → **FAIL** |
| 3 | dry-run writes nothing and converge reports no output change; 3 outputs ⇒ ≥3 | dry-run half reproduces; 3-output half untestable until DF-SPECLANG-020 (no build.yaml) → **FAIL/blocked** |
| 4 | quiet-period semantics preserved (`Duration` still printed) | `Duration: 30927ms` printed → **PASS** |
| 5 | `grep -n filesChangedCount src/daemon/convergence.ts` shows the new accounting | `grep -c` → **0** → **FAIL** |

Root cause of the gap between the claim and reality: cc7d28a8 replaced an event counter with a
`Set` of watcher paths — `src/daemon/convergence.ts:83` `this.filesChangedPaths.add(event.path)` — and
the triggering spec *is* a watcher path. The fix de-duplicated 3 events to 1 path (real improvement)
but never excluded inputs, and never added an output count, so the user-visible number is unchanged
from the state the row calls a defect.

## Step 4 — CLI surface probes

`speclang index` → `error: unknown command 'index'`; `speclang guard` → `error: unknown command 'guard'`;
`speclang start --help` exits 2. Not filed: the shipped command list in `--help` is the contract and
these are not in it (checked `README.md`, `docs/`).

Suite (clean lock state, `TMPDIR=$PWD/.tmp`):
`npx vitest run tests/cli.test.ts --no-file-parallelism` → `43 passed | 2 skipped (45), 62,195 ms, rc=0`.

## Step 5 — install leg (bunker)

    bash ~/.hermes/scripts/bunker-qa.sh launch /home/kara/.hermes/cache/scratch/speclang-qa-c2 --server bunker-mvp
    QA-HEAD=c0dd990673bba2ec5de6da377dbd82fb443516e6
    → QA LAUNCH project: speclang-qa-c2 — detached battery on bunker-mvp (ttl 4h)
    → agent=1f93834b @ bunker-mvp (tailscale)
    → CELL fresh-install: sync repo → ~/qa-speclang-qa-c2

(First attempt was refused — `is not a git repo (git resolves to toplevel: none)` — because I handed it a
`git archive` export; re-cloned with `git clone --no-hardlinks` instead. No credentials minted, no
visibility changed.)

Battery result: see `d3-bunker-cells.md` / the row filed for this leg.
