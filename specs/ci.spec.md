# speclang-header lines:210
id: "@speclang/ci"
version: 1.0.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [ci, github-actions, testing, automation]
short: GitHub Actions CI workflow for SpecLang
target: .github/workflows/ci.yml
status: active
depends_on:
  - "@ref:speclang/core"
  - "@ref:speclang/build"
---

# GitHub Actions CI Workflow

## Purpose

Continuous integration for SpecLang. Every push to `main` and every pull request
runs build + test + secrets guard. No code is merged without green CI.

## Triggers

| Event | Branches | Purpose |
|-------|----------|---------|
| `push` | `main`, `develop` | Validate direct commits |
| `pull_request` | `main` | Validate PRs before merge |
| `workflow_dispatch` | — | Manual trigger for emergency runs |

## Jobs

### 1. `build`

- Runs on `ubuntu-latest`
- Node.js 20 (matches the local dev environment, supports all engines)
- Steps:
  1. `actions/checkout@v4` — checkout the source
  2. `actions/setup-node@v4` — install Node 20 with npm cache
  3. `npm ci` — install dependencies from lockfile
  4. `npm run build` — compile TypeScript with `tsc`
  5. `npm test` — run the vitest suite (1709 tests as of 2026-07-03)
  6. GitReins secrets guard — `gitreins guard` blocks commits containing API keys

### 2. `lint` (optional)

- Lint with ESLint only if `eslint.config.js` is present
- Skipped automatically when no ESLint config exists (the workflow checks for `eslint.config.{js,mjs,cjs}` and `.eslintrc.{js,json}` before invoking `npm run lint`, so the step exits 0 instead of 127 when the binary is missing)
- Future: enable via `// @ts-check` strict mode

## Matrix Strategy

We use a single Node.js version (20) instead of a matrix to keep CI under 2 minutes.
Node 20 LTS is the minimum supported version per `package.json` engines (`>=18.0.0`)
and is what every developer uses locally. The 18/20/22 matrix was tried earlier and
slowed PR feedback without catching additional failures — TypeScript and vitest are
stable across all three.

## GitReins Integration

The `build` job runs `gitreins guard` after tests pass. This is the same hook that
runs in the local pre-commit hook — it blocks secrets (sk-..., ghp_..., API keys)
and verifies diff-mode tests for changed packages. Local pre-commit and CI agree.

## Local Equivalence

A developer running `npm run build && npm test && gitreins guard` locally should get
the same result as CI. The CI script is a thin wrapper over local commands.

## Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `npm ci` fails on lockfile mismatch | `package-lock.json` out of sync | `npm install` locally, commit lockfile |
| `tsc` fails with type errors | New code, missing types | Fix the types, do not use `// @ts-ignore` |
| Tests pass locally but fail in CI | `TMPDIR` collision in CI | Already mitigated: `vitest.config.ts` redirects TMPDIR to `.tmp/` |
| GitReins guard blocks commit | Secret in staged file | Remove the secret, add the file path to `.gitleaks.toml` allowlist |
| ESLint config missing | v9 migration not completed | Workflow probes for an ESLint config file before invoking `npm run lint`; step exits 0 when absent |

## Tier 2 LLM Evaluation (CI-004)

### Purpose

Tier 1 (`gitreins guard`) catches mechanical failures: secrets, broken builds, failing tests.
Tier 2 (`gitreins judge`) catches design and spec issues: code follows the project's TypeScript
conventions, satisfies the touched spec section, includes tests, avoids common anti-patterns.

Tier 2 runs as a **separate job** so it can use `continue-on-error: true` without masking
genuine build failures. Tier 1 blocks the merge; Tier 2 surfaces advisory findings.

### Trigger Conditions

| Event | Tier 2 runs? | Why |
|-------|--------------|-----|
| `push` to `main` | No | Direct commits to main are already trusted (post-merge state) |
| `push` to `develop` | Yes | Catches integration issues before they hit main |
| `pull_request` to `main` | Yes | The primary use case — every PR gets a Tier 2 review |
| `workflow_dispatch` | No | Manual runs are exploratory; LLM cost not justified |

### Task Strategy

A single fixed task `ci-pr-review` lives in `.gitreins/tasks.yaml`. The job:

1. Upserts the task via `gitreins task create ci-pr-review ...` (idempotent — `create`
   fails if it already exists, so the step catches and ignores that error)
2. Starts it via `gitreins task start ci-pr-review`
3. Runs the judge via `timeout 300 gitreins task complete ci-pr-review`
4. Reads the verdict from `.gitreins/history/<date>/<hash>/verdict.json`
5. Posts the verdict to the PR as a comment (via `github-script`)
6. Writes a job-summary marker so the Tier 2 status is visible in the GitHub UI

The criteria are PR-shaped (not commit-shaped): they describe what the **PR's diff as a whole**
must achieve, regardless of which individual commit added each line.

### Required Criteria (8)

The task's criteria are listed verbatim in `.gitreins/tasks.yaml`. They cover:

1. Every modified `.ts` file passes `tsc --noEmit`
2. Every new exported function/class/type has a corresponding test
3. The PR adds at least one entry to the changelog or `## Next Wake` section
4. No `TODO`, `FIXME`, or `XXX` markers were added in this PR (excluding `tests/`)
5. No `console.log` debug statements in production code (`src/**`, not `tests/`, `bin/`, `dist/`)
6. Public API additions are documented in JSDoc with `@param` and `@returns`
7. No dead code (unreachable branches, unused exports, orphaned helpers) in changed files
8. The PR's spec coverage matches the changes — every modified `.spec.md` has a matching source edit

These are intentionally grep-able / build-able so the LLM judge can verify each one with
specific file:line evidence (proven GitReins Tier 2 evaluation pattern from gitreins-poc).

### Secrets Wiring

| Secret | Where | Used by |
|--------|-------|---------|
| `DEEPSEEK_API_KEY` | GitHub repo settings → Secrets → Actions | `gitreins task complete` calls DeepSeek V4 Flash for evaluation |

The key is referenced as `${{ secrets.DEEPSEEK_API_KEY }}` and exported to the job
environment. Without it, Tier 2 fails fast with a clear `LLM not configured` error
(git reverts the job to a yellow status, not red — see `Failure Modes`).

### PR Annotation

After `gitreins task complete` writes the verdict JSON, a `github-script` step:

1. Reads the verdict from disk (or falls back to the job log if absent)
2. Posts a single PR comment with the format:

   ```
   ## 🤖 GitReins Tier 2 Review

   **Verdict:** PASS ✓  |  8/8 criteria passed

   | Criterion | Status | Evidence |
   |-----------|--------|----------|
   | 1. tsc --noEmit clean | ✓ PASS | src/foo.ts:42 — no type errors |
   | ... | ... | ... |
   ```

3. Idempotent — uses a stable `marker: <!-- gitreins-tier2 -->` to find and update
   the existing comment rather than posting a new one on every push

### Failure Modes

| Symptom | Cause | Mitigation |
|---------|-------|------------|
| `gitreins task complete` exits with `LLM not configured` | `DEEPSEEK_API_KEY` missing from repo secrets | The job step prints setup instructions and continues with `continue-on-error: true` — does NOT block merge |
| Verdict exceeds 300s timeout | LLM hits input-token budget on very large diffs | `timeout 300` bounds the call; partial verdict still posts to PR |
| `gitreins task create ci-pr-review` fails on second run | Task already exists | Step uses `|| true` to swallow the duplicate-creation error |
| DeepSeek rate limit (HTTP 429) | High PR volume | Tier 2 marks the PR with `⚠ rate-limited — re-run /label` and proceeds (advisory only) |
| Tier 2 returns `INCOMPLETE` | Evaluator hit iteration cap before verifying all 8 criteria | The PR comment shows which criteria were verified and which were skipped |

### Cost & Latency

- **Per-PR cost:** ~$0.01–0.05 (DeepSeek V4 Flash, 8 short criteria)
- **Per-PR latency:** 30–90s (most time is LLM inference)
- **Rate limit budget:** DeepSeek V4 Flash: 60 req/min default — sufficient for ~1 PR/min,
  the realistic SpecLang PR cadence is 1-2 per hour

### Local Equivalence

A developer running `gitreins task complete ci-pr-review` locally (with `DEEPSEEK_API_KEY`
in `~/.hermes/.env`) gets the same per-criterion verdict the CI gets. CI is a thin
wrapper over local commands.

### Future: Annotation Providers

The Tier 2 job posts to PR comments today. Future versions may add:

- `gh pr-review --request-changes` when verdict has any FAIL (requires write token)
- Job-summary badge with PASS/FAIL/INCOMPLETE for non-PR runs
- Per-file annotation via `gh api` `POST /repos/.../check-runs` for line-level findings

These are out of scope for CI-004 but listed here for future PRs.

## Acceptance Criteria

- [x] `.github/workflows/ci.yml` exists at the repo root
- [x] File has `speclang-header` lines (dual-view compliant)
- [x] Triggers on push to main + develop, and on PRs to main
- [x] Single job (`build`) that runs: checkout → setup-node → install → build → test → guard
- [x] Uses Node 20 (matches local dev)
- [x] Uses `actions/checkout@v4` and `actions/setup-node@v4`
- [x] Includes `gitreins guard` step (Tier 1 secrets/lint/tests)
- [x] Lint step degrades gracefully when no ESLint config exists (workflow checks for `eslint.config.{js,mjs,cjs}` / `.eslintrc.{js,json}` before invoking `npm run lint`; exits 0 when absent — replaces the prior `continue-on-error: true` approach that still exited 127 because `eslint` binary wasn't on PATH)
- [ ] Tier 2 job `review` runs on `pull_request` to `main` and `push` to `develop`
- [ ] Tier 2 job requires `DEEPSEEK_API_KEY` from GitHub Secrets (fails fast with clear error if missing)
- [ ] `.gitreins/tasks.yaml` defines the `ci-pr-review` task with 8 criteria
- [ ] Tier 2 verdict posted as a single PR comment via `github-script` (idempotent, updated in-place)
- [ ] Tier 2 runs as a separate job with `continue-on-error: true` — does NOT block Tier 1 merge gate
- [ ] Workflow file parses as valid YAML (`python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`)
- [ ] Spec and workflow agree on job names, criteria count, and secret names (verified by grep)