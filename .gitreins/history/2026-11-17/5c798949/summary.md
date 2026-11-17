# Verdict: README-16

**Task:** fix: make CI-005 hermetic so a fresh clone runs the documented suite green
**Evaluated:** 2026-11-17T08:09:58.115396
**Result:** ✓ PASS

## Criteria

- ✓ **A fresh clone of the branch with the README install path followed literally (npm install && npm run build) runs npm test to exit 0 with no 'Hook not found' failure and without any git-hook installation step; tests/ci/ci005-precommit-hook.test.ts resolves the tracked .githooks/pre-commit instead of depending on a maintainer-only .git/hooks symlink; no assertion is skipped or weakened; README install path is unchanged.**
  - Fresh clone at /home/kara/fresh-clone-README16 (git clone of HEAD 97bad009, no node_modules, .git/hooks contains only *.sample, core.hooksPath unset). npm install -> exit 0; npm run build -> exit 0; npm test -> "Test Files 110 passed | 4 skipped (114) / Tests 1930 passed | 58 skipped (1988)", grep for "Hook not found" exit=1 (absent), no hook-install step performed. ci005 file run alone in the fresh clone: 7/7 passed with AC1..AC7 present and no .skip/.todo. README unchanged in HEAD (git show --stat lists only tests/ci/ci005-precommit-hook.test.ts). [resolution 0.00; tests/ci/ci005-precommit-hook.test.ts]

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  03:03:10
- ✓ **tier2**
  - COMPLETE
  ✓ A fresh clone of the branch with the README install path followed literally (npm install && npm run build) runs npm test to exit 0 with no 'Hook not found' failure and without any git-hook installation step; tests/ci/ci005-precommit-hook.test.ts resolves the tracked .githooks/pre-commit instead of depending on a maintainer-only .git/hooks symlink; no assertion is skipped or weakened; README install path is unchanged.: Fresh clone at /home/kara/fresh-clone-README16 (git clone of HEAD 97bad009, no node_modules, .git/hooks contains only *.sample, core.hooksPath unset). npm install -> exit 0; npm run build -> exit 0; npm test -> "Test Files 110 passed | 4 skipped (114) / Tests 1930 passed | 58 skipped (1988)", grep for "Hook not found" exit=1 (absent), no hook-install step performed. ci005 file run alone in the fresh clone: 7/7 passed with AC1..AC7 present and no .skip/.todo. README unchanged in HEAD (git show --stat lists only tests/ci/ci005-precommit-hook.test.ts). [resolution 0.00; tests/ci/ci005-precommit-hook.test.ts]
CI-005 now reads the tracked .githooks/pre-commit, so a fresh clone following the README install path passes the full suite with no hook installation step and no weakened assertions.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  03:03:10

Stage tier2: PASS
  COMPLETE
  ✓ A fresh clone of the branch with the README install path followed literally (npm install && npm run build) runs npm test to exit 0 with no 'Hook not found' failure and without any git-hook installation step; tests/ci/ci005-precommit-hook.test.ts resolves the tracked .githooks/pre-commit instead of depending on a maintainer-only .git/hooks symlink; no assertion is skipped or weakened; README install path is unchanged.: Fresh clone at /home/kara/fresh-clone-README16 (git clone of HEAD 97bad009, no node_modules, .git/hooks contains only *.sample, core.hooksPath unset). npm install -> exit 0; npm run build -> exit 0; npm test -> "Test Files 110 passed | 4 skipped (114) / Tests 1930 passed | 58 skipped (1988)", grep for "Hook not found" exit=1 (absent), no hook-install step performed. ci005 file run alone in the fresh clone: 7/7 passed with AC1..AC7 present and no .skip/.todo. README unchanged in HEAD (git show --stat lists only tests/ci/ci005-precommit-hook.test.ts). [resolution 0.00; tests/ci/ci005-precommit-hook.test.ts]
CI-005 now reads the tracked .githooks/pre-commit, so a fresh clone following the README install path passes the full suite with no hook installation step and no weakened assertions.

Overall: PASS ✓
