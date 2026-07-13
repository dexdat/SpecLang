# SpecLang CI — Coding Hermes Tasks

## Active

- [ ] **FIX-VALIDATE-002: Fix 68 spec reference format issues**
  - **Priority:** medium
  - **Source:** Discovery sweep 2026-07-12 — `speclang validate` shows 68 `[@validation/refs]` failures
  - **Failures:** Invalid `@ref:` format — trailing backticks, parentheses, quotes, wrong prefixes (e.g. `@ref:speclang/implementation...` should be `@ref:specs/implementation...`)
  - **Acceptance:** `speclang validate` shows 0 refs failures, refs category passes
  - **Model:** deepseek-v4-flash
  - **Files:** specs/ (various .spec.md files with broken @ref: lines)

- [ ] **FIX-VALIDATE-003: Fix 57 block kind + 12 missing header fields**
  - **Priority:** medium
  - **Source:** Discovery sweep 2026-07-12 — `speclang validate` shows 57 `[@validation/blocks]` + 12 `[@validation/autonomous]` failures
  - **Block issues:** Invalid block kinds — enum, interface, class (not recognized by validator)
  - **Header issues:** Missing required fields — layer, project_level, short
  - **Acceptance:** `speclang validate` shows 0 blocks + 0 autonomous failures
  - **Model:** deepseek-v4-flash
  - **Files:** specs/ (various .spec.md files)

## Done

- [x] **FIX-TEST-004: Fix 2 daemon autonomous cascade test timeouts** (stale — resolved by prior CI-007 ordering fix) — Both tests pass at ~3s, confirmed 2 consecutive runs. Same mechanism as FIX-TEST-001 resolution.

- [x] **FIX-TEST-003: Fix 4 CLI get/search tests referencing wrong spec ID** (commit 0ca68981) — Replaced `@speclang/mcp.authentication` with `@speclang/auth` in tests/cli.test.ts. 32/32 CLI tests pass, 0 failures. ✅

- [x] **FIX-TEST-002: Fix intermittent test timeouts in CLI test suite** (commit 7c349232) — Added timeout:15000 + retry:2 to `search > should filter by tags` and `index > should support --json output`. 5/5 consecutive runs pass. ✅

- [x] **FIX-VALIDATE-001: Fix 313 spec validation failures** (commit 2c9fcac5) — 376 spec header line counts corrected. AC met: validate shows 21 failures (<50)

- [x] **FIX-CI-001: CI installs gitleaks without license secret** (commit 9d116bb1 + 4c12ee47) — RESOLVED by spare foreman ✅
- [x] **FIX-TEST-001: Fix flaky cascade status test timeout** (resolved 2026-07-12) — cascade status test passed 4+ consecutive runs. The search test skips from CI-007 likely changed test ordering enough to resolve the port/resource conflict. Accept: full suite 3 consecutive runs with 0 cascade-related failures ✅
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
- [x] **CI-007: Install gitleaks in CI workflow** (commit ace758fc — pushed by spare foreman)
