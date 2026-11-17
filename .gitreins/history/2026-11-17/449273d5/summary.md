# Verdict: DF-SPECLANG-3-R4

**Task:** Daemon reports false success then fails its own typecheck
**Evaluated:** 2026-11-17T06:07:25.951837
**Result:** ✓ PASS

## Criteria

- ✓ **npm run build exits 0 with no TypeScript errors; npx vitest run tests/daemon/arch002-background-daemon.test.ts exits 0 with 4 passed; node bin/speclang validate exits 0 printing 'Validation Summary'**
  - PASS: npm run build exit 0 (no TS output); npx tsc --noEmit exit 0. vitest: exit 0, "Tests 4 passed (4)" for tests/daemon/arch002-background-daemon.test.ts. node bin/speclang validate: exit 0, "Validation Summary: 452 files", Failed: 0, Errors: 0. Additional this session: TMPDIR=$PWD/.tmp npx vitest run tests/db.test.ts => "Tests 35 passed (35)"; tests/db/cascades-migration.test.ts => "Tests 5 passed (5)". · graded at iteration 100.9 (462,718 in / 2,467 out, 100.9 iterations and 213s into the run) [resolution 0.06; tests/daemon/arch002-background-daemon.test.ts]

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  01:03:06
- ✓ **tier2**
  - COMPLETE
  ✓ npm run build exits 0 with no TypeScript errors; npx vitest run tests/daemon/arch002-background-daemon.test.ts exits 0 with 4 passed; node bin/speclang validate exits 0 printing 'Validation Summary': PASS: npm run build exit 0 (no TS output); npx tsc --noEmit exit 0. vitest: exit 0, "Tests 4 passed (4)" for tests/daemon/arch002-background-daemon.test.ts. node bin/speclang validate: exit 0, "Validation Summary: 452 files", Failed: 0, Errors: 0. Additional this session: TMPDIR=$PWD/.tmp npx vitest run tests/db.test.ts => "Tests 35 passed (35)"; tests/db/cascades-migration.test.ts => "Tests 5 passed (5)". · graded at iteration 100.9 (462,718 in / 2,467 out, 100.9 iterations and 213s into the run) [resolution 0.06; tests/daemon/arch002-background-daemon.test.ts]
Cap exceeded: Iteration cap (100) reached (100.9 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  01:03:06

Stage tier2: PASS
  COMPLETE
  ✓ npm run build exits 0 with no TypeScript errors; npx vitest run tests/daemon/arch002-background-daemon.test.ts exits 0 with 4 passed; node bin/speclang validate exits 0 printing 'Validation Summary': PASS: npm run build exit 0 (no TS output); npx tsc --noEmit exit 0. vitest: exit 0, "Tests 4 passed (4)" for tests/daemon/arch002-background-daemon.test.ts. node bin/speclang validate: exit 0, "Validation Summary: 452 files", Failed: 0, Errors: 0. Additional this session: TMPDIR=$PWD/.tmp npx vitest run tests/db.test.ts => "Tests 35 passed (35)"; tests/db/cascades-migration.test.ts => "Tests 5 passed (5)". · graded at iteration 100.9 (462,718 in / 2,467 out, 100.9 iterations and 213s into the run) [resolution 0.06; tests/daemon/arch002-background-daemon.test.ts]
Cap exceeded: Iteration cap (100) reached (100.9 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

Overall: PASS ✓
