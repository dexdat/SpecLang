# speclang-header lines:10
id: "@specs/pipeline"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
target: src/pipeline/index.ts
tags: [pipeline, build, execution]
short: Pipeline execution system for SpecLang build process
---

# Pipeline Module Specification

## Overview

The Pipeline module provides a complete build and execution system for SpecLang. It manages stage-based pipeline execution with dependency ordering, hook system, recovery actions, and convergence detection.

## Architecture

### Components

- **PipelineExecutor** - Main orchestrator for pipeline execution
- **StageExecutor** - Executes individual pipeline stages
- **HookExecutor** - Runs pre/post stage hooks
- **RecoveryExecutor** - Handles error recovery and rollback
- **PipelineConfigManager** - Loads and validates pipeline configuration

### @block::types @kind:types

Type definitions for pipeline configuration, stages, hooks, and recovery:

- `PipelineConfig` - Main configuration interface
- `Stage` / `StageResult` - Stage execution types
- `Hook` / `HookContext` - Hook system types
- `RecoveryAction` / `RecoveryContext` - Recovery types
- `PipelineResult` - Final pipeline output
- `ExecutorOptions` - Execution configuration

### @block::config @kind:code

Configuration management system:

- Loads pipeline configuration from YAML files
- Validates stage dependencies and detects cycles
- Provides default configuration values
- Singleton pattern for config management

### @block::stages @kind:code

Stage execution with dependency resolution:

- Topological sort (Kahn's algorithm) for stage ordering
- Pre/post hook execution per stage
- Command execution with stdout/stderr capture
- Dependency validation before execution

### @block::hooks @kind:code

Hook execution system:

- Pre-stage, post-stage, post-success, post-fail hooks
- Built-in hook utilities (Discord, Slack, file logging)
- Multiple hook execution with failure tolerance

### @block::recovery @kind:code

Error recovery system:

- Rollback to last spec change, pipeline, or all
- Notification system (orchestrator, log, file)
- Retry mechanism
- Pause/delay actions
- Error logging with suggestions

### @block::executor @kind:code

Main pipeline executor:

- Event-driven architecture (EventEmitter)
- Stage ordering and execution
- Condition evaluation for conditional stages
- Recovery action execution on failures
- Success action execution
- Dry-run mode support

## Dependencies

- "@ref:specs/daemon#types - ConvergenceResult type"
