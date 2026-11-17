# Verdict: UX-004-R1

**Task:** SUPPORT.md advertises a Discussions channel that does not exist
**Evaluated:** 2026-11-17T16:17:18.756519
**Result:** ✓ PASS

## Criteria

- ✓ **From the repo root: SUPPORT.md no longer lists a Discussions channel that does not exist (grep -ci discussions SUPPORT.md prints 0), OR the bullet is replaced by a channel that is actually enabled (gh api repos/dexdat/SpecLang has_discussions true). SUPPORT.md and .github/ISSUE_TEMPLATE/config.yml name the SAME channels; no file claims Discussions is disabled while another advertises it. The remaining support links resolve.**
  - In /home/kara/speclang: `grep -ci discussions SUPPORT.md` prints `0` (grep exit 1); `cat -A` scan of SUPPORT.md also finds no 'discussion' occurrence. Commit 46dd7bff removed the bullet `- **Discussions:** [GitHub Discussions](https://github.com/dexdat/SpecLang/discussions)` and replaced it with SUPPORT.md:14-19 — Issues (https://github.com/dexdat/SpecLang/issues) plus a 'What to expect' bullet pointing at CONTRIBUTING.md. .github/ISSUE_TEMPLATE/config.yml:5-6,14 states `has_discussions=false` and its only contact_link is the issue tracker, so both files name the SAME single channel and no file advertises Discussions. All relative links in SUPPORT.md resolve: `for f in docs/NORTH_STAR.md README.md AGENTS.md CONTRIBUTING.md; do [ -e "$f" ]` -> OK x4. Repo-wide `grep -rni discussion` (excluding node_modules/dist/.tmp/.gitreins) returns only unrelated hits (specs/mcp.spec.dir/messages.spec.md:67,125 threaded discussions; skills docs) and config.yml's 'NOT enabled' statements. Tests: `npx vitest run --passWithNoTests` -> 'Test Files 115 passed | 4 skipped (119)', 'Tests 1958 passed | 58 skipped (2016)', zero FAIL lines. The working-tree diff shown (specs/docs.spec.dir/docs/CONFIGURATION.md, SPECLANG_BIN/SPECLANG_AGENT_TIMEOUT_MS) is unrelated DOC-2 residue and does not touch SUPPORT.md. [resolution 0.12; SUPPORT.md, .github/ISSUE_TEMPLATE/config.yml]

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  11:12:43
- ✓ **tier2**
  - COMPLETE
  ✓ From the repo root: SUPPORT.md no longer lists a Discussions channel that does not exist (grep -ci discussions SUPPORT.md prints 0), OR the bullet is replaced by a channel that is actually enabled (gh api repos/dexdat/SpecLang has_discussions true). SUPPORT.md and .github/ISSUE_TEMPLATE/config.yml name the SAME channels; no file claims Discussions is disabled while another advertises it. The remaining support links resolve.: In /home/kara/speclang: `grep -ci discussions SUPPORT.md` prints `0` (grep exit 1); `cat -A` scan of SUPPORT.md also finds no 'discussion' occurrence. Commit 46dd7bff removed the bullet `- **Discussions:** [GitHub Discussions](https://github.com/dexdat/SpecLang/discussions)` and replaced it with SUPPORT.md:14-19 — Issues (https://github.com/dexdat/SpecLang/issues) plus a 'What to expect' bullet pointing at CONTRIBUTING.md. .github/ISSUE_TEMPLATE/config.yml:5-6,14 states `has_discussions=false` and its only contact_link is the issue tracker, so both files name the SAME single channel and no file advertises Discussions. All relative links in SUPPORT.md resolve: `for f in docs/NORTH_STAR.md README.md AGENTS.md CONTRIBUTING.md; do [ -e "$f" ]` -> OK x4. Repo-wide `grep -rni discussion` (excluding node_modules/dist/.tmp/.gitreins) returns only unrelated hits (specs/mcp.spec.dir/messages.spec.md:67,125 threaded discussions; skills docs) and config.yml's 'NOT enabled' statements. Tests: `npx vitest run --passWithNoTests` -> 'Test Files 115 passed | 4 skipped (119)', 'Tests 1958 passed | 58 skipped (2016)', zero FAIL lines. The working-tree diff shown (specs/docs.spec.dir/docs/CONFIGURATION.md, SPECLANG_BIN/SPECLANG_AGENT_TIMEOUT_MS) is unrelated DOC-2 residue and does not touch SUPPORT.md. [resolution 0.12; SUPPORT.md, .github/ISSUE_TEMPLATE/config.yml]
SUPPORT.md no longer advertises Discussions (grep count 0), it and .github/ISSUE_TEMPLATE/config.yml both name only the issue tracker, all remaining links resolve, and the suite is green (1958 passed).

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  11:12:43

Stage tier2: PASS
  COMPLETE
  ✓ From the repo root: SUPPORT.md no longer lists a Discussions channel that does not exist (grep -ci discussions SUPPORT.md prints 0), OR the bullet is replaced by a channel that is actually enabled (gh api repos/dexdat/SpecLang has_discussions true). SUPPORT.md and .github/ISSUE_TEMPLATE/config.yml name the SAME channels; no file claims Discussions is disabled while another advertises it. The remaining support links resolve.: In /home/kara/speclang: `grep -ci discussions SUPPORT.md` prints `0` (grep exit 1); `cat -A` scan of SUPPORT.md also finds no 'discussion' occurrence. Commit 46dd7bff removed the bullet `- **Discussions:** [GitHub Discussions](https://github.com/dexdat/SpecLang/discussions)` and replaced it with SUPPORT.md:14-19 — Issues (https://github.com/dexdat/SpecLang/issues) plus a 'What to expect' bullet pointing at CONTRIBUTING.md. .github/ISSUE_TEMPLATE/config.yml:5-6,14 states `has_discussions=false` and its only contact_link is the issue tracker, so both files name the SAME single channel and no file advertises Discussions. All relative links in SUPPORT.md resolve: `for f in docs/NORTH_STAR.md README.md AGENTS.md CONTRIBUTING.md; do [ -e "$f" ]` -> OK x4. Repo-wide `grep -rni discussion` (excluding node_modules/dist/.tmp/.gitreins) returns only unrelated hits (specs/mcp.spec.dir/messages.spec.md:67,125 threaded discussions; skills docs) and config.yml's 'NOT enabled' statements. Tests: `npx vitest run --passWithNoTests` -> 'Test Files 115 passed | 4 skipped (119)', 'Tests 1958 passed | 58 skipped (2016)', zero FAIL lines. The working-tree diff shown (specs/docs.spec.dir/docs/CONFIGURATION.md, SPECLANG_BIN/SPECLANG_AGENT_TIMEOUT_MS) is unrelated DOC-2 residue and does not touch SUPPORT.md. [resolution 0.12; SUPPORT.md, .github/ISSUE_TEMPLATE/config.yml]
SUPPORT.md no longer advertises Discussions (grep count 0), it and .github/ISSUE_TEMPLATE/config.yml both name only the issue tracker, all remaining links resolve, and the suite is green (1958 passed).

Overall: PASS ✓
