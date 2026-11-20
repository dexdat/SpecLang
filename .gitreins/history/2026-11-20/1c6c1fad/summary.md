# Verdict: README-5

**Task:** README: runnable-examples honesty, Testing section, dated Path Forward
**Evaluated:** 2026-11-20T08:00:38.566108
**Result:** ✗ FAIL

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: RUN  v4.1.11 /home/kara/speclang
- ✗ **tier2**
  - INCOMPLETE
  ✗ Coverage FAILED — ungraded: AC-1: grep -qE '^#{2,4} .*[Tt]est' README.md exits 0. AC-2: awk '/Path Forward/,0' README.md | grep -qE '20[0-9]{2}' exits 0. AC-3: every examples/ path advertised in README.md is accompanied by a runnable command. AC-4: npx vitest run tests/readme-doc-claims.test.ts exits 0.
Evaluator error: LLM call failed: 402 Client Error: Payment Required for url: https://api.deepseek.com/v1/chat/completions (provider=openai model=deepseek-v4-flash url=https://api.deepseek.com/v1/chat/completions key=<GITREINS_LLM_API_KEY>)

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: RUN  v4.1.11 /home/kara/speclang

Stage tier2: FAIL
  INCOMPLETE
  ✗ Coverage FAILED — ungraded: AC-1: grep -qE '^#{2,4} .*[Tt]est' README.md exits 0. AC-2: awk '/Path Forward/,0' README.md | grep -qE '20[0-9]{2}' exits 0. AC-3: every examples/ path advertised in README.md is accompanied by a runnable command. AC-4: npx vitest run tests/readme-doc-claims.test.ts exits 0.
Evaluator error: LLM call failed: 402 Client Error: Payment Required for url: https://api.deepseek.com/v1/chat/completions (provider=openai model=deepseek-v4-flash url=https://api.deepseek.com/v1/chat/completions key=<GITREINS_LLM_API_KEY>)

Overall: FAIL ✗
