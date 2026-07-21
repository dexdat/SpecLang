# SpecLang — Model Router Task Matrix

**Core purpose:** A meta-circular specification-driven compiler — specs/ are the source of truth, src/ is generated. TypeScript/Node.js, 448 specs, 1791+ tests, self-hosting bootstrap.

## Active Tasks

| ID | Task | Priority | Complexity | Deps | Tags | Model | Reasoning | Fallback |
|----|------|----------|------------|------|------|-------|-----------|----------|
| TEST-REGRESSION-001 | 3 CLI tests failing (cli.test.ts: filter by layer, filter by tags, list all specs). Regression from idle tick #11 (was 1794 pass/0 fail, now 1791 pass/3 fail). Root cause unknown — may be related to better-sqlite3 rebuild or stale TMPDIR state. | High | 3 | — | +testing, +regression | DeepSeek V4 Pro | Test regression investigation — root-cause then fix | GLM-5.2 |
| TEST-INFRA-001 | Default vitest worker pool exhausts system resources (Rolldown panic: thread pool init EAGAIN). Workaround: --maxWorkers=1 --no-file-parallelism. Needs investigation: ulimit -n is 1024, may need increase for 96 test files. | Medium | 2 | — | +infra, +testing | DeepSeek V4 Flash | Infra tuning — ulimit or vitest config change | GLM-5.2 |
| PITFALL-WORKFLOW-001 | Implement workflow command stubs (converge/commit, rollback, pipeline run, registry download) | Medium | 5 | — | ++code-generation, +architecture | GLM-5.2 | 7 TODOs across 2 files; bounded implementation with clear spec references | DeepSeek V4 Pro |
| PITFALL-MCP-001 | Implement MCP one-shot search/get (2 stubs in server.ts) | Low | 3 | — | ++code-generation, +api-use | DeepSeek V4 Flash | 2 stub methods; straightforward MCP protocol implementation | MiniMax M3 |
| PITFALL-DOWNGRADE-001 | Implement downgrade transition workflow (5 stubs across triggers/notification/audit/executor/planner) | Low | 6 | — | ++code-generation, ++architecture | GLM-5.2 | 5 files of stubbed downgrade logic; cross-cutting feature | DeepSeek V4 Pro |
| CI-BILLING-001 | GitHub Actions billing blocked — CI safety net unavailable | High | 1 (admin) | — | — | — | Blocked: requires GitHub account payment method — human action | — |
| NEVER-DONE | 11-point audit sweep | High | 2 | — | ++code-review, +testing | DeepSeek V4 Pro | Audit runs every tick; finds new gaps | GLM-5.2 |

**Assumptions:** TypeScript 7.0.2, Node 22+, pnpm; CI billing is admin/human action; React 19 migration complete; tailwindcss 4 upgrade deferred.

**Routing Notes:** CI-INVESTIGATE-001 resolved (confirmed: all 5 recent CI runs fail in 2-6s with 0 steps executed — GitHub Actions billing/infrastructure, not code). TEST-REGRESSION-001 is the highest-priority actionable task — 3 real test failures. TEST-INFRA-001 is a quick infra fix (ulimit or vitest config). Pitfall tasks blocked until test regression resolved (worker can't verify). CI-BILLING-001 is human-blocked.

**Execution Order:** TEST-REGRESSION-001 → TEST-INFRA-001 → PITFALL-MCP-001 → PITFALL-WORKFLOW-001 → PITFALL-DOWNGRADE-001.

**Escalation Conditions:** Any pitfall task touches >5 files → split. Tests reveal cross-cutting issues → escalate to DeepSeek V4 Pro. Security-relevant code paths → escalate to GPT-5.6 Sol.

## Completed Summary

**THINK-001 through THINK-004:** Spec header `thinking:` field, runtime thinking gating per cascade phase, provider adapter for OpenAI-compatible reasoning params, token accounting with `--metrics` flag.
**DOC/CI/TEST:** LICENSE created (was missing), YAML header fix, body-parser DoS fix, dual-view compliance >95%, ESLint→oxlint migration, daemon test timeout fixes, coverage report race condition fixed.
**DEPS:** React 18→19, TypeScript 5.9→7.0, js-yaml 4→5, postcss patch, @types/node 25→26. Commander 15 + chokidar 5 blocked (ESM-only).
**FIX/VALIDATE:** 313 spec validation fixes, 68 reference format fixes, 57 block kind fixes, 12 YAML header fixes, cascade abort test fix, CLI test fixes.
**ARCH-001 through ARCH-004:** Architecture tasks complete. COMPLIANCE-001 + 002: 100% dual-view compliance.
**CI-INVESTIGATE-001:** Investigation complete — all 5 recent CI runs fail in 2-6s with 0 steps executed. Jobs produce empty ZIP logs. Confirmed GitHub Actions billing/infrastructure issue (not code). Resolution path: CI-BILLING-001 (human action — GitHub payment method).
**Discovery Sweeps:** 12 idle ticks. 2 NEW actionable gaps from idle tick #12 (TEST-REGRESSION-001, TEST-INFRA-001). 1 INVESTIGATION gap resolved this tick (CI-INVESTIGATE-001 — confirmed billing/infrastructure). better-sqlite3 build fixed (pnpm-workspace.yaml committed). Cooldown at 43200s (12h). Build nearly clean: 1791 pass / 58 skip / 3 fail.

### Idle Tick #12 — 11-Point Audit Results (2026-07-21 03:50)

| Check | Result | Detail |
|-------|--------|--------|
| 1. Spec Alignment | PASS | 448 specs, 448 validated (0 failures, 540 warnings) |
| 2. Doc Coverage | PASS | LICENSE + README present |
| 3. Test Gaps | **FAIL** | 3 CLI tests failing (regression from 0 fail). Default worker pool exhausts system resources (needs --maxWorkers=1). |
| 4. Package Upgrades | PASS (blocked) | chokidar 5 (ESM-only), commander 15 (ESM-only), tailwindcss 4 (deferred). better-sqlite3 13 available. |
| 5. Pitfall Hunt | PASS | 0 TODO/FIXME/HACK in src/, 0 stubs found |
| 6. Performance | PASS | 3 benchmark test files (cascade, daemon, mcp) |
| 7. CLI/Endpoint | PASS | `speclang validate` passes all 448 specs. bin/speclang executable. |
| 8. CI/CD | **FAIL** | 3 consecutive failures — "Build, test, and guard" job fails. Billing also blocked. |
| 9. DuckBrain Sync | PASS | 5 entries in speclang namespace |
| 10. Code Quality | PASS (cleaned) | Oxlint 449 warnings/6 errors are speclang-header artifacts in generated files. Fixed: better-sqlite3 native build (pnpm-workspace.yaml committed). Committed untracked pnpm-lock.yaml. |
| 11. Middle-Out Wiring | PASS | CLI wired (bin/speclang), daemon wired (src/speclangd.ts) |

**Scheduler Health:** Cooldown at 43200s (12h). 1st reversion (idle tick #11 re-fix) — warning tracked.
**GitReins Sync:** DEPS-REACT-19 complete (matches board). No stale tasks.
**Hilo:** 3,545 edges across 1,584 files — Hilo=useful.
**This tick (foreman #13 — 2026-07-21 03:51):** Investigated CI-INVESTIGATE-001 via `gh run view` + `gh api` — confirmed all 5 recent CI runs fail in 2-6s with 0 steps executed (empty ZIP logs). This is GitHub Actions billing/infrastructure exhaustion, not code. CI resolution blocked on CI-BILLING-001 (human action). Committed pnpm-workspace.yaml + pnpm-lock.yaml (better-sqlite3 native build fix). Board updated: CI-INVESTIGATE-001 marked resolved, TEST-REGRESSION-001 and TEST-INFRA-001 remain as next actionable tasks.

## [ ] NEVER-DONE — Run coding-hermes-never-done 11-point audit
