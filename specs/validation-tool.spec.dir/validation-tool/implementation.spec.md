# speclang-header lines:13
id: "@speclang/validation-tool/implementation"
version: 0.1.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, tool, implementation, autonomous]
short: Validation tool implementation details
parent: "@speclang/validation-tool"
---

# Validation Tool Implementation

Implementation details for the autonomous validation tool.

## Overview

### @validation-tool/implementation/overview

```speclang
# @block:validation-tool/implementation/overview @kind:note

The validation tool implementation includes:
- ValidationEngine: Core validation orchestration
- RuleRegistry: Manages validation rules
- ValidationReporter: Formats output
- CLI: Command-line interface
```

## Components

### @validation-tool/implementation/engine

The ValidationEngine executes all enabled rules against parsed specs and produces structured reports.

### @validation-tool/implementation/rules

Built-in rules:
- headerRule: Validates header format and required fields
- idRule: Validates spec ID format
- refsRule: Validates reference resolution
- blocksRule: Validates block syntax
- autonomousRule: Validates autonomous mode requirements

### @validation-tool/implementation/reporter

Output formatters:
- text: Human-readable format
- json: Machine-readable format
- minimal: Compact format for CI/CD

### @validation-tool/implementation/cli

CLI integration via `speclang validate` command.

## Integration Points

### @validation-tool/implementation/integrations

- File watcher: Validates on save
- Guard plugin: Validates before write
- CLI: Explicit validation command
- MCP: Remote validation API

## Confidence Scoring

### @validation-tool/implementation/confidence

```speclang
# @block:validation-tool/implementation/confidence @kind:schema
{
  "confidence_score": 0.0-1.0,
  "factors": {
    "completeness": "percentage of required fields present",
    "reference_resolution": "percentage of refs that resolve",
    "step_coverage": "percentage of operations with steps",
    "ambiguity": "count of ambiguous language patterns"
  }
}
```
