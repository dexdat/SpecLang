# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release preparation tasks
- Hard checks verification system
- Database schema migrations
- CLI command suite

### Changed
- Fixed broken spec references (13 references)
- Improved hard checks script regex
- Updated package.json for packaging

### Fixed
- Reference validation errors
- Test suite passes (1229 tests)

## [0.1.0] - 2026-03-22

### Added
- SpecLang core architecture
- Dual-view pattern with symlinks
- SQLite database with FTS and vector search
- Cascade reactive system
- Agent protocol with file ownership
- MCP server for agent-human communication
- OpenAPI specification
- 419 spec files covering entire system
- 370 TypeScript implementation files
- 54 test files with 1229 passing tests
- 7 CLI commands
- Documentation suite (NORTH_STAR, AGENTS, etc.)

### Changed
- Bootstrap from POC to Alpha maturity
- Migrated from UUIDs to git commit hashes for causality
- Enhanced validation system with autonomous agent support
- Improved error handling with rollback mechanisms

### Fixed
- All critical checks pass (6/6)
- No broken references
- Build compiles without errors
- Tests pass consistently