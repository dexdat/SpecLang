# SpecLang CI — Coding Hermes Tasks

## Active

- [x] **DOCS-PRD-002: Track docs/PRD.html in git** (commit 48c3732b)
  - `docs/PRD.html` is a 249-line PRD document, untracked since Jul 14
  - Should be committed — it's project documentation
  - Files: `docs/PRD.html` (git add)
  - AC: PRD.html tracked, committed to git
  - Source: discovery sweep 2026-07-14

- [x] **CLEANUP-ROOT-003: Archive root-level one-off Python scripts** (commit d81b7ef2)
  - Root-level scripts from prior FIX-VALIDATE cycles clutter repo root
  - Moved 5 scripts to scripts/archive/ + removed duplicate generate_index.py symlink
  - Root clean. Build+tests pass (1748/64)

- [ ] **CLEANUP-BIN-ORIG2-004: Archive or remove bin.orig2/ backup directory**
  - `bin.orig2/` contains backup scripts (e2e tests, speclang binary, smoke tests)
  - Listed as orphans by Hilo — no active dependencies
  - Files: `bin.orig2/` directory
  - AC: `bin.orig2/` removed or archived, build+tests still pass
  - Source: discovery sweep 2026-07-14

## Done

- [x] **HILO-HYGIENE-001: Add .gitignore entries for Hilo cache files + track edges.jsonl** (commit 920fedbc)
  - Added `.vfs/graph/graph.db`, `graph.db.wal`, `.last_warm` to .gitignore
  - Tracked `edges.jsonl` (3700 lines) + `manifest.yaml` for cross-machine sync
  - Guard: PASS. Build: PASS. Tests: 1748 passed.
- [x] **FIX-TEST-005: Fix cascade abort test — trigger cascade before aborting** (commit 9457e697)
- [x] **FIX-VALIDATE-004: Fix 12 YAML header parse errors** (commit bfd46ca1)
- [x] **FIX-VALIDATE-003: Fix 57 block kind + 12 missing header fields** (commit 257ccc14)
- [x] **FIX-VALIDATE-002: Fix 68 spec reference format issues** (commit e7df3871)
- [x] **FIX-TEST-004: Fix 2 daemon autonomous cascade test timeouts** (stale — resolved by CI-007 ordering fix)
- [x] **FIX-TEST-003: Fix 4 CLI get/search tests referencing wrong spec ID** (commit 0ca68981)
- [x] **FIX-TEST-002: Fix intermittent test timeouts in CLI test suite** (commit 7c349232)
- [x] **FIX-VALIDATE-001: Fix 313 spec validation failures** (commit 2c9fcac5)
- [x] **FIX-CI-001: CI installs gitleaks without license secret** (commit 9d116bb1 + 4c12ee47)
- [x] **FIX-TEST-001: Fix flaky cascade status test timeout** (resolved by CI-007)
- [x] **CI-001 through CI-006** — All CI tasks complete
- [x] **ARCH-001 through ARCH-004** — All architecture tasks complete
- [x] **COMPLIANCE-001 + COMPLIANCE-002** — 100% dual-view compliance
## [ ] Fix CI: test — 1 failure on main, investigate
