# GitReins verdict persistence

How a judge run becomes a durable evidence record, and how an operator finds it
after a task completes. Task: DF-SPECLANG-12.

## What writes the record

`gitreins task complete <id>` and `gitreins judge` both end in
`engine.persist.persist_evaluation`, which writes one entry under the history dir:

```
.gitreins/history/<UTC date>/<sha256(task_id:evaluated_at)[:8]>/
    verdict.json      # task id, criteria, per-item PASS/FAIL + detail, pass_class,
                      # commit, working-tree fingerprint, stages
    summary.md        # human roll-up of the same run
```

With `history.storage: git` (this repo) the same files are also committed to the
`refs/gitreins/history` ref, one commit per verdict.

## Config keys (authoritative source: installed tool, `engine/persist.py`)

`DEFAULT_HISTORY_CONFIG` and `engine/config_schema.py::_HISTORY` define four keys,
all under the top-level `history:` section:

| key | meaning | default |
| --- | --- | --- |
| `enabled` | `false` = no persistence at all | `true` |
| `path` | history dir, relative to the repo root or absolute | `.gitreins/history` |
| `storage` | `git` = commit each verdict to the history ref; `filesystem` = files only | `git` |
| `max_verdicts` | retention guard: oldest entries pruned past this count (`<= 0` disables) | `1000` |

This repo sets all four explicitly. `gitreins config-validate` accepts the block:
it names an unknown key under `history:` (verified with a deliberate
`history.bogus_knob`) and stays silent on this one.

## Why a run can be missing entirely

Persistence happens only *after* `judge.evaluate_task` returns. A judge killed by
an outer wrapper timeout (e.g. `timeout 1500 gitreins task complete ...`), a
Ctrl-C, or a provider hang writes **nothing**: no `verdict.json`, no ref commit.
There is no partial record to recover — the evaluation never finished. Such a row
needs a completed re-run, not a recovery step. For a fast, LLM-free record use
`--skip-tier2` (the verdict then records `pass_class: tier1-only`, which does not
satisfy a judge-gated merge).

## Retention of the working-tree copy

`.gitreins/history/` stays gitignored. The durable copy is the
`refs/gitreins/history` ref, so committing the JSON into `main` would only churn
every judge run. Caveat, measured 2026-11-17: that ref lives outside
`refs/heads/`, so a plain `git push` does not carry it and a fresh clone does not
have it (`git ls-remote origin 'refs/gitreins/*'` returns nothing). Evidence is
therefore per-checkout unless it is pushed explicitly:

```bash
git push origin refs/gitreins/history:refs/gitreins/history
```

## Runbook — inspect a verdict after a task completes

```bash
# 1. newest verdicts, human roll-up (reads local dir, then the ref)
gitreins report -n 20

# 2. bounded, redacted evidence document for a board closeout (always exits 0)
gitreins report --json

# 3. the artifact on disk (newest first)
find .gitreins/history -name verdict.json | sort | tail -5

# 4. read one record
jq '{task_id, passed, pass_class, tier2_skipped, commit}' \
  .gitreins/history/<date>/<run>/verdict.json

# 5. the same record from the git ref (survives working-tree cleanup)
git log refs/gitreins/history --format='%h %s' -5
git show refs/gitreins/history:.gitreins/history/<date>/<run>/verdict.json | jq .
```

`gitreins serve` (default `127.0.0.1:8616`) browses the same store in a browser.
