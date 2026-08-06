# speclang-header lines:11
id: "@speclang/scripts-packaging"
version: 0.1.0
layer: 1
tags: [scripts, packaging, release, npm]
parent: "@ref:specs/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Packaging and Release Process
---

# Packaging and Release Process

Defines the steps to package and release SpecLang to NPM.

## Purpose

Ensure consistent, repeatable packaging and release process for SpecLang.

## Release Criteria

Before packaging, the system must pass all hard checks:

1. **TypeScript Build** - Compiles without errors
2. **Test Suite** - All tests pass
3. **Reference Validation** - No broken spec references
4. **Spec-Implementation Sync** - Specs have corresponding implementations
5. **CLI Commands** - CLI functional
6. **Database Schema** - Migration files present
7. **Dual-View Symlinks** - Symlinks working
8. **Test Coverage** - Test files exist
9. **Documentation** - Core docs present

## Packaging Steps

### @block::packaging/steps @kind:operation
```speclang
packagingSteps:
  1. Run hard checks:
     ```bash
     python3 scripts/hard-checks.py
     ```
  2. Verify exit code is 0 (all critical checks pass)
  3. Build TypeScript:
     ```bash
     npm run build
     ```
  4. Create npm package tarball:
     ```bash
     npm pack
     ```
  5. Verify tarball contents match expected files
  6. If publishing to NPM:
     ```bash
     npm publish
     ```
   7. Tag git release:
      ```bash
      git tag v$(node -p "require('./package.json').version")
      git push origin --tags
      ```
   8. Create GitHub release (optional):
      ```bash
      # Requires GitHub CLI authentication (gh auth login)
      gh release create v$(node -p "require('./package.json').version") \
        --notes-file CHANGELOG.md \
        --title "SpecLang v$(node -p "require('./package.json').version")"
      ```
```

## Configuration

Package configuration is defined in `package.json`:

- `bin` field maps `speclang` to `./bin/speclang`
- `files` whitelist includes `dist`, `bin`, `README.md`, `LICENSE`
- `prepublishOnly` script runs `npm run build`

## References

- @ref:specs/scripts.hard-checks
- docs/packaging-strategy
- @ref:specs/deployment