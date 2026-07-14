# SpecLang CI — Coding Hermes Tasks

## Active

*Board clear — all tasks complete. Discovery sweep needed.*

## Done

- [x] **FIX-TEST-005: Fix cascade abort test — trigger cascade before aborting** (commit 9457e697)
  - Added `await execAsync(\`${CLI} cascade trigger @speclang/mcp\`)` before abort call
  - Test now passes: 1 passed, 39 skipped. Guard: PASS.

- [x] **FIX-VALIDATE-004: Fix 12 YAML header parse errors** (commit bfd46ca1)
  - Fixed 4 missing closing quotes, 5 merged parent/part entries, 2 duplicate short keys, 1 reserved @ character
  - Also fixed 1 missing short field on autonomous spec + 17 empty placeholder children entries
  - Validate: 447/447 passed, 0 errors. Guard: PASS.

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
