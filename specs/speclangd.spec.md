# speclang-header lines:8
id: "@speclang/speclangd"
version: 0.1.0
layer: 5
target: src/speclangd.ts
tags: [daemon, file-watcher]
short: Main daemon entry point
---

# Speclangd CLI

Command-line interface for the SpecLang reactive file watcher daemon. Provides commands to start, stop, pause, resume, and monitor the cascade.

## Overview

```speclang
# @block:speclangd/overview @kind:entity
SpeclangdCLI:
  purpose: Command-line interface for the SpecLang daemon
  target_audience:
    - Developers using SpecLang
    - System administrators
    - CI/CD pipelines
  
  commands:
    - start: Start the daemon (foreground/background)
    - status: Show daemon status
    - pause: Pause cascade processing
    - resume: Resume cascade processing
    - abort: Abort current cascade
    - trigger: Manually trigger file event
    - converge: Wait for convergence then exit
  
  implementation:
    - language: TypeScript
    - entry_point: src/speclangd.ts
    - dependencies: commander, daemon module
```

## Commands

```speclang
# @block:speclangd/commands @kind:entity
interface SpeclangdCommands:
  start:
    description: Start the daemon
    options:
      -d, --daemon: Run in background
      -c, --config <path>: Config file path (default: .speclangrc)
    behavior: Starts daemon, attaches event listeners
  
  status:
    description: Show daemon status
    behavior: Prints JSON status of daemon
  
  pause:
    description: Pause cascade processing
    behavior: Stops processing new file events
  
  resume:
    description: Resume cascade processing
    behavior: Resumes processing file events
  
  abort:
    description: Abort current cascade
    behavior: Stops current cascade, clears queue
  
  trigger:
    description: Manually trigger an event for a file
    parameters:
      file: string - Path to file
    behavior: Simulates file change event
  
  converge:
    description: Wait for convergence then exit
    options:
      -t, --timeout <seconds>: Timeout in seconds (default: 60)
    behavior: Waits for quiet period, then exits
```

## Implementation

```speclang
# @block:speclangd/implementation @kind:note
The speclangd CLI is implemented in TypeScript as a Commander.js application.

Key files:
- src/speclangd.ts: CLI entry point (this file)
- src/daemon/index.ts: Daemon implementation
- src/daemon/convergence.ts: Convergence detection

Usage examples:

    # Start daemon in foreground
    speclangd start

    # Start daemon in background
    speclangd start --daemon

    # Check status
    speclangd status

    # Pause cascade
    speclangd pause
```

## Error Handling

```speclang
# @block:speclangd/errors @kind:entity
ErrorHandling:
  daemon_not_running: Returns error code 1 with message
  invalid_command: Shows help text
  file_not_found: For trigger command, returns error
  convergence_timeout: For converge command, returns timeout error
```
