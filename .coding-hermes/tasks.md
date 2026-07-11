# SpecLang CI — Coding Hermes Tasks

## Active

- [ ] **FIX-CI-001: Diagnose and fix CI build failures (5 consecutive red runs)**
  - **Priority:** high
  - **Source:** Discovery sweep 2026-07-11 — all 5 recent CI runs on main are `failure`
  - **Symptom:** Build step (`npm run build` / `tsc`) fails on CI but passes locally
  - **Latest run:** https://github.com/dexdat/SpecLang/actions/runs/28683977186
  - **Context:** Remote CI workflow includes `.githooks/` pre-commit hook fix (CI-006) but NOT the gitleaks install (CI-007). Local has additional unpushed CI-007 fixes.
  - **Acceptance:** CI run on main shows ✅ green (build + test pass)
  - **Model:** MiniMax-M3

- [ ] **FIX-TEST-001: Fix flaky cascade status test timeout**
  - **Priority:** low
  - **Source:** Discovery sweep 2026-07-11 — `tests/cli.test.ts > cascade > should show cascade status` times out at 5000ms in full suite, passes in isolation (~984ms)
  - **Likely cause:** Port/resource conflict when running alongside other daemon/CascadeCoordinator tests
  - **Acceptance:** Full suite passes consistently (3 consecutive runs, 0 failures)
  - **Model:** MiniMax-M3

- [ ] **FIX-VALIDATE-001: Fix 319 spec validation failures (pre-existing format issues)**
  - **Priority:** low
  - **Source:** Discovery sweep 2026-07-11 — `./bin/speclang validate` reports 319 failed / 407 errors / 224 warnings across 447 spec files
  - **Root cause:** Spec files missing required fields like `layer` in autonomous validation, YAML header parse errors
  - **Note:** These are spec format issues, not code regressions. Affects `./bin/speclang validate` output but not build/tests.
  - **Acceptance:** `./bin/speclang validate` shows <50 failures (from 319)
  - **Model:** MiniMax-M3 (may need batch fix approach)

## Done

- [x] **CI-004: Wire GitReins Tier 2 into CI** (commit bd96cf83)
- [x] **CI-001: Fix 15 pre-existing test failures** (commit 800dee77)
- [x] **CI-002: Fix /tmp EDQUOT** (commit 25fd3acd)
- [x] **CI-003: Set up GitHub Actions CI pipeline** (commit 64132309)
- [x] **Fix CI: linter step fails (exit code 127)** (commit 5820daaf)
- [x] **ARCH-001: Automatic file watching** (commit 255184a4)
- [x] **ARCH-002: Background daemon mode** (commit 55d52b55)
- [x] **ARCH-003: Parallel agent execution** (commit in history)
- [x] **ARCH-004: Autonomous cascade** (commit 4a7fdd99)
- [x] **Fix CI: test env assumptions fail** (commit 735b7f88)
- [x] **CI-005: Pre-commit hook hardening** (commit a9a92f5f)
- [x] **CI-006: Test coverage reporting** (commit feb93680)
- [x] **Fix CI: test code bugs** (commit 46828de5)
- [x] **COMPLIANCE-001: Add src/generated/ to exemptions** (commit a828b4e3)
- [x] **COMPLIANCE-002: Specs for 22 non-compliant files** (commit 98ccac4c)
- [x] **CI-006 Fix: pre-commit hook missing on fresh CI clone** (commit 442a3296)
- [x] **CI-007: Install gitleaks in CI workflow** (commit ace758fc — NOT PUSHED)
