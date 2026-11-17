# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `npm run check:sqlite-binding` — asserts the `better-sqlite3` native binding really
  loads (one `require` + one in-memory `SELECT 1`, no build). On failure it prints the
  exact remedy for the detected npm version and exits non-zero. The postinstall hook
  runs the same gate and CI runs it right after `npm ci`, so a silent binding loss turns
  a run red instead of reaching users.

### Fixed
- **npm >= 12 silently installed `better-sqlite3` without its native binding.**
  npm 12 blocks dependency install scripts that are not covered by the root
  `package.json` `allowScripts` field (RFC npm/rfcs#868), and better-sqlite3 builds or
  downloads its binding from exactly that script — so `npm install` exited 0 while every
  SQLite-backed command (DB layer, MCP server, cascade daemon) failed at runtime with
  `Could not locate the bindings file`. `package.json` now declares
  `"allowScripts": { "better-sqlite3": true }`, and the install is verified instead of
  assumed. Affects npm >= 12.0.0; npm < 12 runs install scripts by default.

## [1.0.0] - 2026-03-31

### Added
- Complete SpecLang implementation with 95 stories
- 736 baby steps executed
- Hard checks verification system
- Database schema migrations
- CLI command suite (15 commands)
- GitHub Actions CI workflow
- Performance benchmarks
- Examples: hello-world, auth, CRUD
- Scripts for validation, generation, and compliance
- Project maturity levels (POC to Enterprise)
- Layer system with 10 abstraction levels
- Standard library with types and functions
- Lens system for multiple content formats
- Mermaid diagram lens
- MCP server with authentication and tools
- Code generation framework for TypeScript, Go, Python, Rust
- Pipeline executor with build, test, lint, deploy stages
- Guard system for file ownership
- Ralph Loop autonomous agent system
- UI dashboard for system monitoring
- Transition workflows for maturity level upgrades
- Safety systems and recovery mechanisms
- Integration tests and performance tests

### Changed
- Fixed broken spec references (13 references)
- Improved hard checks script regex
- Updated package.json for packaging
- Bootstrap from POC to Alpha maturity
- Migrated from UUIDs to git commit hashes for causality
- Enhanced validation system with autonomous agent support
- Improved error handling with rollback mechanisms
- Dual-view pattern fully implemented with 392 symlinks
- All specs follow header format with required fields
- Test suite expanded to 1478 passing tests (8 skipped)

### Fixed
- Reference validation errors
- Test suite passes consistently
- Build compiles without errors
- All critical checks pass (9/9)
- No broken references

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