# Verdict: DF-SPECLANG-013

**Task:** gitreins tier1 build arm reports FAIL in a fresh worktree that simply lacks node_modules
**Evaluated:** 2026-11-17T21:50:28.324429
**Result:** ✓ PASS

## Criteria

- ✓ **In a fresh worktree with no node_modules, the tier1 build arm reports SKIP (or a named dependencies-not-installed precondition) instead of FAIL; with deps installed the same tree grades build ok and Overall PASS.**
  - Skip half verified in prior context: fresh tree extracted via `git archive HEAD | tar -x -C .tmp/df013-fresh` (no node_modules); `bash scripts/guard-build.sh` printed "skipped: dependencies not installed (node_modules absent — run npm ci)" plus `GITREINS_SKIP: build=...` with rc=0. Engine 0.21.0 real path: Pipeline._run_script_step on the config's build step returned passed=True exit=0 with the sentinel in output, and _record_runtime_skips recorded stage passed=True degraded=True skipped_steps=['build'] with reason "skipped at runtime — build: dependencies not installed...". Bounding check: _bound_step_evidence(4000 cap) + parse_skip_sentinels keeps the sentinel in all orderings tested. Last commit 5d69bfc pins the wrapper in tests/ci/ci005-precommit-hook.test.ts so the test asserts the dependency-aware wrapper rather than the bare build command.

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  16:44:40
- ✓ **tier2**
  - COMPLETE
  ✓ In a fresh worktree with no node_modules, the tier1 build arm reports SKIP (or a named dependencies-not-installed precondition) instead of FAIL; with deps installed the same tree grades build ok and Overall PASS.: Skip half verified in prior context: fresh tree extracted via `git archive HEAD | tar -x -C .tmp/df013-fresh` (no node_modules); `bash scripts/guard-build.sh` printed "skipped: dependencies not installed (node_modules absent — run npm ci)" plus `GITREINS_SKIP: build=...` with rc=0. Engine 0.21.0 real path: Pipeline._run_script_step on the config's build step returned passed=True exit=0 with the sentinel in output, and _record_runtime_skips recorded stage passed=True degraded=True skipped_steps=['build'] with reason "skipped at runtime — build: dependencies not installed...". Bounding check: _bound_step_evidence(4000 cap) + parse_skip_sentinels keeps the sentinel in all orderings tested. Last commit 5d69bfc pins the wrapper in tests/ci/ci005-precommit-hook.test.ts so the test asserts the dependency-aware wrapper rather than the bare build command.
The dependency-aware build wrapper turns a missing-node_modules build into a named SKIP that the guard engine records as a degraded-but-passing stage, and the CI test now pins the wrapper instead of the bare build command.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  16:44:40

Stage tier2: PASS (DEGRADED - skipped checks)
  WARNING: coverage is unknown — build did not run (skipped at runtime — build: ...` with rc=0. Engine 0.21.0 real path: Pipeline._run_script_step on the config's build step returned passed=True exit=0 with the sentinel in output, and _record_runtime_skips recorded stage passed=True degraded=True skipped_steps=['build'] with reason "skipped at runtime — build: dependencies not installed...". Bounding check: _bound_step_evidence(4000 cap) + parse_skip_sentinels keeps the sentinel in all orderings tested. Last commit 5d69bfc pins the wrapper in tests/ci/ci005-precommit-hook.test.ts so the test asserts the dependency-aware wrapper rather than the bare build command.); run `gitreins guard` for the full gate
  COMPLETE
  ✓ In a fresh worktree with no node_modules, the tier1 build arm reports SKIP (or a named dependencies-not-installed precondition) instead of FAIL; with deps installed the same tree grades build ok and Overall PASS.: Skip half verified in prior context: fresh tree extracted via `git archive HEAD | tar -x -C .tmp/df013-fresh` (no node_modules); `bash scripts/guard-build.sh` printed "skipped: dependencies not installed (node_modules absent — run npm ci)" plus `GITREINS_SKIP: build=...` with rc=0. Engine 0.21.0 real path: Pipeline._run_script_step on the config's build step returned passed=True exit=0 with the sentinel in output, and _record_runtime_skips recorded stage passed=True degraded=True skipped_steps=['build'] with reason "skipped at runtime — build: dependencies not installed...". Bounding check: _bound_step_evidence(4000 cap) + parse_skip_sentinels keeps the sentinel in all orderings tested. Last commit 5d69bfc pins the wrapper in tests/ci/ci005-precommit-hook.test.ts so the test asserts the dependency-aware wrapper rather than the bare build command.
The dependency-aware build wrapper turns a missing-node_modules build into a named SKIP that the guard engine records as a degraded-but-passing stage, and the CI test now pins the wrapper instead of the bare build command.

Overall: PASS ✓ [DEGRADED — skipped: tier2(build)=skipped at runtime — build: ...` with rc=0. Engine 0.21.0 real path: Pipeline._run_script_step on the config's build step returned passed=True exit=0 with the sentinel in output, and _record_runtime_skips r…]
