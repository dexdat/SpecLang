# speclang-header lines:12
id: "@speclang/scripts.run-all-checks"
version: 0.1.0
layer: 2
tags: [scripts, validation, integration]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Run all validation checks and report summary
target: scripts/run_all_checks.py
---

# Run All Checks Script

Script that runs all validation and compliance checks and reports a summary.

## Overview

```speclang
# @block:overview @kind:note
The run-all-checks script executes all validation scripts (validate_specs, validate_autonomous, validate_refs, check_compliance, hard-checks) and aggregates results into a single report. This provides a quick health check for the entire SpecLang project.
```

## Purpose

```speclang
# @block:purpose @kind:note
When making changes to specs or code, it's important to ensure the entire system remains consistent. This script runs all validation steps that would normally be run separately, providing a unified view of project health.
```

## Usage

```speclang
# @block:usage @kind:code
```bash
# Run all checks
python3 scripts/run_all_checks.py

# Run with JSON output
python3 scripts/run_all_checks.py --json

# Run specific check categories
python3 scripts/run_all_checks.py --category validation
python3 scripts/run_all_checks.py --category compliance
```
```

## Implementation

```speclang
# @block:implementation @kind:note
The script will:
1. Import each validation module or run as subprocess
2. Collect exit codes and output
3. Aggregate results
4. Print summary table
5. Return non-zero exit code if any check fails
```

## Dependencies

```speclang
# @block:dependencies @kind:note
Depends on:
- validate_specs.py
- validate_autonomous.py
- validate_refs.py
- check_compliance.py
- hard_checks.py
```