# speclang-header lines:9
id: "@specs/codegen"
version: 1.0.0
layer: 2
project_level: Alpha
target: src/codegen/index.ts
agent_support: agent_assisted
tags: [codegen, core]
short: Code generation system for SpecLang
---

# Code Generation System

The code generation system transforms spec blocks into executable code for multiple target languages.

## Architecture

### @block::index @kind:code
Main entry point - exports all codegen functionality.

### @block::parser @kind:code
Parses code blocks from spec files.

### @block::mapper @kind:code  
Maps spec types to target language types.

### @block::writer @kind:code
Writes generated code to filesystem.

### @block::types @kind:code
Type definitions for codegen system.

### @block::templates @kind:code
Template rendering system.

## Targets

### @block::targets/index @kind:code
Target registry and generation orchestration.

### @block::targets/go @kind:code
Go language target generator.

### @block::targets/python @kind:code
Python target generator.

### @block::targets/typescript @kind:code
TypeScript target generator.

### @block::targets/rust @kind:code
Rust target generator.
