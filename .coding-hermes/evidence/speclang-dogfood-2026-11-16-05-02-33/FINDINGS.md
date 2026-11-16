# Dogfood 2026-11-16 — SpecLang

- Tick: `speclang-dogfood-2026-11-16-05-02-33`
- Rev measured: `08b77a59` (clean clone at `/home/kara/.hermes/cache/scratch/speclang-df-20261116-011229/repo`)
- Host: 16 cores, `/proc/loadavg` 7.48 / 8.25 / 9.51 during the timed runs
- Method: clone → plain `npm install --no-audit --no-fund` (the documented install, no harness flags) → `npm run build` → run the documented commands as a user, not the test suite.

## What the product promises

README claims the repository ships ~452 specs, all with valid headers, and that
`./bin/speclang validate` is the verification command. That is the promise this fire tested:
*a user can clone the repo, install it, and have the documented validation command tell them the
truth about the specs.*

## What held up

| Step | Result |
|---|---|
| `npm install --no-audit --no-fund` on a clean clone | exit 0 |
| `npm run build` (tsc) | exit 0, **0.59 s** |
| `./bin/speclang --help` / `--version` | exit 0, **0.04 s** (floor) |
| `./bin/speclang status` | exit 0, **0.06–0.07 s**, reports **452** specs |
| `./bin/speclang validate` (452 files) | runs to completion, **0.44–0.53 s warm**, 0.87 s cold |
| `npm run cascade -- specs/examples.spec.dir/hello-world.spec.md` | exit 0, **0.15 s**, writes the generated file |

## What broke

### 1. The documented verification command exits 1 on the published tip

`./bin/speclang validate` → **exit 1**, 5/5 warm runs. stderr (verbatim, `validate-stderr.txt`):

```
Error validating .../specs/docs.spec.dir/playbook/NASA-SE-PLAYBOOK.md.spec.md: Failed to parse
header YAML: Source contains multiple documents; please use YAML.parseAllDocuments() at line 6,
column 1:

tags: [docs, playbook, requirements, traceability, verification, style]
---
^
```

Root cause, located in source: the spec declares `# speclang-header lines:9` while its header
block is **7** lines (id, version, layer, target, tags, then the `---` terminator). In
`src/parser/header.ts:79` the declared-count branch slices
`lines[start+1 : start+headerLineCount-1]`, and `header.ts:82` only strips a **trailing** `---`.
With `lines:9` the slice carries the real terminator mid-block *plus* the body heading, so
`parseYaml` at `header.ts:107` receives two documents and the single-document parser throws.

This is already on the board as **README-18** (was P4). The premise was re-verified rather than
re-proved: the row's claim is true at this rev. It was raised to **P1** with the root cause
attached — it is the FIRST documented command, and it fails for every user on the published tip.

Fix direction (UNVERIFIED — dogfood does not modify code): correct the spec to `lines:7`, or make
the parser use `parseAllDocuments` and name the offending line.

### 2. The machine-output form hides the failure — filed as DF-SPECLANG-9

`./bin/speclang validate --format json` on the same tree returns `reports.length = 451` while the
tree holds **452** spec files (450 `*.spec.md` + 2 `*.scl`). The failed file has **no report
entry**, so `.reports[] | select((.errors|length) > 0)` is empty: whoever reads the JSON form (the
reason to request JSON) concludes the suite is clean. Separately, stdout line 1 is a human banner,
so `validate --format json | jq` fails outright and consumers must know to strip line 1.

### 3. Install leg — SKIPPED, not passed — filed as DF-SPECLANG-10

`bash ~/.hermes/scripts/bunker-qa.sh run ./repo --keep` launched an ephemeral agent on
`bunker-mvp` (`agent=f2dc254c`), synced the repo, and then the `fresh-install` cell died looking
for a project it does not have: the deployed `qa-run.sh` lines 370–371 probe
`/home/bunker-f2dc254c/qa-noconfig-3173650/package.json` and `server.js` — both
`No such file or directory`. Its own verdict line:

```
Total time: ? | Passed: 0 | Failed: 0 | Audited: 0 | Findings: 0 | NotVerified: 0
— NOTHING AUDITED (0 cells with a verdict; wrapper steps do not count)
```

Zero cells with a verdict is a skip, never a pass. No residue: `bunker list --server bunker-mvp`
shows only the pre-existing `cf-node` and `ci-e2e-01` agents. The documented install path itself
was exercised locally and passed (see table above), so the skip is specific to the clean-host leg.

## Performance (Step 2b)

| Arm | Command | Samples | Load |
|---|---|---|---|
| floor | `./bin/speclang --version` | 0.04, 0.04, 0.04 s | 7.48–9.51 |
| headline warm | `./bin/speclang validate` | 0.87, 0.50, 0.44, 0.53, 0.49 s | 7.48–9.51 |
| headline cold | first run after build | 0.87 s | 7.48 |
| sibling op | `./bin/speclang status` | 0.06, 0.06, 0.07 s | 7.50 |
| cascade | `npm run cascade -- …/hello-world.spec.md` | 0.15, 0.15, 0.15 s | 7.48–9.51 |

`headline − floor ≈ 0.46 s` for **452 files ≈ 1.0 ms/file**; the marginal cost is linear and the
whole run is half a second. Measured: nothing here is slow enough for a user to feel, so **no
PERF row was filed** and no profile was taken — a win nobody can feel is not a finding. The cold
arm is "first execution after the build" (page cache cold for that inode), not a dropped page
cache (that needs root and was not attempted).

## Writes this fire made (and what it deliberately did not do)

- `DF-SPECLANG-9` — machine-output honesty (create + paired `task_created` event **281**).
- `DF-SPECLANG-10` — explicit SKIPPED install leg (create + paired event **282**).
- `README-18` — priority P4 → P1 plus a 1,764-char evidence note, and the title rewritten from
  `P4 — …` to `P1 — …` so the row is self-consistent (`task_updated` events **280** and **283**).
- Provenance repair: `DF-SPECLANG-6/7/8` had rows with no paired `task_created` event and no
  `created_at` (they were hand-appended by the earlier fire of this same tick). Events **277–279**
  pair them and `created_at` is stamped; `git diff --stat` on that commit shows exactly 3
  re-serialized rows in `tasks.jsonl` and 3 appended lines in `events.jsonl`.
- Event-id discipline: my first pass minted 274–282, but two sibling commits landed on
  `origin/main` while this tick worked — `d4e69294` took ids **274/275** (rows `PERF-001`,
  `QA-SPECLANG-006`, `QA-SPECLANG-3`) and `56d80070` took **276** (row `DOC-9`). Rebasing onto
  the second tip renumbered my seven events to **277–283**; both board files carry **zero
  duplicate ids**, and the sibling rows ride in on their own commits, not mine.
- Board honesty: `boardctl validate` was **OK (153 warnings)** on the pre-write tip and is
  **OK (150 warnings)** on the pushed tree, with **zero** warnings naming any row this fire
  touched; making the inherited board green is not this tick's job.
- NOT done: no code edits, no spec edits (the `lines:7` fix is left to the foreman), no repo
  visibility/permission changes, no credentials minted, no PERF row, no profile.

## Re-fire addendum (delivery 3, tick re-dispatched after the 01:02:57 failure mark)

- **Correction to section 3:** the "No residue" claim was false. Ephemeral agent `f2dc254c`
  (created `2026-11-16T06:36:01Z` for this tick's install leg) was still `running` at 5.6 GB
  when delivery 3 started. It has now been destroyed (`bunker-mvp` agents 4 -> 3). Foreign
  agent `850ebfa7` (`05:33:28Z`, named in no evidence file) was left untouched.
- Headline re-proved at `1d25137`: `./bin/speclang validate specs/docs.spec.dir/playbook/NASA-SE-PLAYBOOK.md.spec.md`
  exits 1 on 3/3 runs in 0.08-0.11 s with the same multiple-documents parse error. Row
  `DF-SPECLANG-9` premise is still live; no new row filed.
- Product tree between the measured SHA `08b77a59` and `1d25137` moved only by deleting three
  one-line root files (`python`, `typescript`, `yaml`); no arm was re-walked.
- Scheduler attribution: this tick id is recorded `failed` at `01:02:57` because of a gateway
  HTTP 502 hop-wall-timeout on both hops (`xkiro/openai/gpt-6.1-sol` and `deepseek-flash`,
  600 s each), not because the lane work failed - the work landed as `0c9ec4c3` anyway, which
  is what caused the duplicate dispatch of this same tick id.
