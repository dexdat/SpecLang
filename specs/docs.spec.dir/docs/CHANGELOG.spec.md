# speclang-header lines:9
id: "@specs/docs/changelog"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [documentation, changelog, release]
short: Changelog generation specification
target: docs/CHANGELOG.md
---

# Changelog Generation Specification

This spec defines the format and generation rules for CHANGELOG.md.

## Format

Follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

### Sections

- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** in case of vulnerabilities.

### Version Headers

```
## [Unreleased]
## [1.0.0] - 2026-03-22
```

### Links

- Compare URLs to previous version
- GitHub release tags

## Generation Rules

### Source Data

- Git commit history with `speclang:` prefix
- Commit messages parsed for type (add, fix, change, etc.)
- Group by semantic type

### Automation

- Script: `scripts/generate_changelog.py`
- Run during release preparation
- Update `[Unreleased]` section with recent changes
- Create new version section when tagging

## Example

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X

### Changed
- Improved Y

## [1.0.0] - 2026-03-22

### Added
- Initial release
```

## References

- "@ref:specs/docs
- @ref:specs/release