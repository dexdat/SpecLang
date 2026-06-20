# speclang-header lines:11
id: "@speclang/daemon-setup"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [daemon, setup, chokidar, pi, file-watcher]
status: draft
short: "Daemon Setup and Configuration for Pi Agent"
target: src/daemon-setup/
imports: "["@speclang/daemon", "@speclang/pi-integration"]"
---

# Daemon Setup

How to set up and run the Pi-based Speclang daemon.

## Prerequisites

```speclang
# @block:daemon-setup/prerequisites @kind:entity
Prerequisites:
  - Node.js 18+
  - npm or bun
  - Pi Agent SDK: @earendil-works/pi-coding-agent
  - chokidar npm package
```

## Installation

```speclang
# @block:daemon-setup/install @kind:code
```bash
# Install Pi Agent SDK
npm install @earendil-works/pi-coding-agent

# Install chokidar for cross-platform file watching
npm install chokidar

# Optional: TypeScript types
npm install -D @types/chokidar
```
```

## Starting the Daemon

```speclang
# @block:daemon-setup/start @kind:code
```bash
# Start daemon with default config
speclangd --watch specs/ --pipeline build.yaml

# With custom config
speclangd --config .speclangrc

# Daemon options:
#   --watch      Directory to watch for spec changes
#   --pipeline   Pipeline config file
#   --quiet      Quiet period in seconds (default: 30)
#   --port       Agent API port (default: 7777)
#   --config     Path to .speclangrc
```
```

## How It Works

```speclang
# @block:daemon-setup/flow @kind:sequence
1. speclangd starts, initializes chokidar watcher on specs/
2. Pi Agent SDK creates extension environment
3. Guard extension registers via pi.registerTool() + onToolCall
4. When file change detected:
   a. chokidar emits change event
   b. Cascade router parses header, determines owning agent
   c. Pi agent session created via createAgentSession()
   d. Agent processes file, writes output via guarded tools
   e. New changes trigger more agent sessions
   f. Convergence detector tracks quiet period
5. On convergence: pipeline executes build.yaml stages
```

## Configuration

```speclang
# @block:daemon-setup/config @kind:entity
DaemonConfig:
  watch_dirs:
    - specs/
    - tests/
  
  quiet_period: 30s
  
  agent_config:
    model: gpt-4
    max_concurrent: 5
    timeout: 120s
  
  chokidar:
    ignore_initial: true
    await_write_finish: true
    ignored:
      - "**/node_modules/**"
      - "**/.git/**"
      - "**/.speclang/**"
      - "**/*.log"
```

## See Also

- @ref:specs/pi-integration - Pi Agent integration
- @ref:specs/pi-extension-examples - Pi extension examples
- @ref:specs/daemon - Daemon architecture
