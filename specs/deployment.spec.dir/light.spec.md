---
id: "@speclang/deployment/light"
version: 0.1.0
layer: 2
tags: [deployment, light, scale]
imports: ["@speclang/core", "@speclang/pi-integration"]
status: draft
parent: "@speclang/deployment"
part: "1/2"

project_level: Alpha
agent_support: agent_assisted
short: Light Deployment Mode
---

# Light Mode

Light mode is the minimal deployment profile for Pi Agent + Speclang daemon only.

## Overview

```speclang
# @block:deploy/light-overview @kind:note
Light Mode provides:
- Just Pi Agent + chokidar daemon
- Uses chokidar for cross-platform file watching
- Good for <500 files, solo/small teams
- Zero extra processes
```

## Light Mode Details

### @deploy/light

```speclang
# @block:deploy/light @kind:entity
LightMode:
  start: speclang init --mode=light
  
  components:
    - Pi Agent daemon (speclangd with chokidar)
    - Speclang daemon (hooks into chokidar events)
    
  file_watching:
    provider: chokidar
    events: file.edited, agent.finished, session.idle
    latency: ~100ms
    
  features:
    - cascade triggering
    - convergence detection
    - per-file commits
    - basic pipeline
    
  limitations:
    - no queue visibility
    - no worktree isolation
    - no agent control commands
```

## Architecture

### @deploy/light-arch

```speclang
# @block:deploy/light-arch @kind:diagram
```mermaid
flowchart LR
    U[User] --> O[speclangd<br/>--watch specs/]
    O --> P[Speclang Plugin]
    P --> E[chokidar Events<br/>change, add, unlink]
    E --> S[SQLite + Vector]
    S --> A[Agents via Skills]
    A --> F[File Writes]
    F --> G[Git Commit]
    G --> |30s quiet| PIPE[Pipeline]
```
```

## Configuration

### @deploy/light-config

```speclang
# @block:deploy/light-config @kind:code
```yaml
# .speclangrc (light mode)
mode: light

light:
  # no extra config needed
```
```

## Performance

### @deploy/light-performance

```speclang
# @block:deploy/light-performance @kind:table
| Metric | Light |
|--------|-------|
| Event latency | ~100ms |
| Max files | ~500 |
| Max agents | ~20 |
| Memory | +50MB |
| Processes | 1 |
| Startup time | ~2s |
```