# Index baseline — 2026-11-20 (OBS-6)

Baseline measurement for `speclang index` over this repository's own `specs/` tree,
plus what the same run records for agent-path token accounting.

Worktree: `/home/<user>/worktrees/speclang-OBS-6`, branch `wt/OBS-6`, base commit
`e6e6806e` (= `origin/main` at run time). Node deps installed with
`npm ci --no-audit --no-fund`, build via `npm run build` (`tsc`, exit 0).

This row only measures. Nothing about index generation was changed.

## 1. Headline counts

| Measurement | Value | Source |
| --- | --- | --- |
| Index entry count — spec files fed to the generator | **493** | run output: `Found 493 spec files` / `- Specs: 493` |
| Index entry count — ids stored in `index.specs` (what the CLI prints as `Total specs`) | **485** | run output: `Total specs: 485`; `jq '.specs\|length' _index.json` = 485 |
| Tracked spec files — the row's command, `git ls-files 'specs/**/*.spec.md' \| wc -l` | **346** | command output |
| Signed delta, `index.specs` ids minus row file count | **+139** | 485 − 346 |
| Signed delta, generator entries minus row file count | **+147** | 493 − 346 |

The two index numbers are different measurements of the same run: 493 entries are
created (one per parsed file) and stored into a dictionary keyed by spec id, so 493
entries collapse to 485 keys. 8 ids are duplicated across files, measured directly:

```
$ sort /tmp/obs6-ids.txt | uniq -d          # 493 one-per-file `id:` header lines
id: "@speclang/index"
id: "@speclang/layer-definitions"
id: "@speclang/types"
id: "@speclang/ui-visual-design"
id: "@specs/guard"
id: "@specs/indexer"
id: "@specs/split"
$ sort /tmp/obs6-ids.txt | uniq | wc -l
485
```

## 2. Why the delta exists (measured composition, not a fix)

The generator walks four file classes under `specs/`
(`specs/indexer.spec.dir/src/index.ts:179-219`): `.scl`, `.spec.md`, `.spec.yaml`,
and `*.<ext>.spec`. Measured on disk for this checkout:

| Class | Files | Tracked in git |
| --- | --- | --- |
| `*.spec.md` | 468 | 468 |
| `*.scl` | 2 | 2 |
| `*.spec` (code-spec, e.g. `codegen/ts.spec`) | 23 | 23 |
| `*.spec.yaml` | 0 | 0 |
| **Total generator input** | **493** | **493** |

Two separate reasons for the delta against the row's command:

1. **File classes.** 25 of the 493 inputs are not `.spec.md` (2 `.scl` + 23 `.spec`).
2. **The row's glob omits top-level specs.** In git pathspec form,
   `specs/**/*.spec.md` requires at least one directory level below `specs/`, so the
   122 `.spec.md` files sitting directly in `specs/` are not matched. They are
   tracked, not untracked:

```
$ git ls-files 'specs/**/*.spec.md' | wc -l      # the row's command
346
$ git ls-files 'specs/*.spec.md' | wc -l         # `*` spans `/` in git pathspec
468
$ git ls-files specs | grep -c '\.spec\.md$'     # unambiguous form
468
$ find specs -maxdepth 1 -name '*.spec.md' -type f | wc -l
122
$ LC_ALL=C comm -13 /tmp/obs6-disk.txt /tmp/obs6-tracked.txt | wc -l   # tracked-but-missing-on-disk
0
```

So against the *complete* tracked `.spec.md` set the deltas are:

| Baseline | Tracked files | Index ids | Signed delta | Generator entries | Signed delta |
| --- | --- | --- | --- | --- | --- |
| Row command (`specs/**/*.spec.md`) | 346 | 485 | **+139** | 493 | **+147** |
| All tracked `.spec.md` (`specs/*.spec.md`) | 468 | 485 | **+17** | 493 | **+25** |

The +17 reconciles exactly: 2 `.scl` + 23 `.spec` − 8 duplicate ids = +17.

## 3. Agent-path token accounting: UNMEASURED — no token number is recorded

Finding: the `index` run records **no** token totals, on the agent path or anywhere
else. This is not "zero tokens"; there is no accounting to read. Evidence:

1. **No token reference in the index path.** `grep -ci token` returns 0 for
   `specs/cli.spec.dir/src/commands/index.js` (the compiled command that executed) and
   `grep -rni token specs/indexer.spec.dir/src src/cli/commands/index.ts` returns no
   matches. The command's entire output is counts and timestamps (section 4).
2. **Index entries have no token fields.** The 15 keys on a stored entry, read from the
   generated index: `agent_support, blocks, content_refs, depends_on, file,
   header_lines, id, lastModified, layer, lines, project_level, short, status, tags,
   version`. (`lines` is the file's byte size from `stat.size`, not a token count.)
3. **The run makes no agent/LLM call at all.** `refreshIndex()` calls
   `generateIndex()` plus `populateDatabase()` (`specs/cli.spec.dir/src/utils.ts:100-112`);
   the population path writes spec rows to SQLite and invokes no provider.
4. **Token numbers exist only on the cascade path, and are printed, never stored.**
   `CascadeCoordinator.collateMetrics()` sums `input_tokens` / `output_tokens` /
   `reasoning_tokens` per phase (`specs/cascade.spec.dir/src/coordinator/index.ts:613-641`),
   attaches them to the cascade result only when `--metrics` is passed
   (`.../coordinator/index.ts:461-464`), and nothing persists them. The repo's own
   audit states this: "per-cascade token totals + per-phase token breakdown … only
   surfaced when `--metrics` is passed *and* verbose — printed, never stored"
   (`docs/observability-spec.md:71`), and "No token cost in the metric namespace until
   the tokens are actually produced" (`docs/observability-spec.md:281-283`).
5. **No storage for it either.** `grep -rni token specs/sqlite.spec.dir/src/migrations.ts`
   returns nothing: there is no token column in any table (`specs`, `sessions`,
   `events`, `commands`, `cascades`, …).
6. `TokenCounter` (`specs/split.spec.dir/src/token-counter.ts`) is a 1-token-≈-4-chars
   approximation used only by the spec-split size checker; it is not called by the
   index command and produces no recorded total.

Baseline value for the report's token column: **unmeasured / unavailable**. Any future
"agent-path token total" line needs new instrumentation; this row does not have a
number to compare against.

## 4. Exact commands and verbatim output

### 4.1 The row's literal command — fails

```
$ cd /home/<user>/worktrees/speclang-OBS-6
$ node bin/speclang index
error: unknown command 'index'
EXIT=1
```

`bin/speclang` is the shipped CommonJS CLI (3191 lines). It registers 26 commands
(`start, cascade, agent, status, stop, daemon {start,stop,status}, validate, check,
generate, build, bootstrap, mcp {start,status,stop}, new, expand, search, maturity,
upgrade, downgrade, init, history`) and none of them is `index`; the only occurrence of
the word is the completion-lane list at `bin/speclang:160`. The `index` command is registered only in the TypeScript
CLI entry point (`src/cli/index.ts:163`), which is excluded from `tsc`
(`tsconfig.json` `exclude: ["src/cli/**"]`) and therefore has no `dist/` build.

### 4.2 The TypeScript CLI entry point — also fails

```
$ npx ts-node src/cli/index.ts index
Error: Cannot find module './commands/maturity.js'
Require stack:
- /home/<user>/worktrees/speclang-OBS-6/specs/cli.spec.dir/src/index.ts
EXIT=1
```

`src/cli/index.ts` is a symlink into `specs/cli.spec.dir/src/`; that directory ships
compiled `.js` siblings for every command except `maturity` (only `maturity.ts` and
`check.ts`/`transition.ts` lack `.js`), so the compiled CLI in the spec dir cannot load.

### 4.3 The command as executed (workaround, same code the CLI calls)

The only entry point that runs `indexCommand` end to end is the compiled CLI that ships
in the spec dir:

```
$ node specs/cli.spec.dir/src/index.js index
Generating spec index for specs...
Found 493 spec files
Created _index.json
  - Specs: 493
  - References: 24
  - Missing refs: 17
  - Orphans: 118
  - Cycles: 0
=== Spec Index ===

Total specs: 485
Generated: 2026-11-20T14:36:22.696ZZ

Validation:
  Total refs: 24
  Missing refs: 17
  Cycles: 0
  Orphans: 118
EXIT=0
```

Repeated with `--json` for machine-readable numbers (same counts, exit 0):

```
$ node specs/cli.spec.dir/src/index.js index --json
Generating spec index for specs...
Found 493 spec files
Created _index.json
  - Specs: 493
  - References: 24
  - Missing refs: 17
  - Orphans: 118
  - Cycles: 0
{
  "specs": 485,
  "generated": "2026-11-20T14:37:36.449ZZ",
  "validation": { "total_specs": 493, "total_refs": 24, "missing_ref_count": 17, ... },
  "cycles": [],
  "orphans": [ ... 118 entries ... ]
}
EXIT=0
```

Both runs went through `indexCommand` → `loadIndex()`; `.speclang/_index.json` does not
exist in this checkout, so `loadIndex()` falls back to `generateIndex()`
(`specs/cli.spec.dir/src/utils.ts:87-95`), which prints the generator lines above. The
`generated` field carries a doubled zone suffix (`…696ZZ`) because the generator appends
`'Z'` to an already-ISO string (`specs/indexer.spec.dir/src/index.ts:309`) — recorded
here as observed, not fixed by this row. The write happens because `generateIndex()`
defaults `outputPath` to `_index.json` (`specs/indexer.spec.dir/src/types.ts:145`).

### 4.4 File counts

```
$ git ls-files 'specs/**/*.spec.md' | wc -l
346
$ git ls-files 'specs/*.spec.md' | wc -l
468
$ find specs -type f \( -name '*.scl' -o -name '*.spec.md' -o -name '*.spec.yaml' -o -name '*.spec' \) | wc -l
493
```

## 5. Baseline validation numbers from the same run

| Field | Value |
| --- | --- |
| Entries parsed | 493 |
| Unique spec ids stored | 485 |
| Total refs (valid) | 24 |
| Missing refs | 17 |
| Orphans | 118 |
| Cycles | 0 |

## 6. Side effects observed

- The run writes `_index.json` at the repository root (tracked, 441,639 bytes), because
  `generateIndex()` defaults its `outputPath` there and `loadIndex()`'s fallback does not
  override it. This report restored that file (`git checkout -- _index.json`) so the
  commit is docs-only.
- `bin/speclang index` also created `.speclang/cli-completion.json` (gitignored) via the
  completion-lane recorder at `bin/speclang:157-172`, recording the failed `index` lane.
- `dist/` was produced by `npm run build` (gitignored).

## 7. How to reproduce

```
cd /home/<user>/worktrees/speclang-OBS-6
npm ci --no-audit --no-fund          # better-sqlite3 native binding required
npm run build                         # tsc, exit 0
node specs/cli.spec.dir/src/index.js index --json
git ls-files 'specs/*.spec.md' | wc -l         # 468 — complete tracked .spec.md set
git ls-files 'specs/**/*.spec.md' | wc -l      # 346 — the row's glob (drops specs/*.spec.md)
git checkout -- _index.json                    # the run rewrites this tracked file
```
