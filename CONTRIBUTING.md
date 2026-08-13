# Contributing to SpecLang

Thank you for your interest in contributing to SpecLang!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/dexdat/SpecLang.git
cd SpecLang

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
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

## Questions?

- Open an issue: https://github.com/dexdat/SpecLang/issues
- Check docs: https://github.com/dexdat/SpecLang#documentation

---

**Remember:** SpecLang is meta-circular. You're building the tool that builds itself. Edit specs, not generated code.
