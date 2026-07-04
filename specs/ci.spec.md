# speclang-header lines:14
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
- Skipped automatically when no config exists (graceful degradation)
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
| ESLint config missing | v9 migration not completed | Step is `continue-on-error: true` until config lands |

## Acceptance Criteria

- [x] `.github/workflows/ci.yml` exists at the repo root
- [x] File has `speclang-header` lines (dual-view compliant)
- [x] Triggers on push to main + develop, and on PRs to main
- [x] Single job (`build`) that runs: checkout → setup-node → install → build → test → guard
- [x] Uses Node 20 (matches local dev)
- [x] Uses `actions/checkout@v4` and `actions/setup-node@v4`
- [x] Includes `gitreins guard` step (Tier 1 secrets/lint/tests)
- [x] Lint step is `continue-on-error: true` (graceful when no ESLint config exists)