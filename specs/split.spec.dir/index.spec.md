# speclang-header lines:9
id: "@specs/split"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [split, spec-management]
target: src/split/
short: Dynamic spec splitting and management
---

# Split Module Specification

This module handles dynamic splitting of large specs into smaller, manageable parts.

## @block:types @kind:types

TypeScript types for the splitting system.

### SplitStrategy
- `smart` - Intelligent splitting with heuristics
- `by-section` - Split by natural sections
- `by-token` - Split by token count

### Core Interfaces
- SplitConfig - Configuration for splitting behavior
- SpecSize - Size metrics (tokens, lines, chars)
- SizeCheckResult - Result of size checking
- SplitResult - Result of splitting operation
- SplitFile - A file to be written after split
- SplitDecision - Decision from split checker (no-split, try-optimize, must-split)

### Constants
- DEFAULT_SPLIT_CONFIG - Default configuration
- DEFAULT_MERGE_CONFIG - Default merge threshold (50%)

## @block:index @kind:code

Main exports for the split module, re-exporting all types, constants, and classes from submodules.

## @block:token-counter @kind:code

Token counting utility for measuring spec sizes.

## @block:size-checker @kind:code

Size checking utility to determine if specs need splitting.

## @block:strategy @kind:code

Split strategies: SmartSplitStrategy, BySectionSplitStrategy, ByTokenSplitStrategy.

## @block:splitter @kind:code

Main Splitter class that orchestrates the splitting process.

## @block:directory-builder @kind:code

Builds directory structure for split specs.

## @block:index-updater @kind:code

Updates _index.json after splitting.

## @block:config @kind:code

Configuration loading and management.

### References
@ref:specs/core
