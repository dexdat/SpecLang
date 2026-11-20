# speclang dogfood tick — speclang-dogfood-2026-11-20-06-01-48

Target: `dexdat/SpecLang` (HEAD at start `5cd4ca71`; landed board commits sit on `5916d59e`).
Method: used the shipped CLI as a user would, in a scratch tree; no product code changed.

Scratch workspace: `/home/kara/.hermes/cache/scratch/speclang-df-2026-11-20`
(`hello-cold/` from `speclang new`, `proj2/` from `speclang new` + `init widgets`, `genout/`).

## Install leg (bunker-qa.sh) — RAN, FAILED, battery did not finish

    bash ~/.hermes/scripts/bunker-qa.sh launch /home/kara/speclang
    bash ~/.hermes/scripts/bunker-qa.sh collect --evidence /tmp/bunker-qa-evidence-20261120T064217Z-1088970.jsonl

    cell                 status  detail
    repo-head            OK      tested HEAD=5cd4ca71 at 2026-11-20T06:42:56Z
    toolchain-bootstrap  OK      go 1.27.4, node v22.22.3, gcc/g++, make 4.3, jq 1.8.2, docker compose+buildx
    fresh-install        OK      [npm ci --ignore-scripts --no-audit --no-fund]
    lint                 OK      npm run lint rc=0
    tests                FAIL    rc=1 — tests/cli.test.ts (45 tests | 1 failed | 2 skipped) 34170ms
    docker_build         N/A     no Dockerfile trigger
    compose_config       N/A     no compose file trigger

    collect tail: AGENT-GONE agent=009e9990 rows=16

The ephemeral agent vanished ~5 min after launch (bunker-mvp, ttl 4h), so the per-cell log
was not harvestable and the failing test's name/assertion is unknown. This is a FAIL, not a
pass and not a skip. Copy of the cells: `bunker-qa-cells.jsonl` (this dir).

## Step 2b — perf, headline operation `speclang validate`

Same command, same tree, only the runtime lock differed:

    node bin/speclang validate specs/examples.spec.dir/hello-world.spec.md
      stale 0-byte .speclang/cli-completion.json.lock (mtime 2026-11-19 00:34): 60,253 ms, rc=0,
          stderr "Warning: could not record CLI completion for validate: Timed out waiting for
          CLI completion lock: .../.speclang/cli-completion.json.lock"
      lock removed:                                                          136 ms, rc=0

Suite, same tree:

    TMPDIR=$PWD/.tmp npx vitest run tests/cli.test.ts --no-file-parallelism
      with stale lock : 5 failed | 38 passed | 2 skipped, 265.19s (Tests timed out in 15000ms)
      lock moved aside: 43 passed | 2 skipped, 28.15s, exit 0

Hot path `bin/speclang:19-44` `recordCliCompletion()`: `deadline = performance.now() + 60_000`
(:24), retry loop :34-44, comment :31-32 claims "remove it only after confirming the writer is
gone" with no implementation; the lock is created via `fs.openSync(lock,'wx',0o600)` and never
written to (0 bytes, cannot carry a PID). Gated lanes: `bin/speclang:76`
(`validate|cascade|generate|index|guard`).

Fix landed mid-tick as `2ecc2d2d` ("reclaim stale CLI completion locks left by killed
processes"). Re-tested by this tick on the rebased tree:

    A stale 0-byte lock          -> rc=0 in 294 ms, lock reclaimed, no warning, runCount 877
    B dead-PID lock (999999)     -> rc=0 in 357 ms, reclaimed
    C live-PID lock (pid 1/EPERM)-> NOT stolen: 60,333 ms bounded wait + 1 warning, lock kept
    D suite with stale lock      -> 43 passed | 2 skipped, 58.84 s
    restore                      -> lock back to 0 bytes, mtime 2026-11-19 00:34

No other operation was slow enough for a user to feel: `speclang new` ~230 ms cold,
`generate` ~10 ms warm, `maturity`/`spec list` sub-second. Nothing filed on those.

## Daemon use (`speclang new` project + `start` + spec save)

    [Daemon] File event: modify - specs/main.spec.md
    [Daemon] Cascade converged! { converged: true, filesChanged: 1, duration: 30936 }
    [Pipeline] No config file found at build.yaml, using defaults
    [PipelineExecutor] No pipeline stages configured (build.yaml missing or empty on_converge)
    [Daemon] Pipeline failed (consecutive failure 1): No pipeline stages configured...
    [Daemon] Cascade NOT complete - pipeline did not succeed.

    on disk: find . -name '*.ts' -newer package.json  ->  nothing; no src/generated at all
    `speclang start` banner: "Dashboard: http://localhost:3000"
    curl -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ -> 401 (listener = DuckBrain pid 2966)
    node scripts/speclang.cjs mcp status -> Not running
    node scripts/speclang.cjs stop -> rc=0 in 156 ms; status afterwards: not running

## Rows filed (all in `.coding-hermes/board/tasks.jsonl`, pushed as 5916d59e)

| row | pri | state | one line |
|---|---|---|---|
| PERF-2 | P1 | complete | stale lock = +60 s per command + red suite; fixed by 2ecc2d2d, verified above |
| DF-SPECLANG-020 | P1 | pending | `new` ships no build.yaml -> first save fails, zero codegen, under a "converged!" banner |
| DF-SPECLANG-021 | P2 | pending | converge log counts input watcher events as "filesChanged/Files: 1" when 0 files were produced |
| DF-SPECLANG-022 | P2 | pending | `start` advertises a live :3000 dashboard owned by another process; `mcp status` contradicts "watcher + MCP server" |
| DF-SPECLANG-023 | P2 | pending | clean-machine battery tests cell FAIL (1 of 45); re-check on a tree with 2ecc2d2d first |

Write verification: `git rev-parse HEAD` == `git rev-parse origin/main` == `5916d59e2619b9...`,
and `git show origin/main:.coding-hermes/board/tasks.jsonl | jq` shows all five rows with the
statuses above. Evidence file present in the pushed tree (6,258 bytes).
