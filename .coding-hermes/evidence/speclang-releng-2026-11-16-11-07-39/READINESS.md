# SpecLang release readiness — 2026-11-16 (tick speclang-releng-2026-11-16-11-07-39)

Lane: release-engineering satellite (`speclang-releng`). Authority: VERIFY only, no development.
Decision: **NO-GO** — do not tag, do not publish.

## 1. Target identity

| Field | Value | Receipt |
|---|---|---|
| Carrier checkout | `/home/kara/speclang` | lane stand-in `/home/kara/.hermes/stand-in/releng-lane/speclang` is a symlink-only stand-in (board link only); `coding-hermes-speclang` does not exist |
| Release remote (authority) | `origin` → `https://github.com/dexdat/SpecLang.git` | `git remote -v` |
| Second remote | `spec-main` → `/home/kara/SpecLang` (local mirror, no release authority) | `git remote -v` |
| Forge | GitHub | host in release remote |
| Client used | `gh` | `gh repo view dexdat/SpecLang` |
| Default branch | `main` (forge-declared) | `gh repo view --json defaultBranchRef` → `main` |
| Visibility | PUBLIC | same call |
| Certified candidate | `b9bb5042145f9a87de26c667b1b774adde6a0297` | `git rev-parse origin/main` at census |
| Candidate commit time | 2026-11-16 06:10:32 -0500 (11:10:32Z) | `git log -1` |

The shared checkout is written concurrently by sibling lanes: local HEAD advanced
`8d6a6eb5 → b9bb5042` at 11:10:32Z during this pass and again to `78d416fb`
(unpushed sibling commit) by 11:20Z. All evidence below is anchored to the
release-authority tip `b9bb5042`, re-read from `origin/main`, not to local HEAD.

## 2. Tag / Release identity (blocking finding)

No Release object exists on the forge: `gh release list --repo dexdat/SpecLang --limit 10` → empty.
The forge Release channel has therefore **never published** for this repository, which makes any
cut a FIRST PUBLICATION (owner authorization required) regardless of the tag counter.

Tag names exist but do not bind to the shipped lineage:

| Tag | Local peel | Remote peel | Local reachable from main | Remote reachable from main |
|---|---|---|---|---|
| v0.1.0 | `ff96a2e9` | `676795fc` | yes (ancestor) | **no (unreachable)** |
| v1.0.0 | `f7b4ce7d` | `2f2639a8` | yes (ancestor) | **no (unreachable)** |

`git merge-base --is-ancestor 2f2639a8 origin/main` → false. `git branch -a --contains 2f2639a8`
→ `origin/pi-agent-migration`, `origin/speclang-selfhosting` only. A consumer who checks out
`v1.0.0` from GitHub receives a commit that was never merged into `main`.
Both tag names are also irreconcilable locally vs remotely, so "newest tag" cannot be used as a
release baseline without first repairing identity.

## 3. Commit census

Baseline: `f7b4ce7d` (the main-lineage commit the local `v1.0.0` peels to; the newest tag that is
an ancestor of `main`). Range `f7b4ce7d..b9bb5042`.
Strict parser (`/home/kara/.hermes/cache/scratch/census_speclang.py`) — reconciles:
668 conventional + 55 non-conventional = **723** = `git rev-list --no-merges --count` (723).
Merges: 6.

| Bucket | Count |
|---|---|
| chore | 377 |
| speclang | 91 |
| docs | 64 |
| fix | 49 |
| board | 43 |
| dogfood | 10 |
| ci | 9 |
| test | 6 |
| feat | 4 |
| style | 3 |
| ops / qa / perf / foreman / compliance | 2 each |
| hygiene / pm | 1 each |
| non-conventional | 55 |

Breaking changes: **0** (`BREAKING CHANGE` footers at line start and `type!:` declarations: none).

Materiality split by changed paths (`material_speclang.py`):

| Class | Commits |
|---|---|
| Touch product paths (`src/ bin/ scripts/ tests/ specs/ examples/ package.json tsconfig README CHANGELOG`) | 173 |
| Bookkeeping only (`.coding-hermes/ .gitreins/ docs/ .vfs/`) | 470 |
| Neither (root config / other) — residual by subtraction | 80 |

Material commits by type: docs 46, speclang 43, fix 43, chore 11, ci 8, non-conventional 5, test 5,
feat 4, dogfood 3, style 3, compliance 2.

Conventional bump rule: feat 4 → minor. Material fix 43 → patch. No breaking → not major.
**Proposed version: 1.1.0** (proposal only — not authorized; see §9).

## 4. Hosted CI

| Item | Value |
|---|---|
| Candidate CI | run **43855424821**, headSha `b9bb5042…` (exact), `completed / success` |
| Job "Build, test, and guard" | success — all executed steps success (build, tests, coverage, lint, gitleaks install, GitReins Tier 1 guard) |
| Job "Tier 2 LLM review" | skipped **by design** — `if: pull_request || (push && refs/heads/develop)`; main pushes are post-merge, not a withheld required gate |
| Ancestor run (for attribution only) | 43853971820 success on `40fdd74b` |

CI verdict on candidate: **GREEN**, exact-SHA, cited by id.
Note: the candidate had no run at first probe (11:10:42Z run was `in_progress`); it completed success
before this record was frozen.

## 5. GitReins / dogfood

- GitReins: Tier 1 guard ran inside CI job above and passed, bound to `b9bb5042`. Tier 2 LLM verdict:
  **ABSENT** — no `.gitreins/history/` in the tree and no verdict file bound to the candidate.
  `.gitreins/tasks.yaml` last modified 2026-09-26. Degraded-but-not-red; cannot be cited as a
  release-grade pass.
- Dogfood: latest recorded run `speclang-dogfood-2026-11-16-05-02-33` (rev `08b77a59`, clean clone,
  documented `npm install`) returns **PROMISING-BUT-ROUGH** — the documented `validate` command exits 1
  on the published tip (commit `0c9ec4c3`). Open rows README-18 (P1, validate exits 1) and
  DF-SPECLANG-8 (P3) carry the same user-visible defect.

## 6. Packaging / artifact probe (blocking finding)

Repository-owned release tooling inventory: **none**. No `Makefile` release target, no
`.goreleaser.yml`, no `Dockerfile`, no `scripts/release*`, no `docs/RELEASING*`, no tag-triggered
workflow (only `.github/workflows/ci.yml`, triggered on push to main/develop and PRs).
`package.json` is the only version surface (`1.0.0`); the CLI reads it (`bin/speclang:24`
`.version(packageJson.version)`). The `0.1.0` literals in `bin/speclang` are generated-project
scaffold defaults, not the package version.

Probe: `npm pack` then install the tarball in a clean consumer project.

```
cd /home/kara/speclang && npm pack --pack-destination …/relprobe2
cd …/relprobe2 && npm install ./speclang-1.0.0.tgz --no-audit --no-fund > install.log 2>&1; rc=$?
npm_install_rc=127
npm error code 127
npm error command sh -c bash scripts/postinstall-lint-deps.sh
npm error bash: scripts/postinstall-lint-deps.sh: No such file or directory
```

Tarball: 1747 files, 992.6 kB packed / 5.2 MB unpacked, sha256 `e9ca26c61eb6a8663025161329245832b93ef06077baab81d28b3ac1814cde16`.
`files: ["dist","bin","README.md","CHANGELOG.md","LICENSE"]` ships 3 `bin/` files and **0 `scripts/` files**,
yet `package.json` declares `"postinstall": "bash scripts/postinstall-lint-deps.sh"`.
The published artifact is **not installable**: `npm install speclang` fails with exit 127 on every
consumer. This is the live premise of open row **UX-001** (P1) — probe reproduced at the candidate, and
it is the direct acceptance test UX-001 already names.
(The same script is why `npm run lint` passes in-tree: it copies the `typescript-eslint-ts` alias; see
QA-SPECLANG-006's re-verification note.)

## 7. Distribution channel (blocking finding, independent of code)

| Probe | Output | Meaning |
|---|---|---|
| `gh api repos/dexdat/SpecLang/actions/secrets --jq .total_count` | `0` | no credential reaches any CI publish step |
| `npm view speclang version` | `0.1.1` | the bare name is already published |
| `npm view speclang maintainers time.created repository` | `speclang <speclangdev@gmail.com>`, created `2022-05-13`, source `github.com/Specific-Language/speclang` | the npm name belongs to a **third party**, not dexdat |
| `npm whoami` | `ENEEDAUTH` | no publisher session on this host |
| `gh release list` | empty | forge Release channel never used |

So the npm channel under the declared name is unavailable to this project (publish would 403), and the
forge Release channel is a first publication. Both are owner decisions, not lane decisions.

## 8. Dependencies, posture, blockers

Dependencies (`npm audit --omit=dev` at candidate): **14 production vulnerabilities** — 3 critical,
4 high, 7 moderate. Critical: `simple-git` → `@simple-git/argv-parser`, `proxy-addr`.
High: `@modelcontextprotocol/sdk`, `body-parser`, `brace-expansion`, `zod`.
Full tree (incl. dev): 26 findings (3 critical / 6 high / 17 moderate). This is a release blocker on
its own under the dependency gate.

Remote ref exposure (public remote, refs other than `main`):
`master` +117 commits, `pi-agent-migration` +992, `speclang-selfhosting` +964,
`perf/cli-test-npx-tax` +1 (active lane branch), `qa/…-c2` +0.
Secret scan (`gitleaks detect --log-opts origin/main..<branch>`, redacted, tips and history) over the
three stale branches — **0 findings each, rc=0** (`…/scratch/gl-*.json`). Exposure is stale
lineages, not leaked credentials; the two stale branches are also what the divergent release tags point at.

Open blockers on the board (`boardctl list --status pending` → 77 rows: P0 5, P1 24, P2 11, P3 8, P4 25, P5 3, none 1).
Release-relevant pending P0/P1:
`DF-SPECLANG-1-R4` (init scaffolding specs incompatible with cascade), `DF-SPECLANG-2-R4` (42/1884 tests
fail on minimatch API break), `DF-SPECLANG-3-R4` (daemon false success), `DF-SPECLANG-1-R5` (MCP surface
non-functional), `DF-SPECLANG-2-R5` (daemon re-cascade loop), `DF-SPECLANG-1` (lint DOA), `UX-001`
(artifact uninstallable), `UX-002`, `README-18` (validate exits 1), `QA-SPECLANG-004` (suite hangs with
network cut), `DF-SPECLANG-7` (better-sqlite3 native binding missing on npm>=12), `QA-SPECLANG-006`
(harness-conditioned lint — premise partially repaired by its own re-verification note).
Premise note: `QA-SPECLANG-006` and the minimatch P0 rows are contested by QA-SPECLANG-2-R6
("fixed-premise rows left open → permanent re-dispatch loop"); the R4/R5 P0 rows above were **not**
re-probed in this pass and are recorded as carried, not re-measured.

Version hygiene: `package.json` 1.0.0; `CHANGELOG.md` top section `## [Unreleased]` is **empty** and the
last released section is `[1.0.0] - 2026-03-31` — 7.5 months and 173 material commits stale.
npm registry latest = `0.1.1` (third-party package), unrelated to this tree.

## 9. Decision and unblock path

**NO-GO.** Four independent blocking gates, none repairable by this verify-only lane:

1. **Channel unavailable** — npm name `speclang` is owned by a third-party publisher; 0 CI secrets; forge
   Release list empty (first publication). Needs an owner decision: scope the package (e.g.
   `@dexdat/speclang`), or publish to the forge Release channel only, or supply credentials.
2. **Artifact uninstallable** — postinstall references `scripts/postinstall-lint-deps.sh`, which
   `files[]` excludes; reproduced `npm_install_rc=127`. Ship-blocking until `files` includes the script
   (or the script path is moved under `bin/` / the postinstall is dropped). Row: UX-001.
3. **Dependency gate** — 3 critical + 4 high production advisories.
4. **Tag identity** — remote `v0.1.0`/`v1.0.0` point to commits unreachable from `main`; "last release"
   is undefined until that is reconciled or explicitly superseded (never force-move per doctrine).

Proposed version when the gates clear: **1.1.0** (4 feat + 43 material fix, 0 breaking) — proposal only.
`CHANGELOG.md` must gain a populated `## [1.1.0]` section with a `## Known issues` section before any tag.

No tag created, no Release created, no artifact published, no remote ref mutated in this pass.

## 10. Receipts

- Census: `/home/kara/.hermes/cache/scratch/census_speclang.py`, `material_speclang.py` (outputs quoted above)
- Pack/install probe: `/home/kara/.hermes/cache/scratch/relprobe2/install.log`, tarball sha256 above
- Secret scans: `/home/kara/.hermes/cache/scratch/gl-{master,speclang-selfhosting,pi-agent-migration}.json`
- CI: `gh run view 43855424821 --repo dexdat/SpecLang --json headSha,conclusion,jobs`
- Tags: `git ls-remote --tags origin`; `git merge-base --is-ancestor`
- DuckBrain read of prior release memory for namespace `speclang`: **UNVERIFIED** — MCP transport died
  (`lost its stdio subprocess`) and the second call timed out at 300s; no HTTP read attempted under the
  unattended credential rule. No prior release-decision key was observed in the first 40 keys listed.
