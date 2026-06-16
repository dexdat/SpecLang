# SpecLang Python Tooling Scripts

This directory contains Python scripts used for various tasks in the SpecLang project.

## Categories

### 1. Generation Scripts
Scripts that generate code, indexes, and other artifacts from specs.

| Script | Purpose | Usage |
|--------|---------|-------|
| `generate_index.py` | Generate `_index.json` from specs | `python3 generate_index.py [--validate] [--tree SPEC]` |
| `generate_ralph_loop.py` | Generate Ralph loop implementation | `python3 generate_ralph_loop.py` |
| `generate_sqlite_schema.py` | Generate SQLite schema from entity specs | `python3 generate_sqlite_schema.py` |
| `generate_validation_system.py` | Generate validation system code | `python3 generate_validation_system.py` |
| `generate_mcp_server.py` | Generate MCP server implementation | `python3 generate_mcp_server.py` |
| `generate_opencode_plugin.py` | Generate OpenCode plugin | `python3 generate_opencode_plugin.py` |
| `add_missing_fields.py` | Add missing required header fields to specs | `python3 add_missing_fields.py` |
| `compute_header_lines.py` | Compute header line counts | `python3 compute_header_lines.py` |
| `fix_headers.py` | Fix header formatting | `python3 fix_headers.py` |
| `rename_spec_files.py` | Rename spec files per conventions | `python3 rename_spec_files.py` |
| `generate_todo.py` | Generate TODO list from specs | `python3 generate_todo.py` |
| `generate_from_spec.py` | Generate code from a spec | `python3 generate_from_spec.py <spec>` |

### 2. Validation Scripts
Scripts that validate specs, references, and autonomous support.

| Script | Purpose | Usage |
|--------|---------|-------|
| `validate_specs.py` | Validate spec syntax and headers | `python3 validate_specs.py` |
| `validate_autonomous.py` | Validate autonomous agent support | `python3 validate_autonomous.py` |
| `validate_refs.py` | Validate reference resolution | `python3 validate_refs.py` |
| `verify_system.py` | Verify system integrity | `python3 verify_system.py` |
| `run_all_checks.py` | Run all validation checks and report summary | `python3 run_all_checks.py [--json]` |

### 3. Compliance Scripts
Scripts that check and enforce dual-view pattern compliance.

| Script | Purpose | Usage |
|--------|---------|-------|
| `check_compliance.py` | Check dual-view compliance | `python3 check_compliance.py [--fix] [--report]` |
| `hard_checks.py` | Run hard checks (critical validation) | `python3 hard_checks.py` |

### 4. Analysis Scripts
Scripts that analyze spec completeness and validation coverage.

| Script | Purpose | Usage |
|--------|---------|-------|
| `analyze_completeness.py` | Analyze spec completeness | `python3 analyze_completeness.py` |
| `analyze_validation.py` | Analyze validation coverage | `python3 analyze_validation.py` |

### 5. Debugging Scripts
Scripts for debugging spec issues.

| Script | Purpose | Usage |
|--------|---------|-------|
| `debug_extract.py` | Extract debug information from specs | `python3 debug_extract.py` |
| `debug_steps.py` | Debug step-by-step execution | `python3 debug_steps.py` |
| `fallback_protocol.py` | Fallback protocol for error recovery | `python3 fallback_protocol.py` |

### 6. Utility Scripts
General utility scripts for maintenance.

| Script | Purpose | Usage |
|--------|---------|-------|
| `symlink_manager.py` | Manage symlinks for dual-view pattern | `python3 symlink_manager.py` |
| `replace_ids.py` | Replace spec IDs | `python3 replace_ids.py` |
| `packaging.py` | Packaging utilities | `python3 packaging.py` |
| `cleanup_temp.py` | Clean up temporary files and directories | `python3 cleanup_temp.py [--dry-run]` |

### 7. Integration Scripts
Scripts for integration testing and system validation.

| Script | Purpose | Usage |
|--------|---------|-------|
| `integration-test.py` | Run integration tests | `python3 integration-test.py` |

## Usage Notes

- Most scripts accept `--help` flag for usage information.
- Scripts are designed to be run from the project root directory.
- Many scripts write output to stdout/stderr and return appropriate exit codes (0 for success, non-zero for failure).
- Some scripts have `--json` flag for machine-readable output.

## Adding New Scripts

When adding new scripts:

1. **Create spec first**: Create a `.spec.md` file in `specs/scripts.spec.dir/` with proper header.
2. **Implement script**: Create the Python script in the same directory.
3. **Create symlink**: Symlink from `scripts/` to the spec directory using `ln -sf ../specs/scripts.spec.dir/script.py scripts/script.py`
4. **Update documentation**: Add entry to this README.

## Dependencies

Scripts require Python 3.8+ and may use standard library modules only (no external dependencies).

## Source of Truth

All scripts have their source of truth in `specs/scripts.spec.dir/`. The files in `scripts/` are symlinks to those sources. Never edit files directly in `scripts/` – edit the spec directory files instead.

## Running All Checks

Use `run_all_checks.py` to run all validation and compliance checks:

```bash
python3 scripts/run_all_checks.py
```

This will run:
- `validate_specs.py`
- `validate_autonomous.py`
- `validate_refs.py`
- `check_compliance.py`
- `hard_checks.py`

And report a summary.