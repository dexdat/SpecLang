---
id: "@speclang/pi-integration"
version: 0.1.0
target: src/pi-integration/
layer: 0
tags: [pi, integration, runtime, agents, assembler, watch-system]
imports: ["@speclang/core", "@speclang/daemon", "@speclang/agent-protocol"]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: Pi Agent Integration
---

# Pi Agent Integration

Speclang's runtime implementation using Pi Agent as the agent harness.

## Overview

Pi Agent provides the ideal foundation for Speclang's reactive cascade system:
- `createAgentSession()` SDK for programmatic agent control
- TypeScript extension system with `pi.registerTool()`
- Event interception (`onToolCall`, `onSessionEvent`)
- Custom commands (`/speclang:status`)
- Hot-reload support (`/reload`)
- RPC mode for external programmatic control
- Minimal footprint — system prompt under 1000 tokens

**Pi SDK is used for agent sessions (model calls) only.** The watch system, notification graph, and cascade routing are our own implementations (chokidar + notification graph logic).

## Role of the Assembler

The **assembler** is a core SpecLang module (not part of Pi) that:
1. Reads `.spec.{lang}.md` files (code-pair specs)
2. Reads all `@ref:` dependencies and folder context
3. Uses Pi SDK agent sessions for model calls (via `createAgentSession()`)
4. Produces `.spec.{lang}` generated source files
5. The **cascade router** owns the notification graph — not Pi

## Sub-Specifications

This high-level spec is expanded into detailed sub-specs:

```speclang
# @block:pi-integration/subspecs @kind:refs
@ref:speclang/pi-integration/daemon
@ref:speclang/pi-integration/extensions
```

### 1. Daemon Setup (`@speclang/daemon-setup`)
- File watching with chokidar (our own, not Pi's)
- Watch pattern matching from spec headers (watch.files/watch.exclude)
- Notification graph construction and maintenance
- Cascade event routing via notification graph
- Pi agent session lifecycle
- Convergence detection

### 2. Extension Examples (`@speclang/pi-extension-examples`)
- Custom tools via pi.registerTool()
- Guard interceptor via onToolCall
- Custom commands via pi.registerCommand()
- Event handlers

## Quick Start

```bash
npm install @earendil-works/pi-coding-agent chokidar
speclangd --watch specs/ --pipeline build.yaml
```

The daemon will:
1. Watch `specs/` directory for file changes via chokidar (our own watcher)
2. Parse headers and determine owning agent
3. Query notification graph for dependent specs
4. Create Pi agent sessions for model calls via `createAgentSession()`
5. Enforce file-ownership rules via guard interceptor
6. Apply squash (100ms debounce) and throttle (fairness queue)
7. Dispatch to model pools based on header model/model_pool fields
8. Detect convergence after 30 seconds of inactivity
9. Run the pipeline: assembler produces .spec.{lang} files, then target compiler builds

## Architecture Summary

```speclang
# @block:pi-integration/architecture-summary @kind:diagram
```mermaid
flowchart TD
    chokidar[chokidar Watcher] --> NG[Notification Graph]
    NG --> Router[Cascade Router with Squash + Throttle]
    Router --> Disp[Model Pool Dispatcher]
    Disp --> P1[Pi Session: SpecWriter]
    Disp --> P2[Pi Session: CodeGen (Assembler)]
    Disp --> P3[Pi Session: TestWriter]
    P1 & P2 & P3 --> Guard[Guard Interceptor]
    Guard --> FS[Filesystem]
    FS --> Convergence[Convergence Detector]
    Convergence --> Assembler[SpecLang Assembler]
    Assembler --> TargetCompiler[Target Compiler: gcc/tsc/go build]
    TargetCompiler --> Pipeline[build.yaml Pipeline]
```
```

## Next Steps

- Install Pi Agent SDK: `npm install @earendil-works/pi-coding-agent`
- Install chokidar: `npm install chokidar`
- Configure daemon watcher paths
- Write guard extension using `pi.registerTool()` + `onToolCall`
- Implement notification graph in cascade router
- Implement squash and throttle logic

For full details, see the sub-specs in `specs/pi-integration.spec.dir/`.
