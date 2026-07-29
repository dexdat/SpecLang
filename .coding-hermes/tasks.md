<!--
  ⚠️  BOARD FORMAT — coding-hermes-model-router v1.3 (2026-07-24)
  All tasks MUST use matrix format: | ID | Task | Pri | Cpx | Deps | Tags | Model | Reasoning | Fallback |
  Before editing this file, load the skill: skill_view(name='coding-hermes-model-router')
  Validate: python3 ~/.hermes/scripts/validate-board-format.py .coding-hermes/tasks.md
- [ ] **GITREINS-JUDGE — Configure LLM evaluator for commit quality review**
  | 🔴 Critical | — | — | deepseek-v4-flash @ deepseek-foreman | GITREINS_LLM_API_KEY in ~/.hermes/.env | foreman-direct |

  Run: `python3 ~/.hermes/scripts/check-gitreins-judge.py .` to verify.
  If missing, create/edit .gitreins/config.yaml with evaluator section using deepseek-v4-flash.
  This is CRITICAL for code quality — no automated review of worker output without it.

  NEVER remove the matrix header row or NEVER-DONE / E2E-001 fixtures.
-->

# SpecLang — Model Router Task Matrix

**Core purpose:** A meta-circular specification-driven compiler — specs/ are the source of truth, src/ is generated. TypeScript/Node.js, 448 specs, 1791+ tests, self-hosting bootstrap.

---

### Foreman #75 — NEVER-DONE Audit (2026-07-28, scheduler)

**System State:** Load 3.15, 48Gi avail, 16 cores. Up 12d 7h. Node v22.22.3, TypeScript 7.0.2. vitest: 93/97 files (1808/1866 tests, 58 skip), 27.41s — clean run, 0 flakes. Hilo: 3,616 edges across 1,597 files (5 languages). speclang validate: 448/448 pass (0 fail, 540 warnings pre-existing). tsc clean.

**Scheduler:** SpecLang FOUND (was lost ticks #70-73, restored tick #74). CooldownS=900, Weight=15, Priority=10, Enabled=true. NamespaceID=coding-hermes. Stable — no reversion since tick #74 restoration.

**11-Point Audit Results:**

| Check | Result | Detail |
|-------|--------|--------|
| 1. Spec Alignment | PASS | 448/448 validate (0 fail, 540 warnings pre-existing) |
| 2. Doc Coverage | PASS | 9/9 NEVER-DONE docs verified on disk via ls |
| 3. Test Gaps | PASS | 93/97 files, 1808/1866 tests pass (58 skip), 27.41s — 0 flakes |
| 4. Package Upgrades | PASS (blocked minor) | postcss 8.5.22→8.5.24 (patch). @modelcontextprotocol/sdk 1.29→1.30. @types/node 26.1.1→26.1.2. ESM-only majors remain blocked (better-sqlite3 13, chokidar 5, commander 15, tailwindcss 4) |
| 5. Pitfall Hunt | PASS | 0 TODO/FIXME/HACK in src/**/*.ts. 3 pre-existing Rust daemon TODOs (ipc.rs:26, router.rs:22, convergence.rs:38 — unchanged since Jul 12) |
| 6. Performance | PASS | 3 bench test files (cascade, daemon, mcp) + monitor.ts utility (248 lines on disk, NOT a bench test — no .test.ts suffix) |
| 7. CLI/Endpoint | PASS | tsc clean, speclang --help + validate both work |
| 8. CI/CD | **FAIL (pre-existing)** | billing (CI-BILLING-001, human action) |
| 9. DuckBrain Sync | PASS | Tick #75 written (c1b8d2f1), namespace speclang active |
| 10. Code Quality | NOTED | tsc --noEmit clean. npm audit: 2 moderate vulns (@hono/node-server, @modelcontextprotocol/sdk — pre-existing) |
| 11. Middle-Out Wiring | PASS | CLI (bin/speclang) + daemon (src/speclangd.ts) wired |

**Actions Taken:**
1. Self-heal: identity verified (kara), git stash + pull --rebase (up to date), cleaned untracked test-temp-bootstrap/ and test-temp-meta/
2. Ground truth: ALL checks run fresh this tick — vitest, tsc, speclang validate, hilo graph stats, npm outdated, npm audit, scheduler API, DuckBrain, GitReins
3. Scheduler: SpecLang confirmed (Weight=15, Priority=10, CooldownS=900, Enabled=true). Stable — same as tick #74.
4. 0 test flakes at load 3.15 — vitest 27.41s (in range with prior ticks: 27-34s)
5. Bench count verified via `find`: 3 bench test files + monitor.ts utility. No fabrication risk — confirmed on disk.
6. Docs: 9/9 verified via `ls` on disk
7. GitReins: guard_run PASS (no staged files). 3 tasks all complete. Judge config PASS (deepseek-v4-flash, caps: 100/30m/0.5M/0.5M)
8. DuckBrain: tick #75 written, speclang namespace confirmed
9. 0 new gaps requiring code tasks — **project remains genuinely idle (54 consecutive idle ticks, 12+ days)**
10. Bookkeeping: tasks.md updated

**Eval:** Tier1=N/A (TypeScript), Audit=N/A, Tier3=N/A, Hilo=useful, DuckBrain=connected, GitReins=clean

**VERDICT: idle — maintenance mode (scheduler stable at 900s cooldown)**

**⚠️ 54th consecutive idle tick (12+ days).** All tasks complete. Scheduler stable. Bench count verified. Docs 9/9. ONLY remaining: CI-BILLING-001 (human action — GitHub billing). Cooldown at 900s is appropriate for monitoring. No new gaps.

**Scheduler Health:** Daemon running. SpecLang namespace present. CooldownS=900. Enabled=true. Weight=15. No cooldown reversion since tick #74 restoration.

---

## Active Tasks

- [ ] **E2E-001 — E2E Testing Tick (self-improving loop)** 🔁 Recurring every 5-10 ticks
  Spawn Luna (browser/screenshots) or Step 3.7 Flash (CLI/API). Deploy/build, Playwright, screenshots, endpoints, console. → e2e-output/tasks.md → inject into board. See foreman Step 1.5i. Proven: HEADING 10 bugs found.

| ID | Task | Priority | Complexity | Deps | Tags | Model | Reasoning | Fallback |
|----|------|----------|------------|------|------|-------|-----------|----------|
| CI-BILLING-001 | GitHub Actions billing blocked — CI safety net unavailable | High | 1 (admin) | — | — | — | Blocked: requires GitHub account payment method — human action | — |
| NEVER-DONE | 11-point audit sweep | High | 2 | — | ++code-review, +testing | DeepSeek V4 Pro | Audit runs every tick; finds new gaps | GLM-5.2 |

**Assumptions:** TypeScript 7.0.2, Node 22+, pnpm; CI billing is admin/human action; React 19 migration complete; tailwindcss 4 upgrade deferred.

**Routing Notes:** All 3 PITFALL tasks resolved. TEST-REGRESSION-001 RESOLVED. TEST-INFRA-001 RESOLVED. CI-BILLING-001 is human-blocked. U01 complete. 54 consecutive idle ticks.

**Execution Order:** NEVER-DONE audit runs every tick.

**Escalation Conditions:** Any pitfall task touches >5 files → split. Tests reveal cross-cutting issues → escalate to DeepSeek V4 Pro. Security-relevant code paths → escalate to GPT-5.6 Sol.

## Completed Summary

**PITFALL-MCP-001:** DONE (tick #20). **PITFALL-WORKFLOW-001:** DONE (tick #20/21). **PITFALL-DOWNGRADE-001:** DONE (tick #21). **THINK-001 through THINK-004:** Complete. **ARCH-001 through ARCH-004:** Complete. **COMPLIANCE-001 + 002:** Complete. **U01:** DONE (tick #29). **TEST-REGRESSION-NEW:** RESOLVED. **TEST-INFRA-001:** RESOLVED.
