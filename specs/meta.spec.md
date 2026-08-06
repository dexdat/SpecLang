# speclang-header lines:10
id: "@specs/meta"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [meta, codegen, validation]
short: Meta-programming utilities spec
target: src/meta/
---

# Meta Module Spec

This spec defines meta-programming utilities for SpecLang, including bootstrap, generation, and validation.

## Components

### @block::bootstrap @kind:code
Bootstrap utilities for meta-circular compilation.

### @block::generator @kind:code
Code generation utilities for meta-programming.

### @block::validator @kind:code
Meta-spec validation utilities.

### @block::types @kind:code
Type definitions for meta-programming.

### @block::index @kind:code
Main meta module entry point.

## Dependencies

@ref:specs/compiler
@ref:speclang/implementation-codegen
@ref:specs/validation