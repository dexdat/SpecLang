# Verdict: DF-SPECLANG-9

**Task:** validate --format json must not drop a failing spec and must keep stdout pure JSON
**Evaluated:** 2026-11-16T16:21:32.414102
**Result:** ✓ PASS

## Criteria

- ✓ **validate --format json emits one report per spec file and never drops a failing spec: proof = tests/cli.test.ts 'validate --format json report integrity' builds a 2-file fixture where one spec fails to PARSE, then asserts stdout parses with plain JSON.parse (no banner tolerated), reports.length == totalFiles == 2, the unparsable spec's report carries >=1 error, and rc == 1; independently verified RED on the pre-fix tree (JSON.parse throws on the banner, reports=1) and GREEN on this tree. failure_condition = the fixture test fails, or a repo-wide run prints a banner to stdout before the JSON payload, or reports.length < totalFiles when a spec fails**
  - PASS (re-confirmed on HEAD 2f2b6ffd, dist built):
- fixture /tmp/vj (2 specs, broken missing `version`): ./bin/speclang validate -d /tmp/vj --format json -> rc=1, stdout starts "{" (pure JSON), stderr has banner + "Error validating .../broken.spec.md: Missing required field: version"; JSON.parse -> totalFiles 2, reports 2, errors 1, failed 1; broken report passed=false errors=1.
- repo-wide: ./bin/speclang validate --format json -> rc=0, stdout starts "{", banner on stderr, totalFiles 452 reports 452 (no banner on stdout, no drop).
- vitest run tests/cli.test.ts -t "report integrity" -> "Tests 2 passed | 43 skipped (45)", exit 0.
- code: specs/validation.spec.dir/src/cli.ts:41-58 parseFailureReport, :135-141 catch pushes report; bin/speclang:450 banner -> console.error for json.
 · graded at iteration 90.1 (251,928 in / 2,240 out, 90.1 iterations and 1313s into the run) [resolution 0.28; tests/cli.test.ts]

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  10:58:05
- ✓ **tier2**
  - COMPLETE
  ✓ validate --format json emits one report per spec file and never drops a failing spec: proof = tests/cli.test.ts 'validate --format json report integrity' builds a 2-file fixture where one spec fails to PARSE, then asserts stdout parses with plain JSON.parse (no banner tolerated), reports.length == totalFiles == 2, the unparsable spec's report carries >=1 error, and rc == 1; independently verified RED on the pre-fix tree (JSON.parse throws on the banner, reports=1) and GREEN on this tree. failure_condition = the fixture test fails, or a repo-wide run prints a banner to stdout before the JSON payload, or reports.length < totalFiles when a spec fails: PASS (re-confirmed on HEAD 2f2b6ffd, dist built):
- fixture /tmp/vj (2 specs, broken missing `version`): ./bin/speclang validate -d /tmp/vj --format json -> rc=1, stdout starts "{" (pure JSON), stderr has banner + "Error validating .../broken.spec.md: Missing required field: version"; JSON.parse -> totalFiles 2, reports 2, errors 1, failed 1; broken report passed=false errors=1.
- repo-wide: ./bin/speclang validate --format json -> rc=0, stdout starts "{", banner on stderr, totalFiles 452 reports 452 (no banner on stdout, no drop).
- vitest run tests/cli.test.ts -t "report integrity" -> "Tests 2 passed | 43 skipped (45)", exit 0.
- code: specs/validation.spec.dir/src/cli.ts:41-58 parseFailureReport, :135-141 catch pushes report; bin/speclang:450 banner -> console.error for json.
 · graded at iteration 90.1 (251,928 in / 2,240 out, 90.1 iterations and 1313s into the run) [resolution 0.28; tests/cli.test.ts]
Cap exceeded: Iteration cap (100) reached (100.4 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  10:58:05

Stage tier2: PASS
  COMPLETE
  ✓ validate --format json emits one report per spec file and never drops a failing spec: proof = tests/cli.test.ts 'validate --format json report integrity' builds a 2-file fixture where one spec fails to PARSE, then asserts stdout parses with plain JSON.parse (no banner tolerated), reports.length == totalFiles == 2, the unparsable spec's report carries >=1 error, and rc == 1; independently verified RED on the pre-fix tree (JSON.parse throws on the banner, reports=1) and GREEN on this tree. failure_condition = the fixture test fails, or a repo-wide run prints a banner to stdout before the JSON payload, or reports.length < totalFiles when a spec fails: PASS (re-confirmed on HEAD 2f2b6ffd, dist built):
- fixture /tmp/vj (2 specs, broken missing `version`): ./bin/speclang validate -d /tmp/vj --format json -> rc=1, stdout starts "{" (pure JSON), stderr has banner + "Error validating .../broken.spec.md: Missing required field: version"; JSON.parse -> totalFiles 2, reports 2, errors 1, failed 1; broken report passed=false errors=1.
- repo-wide: ./bin/speclang validate --format json -> rc=0, stdout starts "{", banner on stderr, totalFiles 452 reports 452 (no banner on stdout, no drop).
- vitest run tests/cli.test.ts -t "report integrity" -> "Tests 2 passed | 43 skipped (45)", exit 0.
- code: specs/validation.spec.dir/src/cli.ts:41-58 parseFailureReport, :135-141 catch pushes report; bin/speclang:450 banner -> console.error for json.
 · graded at iteration 90.1 (251,928 in / 2,240 out, 90.1 iterations and 1313s into the run) [resolution 0.28; tests/cli.test.ts]
Cap exceeded: Iteration cap (100) reached (100.4 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

Overall: PASS ✓
