# speclang-header lines:13
id: "@speclang/scripts"
version: 0.1.0
layer: 0
tags: [scripts, tooling, build]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Build and Development Scripts
children: 
    - "@ref:speclang/scripts/generate"
    - "@ref:speclang/scripts/validate"
---
# Build and Development Scripts

Scripts for building, validating, and maintaining Speclang.

## Overview

```speclang
# @block:scripts/overview @kind:note
Scripts that build and maintain Speclang itself.
Each script has a corresponding spec in scripts.spec.dir/
```

## Children

```speclang
# @block:scripts/children @kind:table
| Category | Purpose |
|----------|---------|
| generate | Generation scripts (code, indexes, schemas, etc.) |
| validate | Validation scripts (reference integrity, autonomous readiness) |
```
