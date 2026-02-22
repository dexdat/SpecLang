# speclang-header lines:14
id: "@speclang/daemon"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_assisted
tags: [daemon, inotify, watcher, rust]
imports: ["@speclang/core"]
status: draft
short: "daemon.spec.md"
children:
  - "@ref:specs/daemon.dir/architecture"
  - "@ref:specs/daemon.dir/events"
  - "@ref:specs/daemon.dir/routing"
  - "@ref:specs/daemon.dir/convergence"
---
# speclangd

The reactive file watcher daemon. Rust binary, ~5MB, cross-platform.

This spec has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- @ref:specs/daemon.dir/architecture - Architecture overview of speclangd
- @ref:specs/daemon.dir/events - File watching and event handling
- @ref:specs/daemon.dir/routing - Event routing to agents
- @ref:specs/daemon.dir/convergence - Convergence detection and finalization

---

*See individual parts in daemon.dir/*