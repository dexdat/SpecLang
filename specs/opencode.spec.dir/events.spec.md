# speclang-header lines:10
id: "@speclang/opencode/events"
version: 0.1.0
layer: 2
tags: [opencode, events, file-watching, convergence]
parent: "@speclang/opencode"
part: "1/2"
project_level: Alpha
agent_support: agent_assisted
short: OpenCode Events & Convergence
---
# OpenCode Events & Convergence

Part 1 of 2: Events, file watching, session events, and convergence detection.

## File Watching: Native vs Custom

### @opencode/file-watching

```speclang
# @block:opencode/file-watching @kind:entity
FileWatching:
  native:
    provider: OpenCode built-in
    events:
      - file.edited: file was saved
      - file.watcher.updated: directory changed
      - session.idle: session has no pending work
      - agent.finished: agent completed turn
    platforms: inotify (Linux), fsnotify (macOS), ReadDirectoryChangesW (Windows)
    latency: ~100ms (acceptable for most use cases)
    
  custom_rust_daemon:
    provider: separate speclangd binary
    events: raw inotify
    latency: ~10ms
    complexity: extra binary to ship, maintain
    
  recommendation:
    v0.1: use native OpenCode watching
    future: add Rust daemon if latency becomes issue
    rationale: zero extra moving parts, simpler MVP
```

### @opencode/native-vs-custom

```speclang
# @block:opencode/native-vs-custom @kind:table
| Aspect | OpenCode Native | Custom Rust Daemon |
|--------|-----------------|-------------------|
| File watching | Yes, built-in | Yes, raw inotify |
| Session awareness | Yes, built-in | Would need IPC |
| Plugin hooks | First-class | Would need bridge |
| Latency | ~100ms | ~10ms |
| Extra binary | No | Yes (~5MB) |
| Simplicity | High | Lower |
| MVP suitability | Perfect | Overkill |

Decision: Start with native. Add Rust later if needed.
```

## Session Events

### @opencode/events

```speclang
# @block:opencode/events @kind:entity
OpenCodeEvents:
  file.edited:
    when: any file is saved
    data: { path, timestamp }
    
  agent.finished:
    when: agent completes turn
    data: { session, summary, files_written }
    
  session.idle:
    when: session has no pending work
    data: { session }
    
  session.started:
    when: new agent session created
    data: { session, agent, owns }
```

## Convergence Detection

### @opencode/convergence

```speclang
# @block:opencode/convergence @kind:entity
ConvergenceInOpenCode:
  signals:
    - no file.edited for 30 seconds
    - all sessions report idle
    - or explicit /finalize command
    
  detection:
    - plugin tracks last_edit timestamp
    - on agent.finished, checks elapsed time
    - if > quiet_period AND all_idle: converged
    
  on_converge:
    1. run pipeline (build.yaml)
    2. run tests
    3. commit per file
    4. notify user
```