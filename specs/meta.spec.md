# speclang-header lines:6
id: "@specs/meta"
version: 1.0.0
layer: 5
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
@ref:specs/codegen
@ref:specs/validation