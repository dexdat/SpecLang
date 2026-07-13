# speclang-header lines:10
id: "@specs/daemon-dir/index"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [daemon, index, directory]
short: "Daemon Directory Index - speclangd file watcher sub-specs"
status: active
---

# Daemon Directory Index

**Directory:** `specs/daemon.dir/`  
**Parent:** `daemon.spec.md` (main index spec)

## Contents

This directory contains sub-specs for `speclangd` - the reactive file watcher daemon that powers SpecLang.

### Files

1. **`architecture.spec.md`** - Daemon Architecture
   - Overview, components, lock manager, agent API, CLI, configuration
   - Layer: 2, Part: 1/4
   - Siblings: next → `events.spec.md`

2. **`events.spec.md`** - Daemon Events & Watcher
   - File watching patterns, ignore rules, event types
   - Layer: 2, Part: 2/4
   - Siblings: prev → `architecture.spec.md`, next → `routing.spec.md`

3. **`routing.spec.md`** - Daemon Routing
   - Event routing to agents, session matching, priority queues
   - Layer: 2, Part: 3/4
   - Siblings: prev → `events.spec.md`, next → `convergence.spec.md`

4. **`convergence.spec.md`** - Daemon Convergence
   - Quiet period detection, pipeline triggering, recovery
   - Layer: 2, Part: 4/4
   - Siblings: prev → `routing.spec.md`

## Reading Order

For understanding the daemon:

1. **Start with parent:** `../daemon.spec.md` (main index)
2. **Then read:** `architecture.spec.md` (overview and components)
3. **Then read:** `events.spec.md` (file watching)
4. **Then read:** `routing.spec.md` (event routing)
5. **Then read:** `convergence.spec.md` (quiet detection)

## Key Concepts

### From `architecture.spec.md`:
- **speclangd**: Rust binary, ~5MB, cross-platform
- **Components**: Watcher, Router, LockManager, ConvergenceDetector
- **Agent API**: HTTP/IPC communication with agents
- **CLI**: `speclangd start|stop|status|attach|trigger|converge`
- **Configuration**: Watch directories, quiet period, locks, logging

### From `events.spec.md`:
- **File patterns**: `**/*.spec.{md,yaml,yml,scl}`, `**/*.{go,ts,...}.spec`
- **Ignore rules**: Respects `.gitignore`, plus system patterns
- **Event types**: Create, Modify, Delete, Rename
- **Debouncing**: Prevent rapid-fire events

### From `routing.spec.md`:
- **Ownership matching**: Which agent owns changed file
- **Session routing**: Deliver event to correct agent session
- **Priority queues**: Handle events in dependency order
- **Lock coordination**: Prevent concurrent write conflicts

### From `convergence.spec.md`:
- **Quiet period**: No changes for N seconds (default: 30s)
- **Pipeline trigger**: Execute `build.yaml` after convergence
- **Recovery**: Rollback on failure, notify North Star
- **State persistence**: Survive daemon restart

## Dependencies

All files:
- Reference parent: @ref:specs/daemon
- Reference siblings via `siblings.prev` and `siblings.next`
- Reference `core.dir/entities.spec.md` for daemon entity definition

## Purpose

The Daemon directory defines:
- **How file changes are detected** (inotify/fsnotify)
- **How events are routed** to owning agents
- **How conflicts are prevented** (locks)
- **How convergence is detected** (quiet period)
- **How the pipeline is triggered** after cascade completes

## Implementation Modes

1. **Light mode**: TypeScript OpenCode plugin (uses OpenCode events)
2. **Enterprise mode**: Rust daemon (raw inotify + MCP server)

## Notes

- **Layer 2**: Implementation details of layer 1 daemon concept
- **Required for cascade**: Daemon enables reactive file system
- **Cross-platform**: Linux (inotify), macOS (FSEvents), Windows (ReadDirectoryChangesW)
- **Scalable**: Handles 10 files or 10,000 files

For complete daemon understanding, read `../daemon.spec.md` first, then these sub-specs in order.