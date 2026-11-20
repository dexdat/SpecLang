# Verdict: DOC10-CLN002

**Task:** CLN-002 dead handwritten index generator deletion + DOC-10 GET /metrics docs rows
**Evaluated:** 2026-11-19T08:58:42.730877
**Result:** ✗ FAIL

## Pipeline Stages

- ✗ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ~ tests: Command timed out after 120s (step budget)
- ✗ **tier2**
  - INCOMPLETE
  ✗ Coverage FAILED — ungraded: 1. CLN-002: generate_index.py.handwritten is deleted from the working tree and untracked (git ls-files finds nothing), grep across py/md/sh finds no caller, and python3 scripts/generate_index.py --generate exits 0 with the regenerated _index.json containing no spec whose file path starts with .tmp/ (jq count 0); the committed _index.json is restored afterward. 2. DOC-10: docs/API_REFERENCE.md (via its spec twin specs/docs.spec.dir/docs/API_REFERENCE.md) lists GET /metrics in the HTTP+SSE transport row and the implemented-transports enumeration naming Prometheus OpenMetrics exposition, and GETTING-STARTED.md remote route table gains a GET /metrics row; docs/observability-spec.md and AGENTS.md are untouched; git diff touches only those doc paths; npm run build exits 0.
Evaluator error: LLM call failed: 402 Client Error: Payment Required for url: https://api.deepseek.com/v1/chat/completions (provider=openai model=deepseek-v4-flash url=https://api.deepseek.com/v1/chat/completions key=<GITREINS_LLM_API_KEY>)

## Summary

Stage tier1: FAIL (DEGRADED - skipped checks)
  WARNING: coverage is unknown — tests did not run (skipped at runtime — tests: timed out after 120s (step budget)); run `gitreins guard` for the full gate
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ~ tests: Command timed out after 120s (step budget)

Stage tier2: FAIL
  INCOMPLETE
  ✗ Coverage FAILED — ungraded: 1. CLN-002: generate_index.py.handwritten is deleted from the working tree and untracked (git ls-files finds nothing), grep across py/md/sh finds no caller, and python3 scripts/generate_index.py --generate exits 0 with the regenerated _index.json containing no spec whose file path starts with .tmp/ (jq count 0); the committed _index.json is restored afterward. 2. DOC-10: docs/API_REFERENCE.md (via its spec twin specs/docs.spec.dir/docs/API_REFERENCE.md) lists GET /metrics in the HTTP+SSE transport row and the implemented-transports enumeration naming Prometheus OpenMetrics exposition, and GETTING-STARTED.md remote route table gains a GET /metrics row; docs/observability-spec.md and AGENTS.md are untouched; git diff touches only those doc paths; npm run build exits 0.
Evaluator error: LLM call failed: 402 Client Error: Payment Required for url: https://api.deepseek.com/v1/chat/completions (provider=openai model=deepseek-v4-flash url=https://api.deepseek.com/v1/chat/completions key=<GITREINS_LLM_API_KEY>)

Overall: FAIL ✗ [DEGRADED — skipped: tier1(tests)=skipped at runtime — tests: timed out after 120s (step budget)]
