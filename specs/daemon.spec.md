# speclang-header lines:15
id: "@speclang/daemon"
version: 0.2.0
target: src/daemon/
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [daemon, rust, typescript, reactive, file-watcher, watch-system, notification-graph]
children:
  - "@ref:specs/daemon.spec.dir/architecture"
  - "@ref:specs/daemon.spec.dir/events"
  - "@ref:specs/daemon.spec.dir/routing"
  - "@ref:specs/daemon.spec.dir/convergence"
short: "speclangd - Reactive file watcher daemon with watch pattern system"
status: draft
---

# speclangd Daemon

The reactive file watcher daemon that powers the SpecLang cascade. Watches for file changes, routes events to owning agents, manages concurrency locks, detects convergence, and maintains the notification graph.

## Overview

```speclang
# @block:daemon/overview @kind:entity
speclangd:
  implementations:
    - typescript: chokidar/fs.watch based daemon (standard mode)
    - rust: High-performance daemon with inotify (enterprise)

  responsibilities:
    - Watch specs/ directory recursively
    - Parse watch: patterns from all spec headers (watch.files, watch.exclude)
    - Maintain notification graph: which specs watch which files
    - Match file changes against watch patterns (literal + glob)
    - Route events to all dependent specs via notification graph
    - Emit FileChangeEvent with: path, kind, dependent_specs[]
    - Manage file locks to prevent conflicts
    - Detect convergence (quiet period)
    - Trigger pipeline execution
    - Flag file contention for throttle system

  modes:
    - standard: TypeScript daemon using chokidar for cross-platform file watching
    - enterprise: Rust daemon + MCP server
```

## Watch Patterns

### @block:daemon/watch-patterns @kind:entity
```speclang
WatchPattern:
  description: "File watching patterns from spec headers"

  pattern_types:
    - literal: "Exact file path (specs/auth/handler.spec.md)"
    - glob: "Glob pattern (specs/**/*.spec.md, **/*.spec.go.md)"

  header_fields:
    - watch.files: "List of file paths/globs to watch"
    - watch.exclude: "List of paths/globs to exclude from watch"

  matching:
    - When a file change is detected, read its path
    - Find ALL specs that watch this file (via watch.files patterns)
    - Also find specs with @ref: to this file in body or depends_on
    - Exclude any paths matching watch.exclude patterns
    - Return list of dependent specs that need notification
```

## Notification Graph Maintenance

### @block:daemon/notification-graph @kind:entity
```speclang
NotificationGraph:
  description: "Maintained by speclangd — maps file changes to dependent specs"

  construction:
    - On spec creation/update: re-parse header and body
    - Extract watch.files, watch.exclude, depends_on, and body @ref: links
    - Merge all sources into notification edges
    - Store in memory and SQLite for persistence

  update_triggers:
    - spec_created: "Parse header, add edges to graph"
    - spec_modified: "Re-parse header, update edges"
    - spec_deleted: "Remove all edges for this spec"

  query:
    - file_changed(path): "Return list of spec IDs that watch this file"
    - spec_dependents(id): "Return list of specs that depend on this spec"
```

## File Change Event

When a file change is detected, the daemon reads the file's header (if it's a spec) and queries the notification graph for all dependent specs. The resulting event contains:

- `path`: The file that changed
- `kind`: create, modify, or delete
- `dependent_specs`: List of spec IDs that need notification
- `timestamp`: When the change was detected

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

- **Standard mode**: TypeScript daemon using chokidar for cross-platform file watching
- **Enterprise mode**: Rust daemon with raw inotify/fsnotify + MCP server

The daemon is the heart of SpecLang's reactive cascade system.
