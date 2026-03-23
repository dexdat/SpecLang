# speclang-header lines:9
id: "@specs/workflow"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [workflow, cli, commands]
short: Workflow CLI and command handlers
target: src/workflow/index.ts
---

# Workflow Module

The workflow module provides CLI functionality and command handlers for Speclang.

## Exports

### @block::cli @kind:code
CLI entry point - and runs creates the command-line interface.

### @block::setup @kind:code  
Project initialization and validation - sets up new Speclang projects.

### @block::commands @kind:code
NorthStar command parsing and execution - handles skill downloads and listings.

### @block::review @kind:code
Status and diff viewing - shows changes, specs, and file modifications.

### @block::conversation @kind:code
Natural language command processing - parses and executes user intents.
