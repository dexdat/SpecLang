# speclang-header lines:24
id: "@speclang/scripts/generate"
version: 0.1.0
layer: 2
tags: [scripts, generation, tooling]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Generation Scripts for Speclang
parent: ""@ref:speclang/scripts"part: 1/2
children:
  - ""@ref:speclang/scripts.generate-index"  - ""@ref:speclang/scripts.generate-ralph-loop"  - ""@ref:speclang/scripts.generate-sqlite-schema"  - ""@ref:speclang/scripts.generate-validation-system"  - ""@ref:speclang/scripts.generate-mcp-server"  - ""@ref:speclang/scripts.generate-opencode-plugin"  - ""@ref:speclang/scripts.add-missing-fields"  - ""@ref:speclang/scripts.compute-header-lines"  - ""@ref:speclang/scripts.fix-headers"  - ""@ref:speclang/scripts.rename-spec-files"  - ""@ref:speclang/scripts.generate-todo"  - ""@ref:speclang/scripts.generate-from-spec"---
# Generation Scripts

Scripts that generate code, indexes, and other artifacts from Speclang specs.

## Overview

```speclang
# @block:scripts/generate/overview @kind:note
Generation scripts transform Speclang specifications into executable code,
database schemas, tool configurations, and other implementation artifacts.
```

## Scripts

```speclang
# @block:scripts/generate/list @kind:table
| Script | Purpose |
|--------|---------|
| generate_index | Generate _index.json from specs |
| generate_ralph_loop | Generate Ralph loop implementation |
| generate_sqlite_schema | Generate SQLite schema from entity specs |
| generate_validation_system | Generate validation system code |
| generate_mcp_server | Generate MCP server implementation |
| generate_pi_extension | Generate Pi Agent extension |
| add_missing_fields | Add missing fields to specs |
| compute_header_lines | Compute header line counts |
| fix_headers | Fix header formatting |
| rename_spec_files | Rename spec files per conventions |
| generate_todo | Generate TODO list from specs |
| generate_from_spec | Generate code from a spec |
```