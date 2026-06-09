# speclang-header lines:11
id: "@speclang/convergence"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [convergence, core, reactive]
short: "Convergence detection and triggers for reactive cascade"
children:
  - "@ref:speclang/convergence/detection"  - "@ref:speclang/convergence/triggers"---
# Convergence

Convergence is the point at which the reactive cascade stops because no more changes are occurring. The system detects convergence through signals like quiet periods and agent idle states, then triggers post‑convergence actions (pipeline, commit, etc.).

## Overview

Convergence ensures that:
- The cascade doesn't run forever
- Changes are batched before pipeline execution
- Resources are released before next development cycle
- Users get a clear "done" signal

## Sub‑specifications

1. **Detection** – algorithms and signals for detecting convergence
2. **Triggers** – normal and forced termination conditions

## Core Principles

- **Quiet period**: Default 30 seconds of no file changes
- **Agent idle**: All agents must report idle status
- **Depth stability**: Cascade depth not increasing
- **Event queue empty**: No pending events to process

## See Also

- "@ref:speclang/cascade/convergence – cascade‑specific convergence
- @ref:speclang/daemon/convergence – daemon implementation
- @ref:specs/pi-extension-examples – Pi extension convergence detection

