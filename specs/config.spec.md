---
id: "@speclang/config"
version: 0.1.0
layer: 0
tags: [config, schema, loader, validator]
imports: ["@speclang/core", "@speclang/stdlib"]
children:
  - "@ref:speclang/config.spec.dir/schema"  - "@ref:speclang/config.spec.dir/defaults"status: draft

project_level: Alpha
agent_support: agent_assisted
short: Configuration System
---

# Configuration System

Configuration management for SpecLang projects.

## Overview

```speclang
# @block:config/overview @kind:note
Configuration follows a hierarchical schema:
- Project-level configuration in `.speclangrc`
- Default values for all settings
- Validation against schema
- Type-safe TypeScript interfaces
```

## Sub-specs

This spec has been split into focused sub-specs:

### @ref:specs/config.spec.dir/schema
- Configuration schema definitions
- TypeScript interface generation
- Default configuration constants

### @ref:specs/config.spec.dir/defaults
- Default configuration values
- Environment-specific overrides
- Configuration merging logic

