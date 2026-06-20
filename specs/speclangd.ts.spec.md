# speclang-header lines:9
id: "@specs/speclangd-ts"
version: 1.0.0
layer: 5
short: Speclang daemon TypeScript implementation
tags: [daemon, typescript]
project_level: Alpha
agent_support: agent_autonomous
---
# Speclang Daemon TypeScript Implementation

TypeScript CLI entry point for the SpecLang reactive file watcher daemon. Implements command-line interface using Commander.js.

## Overview

```speclang
# @block:speclangd.ts/overview @kind:entity
SpeclangdTypeScript:
  purpose: TypeScript CLI for speclang daemon
  entry_point: src/speclangd.ts
  dependencies:
    - commander: Command-line framework
    - ./daemon/index.js: Daemon implementation
    - ./daemon/convergence.js: Convergence detection
  
  commands:
    - start: Start daemon (foreground/background)
    - status: Show daemon status
    - pause: Pause cascade
    - resume: Resume cascade
    - abort: Abort current cascade
    - trigger: Manually trigger file event
    - converge: Wait for convergence then exit
```

## Command: start

```speclang
# @block:speclangd.ts/start @kind:operation
start command:
  description: Start the daemon
  options:
    -d, --daemon: Run in background
    -c, --config <path>: Config file path (default: .speclangrc)
  behavior:
    - Creates Daemon instance
    - Attaches event listeners for started, converged, task
    - Starts daemon
    - If not --daemon, runs in foreground and handles SIGINT
```

## Command: status

```speclang
# @block:speclangd.ts/status @kind:operation
status command:
  description: Show daemon status
  behavior:
    - Creates Daemon instance
    - Starts daemon temporarily
    - Calls getStatus()
    - Prints JSON status
    - Stops daemon
```

## Command: pause

```speclang
# @block:speclangd.ts/pause @kind:operation
pause command:
  description: Pause cascade processing
  behavior:
    - Creates Daemon instance
    - Starts daemon
    - Sends Pause command via processCommand
    - Stops daemon
```

## Command: resume

```speclang
# @block:speclangd.ts/resume @kind:operation
resume command:
  description: Resume cascade processing
  behavior:
    - Creates Daemon instance
    - Starts daemon
    - Sends Resume command via processCommand
    - Stops daemon
```

## Command: abort

```speclang
# @block:speclangd.ts/abort @kind:operation
abort command:
  description: Abort current cascade
  behavior:
    - Creates Daemon instance
    - Starts daemon
    - Sends Abort command via processCommand
    - Stops daemon
```

## Command: trigger

```speclang
# @block:speclangd.ts/trigger @kind:operation
trigger command:
  description: Manually trigger an event for a file
  parameters:
    file: string - Path to file
  behavior:
    - Creates Daemon instance
    - Starts daemon
    - Sends Trigger command with file path
    - Stops daemon
```

## Command: converge

```speclang
# @block:speclangd.ts/converge @kind:operation
converge command:
  description: Wait for convergence then exit
  options:
    -t, --timeout <seconds>: Timeout in seconds (default: 60)
  behavior:
    - Creates Daemon instance
    - Starts daemon
    - Calls getConvergence().waitForConvergence(timeout)
    - Prints result or timeout error
    - Stops daemon
```

## Implementation Notes

```speclang
# @block:speclangd.ts/implementation @kind:note
The TypeScript implementation uses the Commander.js library for CLI parsing.

Key patterns:
- Each command creates a new Daemon instance (lightweight)
- Commands start the daemon, perform action, then stop
- Event listeners are attached for logging
- Error handling via try/catch

File location: src/speclangd.ts (symlinked from specs/speclangd.ts.spec.dir/src/speclangd.ts)
```