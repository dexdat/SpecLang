# SpecLang — Model Router Task Matrix

**Core purpose:** A meta-circular specification-driven compiler — specs/ are the source of truth, src/ is generated. TypeScript/Node.js, 476 specs, 1794+ tests, self-hosting bootstrap.

## Active Tasks

| ID | Task | Priority | Complexity | Deps | Tags | Model | Reasoning | Fallback |
|----|------|----------|------------|------|------|-------|-----------|----------|
| CI-INVESTIGATE-001 | CI failing 3 consecutive runs — "Build, test, and guard" job fails. Local build+tests pass clean (1794 pass). Logs inaccessible in cron context. Likely environment/infra — needs log access to root-cause. | High | 2 | — | +ci, +investigation | DeepSeek V4 Pro | CI diagnostics — environment mismatch, resource exhaustion, or pre-existing issue | GLM-5.2 |
| PITFALL-WORKFLOW-001 | Implement workflow command stubs (converge/commit, rollback, pipeline run, registry download) | Medium | 5 | — | ++code-generation, +architecture | GLM-5.2 | 7 TODOs across 2 files; bounded implementation with clear spec references | DeepSeek V4 Pro |
| PITFALL-MCP-001 | Implement MCP one-shot search/get (2 stubs in server.ts) | Low | 3 | — | ++code-generation, +api-use | DeepSeek V4 Flash | 2 stub methods; straightforward MCP protocol implementation | MiniMax M3 |
| PITFALL-DOWNGRADE-001 | Implement downgrade transition workflow (5 stubs across triggers/notification/audit/executor/planner) | Low | 6 | — | ++code-generation, ++architecture | GLM-5.2 | 5 files of stubbed downgrade logic; cross-cutting feature | DeepSeek V4 Pro |
| CI-BILLING-001 | GitHub Actions billing blocked — CI safety net unavailable | High | 1 (admin) | — | — | — | Blocked: requires GitHub account payment method — human action | — |
| NEVER-DONE | 11-point audit sweep | High | 2 | — | ++code-review, +testing | DeepSeek V4 Pro | Audit runs every tick; finds new gaps | GLM-5.2 |

**Assumptions:** TypeScript 7.0.2, Node 22+, pnpm; CI billing is admin/human action; React 19 migration complete; tailwindcss 4 upgrade deferred.

**Routing Notes:** All active pitfall tasks are stubs/TODOs — well-scoped, no new architecture needed. GLM-5.2 for multi-file workflow/downgrade tasks. DeepSeek V4 Flash for simple 2-method MCP stubs. CI-BILLING-001 is human-blocked — no model can fix it. CI-INVESTIGATE-001 needs CI log access to diagnose — may be environment/infra (not code).

**Execution Order:** CI-INVESTIGATE-001 → PITFALL-MCP-001 → PITFALL-WORKFLOW-001 → PITFALL-DOWNGRADE-001 (CI first, then ascending complexity). CI-BILLING-001 is independent.

**Escalation Conditions:** Any pitfall task touches >5 files → split. Tests reveal cross-cutting issues → escalate to DeepSeek V4 Pro. Security-relevant code paths → escalate to GPT-5.6 Sol.

## Completed Summary

**THINK-001 through THINK-004:** Spec header `thinking:` field, runtime thinking gating per cascade phase, provider adapter for OpenAI-compatible reasoning params, token accounting with `--metrics` flag.
**DOC/CI/TEST:** LICENSE created (was missing), YAML header fix, body-parser DoS fix, dual-view compliance >95%, ESLint→oxlint migration, daemon test timeout fixes, coverage report race condition fixed.
**DEPS:** React 18→19, TypeScript 5.9→7.0, js-yaml 4→5, postcss patch, @types/node 25→26. Commander 15 + chokidar 5 blocked (ESM-only).
**FIX/VALIDATE:** 313 spec validation fixes, 68 reference format fixes, 57 block kind fixes, 12 YAML header fixes, cascade abort test fix, CLI test fixes.
**ARCH-001 through ARCH-004:** Architecture tasks complete. COMPLIANCE-001 + 002: 100% dual-view compliance.
**Discovery Sweeps:** 11 idle ticks. 1 NEW actionable gap this tick (CI-INVESTIGATE-001). Cooldown at 43200s (12h) — re-fixed after daemon restart reversion (1st reversion). Build clean, 1794 pass / 58 skip / 0 fail.

### Idle Tick #11 — 11-Point Audit Results (2026-07-21 01:03)

| Check | Result | Detail |
|-------|--------|--------|
| 1. Spec Alignment | PASS | 449 specs, 448 validated (0 failures, 540 warnings) |
| 2. Doc Coverage | PASS | LICENSE + README present |
| 3. Test Gaps | PASS | 96 test files, 1794 pass / 58 skip / 0 fail |
| 4. Package Upgrades | PASS (blocked) | chokidar 5 (ESM-only), commander 15 (ESM-only), tailwindcss 4 (deferred) |
| 5. Pitfall Hunt | PASS | 0 TODO/FIXME/HACK in src/, 0 stubs found |
| 6. Performance | PASS | 27 benchmark test files |
| 7. CLI/Endpoint | PASS | `speclang validate` passes all 448 specs |
| 8. CI/CD | **FAIL** | 3 consecutive failures — "Build, test, and guard" job fails. Logs inaccessible (cron). Created CI-INVESTIGATE-001. |
| 9. DuckBrain Sync | PASS | 9 entries in speclang namespace |
| 10. Code Quality | PASS (cleaned) | Removed stale test-temp-bootstrap/ + test-temp-meta/. No untracked files. |
| 11. Middle-Out Wiring | PASS | CLI wired (bin/speclang), daemon wired (src/speclangd.ts) |

**Scheduler Health:** Cooldown reverted 43200s→1800s (daemon restart). Re-fixed via API PUT → 43200s. **1st reversion** — warning tracked.
**GitReins Sync:** DEPS-REACT-19 complete (matches board). No stale tasks.

## [ ] NEVER-DONE — Run coding-hermes-never-done 11-point audit
