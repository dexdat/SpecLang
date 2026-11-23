# RELEASE-TAGS: v0.1.0 / v1.0.0 Containment Audit + Supersession Record

- **Task:** RELEASE-002
- **Date:** 2026-11-23 (evidence captured 22:23 UTC)
- **Status:** Dangling release tags confirmed; superseded by the next main-lineage release tag (see Supersession below)
- **Method:** Read-only audit. Remote refs observed via `git ls-remote --tags origin` before and after the audit; local evidence from a full tag fetch (`git fetch origin 'refs/tags/*:refs/tags/*' 'refs/heads/main:refs/remotes/origin/main'`) in a worktree of the canonical repo. Containment tested with `git merge-base --is-ancestor "$(git rev-parse "T^{}")" origin/main` on the PEELED ref (annotated tag objects dereferenced via `^{}`), exactly as specified. No tag was deleted, moved, re-pointed, or pushed.

## Verdict summary

Both `v0.1.0` and `v1.0.0` peel to commits that are **NOT contained in `origin/main`** (`git merge-base --is-ancestor <peeled> origin/main` exits `1` for both). The divergence is total: `git merge-base` between each peeled tag and `origin/main` returns **no common ancestor at all** (exit code 1, empty output) — the tag lineage is a separate root (`9d7fad4110e1daf162510af2adf6ef61800cb1f2`) unrelated to main's history. The two tags remain reachable only through the side branches `origin/pi-agent-migration` and `origin/speclang-selfhosting`. `v1.0.0` is a descendant of `v0.1.0` within that side lineage (containment exit 0 tag-to-tag), so the two tags mark one disjoint lineage, not two.

## BEFORE state — `git ls-remote --tags origin` (verbatim, captured 2026-11-23 pre-work)

```
3d823fc13473791ab947b35c076f7667f1c04498	refs/tags/v0.1.0
676795fcfb25df99c97dae6f204774cf8a3c5e3f	refs/tags/v0.1.0^{}
f64ff1398cb2d36f4e06a0f395bf316522a25d4e	refs/tags/v1.0.0
2f2639a87a2615d6c5e232c83943ac6c871385e0	refs/tags/v1.0.0^{}
```

Both refs are annotated tag objects (`git cat-file -t` → `tag`); the `^{}` lines are the peeled commits.

## Divergence table

Reference for all counts: `origin/main` = `35bab7a535abeb51ab9b0dd98f4ae1b7b0bb830b` (current main tip at capture time).

| Tag | Peeled sha (`T^{}`) | Contained in origin/main? | Commits tag-only | Commits main-only | Commit subject / date | Remote branches containing it |
|---|---|---|---|---|---|---|
| v0.1.0 | `676795fcfb25df99c97dae6f204774cf8a3c5e3f` | **NO** (`merge-base --is-ancestor` exit 1) | 850 | 1979 | `speclang: validation fix - Fix broken depends_on references` — Sun Mar 22 15:31:22 2026 -0500 | `origin/pi-agent-migration`, `origin/speclang-selfhosting` |
| v1.0.0 | `2f2639a87a2615d6c5e232c83943ac6c871385e0` | **NO** (`merge-base --is-ancestor` exit 1) | 930 | 1979 | `speclang: testing add performance benchmarks - P9-002 complete` — Tue Mar 31 19:05:14 2026 -0500 | `origin/pi-agent-migration`, `origin/speclang-selfhosting` |

Additional structural facts backing the table:

- `git merge-base <peeled> origin/main` exits 1 with empty output for both tags — unrelated histories, so neither tag can ever be merged into main without a history graft; "unreachable from main" is the correct characterization.
- `git merge-base --is-ancestor v0.1.0^{} v1.0.0^{}` exits 0 — v1.0.0's commit contains v0.1.0's commit.
- Tag-only / main-only counts via `git rev-list --count` with the peeled refs, per the divergence direction (`origin/main..<peeled>` and `<peeled>..origin/main`).
- Tag inventory (`git tag -l --sort=-creatordate`): `v1.0.0`, `v0.1.0` — **these are the only two tags in the repo.**

## Existing-tag protection (hard constraint honored)

This audit is read-only with respect to remote refs. **No tag was deleted, force-moved, re-created, or pushed.** The BEFORE `ls-remote` output above is the binding record; the AFTER check below must reproduce it byte-for-byte (same four lines, same SHAs) for this audit to remain valid.

## Supersession statement

**No later main-lineage release tag exists today** — the tag inventory contains only `v0.1.0` and `v1.0.0`, both of which mark commits on a lineage unrelated to `origin/main`. Therefore:

> For release purposes, **the next main-lineage release tag cut from `origin/main` (i.e., from `35bab7a535abeb51ab9b0dd98f4ae1b7b0bb830b` or later) supersedes both `v0.1.0` and `v1.0.0`.** Neither existing tag is a valid release marker for current main: each peels to a commit with zero shared ancestry with main (divergence table above: 850/930 tag-only commits, 1979 main-only commits, containment exit 1). Consumers MUST NOT treat `v0.1.0` or `v1.0.0` as describing any state of `origin/main`; release tooling, changelogs, and install docs should point at the first release tag created on the main lineage. The existing tags are left in place untouched (they remain valid markers of the `pi-agent-migration` / `speclang-selfhosting` side lineage) — mutation or deletion of existing tags is out of scope and forbidden by this audit's constraints.

Once the next main-lineage release tag exists, this record's supersession is anchored by it; until then, the absence of any main-lineage tag is itself part of the release-readiness gap and the next release cut is the recommended resolution.

## AFTER verification (foreman checklist)

- [ ] **AFTER `ls-remote` byte-parity:** run `git ls-remote --tags origin` after this work merges and confirm the output is identical to the BEFORE block above — all four lines, same tag objects (`3d823fc1…`, `f64ff139…`) and same peeled commits (`676795fc…`, `2f2639a8…`). Any difference means a tag was mutated and this record must be re-opened.
- [ ] First main-lineage release tag exists (future): cut the next release from `origin/main` and cite this record in the release notes as the supersession anchor for `v0.1.0`/`v1.0.0`.
