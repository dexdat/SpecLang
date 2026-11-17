# Verdict: README-SWEEP

**Task:** README truth sweep: counts, license, integration tests, cascade output, index args
**Evaluated:** 2026-11-17T12:13:26.675383
**Result:** ✗ FAIL

## Criteria

- — **FAILIF: any README test-count claim disagrees with a measured suite run, README still says ISC, any index-entry count disagrees with _index.json, the None exist integration-test claim survives, dry-run by default survives, or index-analysis examples cannot be run as documented. PROOF: per-row command plus real output.**
  - Not examined — evaluation ended before this criterion was reached (no judgement was made about it)

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  06:45:43
- ✗ **tier2**
  - INCOMPLETE
  — FAILIF: any README test-count claim disagrees with a measured suite run, README still says ISC, any index-entry count disagrees with _index.json, the None exist integration-test claim survives, dry-run by default survives, or index-analysis examples cannot be run as documented. PROOF: per-row command plus real output.: Not examined — evaluation ended before this criterion was reached (no judgement was made about it)
  ✗ Coverage FAILED — not passing: FAILIF: any README test-count claim disagrees with a measured suite run, README still says ISC, any index-entry count disagrees with _index.json, the None exist integration-test claim survives, dry-run by default survives, or index-analysis examples cannot be run as documented. PROOF: per-row command plus real output.
Cap exceeded: Iteration cap (100) reached (100.1 used). Increase max_iterations or split criteria. Partial verdict — 0 of 1 criteria graded, 1 ungraded. The run spent 345,707 in / 3,786 out over 100.1 iterations.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  06:45:43

Stage tier2: FAIL
  INCOMPLETE
  — FAILIF: any README test-count claim disagrees with a measured suite run, README still says ISC, any index-entry count disagrees with _index.json, the None exist integration-test claim survives, dry-run by default survives, or index-analysis examples cannot be run as documented. PROOF: per-row command plus real output.: Not examined — evaluation ended before this criterion was reached (no judgement was made about it)
  ✗ Coverage FAILED — not passing: FAILIF: any README test-count claim disagrees with a measured suite run, README still says ISC, any index-entry count disagrees with _index.json, the None exist integration-test claim survives, dry-run by default survives, or index-analysis examples cannot be run as documented. PROOF: per-row command plus real output.
Cap exceeded: Iteration cap (100) reached (100.1 used). Increase max_iterations or split criteria. Partial verdict — 0 of 1 criteria graded, 1 ungraded. The run spent 345,707 in / 3,786 out over 100.1 iterations.

Overall: FAIL ✗
