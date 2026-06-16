# speclang-header lines:14
id: "@speclang/scripts/validate"
version: 0.1.0
layer: 2
tags: [scripts, validation, tooling]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Validation Scripts for Speclang
parent: ""@ref:speclang/scripts"part: 2/2
children:
  - ""@ref:speclang/scripts.validate-refs"  - ""@ref:speclang/scripts.validate-autonomous"---
# Validation Scripts

Scripts that validate Speclang specifications for correctness and completeness.

## Overview

```speclang
# @block:scripts/validate/overview @kind:note
Validation scripts check Speclang specifications for structural correctness,
reference integrity, and autonomous agent readiness.
```

## Scripts

```speclang
# @block:scripts/validate/list @kind:table
| Script | Purpose |
|--------|---------|
| validate_refs | Validate @ref references across specs |
| validate_autonomous | Validate agent_autonomous spec completeness |
```