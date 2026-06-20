# speclang-header lines:10
id: "@speclang/scripts.validate-specs"
version: 0.1.0
layer: 1
tags: [scripts, validation, specs]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Validate Specs Script
---

# Validate Specs Script

Validates all SpecLang specifications for structural correctness, header completeness, and reference integrity.

## Purpose

```speclang
# @block:scripts/validate-specs/overview @kind:note
This script runs multiple validation checks on all spec files:
1. Header validation (required fields, format)
2. Reference resolution (all @ref: references exist)
3. Block syntax validation (@block: and @kind:)
4. Autonomous agent readiness (agent_support: agent_autonomous)
5. Project maturity level compliance

It aggregates results from existing validation scripts (validate_refs.py, validate_autonomous.py) and adds additional checks.
```

## Implementation

```speclang
# @block:scripts/validate-specs/implementation @kind:code
# validate_specs.py - Main validation script
```

## Usage

```bash
python validate_specs.py [--fix] [--report] [--specs-dir SPECS_DIR]
```