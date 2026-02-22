# speclang-header lines:11
id: "@speclang/cascade-protocol"
version: 1.0.0
layer: 1
tags: [cascade, protocol, coordination, agents]
status: draft
project_level: Alpha
agent_support: agent_autonomous
short: Explicit Cascade Coordination Protocol
---

# SpecLang Cascade Protocol

Explicit coordination protocol for the reactive cascade within OpenCode constraints.

This spec has been split into sub‑specs for clarity:

## Sub‑Specs

### @ref:specs/cascade-protocol/events
**Events and Definitions** – Cascade state, agent roles, verification gates, error handling, termination states, success criteria, and implementation notes.

### @ref:specs/cascade-protocol/flow  
**Flow and Multi‑Tree Generation** – Protocol overview, cascade flow steps, multi‑tree spanning generation, layer‑ordered processing, and examples.

## Overview

The cascade protocol coordinates the reactive generation of specs, code, tests, and docs across multiple dependency trees. Because OpenCode lacks automatic file watching and agent triggering, the protocol uses explicit coordination via the `@speclang‑coordinator` agent.

**Key principle**: Explicit > automatic when automation is unreliable.

For full details, see the sub‑specs above.
