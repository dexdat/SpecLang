# Contributing to SpecLang

Thank you for your interest in contributing to SpecLang!

## Development Setup

### Prerequisites

- Node.js 18 or newer (`engines.node` in `package.json`; CI runs Node 20).
- Nothing else: no database, service or extra toolchain is needed to install
  dependencies or run the test suite.

`npm install` followed by `npm test` is all that a fresh clone needs:

- The `pretest` hook runs `npm run build` before the suite, so the CLI that
  integration tests spawn (`bin/speclang`, which loads `dist/`) is present and
  current without a separate build step.
- The `test` script sets `TMPDIR=$PWD/.tmp` itself (and `vitest.config.ts`
  points Vite's cache at the same project-local directory), so you never need
  to export `TMPDIR` by hand.
- If you run `npx vitest ...` directly instead of `npm test`, or your `dist/`
  is stale, run `npm run build` first — a stale `dist/` means you are testing
  old code.

```bash
# Clone the repository
git clone https://github.com/dexdat/SpecLang.git
cd SpecLang

# Install dependencies
npm install

# Run tests (the `pretest` hook builds first, so no separate build is needed)
npm test
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

**Important:** This is a meta-circular project. Changes should be made to specs, not generated code.

```bash
# Edit specs (source of truth)
vim specs/my-feature.spec.md

# Generate code (if applicable)
# The build system will regenerate from specs

# Test your changes
npm run build && npm test
```

### 3. Validate Your Changes

Before committing, ensure:

```bash
# Build passes
npm run build

# Tests pass
npm test

# Run hard checks (if available)
python3 scripts/hard-checks.py
```

### 4. Commit Changes

We use structured commit messages:

```bash
# Format:
# speclang: <area> <action> - <brief description>

# Examples:
git commit -m "speclang: parser add - Implement header parser"
git commit -m "speclang: docs update - Add installation instructions"
git commit -m "speclang: db add - Create sessions table migration"
```

**Commit Message Format:**
```
speclang: <area> <action> - <brief description>

Source: specs/path/to/spec.spec.md
Changes:
- What changed
- Why it changed

Validation:
- TypeScript: ✓ compiles
- Tests: ✓ pass
```

### 5. Submit a Pull Request

```bash
git push origin feature/my-new-feature
# Then create PR via GitHub UI
```

## Coding Standards

### TypeScript

- Use explicit types everywhere
- Follow naming conventions:
  - `CONSTANTS` - UPPER_SNAKE_CASE
  - `variables` - camelCase
  - `functions` - camelCase
  - `Classes` - PascalCase
- Import order: stdlib → third-party → local

### Specs (Markdown)

- Include `speclang-header` with required fields
- Use `@block:name @kind:type` for code blocks
- Reference dependencies with `@ref:specs/path`

### Commit Rules

- One file per commit when possible
- Always use `speclang:` prefix
- Include source spec reference
- Describe what AND why

## Project Structure

```
specs/                    # Source of truth (specifications)
src/                     # Generated TypeScript
scripts/                 # Python tooling
tests/                   # Test files
docs/                    # Documentation
.opencode/              # OpenCode configuration
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run tests/my-test.test.ts
```

## Validation

```bash
# Validate spec references (exits non-zero while missing refs exceed --max-missing)
python3 scripts/generate_index.py --validate

# Run autonomous validation
python3 scripts/validate_autonomous.py --project

# Check for broken links
python3 scripts/hard-checks.py
```

## Support and Bug Reports

Support requests and bug reports both go through the issue tracker: open one
with the [bug report form](.github/ISSUE_TEMPLATE/bug_report.yml) (GitHub shows
it as **Bug report** when you click **New issue**). Free-form issues are
disabled so that reports arrive with the details below already filled in — that
is the difference between a report that can be reproduced and one that cannot be
acted on.

Please include:

- **Version or commit** — `git rev-parse --short HEAD` in your clone, or the
  `version` field of `package.json` if you installed from npm.
- **The exact command and the directory you ran it from** — copy it from your
  shell rather than retyping it.
- **Expected vs actual** — what you expected to happen and what happened
  instead.
- **Output or error text** — the full output, stack trace or error with API keys
  and other secrets removed. If the command produced no output at all, say so;
  silence is itself a symptom.
- **Environment** — operating system and `node --version` (SpecLang requires
  Node.js 18 or newer).

Do not report a security vulnerability in a public issue — follow
[SECURITY.md](SECURITY.md) instead.

What to expect: this is a small project maintained on a best-effort basis.
Issues are triaged when a maintainer is available; there is no guaranteed
response time and no support SLA. A self-contained, reproducible report is
looked at first, and a correct minimal reproduction is the single most useful
thing you can provide.

## Questions?

- Open an issue: https://github.com/dexdat/SpecLang/issues
- Check docs: https://github.com/dexdat/SpecLang#documentation

---

**Remember:** SpecLang is meta-circular. You're building the tool that builds itself. Edit specs, not generated code.
