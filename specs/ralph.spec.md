# speclang-header lines:6
id: "@specs/ralph"
version: 1.0.0
layer: 5
target: src/ralph/
---

# Ralph Module Spec

This spec defines Ralph Loop integration for SpecLang, including builder, loop, steering, and verification.

## Components

### @block::builder @kind:code
Ralph Loop builder utilities.

### @block::loop @kind:code
Ralph Loop implementation.

### @block::steering @kind:code
Steering packet generation and processing.

### @block::verifier @kind:code
Verification utilities for Ralph Loop.

### @block::types @kind:code
Type definitions for Ralph integration.

### @block::index @kind:code
Main ralph module entry point.

## Dependencies

@ref:specs/agents
@ref:specs/validation