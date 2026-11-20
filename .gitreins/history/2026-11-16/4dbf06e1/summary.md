# Verdict: DF-SPECLANG-9

**Task:** validate --format json drops the failing spec and prefixes a banner
**Evaluated:** 2026-11-16T15:42:14.000262
**Result:** ✗ FAIL

## Criteria

- ✗ **validate --format json emits one report per spec file (452 for this tree) and includes the failing spec's errors | proof: run ./bin/speclang validate --format json, pipe stdout to jq, assert .reports|length==452 and (.reports|map(select((.errors|length)>0))|length)>=1 | failure_condition: reports length < spec count, or stdout fails to parse as JSON because of a banner line**
  - PARTIAL: `./bin/speclang validate --format json` in worktree /home/kara/worktrees/SpecLang-DF-SPECLANG-9 -> rc=0, stderr="📋 Validating specs...", stdout starts "{" and parses with jq. jq '.reports|length'=452, '.totalFiles'=452 (find specs -name '*.spec.md'=450 + '*.scl'=2 = 452). BUT jq '[.reports[]|select((.errors|length)>0)]|length' = 0 -> the second half of the criterion (>=1 report with errors) is NOT satisfied on this tree. Commit message admits: "the in-tree error count is 0; the drop defect is pinned by the new fixture test instead." · graded at iteration 19.9 (236,409 in / 1,708 out, 19.9 iterations and 63s into the run)

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  10:32:09
- ✗ **tier2**
  - INCOMPLETE
  ✗ validate --format json emits one report per spec file (452 for this tree) and includes the failing spec's errors | proof: run ./bin/speclang validate --format json, pipe stdout to jq, assert .reports|length==452 and (.reports|map(select((.errors|length)>0))|length)>=1 | failure_condition: reports length < spec count, or stdout fails to parse as JSON because of a banner line: PARTIAL: `./bin/speclang validate --format json` in worktree /home/kara/worktrees/SpecLang-DF-SPECLANG-9 -> rc=0, stderr="📋 Validating specs...", stdout starts "{" and parses with jq. jq '.reports|length'=452, '.totalFiles'=452 (find specs -name '*.spec.md'=450 + '*.scl'=2 = 452). BUT jq '[.reports[]|select((.errors|length)>0)]|length' = 0 -> the second half of the criterion (>=1 report with errors) is NOT satisfied on this tree. Commit message admits: "the in-tree error count is 0; the drop defect is pinned by the new fixture test instead." · graded at iteration 19.9 (236,409 in / 1,708 out, 19.9 iterations and 63s into the run)
  ✗ Coverage FAILED — not passing: validate --format json emits one report per spec file (452 for this tree) and includes the failing spec's errors | proof: run ./bin/speclang validate --format json, pipe stdout to jq, assert .reports|length==452 and (.reports|map(select((.errors|length)>0))|length)>=1 | failure_condition: reports length < spec count, or stdout fails to parse as JSON because of a banner line
Cap exceeded: Iteration cap (100) reached (100.6 used). Increase max_iterations or split criteria. Partial verdict — 1 of 1 criteria graded, 0 ungraded. The run spent 392,719 in / 2,189 out over 100.6 iterations.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  10:32:09

Stage tier2: FAIL
  INCOMPLETE
  ✗ validate --format json emits one report per spec file (452 for this tree) and includes the failing spec's errors | proof: run ./bin/speclang validate --format json, pipe stdout to jq, assert .reports|length==452 and (.reports|map(select((.errors|length)>0))|length)>=1 | failure_condition: reports length < spec count, or stdout fails to parse as JSON because of a banner line: PARTIAL: `./bin/speclang validate --format json` in worktree /home/kara/worktrees/SpecLang-DF-SPECLANG-9 -> rc=0, stderr="📋 Validating specs...", stdout starts "{" and parses with jq. jq '.reports|length'=452, '.totalFiles'=452 (find specs -name '*.spec.md'=450 + '*.scl'=2 = 452). BUT jq '[.reports[]|select((.errors|length)>0)]|length' = 0 -> the second half of the criterion (>=1 report with errors) is NOT satisfied on this tree. Commit message admits: "the in-tree error count is 0; the drop defect is pinned by the new fixture test instead." · graded at iteration 19.9 (236,409 in / 1,708 out, 19.9 iterations and 63s into the run)
  ✗ Coverage FAILED — not passing: validate --format json emits one report per spec file (452 for this tree) and includes the failing spec's errors | proof: run ./bin/speclang validate --format json, pipe stdout to jq, assert .reports|length==452 and (.reports|map(select((.errors|length)>0))|length)>=1 | failure_condition: reports length < spec count, or stdout fails to parse as JSON because of a banner line
Cap exceeded: Iteration cap (100) reached (100.6 used). Increase max_iterations or split criteria. Partial verdict — 1 of 1 criteria graded, 0 ungraded. The run spent 392,719 in / 2,189 out over 100.6 iterations.

Overall: FAIL ✗
