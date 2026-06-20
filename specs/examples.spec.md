# speclang-header lines:12
id: "@speclang/examples.spec"
version: 0.1.0
layer: 1
target: src/examples/
tags: [examples]
children:
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Example specifications
---
# Examples

Collection of example specs demonstrating SpecLang features.

## Hello World

See `@ref:specs/examples.spec.dir/hello-world` for a simple code generation example.

## Hello World Cascade (CRITICAL)

See `@ref:specs/examples.spec.dir/hello-world-cascade` for a **complete end-to-end demonstration** showing:
- File creation → Cascade → Code generation → Testing → Pipeline
- This is the key example for understanding how SpecLang works

## Authentication Example

See `@ref:specs/examples.spec.dir/auth` for an authentication example demonstrating entity definitions, operations, and security patterns.

## API Example

See `@ref:specs/examples.spec.dir/api` for an API design example demonstrating endpoint definitions, request/response schemas, and error handling.