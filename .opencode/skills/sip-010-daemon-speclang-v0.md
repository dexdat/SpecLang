---
name: sip-010-daemon-speclang-v0
title: "SIP 10: Daemon Architecture"
version: 0.1.0
description: The reactive file watcher daemon (speclangd)
category: standard
---

# SIP 10: Daemon Architecture

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines speclangd, the reactive file watcher daemon that powers the cascade system.

### Quick Start

1. **Watch:** Monitor filesystem for spec changes
2. **Route:** Find owning agent for each file
3. **Notify:** Send events to agents
4. **Converge:** Detect when cascade is done
5. **Build:** Run pipeline on convergence

### Example

```
User edits specs/auth.spec.yaml
  → speclangd detects change (inotify)
  → Router finds SpecAgent owns this file
  → Agent receives event, processes, writes new files
  → speclangd detects quiet period (30s)
  → Pipeline runs
```

### Key Concepts

- **Reactive:** Event-driven, not batch
- **Rust Binary:** ~5MB, cross-platform
- **Lock Manager:** Prevents write conflicts
- **Convergence Detection:** Knows when done

### When to Read This

- **Understanding events:** How file changes become agent work
- **Debugging:** Why didn't my change trigger?
- **Architecture:** How speclangd works internally

### Related SIPs

- SIP 7: Cascade System
- SIP 6: Agent Protocol
- SIP 8: Configuration

## Abstract

This SIP defines the architecture of speclangd, the reactive file watcher daemon. speclangd watches the filesystem, routes events to agents, manages locks, and detects convergence.

## Motivation

SpecLang needs a reactive core that:
- Detects file changes immediately
- Routes changes to the right agent
- Prevents concurrent write conflicts
- Knows when the cascade is done

A native daemon provides low-latency, reliable file watching.

## Rationale

**Daemon Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                        Filesystem                           │
│   specs/        tests/        generated/   project.scl      │
└──────────────────────┬──────────────────────────────────────┘
                       │ inotify/fsnotify
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      speclangd (Rust)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Watcher  │→ │  Router  │→ │  Locks   │→ │ Convergence │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/IPC
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent Sessions                          │
│   NorthStar    SpecAgent    CodeAgent    TestAgent          │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Low latency (native inotify)
- Cross-platform (Linux, macOS, Windows)
- Small footprint (~5MB)
- Reliable (no external dependencies)

## Specification

### Components

#### Watcher

```speclang
Watcher:
  library: notify crate (Rust)
  
  patterns:
    - "**/*.spec.{md,yaml,yml,scl}"
    - "**/*.{go,ts,js,py,rs,java}.spec"
    - "**/project.scl"
    - "**/build.{scl,yaml}"
    
  ignore:
    - Uses: .gitignore rules
    - Plus: [".speclang/", "*.log", "reports/"]
    
  events:
    - Create: new file
    - Modify: content changed
    - Delete: file removed
    - Rename: file moved
    
  debounce: 100ms
```

#### Router

```speclang
Router:
  input: file change event
  output: notification to owning agent
  
  routing_rules:
    project.scl → NorthStarAgent
    specs/**/*.scl → SpecAgent
    tests/**/*.test.spec.scl → TestAgent
    generated/**/*.go → CodeAgent-Go
    generated/**/*.ts → CodeAgent-TS
    
  notification:
    method: HTTP POST to agent session
    payload: { event, file, diff? }
```

#### Lock Manager

```speclang
LockManager:
  purpose: prevent concurrent write conflicts
  
  lock_file: .speclang/locks/{file-path}.lock
  
  protocol:
    1. agent requests lock
    2. if no lock exists, grant it
    3. if lock exists and expired (>30s), force grant
    4. agent writes file
    5. agent releases lock
  
  timeout: 30 seconds (auto-release)
```

#### Convergence Detector

```speclang
ConvergenceDetector:
  purpose: know when the cascade is done
  
  signals:
    - quiet_period: no events for N seconds
    - all_agents_done: every agent reports idle
    - user_finalize: /finalize in north star
  
  default_quiet: 30 seconds
  
  on_converge:
    1. wait for all in-flight events
    2. verify all agents idle
    3. run tests
    4. commit changes
    5. notify user
```

### Event Flow

```
1. Event Detection
   - inotify/fsnotify detects change
   - debounce 100ms
   - validate file matches spec patterns
   
2. Event Routing
   - Parse header for ownership
   - Find owning agent
   - Check file not locked
   - Create/send event
   
3. Agent Processing
   - Agent receives event via HTTP
   - Reads file
   - Reads dependencies
   - Processes content
   
4. Agent Writing
   - Acquire lock
   - Writes new files
   - Validates headers
   - Release lock
   
5. Convergence Check
   - Track last event time
   - If quiet for N seconds → converged
   - Trigger pipeline
```

### Agent API

```speclang
AgentAPI:
  protocol: HTTP (local) or IPC
  
  endpoints:
    POST /event
      body: { kind, file, diff?, timestamp }
      response: { accepted: bool }
    
    GET /status
      response: { status, current_file, queue_depth }
    
    POST /lock/acquire
      body: { file }
      response: { granted: bool, lock_id? }
    
    POST /lock/release
      body: { file, lock_id }
      response: { ok: bool }
```

## Configuration

**DaemonConfig:**

```yaml
watch_dirs:
  - specs/
  - tests/
  - generated/
  - project.scl

quiet_period: 30s

agent_api:
  port: 7777
  host: localhost

locks:
  dir: .speclang/locks
  timeout: 30s

logging:
  level: info
  file: .speclang/daemon.log
```

## CLI Interface

```bash
speclangd start              # Start daemon in background
speclangd stop               # Stop daemon
speclangd status             # Show status, watched files, agent states
speclangd attach             # Attach to daemon output (logs)
speclangd trigger <file>     # Manually trigger an event (testing)
speclangd converge           # Wait for convergence, then exit

Options:
  --config      path to .speclangrc
  --quiet       set quiet period (default: 30s)
  --port        agent API port (default: 7777)
```

## Binary Distribution

```
Binaries:
  speclangd-linux-amd64
  speclangd-linux-arm64
  speclangd-darwin-amd64
  speclangd-darwin-arm64
  speclangd-windows-amd64.exe

Size: ~5MB each

Install:
  curl -sSL https://speclang.dev/install | sh
  
Or:
  cargo install speclangd
```

## Error Handling

```speclang
DaemonError:
  - WatchFailed: can't watch directory
  - AgentUnreachable: agent not responding
  - LockTimeout: couldn't acquire lock
  - ConfigError: bad configuration
  
Recovery:
  - retry agent notification (3x)
  - force release stale locks
  - continue on non-fatal errors
  - log everything
```

## References

- @ref:specs/daemon - Daemon spec (parent)
- @ref:specs/daemon.spec.dir/architecture - Architecture details
- @ref:specs/daemon.spec.dir/events - Event handling
- @ref:specs/daemon.spec.dir/routing - Event routing
- @ref:specs/daemon.spec.dir/convergence - Convergence detection
- SIP 7: Cascade System
- SIP 6: Agent Protocol

## Copyright

This document is in the public domain.
