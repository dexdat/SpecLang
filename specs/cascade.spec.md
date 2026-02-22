# speclang-header lines:12
id: "@speclang/cascade"
version: 0.1.0
layer: 0
tags: [cascade, reactive, loop, trigger]
imports: ["@speclang/core", "@speclang/daemon", "@speclang/agent-protocol"]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Cascade
---
# Cascade

The reactive loop where files trigger files. The heart of Speclang.

This specification has been split into two detailed sub-specifications:

## Sub-specifications

### @ref:speclang/cascade/triggers
**Triggers and Flow** – What starts a cascade, depth tracking, concurrent cascades, events, control, graph, and loop prevention.

### @ref:speclang/cascade/convergence
**Convergence and Termination** – How cascades end, debugging, and comparison with build systems.

## Overview

```speclang
# @block:cascade/overview @kind:note
The cascade is the never-ending cycle of:
1. File changes
2. Agent reactions
3. New file changes
4. More agent reactions
5. Repeat until convergence

It's a living system - files trigger agents, agents write files,
files trigger more agents. Like a reactor, not a compiler.
```

---

For detailed information, refer to the sub-specifications above.