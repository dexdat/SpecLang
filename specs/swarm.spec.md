# speclang-header lines:13
id: @specs/swarm
version: 1.0.0
layer: 5
target: src/swarm/
project_level: Alpha
agent_support: agent_assonomous
tags: [swarm]
short: swarm module implementation
---

# Swarm Module

Specification for the swarm module.

## Files

### @block:swarm/agent-router @kind:code
Routes file paths to appropriate agent type based on patterns

### @block:swarm/file-watcher @kind:code
Watches spec file globs using chokidar with debouncing

### @block:swarm/git-handler @kind:code
Manages git commits with causality chain tracking

### @block:swarm/index @kind:code
Barrel export re-exporting all swarm module types and classes

### @block:swarm/queue @kind:code
Priority-based queue for concurrent agent task processing

### @block:swarm/session-manager @kind:code
Spawns and manages AI agent session lifecycles

### @block:swarm/session-persistence @kind:code
Multi-tier context manager optimizing LLM context window usage

