# speclang-header lines:12
id: "@speclang/roadmap/alpha/build-system"
parent: "@ref:speclang/roadmap/alpha"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
status: draft
tags: [roadmap, alpha, build, typescript]
imports: ["@speclang/pipeline"]
short: Alpha TypeScript builds with dependency resolution and caching
---

# Alpha: Build System

## Scope

Extracts P4-006 and P4-010 from @ref:speclang/roadmap/alpha. Requirements here
are not a declaration that the Alpha milestone is complete.

## Requirements

### @block::build @kind:operation

1. Resolve generated code dependencies before compiling.
2. Integrate npm and tsc into the pipeline build stage.
3. Support incremental builds and development watch mode.
4. Cache reusable build output in `.speclang/build/`.
5. Invalidate cached output when its inputs change and propagate compilation errors.

## Acceptance Criteria

- Valid generated TypeScript compiles without errors in the build stage.
- Invalid TypeScript fails the stage rather than reusing stale successful output.
- Changed dependencies invalidate affected build results.
- Measure build success rate against the parent milestone's greater-than-90% target.
