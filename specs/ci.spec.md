# speclang-header lines:309
id: "@speclang/ci"
version: 1.3.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [ci, github-actions, testing, automation, precommit, gitreins]
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
| `Hook not found: /home/runner/.git/hooks/pre-commit` (CI-005 AC1) | `actions/checkout@v4` does not install git hooks; `.git/hooks/` is per-clone and not tracked | The canonical hook lives at `.githooks/pre-commit` (tracked); CI's `Install pre-commit hook` step symlinks it into `.git/hooks/pre-commit` and sets `core.hooksPath=.githooks` so both the AC1 path-based assertion and git's own hook lookup succeed on a fresh clone |

## Pre-Commit Hook in CI (CI-005 AC7)

GitHub Actions' `actions/checkout` step does not install git hooks, and `.git/hooks/` is
per-clone (not tracked). Without an explicit install step, the
`tests/ci/ci005-precommit-hook.test.ts` "Hook not found" failure breaks the build
(observed in CI run `28718869369`, 2026-07-04, and again on run `29001005644` /
2026-07-09 — fresh clone had no `.git/hooks/pre-commit`, the prior `gitreins install`
was a no-op because GitReins isn't installed until step 12).

The canonical hook now lives at `.githooks/pre-commit` (tracked in the repo). CI's
`Install pre-commit hook` step:

1. Symlinks `.git/hooks/pre-commit` → `../../.githooks/pre-commit` (so the
   `tests/ci/ci005-precommit-hook.test.ts` AC1 existsSync assertion finds a hook
   at its hardcoded path on a fresh clone).
2. Sets `core.hooksPath=.githooks` so git itself picks up the tracked hook on
   every commit (no `gitreins install` race).
3. Ensures the executable bit is set on both the canonical file and the symlink.

Local developers run the same `git config core.hooksPath .githooks` once after
cloning; the `.git/hooks/pre-commit` symlink is restored by the project
`setup.sh` (idempotent — re-running is safe).

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

## Test Coverage Reporting (CI-006)

### Purpose

Surface code coverage in CI so reviewers can spot untested branches without
running the suite locally. Vitest's built-in v8 coverage provider produces
JSON + HTML reports under `coverage/`; CI uploads those as a run-scoped
artifact and writes a four-line summary to the job summary panel.

### Provider

`@vitest/coverage-v8` (already pinned in `package.json` devDependencies).
The v8 provider re-uses the V8 engine's built-in counters — fast, no
transpilation, and matches the runtime that actually executes the tests.
`c8` (the alternative) ships a separate instrumented binary per test
process which is materially slower on the full suite.

### Configuration

`vitest.config.ts` declares the coverage block:

```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/dashboard/**']
}
```

- **`include` is intentionally narrow.** The dashboard module is the
  consumer-facing surface where coverage matters most. Broadening to all
  of `src/` would inflate the report without surfacing actionable gaps —
  most non-dashboard modules are wiring, CLI dispatch, or one-shot
  scripts where coverage thresholds are inappropriate. Future PRs can
  broaden the scope per-module once dedicated thresholds exist.

### CI Integration

The `build` job runs three new steps after `Run tests`:

1. **`Generate coverage report (CI-006)`** — `npm run test:coverage`
   re-executes the suite with `--coverage`, writing `coverage/coverage-final.json`
   and `coverage/index.html` to disk.
2. **`Upload coverage artifact (CI-006)`** — `actions/upload-artifact@v4`
   with `if: always()` and `if-no-files-found: warn` so a coverage
   failure does NOT block the build (Tier 1 guard already verifies tests
   pass and that gate is the authoritative quality signal). The artifact
   name is `coverage-${RUN_ID}` so concurrent runs do not collide.
3. **`Write coverage summary`** — parses `coverage-final.json` and writes
   a 4-row table (lines / statements / functions / branches) to
   `$GITHUB_STEP_SUMMARY`. The step is wrapped in a `if [ -f ... ]`
   guard so a missing report yields an explicit "⚠ No coverage report
   was generated" banner instead of crashing the step.

### Failure Modes

| Symptom | Cause | Mitigation |
|---------|-------|------------|
| `npm run test:coverage` exits non-zero | Coverage thresholds or a test failure | The step has no `continue-on-error` — failures propagate. If the suite passes `npm test`, the coverage run is expected to also pass. |
| Coverage artifact missing | `coverage/` was not written (e.g., permission issue) | `if-no-files-found: warn` makes the upload a soft warning. The summary step detects this and writes a clear banner. |
| Job summary shows 0% on a critical module | The include glob misses the module | Broaden `vitest.config.ts` `coverage.include` accordingly; re-run. |
| HTML report too large to inspect | Inflated by a debug build | The v8 provider strips comments/source maps by default — no action required. |

### Local Equivalence

A developer running `npm run test:coverage` locally (or
`TMPDIR=$PWD/.tmp npx vitest run --coverage`) produces the exact same
files CI uploads. Inspect results via `open coverage/index.html` or by
parsing `coverage/coverage-final.json`.

### Future

- **Per-package coverage thresholds** — once `coverage.include` broadens
  beyond `src/dashboard/**`, set per-glob minimums via
  `coverage.thresholds` (vitest v2 + v8 provider supports nested objects).
- **Codecov / Coveralls upload** — likely out of scope; an artifact +
  summary is sufficient for SpecLang's PR cadence.
- **Per-file line annotations in PR diff** — requires a third-party
  service (Codecov, Coveralls, or a custom action). The current
  artifact path is enough to start, and we can layer annotations later
  without changing the spec.

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
- [x] Workflow file parses as valid YAML (`python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`)
- [x] Spec and workflow agree on job names, criteria count, and secret names (verified by grep)
- [x] `package.json` declares `"test:coverage": "TMPDIR=$PWD/.tmp vitest run --coverage"` (script name matches the `npm run test:coverage` invocation in the workflow)
- [x] `package.json` includes `@vitest/coverage-v8` as a devDependency so `npx vitest run --coverage` resolves the v8 provider
- [x] `vitest.config.ts` declares a `coverage: { provider: 'v8', reporter: ['text','json','html'], ... }` block
- [x] `npm run test:coverage` produces `coverage/coverage-final.json` AND `coverage/index.html` (v8 provider, `reporter: ['text','json','html']`)
- [x] `.github/workflows/ci.yml` `build` job runs `Generate coverage report (CI-006)` step (`npm run test:coverage`) AFTER `Run tests` and BEFORE lint
- [x] Coverage artifact upload uses `actions/upload-artifact@v4`, name `coverage-${{ github.run_id }}`, path glob `coverage/coverage-final.json` + `coverage/index.html`, retention ≥ 7 days, `if-no-files-found: warn` (soft warn, not a block)
- [x] Job summary step parses `coverage/coverage-final.json` and writes lines/statements/functions/branches rows to `$GITHUB_STEP_SUMMARY`