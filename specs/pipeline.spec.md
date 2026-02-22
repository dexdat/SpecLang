# speclang-header lines:13
id: "@speclang/pipeline"
version: 0.1.0
layer: 0
tags: [pipeline, build, convergence, hooks]
imports: ["@speclang/core"]
status: draft
children: ["@speclang/pipeline/build", "@speclang/pipeline/hooks", "@speclang/pipeline/recovery"]
project_level: Alpha
agent_support: agent_assisted
short: Build Pipeline
---

# Build Pipeline

The pipeline runs after convergence. Defined in specs, executed by speclangd.

## Overview

```speclang
# @block:pipeline/overview @kind:note
When speclangd detects convergence (all files quiet for N seconds),
it reads the pipeline definition and executes it.

The pipeline is self-defining - specs describe how to build themselves.
```

## Child Specs

- @ref:speclang/pipeline/build - Core stages, triggers, convergence detection, output, per-target configuration, and full example.
- @ref:speclang/pipeline/hooks - Pre/post stage actions and built-in hooks.
- @ref:speclang/pipeline/recovery - Failure handling and self-healing strategies.

## Pipeline Definition

See @ref:speclang/pipeline/build for detailed pipeline structure, triggers, stages, and convergence detection.