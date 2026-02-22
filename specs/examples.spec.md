# speclang-header lines:13
id: "@speclang/examples"
version: 0.1.0
layer: 1
tags: [examples]
imports: ["@speclang/core"]
children:
  - @ref:specs/examples.spec.dir/auth
  - @ref:specs/examples.spec.dir/api
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Example specifications
---
# Examples

Collection of example specs demonstrating SpecLang features.

## Hello World

See `@ref:specs/examples.spec.dir/hello-world` for a simple example.

## Authentication Example

See `@ref:specs/examples.spec.dir/auth` for an authentication example demonstrating entity definitions, operations, and security patterns.

## API Example

See `@ref:specs/examples.spec.dir/api` for an API design example demonstrating endpoint definitions, request/response schemas, and error handling.