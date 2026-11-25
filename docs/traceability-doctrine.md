# Traceability doctrine — the repository-local contract

How a unit of work in this repository is identified, and how a reader follows it
from the board row that names it to the commit and verdict that prove it.

This file is the contract. It is written against artifacts that already exist in
this repository — the board, the wave manifests, the GitReins verdict store, the
spec tree — and it names the exact paths and key names of each. Nothing here
invents a parallel scheme; where the repository's practice is thinner than the
contract, the gap is stated in [What this contract does not guarantee](#5-what-this-contract-does-not-guarantee).

Audience: developer (what to write when you land work), operator (what to check
when a trace is incomplete), integrator (what is guaranteed vs best-effort).
Related: [docs/gitreins-verdicts.md](gitreins-verdicts.md) covers verdict
persistence in depth; this file covers the identity of work.

---

## 1. The marker

A trace is a single line of `key=value` pairs whose first token is the literal
prefix `ch:trace`:

```
ch:trace row=<ROW-ID> spec=<ref|none:reason> wave=<tick-id[#phase]|none:reason> test=<path[::case]|none:reason> evidence=<path|run-id|none:reason> witness=<what|none:reason> verdict=<run-id>:<RESULT|none:reason> commit=<sha|none:open> memory=<namespace:key|none:reason>
```

Rules:

- One line, no newlines. Values never contain spaces — a path with a space would
  break every grep that finds markers — so single tokens only.
- `none:` is never bare. Every absent field carries a hyphenated reason token
  (`none:open-finding`, `none:worker-worktree`, `none:exact-key-not-found`) so a
  reader can tell "not yet" from "deliberately not applicable".
- Fields are written **twice** in a normal lifecycle: at open (audit/dispatch
  phase, most values `none:<reason>`) and at close (resolved). The close value
  supersedes; the row keeps both by appending rather than replacing, so the
  correction history survives.
- Extra fields are tolerated and are not part of the contract. Practice today
  carries `doc=` (the file the work changes) and `prompt=` (the skill that drove
  the lane). Integrators must not depend on them.

Where markers live (all four are real in this repository):

| location | form | real example |
| --- | --- | --- |
| board row `foreman_note` / `reasoning` | appended text on `.coding-hermes/board/tasks.jsonl` | row `DOC-7`, `.coding-hermes/board/tasks.jsonl:119` |
| board event `detail` | JSON string field on `.coding-hermes/board/events.jsonl` (`"markers": [...]`) | event 272, the DuckBrain correction |
| test file header comment | JSDoc block above the imports | `tests/cli/start-dashboard-contract.test.ts:12` |
| commit message body | prose then the marker line | `git log -1 --format=%B <sha>` |

Census taken 2026-11-17 at `33912948`: 151 rows, 18 of which carry a marker
(24 `ch:trace` occurrences across the board's row text); 13 occurrences live in
`events.jsonl`, spread over 5 events (259, 268, 271, 272, 300); no row has a
resolved `verdict=` value yet (17 read `verdict=none:open-finding`). Marker
coverage is therefore **not** evidence of anything on its own — see §5.

---

## 2. The nine fields

Each field is defined once, with the artifact that holds it in this repository.

- **row** — the board row id that identifies the unit of work; the key
  `id` on `.coding-hermes/board/tasks.jsonl`, unique across the board, canon
  declared in `.coding-hermes/board/schema.sql` (`CREATE TABLE IF NOT EXISTS tasks`).
- **spec** — the contract the work must satisfy: a spec file under `specs/`
  (`specs/<name>.spec.md` — 122 of them — with the generated payload under the
  sibling `specs/<name>.spec.dir/` — 86 directories), cited as `path#anchor`.
  When the reader-facing file is a symlink the **target** is authoritative:
  `docs/API_REFERENCE.md` is a symlink to
  `specs/docs.spec.dir/docs/API_REFERENCE.md`, whose header carries
  `id: @specs/docs`. Absence is `none:<reason>` (real value:
  `none:repository-contract-absent`).
- **wave** — the dispatch batch that carried the row, named by the wave
  manifest `.coding-hermes/waves/<tick_id>.json`; its keys include `tick_id`,
  `base_ref`, `base_sha`, `wave_budget`, `composed`, `workers[]` (each with `id`,
  `worktree`, `branch`, `brief`, `log`, `files`, `priority`), `merge_order`,
  `closed_inline`, `status`, `independence_check`. A serial lane tick that
  dispatches no wave writes `none:serial-audit` / `none:serial-readme-tick` and
  has no manifest.
- **test** — the executable check that pins the behaviour, as `path::case` for a
  vitest case or `path` for a gate script (`scripts/check_docs_vs_cli_help.js`).
  The named test need not be the file holding the marker: row `DF-SPECLANG-1-R4`
  puts its marker in `tests/cli/init-cascade-contract.test.ts:16` but names
  `tests/project-layout.test.ts::init-to-cascade`, a real case at
  `tests/project-layout.test.ts:441`. A test file that guards a row carries its
  own marker in its header comment.
- **evidence** — what was observed, and where it is stored: an absolute
  artifact path or a verdict run id that resolves to a stored run. Two real
  forms live under `.coding-hermes/evidence/`: a flat per-row artifact
  (`DF-SPECLANG-7-closeout-2026-11-17.json`) and a per-tick directory
  (`speclang-releng-2026-11-16-11-07-39/`); lane artifacts may also sit outside
  the repository (`/home/kara/.hermes/stand-in/…/audit-….transcript.log`). On
  the row, bound runs live in `detail.evidence[]` as
  `{ "run_id": "<8 hex>", "ts": "<ISO-8601>" }`; audit events may additionally
  carry `artifact_sha256`.
- **witness** — the independent check that did not come from the author: the
  judge run, a second checkout, an origin ref (`path@origin:<path>`, real on row
  `DOC-9`), or an explicit `none:<reason>` such as `none:auditor-probe-only`.
  The field records the absence of independence when there is none; it does not
  manufacture it.
- **verdict** — the GitReins run that graded the tree, as
  `<run-id>:<PASS|FAIL|INCOMPLETE>` (or `none:<reason>` when no judge ran). The
  stored record is `.gitreins/history/<YYYY-MM-DD>/<run-id>/verdict.json` with
  `summary.md`, `commit.patch`, `worktree.patch` beside it; `run-id` is
  `sha256(task_id:evaluated_at)[:8]`. `.gitreins/config.yaml` sets
  `history.enabled: true`, `history.storage: git`, `history.max_verdicts: 1000`,
  so each verdict is also a commit on the `refs/gitreins/history` ref. The
  working-tree copy is gitignored on purpose; the ref is the durable record.
- **commit** — the landed work as a full 40-hex Git object name: `commit_hash`
  on the row, `commit` inside `verdict.json`. Abbreviated shas are acceptable
  only in prose. `none:open` while the work is unlanded; `git cat-file -e <sha>`
  is the check that a cited sha exists in this clone.
- **memory** — the durable note outside the repository, as
  `<namespace>:<key>` in DuckBrain. Real: row `DOC-7` resolves to
  `speclang:/projects/speclang/docs-audit/2026-11-16-05-02-33` (record id
  `1d2e750e-fb0a-44d5-9e74-b1c4c99a37d0`). Absence is `none:<reason>` and must be
  established by `list_namespaces`, never by failing to guess a name.

Two fingerprints are in play and they are different things: the row's
`detail.fingerprint` is the row-content hash used for provenance of the text,
while `working_tree_content_fingerprint` inside `verdict.json` is the hash of the
tree the judge actually graded. Neither is the commit sha.

---

## 3. Worked example — row DOC-7, all nine fields

Row `DOC-7` (`.coding-hermes/board/tasks.jsonl:119`, status `complete`) is the
one trace in this repository whose nine fields all resolve to verifiable values.
It was filed by the docs audit lane, dispatched by a serial foreman tick, judged,
and closed by a board commit.

The marker as written at open (`foreman_note`):

```
ch:trace row=DOC-7 spec=none:repository-contract-absent wave=none:serial-audit test=none:open-finding doc=docs/API_REFERENCE.md prompt=/home/kara/.hermes/skills/documentation/documentation-auditing/SKILL.md evidence=/home/kara/.hermes/stand-in/docs/speclang/docs-audit-2026-11-16-05-02-33.transcript.log witness=none:static-source-versus-doc-audit verdict=none:open-finding commit=none:open memory=none:exact-key-not-found
```

The same trace resolved at close 2026-11-17 (each value verified below):

| field | resolved value | where it lives |
| --- | --- | --- |
| row | `DOC-7` | `.coding-hermes/board/tasks.jsonl:119` |
| spec | `docs/API_REFERENCE.md` → `specs/docs.spec.dir/docs/API_REFERENCE.md` (header `id: @specs/docs`) | symlink target under `specs/` |
| wave | `none:serial-audit` — filed by tick `speclang-docs-2026-11-16-05-02-33`, no wave manifest exists for it | `.coding-hermes/waves/` holds no such file |
| test | `scripts/check_docs_vs_cli_help.js` (parity gate, added by the work commit) | tracked script at repo root `scripts/` |
| evidence | run `6f9c3e1f` → `.gitreins/history/2026-11-17/6f9c3e1f/` (`verdict.json`, `summary.md`, `commit.patch` 2732 B from `git show ad5f0ec93ae6`, `worktree.patch` 32184 B) | `refs/gitreins/history` at commit `34ebf809`; row `detail.evidence[0].run_id = "6f9c3e1f"` |
| witness | the tier-2 judge itself: `pass_class: judged`, `tier2_skipped: false`, `stages.tier2.passed: true` with `summary` beginning `COMPLETE` | `verdict.json` `.stages.tier2` |
| verdict | `6f9c3e1f:PASS` — `passed: true`, `merge_recommendation: no_concerns_found` | `.gitreins/history/2026-11-17/6f9c3e1f/verdict.json` |
| commit | `9bcea767220d929021137cc160b6bfa3335976e9` (work commit, row `commit_hash`); graded tip `ad5f0ec93ae6fad9325ff6e818506dde949b40d9` | `git show --stat 9bcea767…` |
| memory | `speclang:/projects/speclang/docs-audit/2026-11-16-05-02-33`, record `1d2e750e-fb0a-44d5-9e74-b1c4c99a37d0` | DuckBrain namespace `speclang`; event 272 |

Verification, run from the repository root:

```
$ git cat-file -e 9bcea767220d929021137cc160b6bfa3335976e9 && echo OK
OK
$ git show --stat --oneline 9bcea767220d929021137cc160b6bfa3335976e9 | head -4
9bcea767 docs(api): document the five shipped CLI commands missing from the reference (DOC-7)
 scripts/check_docs_vs_cli_help.js         | 172 ++++++++++++++++++++++++++++++
 specs/docs.spec.dir/docs/API_REFERENCE.md |   6 +-
 2 files changed, 177 insertions(+), 1 deletion(-)
$ git merge-base --is-ancestor 9bcea767 ad5f0ec9 && echo "work commit contained in graded tip"
work commit contained in graded tip
$ git show refs/gitreins/history:.gitreins/history/2026-11-17/6f9c3e1f/verdict.json \
    | jq -c '{task_id, passed, pass_class, commit}'
{"task_id":"DOC-7","passed":true,"pass_class":"judged","commit":"ad5f0ec93ae6fad9325ff6e818506dde949b40d9"}
$ git log -1 --format='%h %s' 34ebf809
34ebf809 verdict: DOC-7 — PASS
$ jq -c 'select(.id=="DOC-7")|{status, commit_hash, guard_result, ci_result, run: .detail.evidence[0].run_id}' \
    .coding-hermes/board/tasks.jsonl
{"status":"complete","commit_hash":"9bcea767220d929021137cc160b6bfa3335976e9","guard_result":"PASS","ci_result":"SKIP","run":"6f9c3e1f"}
```

The row's status became `complete` in the **committed board** at `5b3fce1d`
(`chore(board): close the 2026-11-17-05-00-08 wave rows (DOC-9, DOC-7, README-20,
UX-003)`); the row was still `pending` in `12ec01d1`. That is the pattern the
operator checks: a row status is a fact about a commit, not about a working tree.

Two corrections are visible in this same trace, and they are the reason the
contract warns in §5 rather than certifying:

1. The row's opening text claimed the reference table omitted **four** commands;
   re-measurement by the same lane found **five** (`search` was missed). The row
   carries its own correction and the acceptance criterion was tightened.
2. The opening marker line of event 271, and the commit message of `ad80bae0`
   that carried it, claimed `memory=none:no-speclang-namespace`. That was false:
   the `speclang` namespace exists. Event 272 corrects it, names the record id,
   and states the lesson ("call `list_namespaces` before asserting a namespace is
   absent"). The row's own `foreman_note` never carried that value — it reads
   `memory=none:exact-key-not-found`, a third and weaker claim. Three surfaces,
   three different statements, and only the corrected event resolves.

---

## 4. The three audiences

### Developer — what to write when you land work

1. Work from the row id. Never invent one; ids come from `boardctl next-id
   --family <PREFIX>` or the row the tick dispatched.
2. Land the code, then take the full 40-hex commit sha from `git rev-parse HEAD`
   after the commit that actually contains the work. Confirm it with
   `git cat-file -e <sha>`.
3. If you add or touch a test that pins the row, put the marker in the file's
   header comment. Worker-phase values are honest placeholders — the real form,
   from `tests/cli/start-dashboard-contract.test.ts:12`:

   ```
   ch:trace row=DF-SPECLANG-3-R5 spec=none:cli-banner wave=none:serial-worker test=tests/cli/start-dashboard-contract.test.ts doc=none:code-task evidence=none:worker-local-until-foreman-verifies witness=none:worker-worktree verdict=none:foreman-must-run-judge commit=none:worker-commit memory=none:foreman-writes
   ```

   The `none:foreman-must-run-judge` / `none:foreman-writes` values are the
   handoff: the worker states which fields it did not own.
4. Do not write `verdict=` yourself. The run id comes from the judge.
5. Do not edit the board row to say what you think; `boardctl` writes it, and it
   will refuse a completion that carries no run id (see guarantee 1 in §4).

### Operator — what to check when a trace is incomplete

Work down this list; stop at the first field that does not resolve.

```
# 1. does the row exist, and what does it claim?
boardctl show <ROW-ID>

# 2. is a run bound to it? (empty array = no run, whatever the prose says)
jq -c 'select(.id=="<ROW-ID>")|.detail.evidence' .coding-hermes/board/tasks.jsonl

# 3. does that run exist on disk, or on the ref?
find .gitreins/history -name verdict.json | sort | tail -5
git log refs/gitreins/history --format='%h %s' -5
git show refs/gitreins/history:.gitreins/history/<date>/<run>/verdict.json | jq '{task_id, passed, pass_class, commit}'

# 4. did the judge grade the commit the row names, or a later tip?
git merge-base --is-ancestor <row commit_hash> <verdict.commit>; echo $?   # 0 = contained

# 5. fleet-level honesty on the same board
boardctl doctor                      # reports verified_complete_share (TR-251 debt)
gitreins report -n 20                # recent verdicts, disk + ref
```

Read the numbers as of 2026-11-17 at `33912948`: `boardctl doctor` reports
`verified_complete_share: 0.2911 (23/79)` — 56 complete rows carry no evidence
run — and `gitreins report -n 3` reports
`Storage: git (/home/kara/worktrees/SpecLang-DOC-6/.gitreins/history)` /
`Total entries: 21`. Those two numbers are the real state of traceability here;
anything rosier is prose. Note that `.gitreins/history/` does not exist in a
fresh worktree at all (it is gitignored): the ref, not the directory, is the
record.

Incomplete-trace taxonomy, in the order it usually appears:

| symptom | meaning | action |
| --- | --- | --- |
| row exists, `detail.evidence` empty | work may be real, unbound | run the judge, then `boardctl update --status complete --evidence-run-id` |
| run id on row, no `verdict.json` on disk or ref | judge died before persisting; nothing to recover | re-run (docs/gitreins-verdicts.md) |
| `verdict.json` present, `[DEGRADED — skipped: tier1(tests)]` | a tier-1 step hit its 120 s budget, not a pass | raise the step timeout or re-run scoped |
| verdict `commit` is not the row `commit_hash` | judge graded a later tip | check ancestry; both are true statements about different commits |
| `passed: false` while some `items[]` read PASS | the overall verdict decides the run; stages and criteria must be read together | read `.items[]` + `.stages`; one passing leg does not lift a failing one |
| verdict `commit` names a tip the row does not (UX-003: row `a4170279…`, verdict `ad5f0ec9…`) | the judge graded a later, fixed tip; the row's own commit may never have been green | treat the PASS as a statement about the graded tip; check CI for the row commit separately |
| printed `Verdict saved: <id>` ≠ the history entry directory | the printed id can be the history-ref commit, not `sha256(task_id:evaluated_at)[:8]` — `DF-SPECLANG-7`'s artifact cites `553a7017`, which matches no stored run; the entry is `abfe0118` | resolve the entry by `task_id`, not by the printed id |
| marker absent | says nothing either way (18/151 rows carry one) | fall back to row + commit + verdict |

### Integrator — guaranteed vs best-effort

**Guaranteed (enforced by tooling, verified in this repository):**

1. A row cannot be closed **through `boardctl`** without a bound evidence run.
   `boardctl update <id> --status complete` without `--evidence-run-id` is
   refused, exit 1: `boardctl: evidence run required: completion REFUSED for
   "<id>": --evidence-run-id is REQUIRED when setting status "complete" (TR-251);
   re-run with --evidence-run-id <run-id> — the run id is recorded on the row's
   detail.evidence[] and must resolve to a stored run (e.g.
   .gitreins/history/<date>/<run-id>/verdict.json)`. 56 historic complete rows
   predate that enforcement (§5, item 6).
2. A stored run has a fixed shape: `.gitreins/history/<YYYY-MM-DD>/<run-id>/`
   containing `verdict.json` with keys `task_id`, `passed`, `pass_class`,
   `commit`, `stages`, `items`, `evidence`, `task_criteria`,
   `working_tree_content_fingerprint`; `<run-id>` is
   `sha256(task_id:evaluated_at)[:8]`.
3. The durable verdict store is a git ref, `refs/gitreins/history`, one commit
   per verdict, per `.gitreins/config.yaml` (`history.storage: git`).
4. Row canon keys are declared in `.coding-hermes/board/schema.sql`; drift is
   reported by `boardctl doctor` / `boardctl validate`.
5. `boardctl`, `gitreins` and the board files are the only writers of row state,
   bindings and verdicts — nothing in this repository edits them in place.

**Best-effort (no gate enforces it):**

1. The `ch:trace` marker itself. No script, test or CI step parses it — a grep
   for `ch:trace` across `scripts/`, `tests/` and `src/` finds only two test-file
   header comments, and no validator exists. The marker is a reader contract,
   not a machine contract.
2. The prose in `foreman_note`, `reasoning`, `worker_summary`. It is append-only
   and it has been factually wrong (both corrections in §3 are prose).
3. `doc=` and `prompt=` and any other extra field.
4. The `memory` field: a DuckBrain write can be recorded and later not found if
   the namespace is wrong; the field is only as good as its last verification.
5. `witness`: `none:auditor-probe-only` appears 5 times on this board — the
   honest record of no independent witness.

---

## 5. What this contract does not guarantee

These are not hypotheticals; each one happened in this repository.

1. **A row status is not proof the work landed — the commit tree is.** The
   closeout artifact `.coding-hermes/evidence/DF-SPECLANG-7-closeout-2026-11-17.json`
   carries its own `supersedes` field: an earlier revision, written and committed
   before the judge ran, "over-stated closure"; the gitreins judge — stored run
   `abfe0118` under `.gitreins/history/2026-11-17/`, `passed: false`, tier 1 PASS
   / tier 2 `INCOMPLETE` — proved one acceptance leg was missing. The artifact's
   own prose calls that run `553a7017`, an id that resolves to nothing on
   `refs/gitreins/history`, so even an evidence pointer needs re-resolution
   before it is trusted. The three statements of that row's state do not agree
   even now — the artifact says "blocked, not complete", the board row reads
   `in_progress` with its own `blocked_reason`. Always read
   `git show <rev>:<board file>` for the committed row, never the working tree
   alone, and treat status as a claim the commit has to support.
2. **A marker field can be false.** `memory=none:no-speclang-namespace` was
   written into event 271 and the `ad80bae0` commit message; the namespace exists.
   The correction lives in event 272, not in either of them.
3. **`verdict.commit` is not `row.commit_hash`.** The judge grades the tip it
   ran on; on `DOC-7` the row names `9bcea767…` while the verdict names
   `ad5f0ec9…`, which merely contains it. Identity must be proven by
   `git merge-base --is-ancestor`, not assumed from equality. Worse, the graded
   tip can be someone else's fix: row `UX-003` names `a4170279…` while verdict
   `94482854` graded `ad5f0ec9…`. A PASS certifies the graded tip — not the row's
   commit, and not CI. On `UX-003` the row's own commit is the one that turned
   main red (`INT-CI-2`, still `pending`).
4. **A green verdict is not a green CI.** Tier 2 is a Linux judge; it does not
   run the platform CI matrix. `UX-003` carries `passed: true` and
   `ci_result: SKIP` while `INT-CI-2` records that its commit broke
   `tests/e2e/spec-to-code.test.ts:341`. CI and the judge are two witnesses, not
   one.
5. **Numbers inside rows are claims, not measurements.** Row `DOC-7` said four
   missing CLI commands where the true count was five, and anchored line numbers
   in a symlinked file. Re-measure before dispatching or closing.
6. **A bound marker is not a bound run.** `verified_complete_share: 0.2911`
   (23/79) at `33912948` means 56 complete rows have no evidence run at all.
7. **Evidence is per-checkout unless the ref is pushed.** `refs/gitreins/history`
   lives outside `refs/heads/`, so plain `git push` does not carry it; the remote
   has no such ref (`git ls-remote origin 'refs/gitreins/*'` returns nothing) and
   a fresh clone starts empty.
8. **A killed judge writes nothing.** No `verdict.json`, no ref commit, no
   partial record — the absence is the signal, not a bug in the lookup.
9. **Absence of a marker means nothing.** 18 of 151 rows carry one. A row with no
   marker is not thereby untraceable, and a row with one is not thereby traced.
10. **`docs/` line numbers drift under symlinks.** `docs/API_REFERENCE.md` is a
    symlink into `specs/docs.spec.dir/`; cite the target path and re-verify line
    anchors before relying on them.
11. **Nothing here is a provenance proof against a determined author.** The
    marker is free text; the guarantees in §4 come from `boardctl` and GitReins,
    not from the marker.

---

## 6. Maintenance

- New field: needs a definition in §2, a `none:<reason>` token convention, and a
  real value somewhere in the repository. Do not add a field that no artifact can
  resolve.
- New audience rule: put it in §4 under the audience that must act on it.
- When a §5 item is fixed by tooling, move it to §6 (guaranteed) in the same
  commit that lands the tooling, and cite the check that now enforces it.
- This file is a plain document, not a spec file: it carries no
  `speclang-header`, like [docs/gitreins-verdicts.md](gitreins-verdicts.md). Its
  own row is `DOC-6`.
