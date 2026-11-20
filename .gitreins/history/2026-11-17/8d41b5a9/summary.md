# Verdict: PROBE-DF12

**Task:** DF-SPECLANG-12 verdict-persistence probe
**Evaluated:** 2026-11-17T05:42:14.370850
**Result:** ✗ FAIL

## Pipeline Stages

- ✗ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ~ tests: Command timed out after 120s (step budget)

## Summary

Stage tier1: FAIL (DEGRADED - skipped checks)
  WARNING: coverage is unknown — tests did not run (skipped at runtime — tests: timed out after 120s (step budget)); run `gitreins guard` for the full gate
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ~ tests: Command timed out after 120s (step budget)

Overall: FAIL ✗ [DEGRADED — skipped: tier1(tests)=skipped at runtime — tests: timed out after 120s (step budget)]
