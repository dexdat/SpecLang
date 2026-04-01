# speclang-header lines:15
id: "@speclang/daemon"
version: 0.2.0
target: src/daemon/
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [daemon, rust, typescript, reactive, file-watcher]
children:
  - "@ref:specs/daemon.spec.dir/architecture"  - "@ref:specs/daemon.spec.dir/events"  - "@ref:@ref:specs/daemon.spec.dir/routing"  - "@ref:specs/daemon.spec.dir/convergence"
short: "speclangd - Reactive file watcher daemon"
status: draft
---

# speclangd Daemon

The reactive file watcher daemon that powers the SpecLang cascade. Watches for file changes, routes events to owning agents, manages concurrency locks, and detects convergence.

## Overview

```speclang
# @block:daemon/overview @kind:entity
speclangd:
  implementations:
    - rust: Primary daemon for scale (enterprise)
    - typescript: OpenCode plugin for light mode
  
  responsibilities:
    - Watch filesystem for spec changes
    - Route events to owning agent sessions
    - Manage file locks to prevent conflicts
    - Detect convergence (quiet period)
    - Trigger pipeline execution
  
  modes:
    - light: OpenCode plugin only (TypeScript)
    - enterprise: Rust daemon + MCP server
```

## Architecture

See @ref:specs/daemon.spec.dir/architecture for full architecture diagram and components.

## File Watching

See @ref:specs/daemon.spec.dir/events for file watching patterns, ignore rules, and event types.

## Event Routing

See @ref:specs/daemon.spec.dir/routing for how events are routed to appropriate agent sessions.

## Convergence Detection

See @ref:specs/daemon.spec.dir/convergence for quiet period detection and pipeline triggering.

## Implementation Strategy

Based on project needs:

- **Light mode**: TypeScript OpenCode plugin (uses OpenCode's native file events)
- **Enterprise mode**: Rust daemon with raw inotify/fsnotify + MCP server

The daemon is the heart of SpecLang's reactive cascade system.

