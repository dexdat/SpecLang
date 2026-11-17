# Verdict: QA-SPECLANG-009

**Task:** test suite must not rebuild dist/ mid-run (hello-world spec step 2 races concurrent readers)
**Evaluated:** 2026-11-17T21:38:23.942981
**Result:** ✗ FAIL

## Criteria

- — **A full npm test run does not rebuild the repo dist/ underneath concurrent readers: the hello-world spec build step writes to a scratch outDir or is serialized; red-proof on pre-fix tree; 3 consecutive post-fix full runs green with no mid-run build of dist/.**
  - Not examined — evaluation ended before this criterion was reached (no judgement was made about it)

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  16:35:02
- ✗ **tier2**
  - INCOMPLETE
  — A full npm test run does not rebuild the repo dist/ underneath concurrent readers: the hello-world spec build step writes to a scratch outDir or is serialized; red-proof on pre-fix tree; 3 consecutive post-fix full runs green with no mid-run build of dist/.: Not examined — evaluation ended before this criterion was reached (no judgement was made about it)
  ✗ Coverage FAILED — not passing: A full npm test run does not rebuild the repo dist/ underneath concurrent readers: the hello-world spec build step writes to a scratch outDir or is serialized; red-proof on pre-fix tree; 3 consecutive post-fix full runs green with no mid-run build of dist/.
Cap exceeded: Iteration cap (100) reached (100.1 used). Increase max_iterations or split criteria. Partial verdict — 0 of 1 criteria graded, 1 ungraded. The run spent 428,613 in / 3,303 out over 100.1 iterations.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  16:35:02

Stage tier2: FAIL
  INCOMPLETE
  — A full npm test run does not rebuild the repo dist/ underneath concurrent readers: the hello-world spec build step writes to a scratch outDir or is serialized; red-proof on pre-fix tree; 3 consecutive post-fix full runs green with no mid-run build of dist/.: Not examined — evaluation ended before this criterion was reached (no judgement was made about it)
  ✗ Coverage FAILED — not passing: A full npm test run does not rebuild the repo dist/ underneath concurrent readers: the hello-world spec build step writes to a scratch outDir or is serialized; red-proof on pre-fix tree; 3 consecutive post-fix full runs green with no mid-run build of dist/.
Cap exceeded: Iteration cap (100) reached (100.1 used). Increase max_iterations or split criteria. Partial verdict — 0 of 1 criteria graded, 1 ungraded. The run spent 428,613 in / 3,303 out over 100.1 iterations.

Overall: FAIL ✗
