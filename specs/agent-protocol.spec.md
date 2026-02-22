# speclang-header lines:12
id: "@speclang/agent-protocol"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_assisted
tags: [agents, protocol, ownership, sessions]
imports: ["@speclang/core"]
status: draft

short: Agent Protocol
---

# Agent Protocol

How agents communicate, own files, and respect boundaries.

## Overview

```speclang
# @block:protocol/overview @kind:note
Every agent runs in its own session. Each session owns specific files.
Agents can read anything but only write to files they own.
The guard plugin enforces this at the AI editor level.
```

## Parts

This specification is split into two component specs:

### @ref:speclang/agent-protocol/sessions
- Sessions, lifecycle, and session management
- Concurrency model and error handling  
- Behavior based on metadata

### @ref:speclang/agent-protocol/ownership
- File ownership patterns and access control
- Communication events and guard plugin
- Locking mechanisms and custom agents

See the component specs for detailed specifications.
