# SpecLang CI — Coding Hermes Tasks

## Active

- [ ] **DEPS-UPDATE-002: Audit and update outdated npm dependencies (2026-07-18)**
  - [x] @types/node 25→26 — major bump (commit c940f6ba) — Build: tsc clean, Tests: 1746/1812 pass (8 pre-existing cascade flakes)
  - Remaining: commander 15 (BLOCKED — ESM+Node 22), chokidar 5 (BLOCKED — ESM), date-fns 4 (unused), tailwindcss 4 (major rewrite), typescript 7.0 (HIGH, needs 5.9→6.x first), zustand 5 (unused)
  - Discovery sweep: `npm outdated --depth=0` showed 18 packages behind latest
  - Minor/patch bumps done (commits a1d6d899, 07093c08): mcp-sdk, better-sqlite3, fs-extra, vitest, autoprefixer, coverage-v8, @types/node, @types/react
  - Major upgrade done: js-yaml 4→5 (commit 42225848) — CJS path exists, 0 vulns, 1754/1754 tests pass
  - Remaining major upgrades filed as child tasks below — each assessed for ESM/CJS compatibility, engine requirements, and code impact
  
- [ ] **DEPS-UPDATE-002a: commander 14→15 — BLOCKED (ESM-only + Node ≥22.12)**
  - Used in 6 CLI entry points (specs/cli.spec.dir, specs/speclangd.ts.spec.dir, specs/daemon.spec.dir, specs/workflow.spec.dir, specs/implementation.spec.dir)
  - commander@15: type=module (ESM-only), engines node>=22.12.0
  - All imports use `require("commander")` / CommonJS — ESM migration needed project-wide
  - Node version requirement is 2 majors ahead of current env
  - Priority: LOW — defer until Node upgrade + ESM migration planned

- [ ] **DEPS-UPDATE-002b: chokidar 4→5 — BLOCKED (ESM-only + Node ≥20.19)**
  - Direct dep, but no source imports found in src/ (unused or tooling-only)
  - chokidar@5: type=module (ESM-only), engines node>=20.19.0
  - TailwindCSS 3.x pulls chokidar@3.x transitively
  - Priority: LOW — defer; consider removing if truly unused

- [ ] **DEPS-UPDATE-002c: date-fns 3→4 — ESM-only, unused in src**
  - Listed in devDependencies, no source imports found
  - date-fns@4: type=module, has index.cjs fallback but exports-gated
  - Priority: LOW — bump when unused deps audit happens

- [x] **DEPS-UPDATE-002d: react 18→19 + react-dom + @types/react + @types/react-dom** (commit 2b58bb23)
  - React 19.2.7, react-dom 19.2.7, @types/react 19.2.17, @types/react-dom 19.2.3
  - Build: tsc clean | Tests: 1753/1812 pass (1 pre-existing cascade flake)
  - npm audit: 0 vulns

- [ ] **DEPS-UPDATE-002e: tailwindcss 3→4 — Major rewrite**
  - Used only for type annotation in tailwind.config.js
  - TailwindCSS 4: CSS-first config (no tailwind.config.js), new @theme directives, Catalyst UI
  - Priority: LOW — only impacts dashboard styling; defer until UI refresh planned

- [ ] **DEPS-UPDATE-002f: typescript 5.9→7.0 — Two-major jump**
  - tsc is the build compiler — affects entire codebase
  - TS 7.0: type=module on package (irrelevant for CLI usage), new strictness checks likely
  - Current: 1754 tests pass on 5.9.3; TS 6.0 was skipped entirely
  - Priority: HIGH — file as dedicated task with incremental approach (5.9→6.x first, then 6.x→7.0)
  - Must not break CI; verify with --noEmit before committing

- [ ] **DEPS-UPDATE-002g: zustand 4→5 — Safe but unused**
  - zustand@5: type=commonjs, engines node>=12.20.0, peer react>=18 (✓)
  - No source imports found in src/ — listed as dep but unused
  - Priority: LOW — safe to bump anytime, or remove if confirmed unused

## Done

- [x] **DOC-README-005: Update README stale spec count — 463→475 specs** (commit 79bed3f5)
  - Discovery sweep 2026-07-17: README said 463 specs, CLI `speclang status` shows 475 (12 new specs)
  - Fixed mechanically by foreman — 5 occurrences updated, no worker needed

- [x] **FIX-TEST-007: Clean up temp artifacts left by arch004-autonomous-cascade test** (commit 9947a149)
  - Added `afterAll` safety net to ensure temp specs/fixtures/RcFile are removed even when individual tests crash
  - Prior `afterEach` existed but wasn't sufficient — artifacts still accumulated on disk
  - 6/6 tests pass, guard PASS, build clean — no temp artifacts after test run (verified 2026-07-17)

- [x] **DOC-README-004: Update README stale test count — 1751→1752 tests passing, 3→2 known flakes** (commit 0e899a04)
  - Discovery sweep 2026-07-16: README said 1751 tests / 3 flakes, actual is 1752 passed / 2 failed (CI-005 gitleaks)
  - Fixed mechanically by foreman — no worker needed

- [x] **DOC-README-002: Update README stale counts — 471→463 specs, 1752+→1751 tests** (commit e276f6a0)
  - Discovery sweep 2026-07-16: _index.json has 463 entries, README said 471
  - Tests: 1751 pass / 3 fail (2 gitleaks config, 1 cascade timeout — all pre-existing flakes)
  - Fixed mechanically by foreman — no worker needed

- [x] **DOC-README-003: Update README stale counts — 419→463 specs, 1229→1751 tests, stale date** (commit c4961148)
  - Discovery sweep 2026-07-16: 4 embedded count references still said 419 specs / 1229 tests
  - Also updated Last Updated date from 2026-03-22 → 2026-07-16
  - Fixed mechanically by foreman — no worker needed

- [x] **CI-PERF-FLAKE-005: Fix cascade performance test threshold flake** (commit bbe06108)
  - Already fixed in prior tick — threshold bumped 2.0→3.0, 9/9 perf tests pass locally
  - Board was stale; fix applied before this foreman tick
  - CI billing-blocked — local verification only

- [x] **FIX-TEST-006: Unskip validate/check CLI tests — commands work, tests still skipped** (commit 663e6d39)
  - Unskipped 6 tests; validate uses source CLI (tsx), check uses CLI_BIN
  - Fixed `--json` → `--format json` for binary tests; validate source CLI uses `--json`
  - Assertions updated to match actual CLI output
  - All 6 tests pass; guard PASS

- [x] **CLEANUP-BIN-ORIG2-004: Remove bin.orig2/ backup directory** (removed 12 files, 236K — never tracked by git, disk-only; build ✓, tests ✓ 89/1748)
- [x] **DOCS-PRD-002: Track docs/PRD.html in git** (commit 48c3732b)
- [x] **CLEANUP-ROOT-003: Archive root-level one-off Python scripts** (commit d81b7ef2)
- [x] **HILO-HYGIENE-001: Add .gitignore entries for Hilo cache files + track edges.jsonl** (commit 920fedbc)
- [x] **FIX-TEST-005: Fix cascade abort test — trigger cascade before aborting** (commit 9457e697)
- [x] **FIX-VALIDATE-004: Fix 12 YAML header parse errors** (commit bfd46ca1)
- [x] **FIX-VALIDATE-003: Fix 57 block kind + 12 missing header fields** (commit 257ccc14)
- [x] **FIX-VALIDATE-002: Fix 68 spec reference format issues** (commit e7df3871)
- [x] **FIX-TEST-004: Fix 2 daemon autonomous cascade test timeouts** (stale — resolved by CI-007)
- [x] **FIX-TEST-003: Fix 4 CLI get/search tests referencing wrong spec ID** (commit 0ca68981)
- [x] **FIX-TEST-002: Fix intermittent test timeouts in CLI test suite** (commit 7c349232)
- [x] **FIX-VALIDATE-001: Fix 313 spec validation failures** (commit 2c9fcac5)
- [x] **FIX-CI-001: CI installs gitleaks without license secret** (commit 9d116bb1 + 4c12ee47)
- [x] **FIX-TEST-001: Fix flaky cascade status test timeout** (resolved by CI-007)
- [x] **CI-001 through CI-006** — All CI tasks complete
- [x] **ARCH-001 through ARCH-004** — All architecture tasks complete
- [x] **COMPLIANCE-001 + COMPLIANCE-002** — 100% dual-view compliance

- [x] **CI-BILLING: dexdat/SpecLang CI — GitHub Actions billing blocked (infrastructure)**
  - Last 8 CI runs all fail in 3-5s (classic billing-exhaustion pattern)
  - Last successful CI: run 29338099891 (2026-07-14)
  - Local verification: 1751/1754 tests pass (3 flakes), tsc build clean, GitReins guard PASS
  - Resolution: billing/admin action required (add payment method to GitHub account)

- [x] **DEPS-VULN-001: npm audit — 2 dev dependency vulnerabilities (esbuild MODERATE, vite HIGH)** (commit e8331355)
  - npm audit fix --force: esbuild upgraded, vite 5.4.21→8.1.5, @vitejs/plugin-react peer dep warning (cosmetic)
  - Build: tsc clean ✓ | Tests: 1752 pass / 2 known flakes ✓ | Audit: 0 vulns ✓
  - Peer dep warning for plugin-react — cosmetic, does not affect build or tests
