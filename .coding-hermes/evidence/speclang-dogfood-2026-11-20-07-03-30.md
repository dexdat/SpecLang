# Foreman evidence — tick speclang-dogfood-2026-11-20-07-03-30

Repo: /home/kara/speclang · base origin/main 1d86d2db · host 16 cores, load avg 42 at dispatch
Worker seat: openai/gpt-6.1-terra via provider xkiro (session cwd recorded in state.db sessions.cwd)

## 1. PERF-2 re-opened (previous "closed-by-verification" was false)

Committed fix 2ecc2d2d is an ancestor of origin/main. With a FRESH 0-byte lock:

    S=$(mktemp -d); mkdir -p $S/.speclang; : > $S/.speclang/cli-completion.json.lock
    cd $S && node /home/kara/speclang/bin/speclang validate /home/kara/speclang/specs/examples.spec.dir/hello-world.spec.md
    rc=0 ms=60235
    Warning: could not record CLI completion for validate: Timed out waiting for CLI completion lock: .../cli-completion.json.lock

Cause: bin/speclang lockOwnerState() parses the lock body as a PID; an empty body yields pid=0 and
falls through to the LOCK_STALE_MS (5 min) age test, so a 1-second-old lock is 'contended' and the
10 ms retry loop burns the full 60 s deadline. 2ecc2d2d only reclaims dead-PID locks.

## 2. README-4 — all three named gaps are gone (verification-only close)

| Claim | Check | Result |
|---|---|---|
| "lint command undocumented" | grep -n 'npm run lint' README.md | 640, 644, 650 — documented with the TS6/TS7 resolution note |
| "phantom 449-specs output line at README.md:279" | grep -n '449' README.md | no match |
| "Last Updated stamp stale" | grep -n 'Last Updated' README.md | 847: **Last Updated**: 2026-11-18 (2 days old) |

## 3. README-25 — no pinned counts remain (verification-only close)

    grep -nE '1995|2053|2011|2069|120 of|121 of|452|453|470|479|466' README.md   -> no output

The README now defers every count to the command that produces it ("Run `npm test` for the
authoritative number ..." lines 398-402, "Run `python3 scripts/generate_index.py --graph` for the
authoritative number of graph nodes and edges" line 753), which is the durable form of the fix the
judge asked for. Live counts for reference at this base:
_index.json specs=464, specs/*.spec.md=123, tests/**/*.test.ts=119.

## 4. DOC-5 — doc half fixed, code half reproduced and re-filed as GEN-1

* No hardcoded entry count remains (line 402 now: "Run `jq '.specs | length' _index.json` for the
  authoritative number of saved entries").
* `--generate` is no longer a documented step; line 407 warns "Only --generate rewrites the index;
  do not use it for read-only verification."
* But the underlying defect is live and larger:

    python3 scripts/generate_index.py --generate    # on clean 1d86d2db
    git diff --stat _index.json  -> 1 file changed, 17299 insertions(+), 10914 deletions(-)
    run1 sha=04cbc9c0fa8a36a2  run2 sha=9e88415bac66f604  -> NON-DETERMINISTIC
    diff (timestamp line removed) -> 2204 lines, e.g. element order flips
      ("specs/examples/hello-world","@speclang/tutorial") vs ("@speclang/tutorial","specs/examples/hello-world")
    generated output contains "@unknown/test.spec.md" (untracked 55-byte repo-root test.spec.md)

Filed as GEN-1 (P2, bug) with AC-1 determinism, AC-2 clean tree, AC-3 no stray ingestion, AC-4
read-only modes unaffected.

## 5. README-5 — two of three gaps already fixed; the third is live

* ### Testing exists (README.md:541) — satisfied.
* Last Updated 2026-11-18 present in the Path Forward region — satisfied.
* examples/auth and examples/crud-app are library modules with no top-level demo:

    npx tsx examples/hello-world/index.ts -> rc=0, 13 bytes ("Hello, World!")
    npx tsx examples/auth/index.ts        -> rc=0, 0 bytes
    npx tsx examples/crud-app/index.ts    -> rc=0, 0 bytes

  Dispatched as the third wave worker (README.md only, disjoint from the code seams).

## 6. Wave outcome

| Row | Worker commit | Merged as | Gate I ran myself | Verdict |
|---|---|---|---|---|
| PERF-2 | ec44897b | 6c4feb5d | AC-1 repro 60235ms -> 936ms, 21/21 completion tests | tier1 PASS, run 58fda9b6 |
| DF-SPECLANG-021 | 3e00a7cf | cc7d28a8 | tsc rc=0, tests/daemon 14 files 134 passed 2 skipped | tier1 PASS, run 322d3d4f |
| README-5 | 40c54e45 | 69abf2ab | both documented npx tsx -e commands re-run, real output | tier1 PASS, run 1c6c1fad |
| DOCS-RECHECK-1120 | — | — | doc evidence verified | tier1 PASS, run b554ae00 |

Two workers died at launch with "Gateway did not answer session.create" (PERF-2, README-5) and were
re-dispatched; the retries ran to completion. Tier 2 judged nothing on every run — the deepseek
endpoint answers 402 (JUDGE-1 is the row that tracks that outage), so every verdict above is tier 1
only and the FAIL/INCOMPLETE lines in those verdicts are infrastructure, not code.

See .coding-hermes/waves/SpecLang-dogfood-2026-11-20-07-03-30.json (local, gitignored). Two of four
slots used because DF-SPECLANG-020 and DF-SPECLANG-022 share bin/speclang with PERF-2 and the README
cluster shares README.md, so at most one row per seam can run at a time.
