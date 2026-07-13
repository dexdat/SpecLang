# SpecLang CI — Coding Hermes Tasks

## Active

- [ ] **FIX-VALIDATE-001: Fix 313 spec validation failures (pre-existing format issues)**
  - **Priority:** medium
  - **Source:** Discovery sweep 2026-07-11
  - **Progress (2026-07-12):** Parser fix (5389c248) skips code blocks in ref extraction (-6 failures, -40 errors). Remaining 313 failures are YAML parse errors ("Nested mappings not allowed", "Plain value cannot start with @" in header frontmatter) and ~20 ref format issues from inline markdown. These need per-file YAML header fixes.
  - **Root cause:** Many spec YAML headers have malformed quoting (`parent: ""@ref:specs/...` patterns) or unquoted `@` values.
  - **Acceptance:** `./bin/speclang validate` shows <50 failures (from 313)
  - **Model:** MiniMax-M3 (batch fix approach recommended)

- [ ] **FIX-TEST-002: Fix intermittent test timeouts in CLI test suite**
  - **Priority:** low
  - **Source:** Foreman tick 2026-07-12 — 2 tests flake intermittently:
    - `search > should filter by tags` (timeout 5000ms) — intermittent
    - `index > should support --json output` (timeout 5000ms) — intermittent
  - **Note:** These are different from FIX-TEST-001 (cascade status). They appear in ~1/4 runs.
  - **Acceptance:** Full suite passes consistently (5 consecutive runs, 0 failures)
  - **Model:** MiniMax-M3

## Done

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
