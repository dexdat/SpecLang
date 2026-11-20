# Verdict: CLN-002

**Task:** delete dead generate_index.py.handwritten
**Evaluated:** 2026-11-20T06:41:22.334700
**Result:** ✓ PASS

## Criteria

- ✓ **The dead tracked file generate_index.py.handwritten no longer exists in the repository tree (git ls-files returns no match) and npm run build still exits 0.**
  - `git ls-files | grep -i handwritten` exits 1 (no match) — the file is not tracked; commit 180d2b55 deleted generate_index.py.handwritten (201 lines, shown in `git show --stat 180d2b55`). The only remaining copies (./.tmp/df013-fresh/ and ./.tmp/freshclone/) are untracked and ignored via .gitignore:98 `.tmp/` (confirmed by `git check-ignore -v`), so they are not in the repository tree. `npm run build` (tsc) ran fresh and printed `BUILD EXIT: 0`.

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  01:37:58
- ✓ **tier2**
  - COMPLETE
  ✓ The dead tracked file generate_index.py.handwritten no longer exists in the repository tree (git ls-files returns no match) and npm run build still exits 0.: `git ls-files | grep -i handwritten` exits 1 (no match) — the file is not tracked; commit 180d2b55 deleted generate_index.py.handwritten (201 lines, shown in `git show --stat 180d2b55`). The only remaining copies (./.tmp/df013-fresh/ and ./.tmp/freshclone/) are untracked and ignored via .gitignore:98 `.tmp/` (confirmed by `git check-ignore -v`), so they are not in the repository tree. `npm run build` (tsc) ran fresh and printed `BUILD EXIT: 0`.
The tracked file generate_index.py.handwritten was deleted in commit 180d2b55, git ls-files returns no match (remaining copies live only in the gitignored .tmp/ scratch dir), and a fresh `npm run build` exits 0.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  01:37:58

Stage tier2: PASS
  COMPLETE
  ✓ The dead tracked file generate_index.py.handwritten no longer exists in the repository tree (git ls-files returns no match) and npm run build still exits 0.: `git ls-files | grep -i handwritten` exits 1 (no match) — the file is not tracked; commit 180d2b55 deleted generate_index.py.handwritten (201 lines, shown in `git show --stat 180d2b55`). The only remaining copies (./.tmp/df013-fresh/ and ./.tmp/freshclone/) are untracked and ignored via .gitignore:98 `.tmp/` (confirmed by `git check-ignore -v`), so they are not in the repository tree. `npm run build` (tsc) ran fresh and printed `BUILD EXIT: 0`.
The tracked file generate_index.py.handwritten was deleted in commit 180d2b55, git ls-files returns no match (remaining copies live only in the gitignored .tmp/ scratch dir), and a fresh `npm run build` exits 0.

Overall: PASS ✓
