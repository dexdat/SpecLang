# Verdict: OBS-6

**Task:** Index baseline observability report: entry count vs tracked specs, delta, agent-path token accounting
**Evaluated:** 2026-11-20T14:49:55.669851
**Result:** ✗ FAIL

## Criteria

- ✓ **A committed docs/observability/ report states the index entry count from node bin/speclang index over the repo's own specs, the count from git ls-files specs/**/*.spec.md, their signed delta, an explicit measured-or-unmeasured token accounting finding with evidence, and the exact commands; counts re-verified live.**
  - docs/observability/index-baseline-2026-11-20.md is committed (commit 8cfd7648, tracked per `git ls-files docs/observability/`). All counts re-verified live in this session: `node bin/speclang index` -> 'error: unknown command 'index'' EXIT=1 (report §4.1 documents this failure honestly and gives the working entry point); `node specs/cli.spec.dir/src/index.js index` -> 'Found 493 spec files' / 'Total specs: 485' EXIT=0; `jq '.specs|length' _index.json` = 485; `git ls-files 'specs/**/*.spec.md' | wc -l` = 346; `git ls-files 'specs/*.spec.md' | wc -l` = 468; find over the four spec file classes = 493. Signed deltas stated and arithmetically correct: +139 (485-346) and +147 (493-346), plus +17/+25 against the complete 468-file tracked set with exact reconciliation (2 .scl + 23 .spec - 8 duplicate ids = +17). Duplicate-id claim independently reproduced: 493 per-file header ids -> 485 unique with the same 7 duplicated ids the report lists. Token accounting finding is explicit (UNMEASURED, §3) with 6 evidence points, all spot-verified: `grep -ci token specs/cli.spec.dir/src/commands/index.js` = 0, no token matches in indexer src or specs/sqlite.spec.dir/src/migrations.ts, collateMetrics() at specs/cascade.spec.dir/src/coordinator/index.ts:616 only attached when --metrics passed (line 463), docs/observability-spec.md:71 confirms 'printed, never stored'. Exact commands with verbatim output in §4 and reproduction steps in §7.

## Pipeline Stages

- ✗ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✗ tests: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/5]⎯
- ✓ **tier2**
  - COMPLETE
  ✓ A committed docs/observability/ report states the index entry count from node bin/speclang index over the repo's own specs, the count from git ls-files specs/**/*.spec.md, their signed delta, an explicit measured-or-unmeasured token accounting finding with evidence, and the exact commands; counts re-verified live.: docs/observability/index-baseline-2026-11-20.md is committed (commit 8cfd7648, tracked per `git ls-files docs/observability/`). All counts re-verified live in this session: `node bin/speclang index` -> 'error: unknown command 'index'' EXIT=1 (report §4.1 documents this failure honestly and gives the working entry point); `node specs/cli.spec.dir/src/index.js index` -> 'Found 493 spec files' / 'Total specs: 485' EXIT=0; `jq '.specs|length' _index.json` = 485; `git ls-files 'specs/**/*.spec.md' | wc -l` = 346; `git ls-files 'specs/*.spec.md' | wc -l` = 468; find over the four spec file classes = 493. Signed deltas stated and arithmetically correct: +139 (485-346) and +147 (493-346), plus +17/+25 against the complete 468-file tracked set with exact reconciliation (2 .scl + 23 .spec - 8 duplicate ids = +17). Duplicate-id claim independently reproduced: 493 per-file header ids -> 485 unique with the same 7 duplicated ids the report lists. Token accounting finding is explicit (UNMEASURED, §3) with 6 evidence points, all spot-verified: `grep -ci token specs/cli.spec.dir/src/commands/index.js` = 0, no token matches in indexer src or specs/sqlite.spec.dir/src/migrations.ts, collateMetrics() at specs/cascade.spec.dir/src/coordinator/index.ts:616 only attached when --metrics passed (line 463), docs/observability-spec.md:71 confirms 'printed, never stored'. Exact commands with verbatim output in §4 and reproduction steps in §7.
The committed observability report states all required counts (493 generator entries / 485 stored ids vs 346 tracked via the row's glob), correct signed deltas (+139/+147), an explicit UNMEASURED token-accounting finding with six verified evidence points, and exact commands — every number re-verified live, including the honest documentation that `node bin/speclang index` itself fails and the working alternative.

## Summary

Stage tier1: FAIL
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✗ tests: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/5]⎯

Stage tier2: PASS
  COMPLETE
  ✓ A committed docs/observability/ report states the index entry count from node bin/speclang index over the repo's own specs, the count from git ls-files specs/**/*.spec.md, their signed delta, an explicit measured-or-unmeasured token accounting finding with evidence, and the exact commands; counts re-verified live.: docs/observability/index-baseline-2026-11-20.md is committed (commit 8cfd7648, tracked per `git ls-files docs/observability/`). All counts re-verified live in this session: `node bin/speclang index` -> 'error: unknown command 'index'' EXIT=1 (report §4.1 documents this failure honestly and gives the working entry point); `node specs/cli.spec.dir/src/index.js index` -> 'Found 493 spec files' / 'Total specs: 485' EXIT=0; `jq '.specs|length' _index.json` = 485; `git ls-files 'specs/**/*.spec.md' | wc -l` = 346; `git ls-files 'specs/*.spec.md' | wc -l` = 468; find over the four spec file classes = 493. Signed deltas stated and arithmetically correct: +139 (485-346) and +147 (493-346), plus +17/+25 against the complete 468-file tracked set with exact reconciliation (2 .scl + 23 .spec - 8 duplicate ids = +17). Duplicate-id claim independently reproduced: 493 per-file header ids -> 485 unique with the same 7 duplicated ids the report lists. Token accounting finding is explicit (UNMEASURED, §3) with 6 evidence points, all spot-verified: `grep -ci token specs/cli.spec.dir/src/commands/index.js` = 0, no token matches in indexer src or specs/sqlite.spec.dir/src/migrations.ts, collateMetrics() at specs/cascade.spec.dir/src/coordinator/index.ts:616 only attached when --metrics passed (line 463), docs/observability-spec.md:71 confirms 'printed, never stored'. Exact commands with verbatim output in §4 and reproduction steps in §7.
The committed observability report states all required counts (493 generator entries / 485 stored ids vs 346 tracked via the row's glob), correct signed deltas (+139/+147), an explicit UNMEASURED token-accounting finding with six verified evidence points, and exact commands — every number re-verified live, including the honest documentation that `node bin/speclang index` itself fails and the working alternative.

Overall: FAIL ✗
