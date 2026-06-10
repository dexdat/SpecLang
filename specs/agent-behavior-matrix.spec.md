---
id: "@speclang/agent-behavior-matrix"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, behavior, matrix, autonomous]
short: Directory spec for agent behavior matrix
---
# Agent Behavior Matrix (Directory)

This spec has been split into sub‑specs for better organization:

## Sub‑specs

1. **[@ref:speclang/agent-behavior-matrix/matrix]** – Core behavior matrix definitions
2. **[@ref:speclang/agent-behavior-matrix/transitions]** – Transition workflows and fallback protocols

## Purpose

The agent behavior matrix defines how each agent role should behave based on metadata fields:
- `project_level` (POC → Enterprise)
- `agent_support` (human_only → agent_autonomous)
- `layer` (depth in tree)

## Usage

Refer to the sub‑specs for detailed rules. This directory spec provides the overall structure.