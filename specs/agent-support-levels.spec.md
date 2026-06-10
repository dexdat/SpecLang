---
id: "@speclang/agent-support-levels"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, support, autonomy, levels]
children: ["@speclang/agent-support-levels/levels", "@speclang/agent-support-levels/behaviors"]
short: Behavioral expectations for each agent_support level
---

# Agent Support Levels

This spec has been split into sub-specs for better organization.

## Overview

### @block::overview @kind:entity

Agent support levels define how much autonomy an AI agent has when working with specs. The level is specified in the spec header using the `agent_support` field.

### @block::levels-definitions @kind:entity

LevelDefinitions:
  human_only:
    autonomy: 0
    description: Human makes all decisions, AI assists only
    
  human_oversight:
    autonomy: 25
    description: AI proposes, human approves
    
  agent_assisted:
    autonomy: 50
    description: AI executes, human supervises
    
  agent_autonomous:
    autonomy: 100
    description: AI operates independently

### @block::behavior-matrix @kind:entity

BehaviorMatrix:
  decision_making:
    human_only: Human
    human_oversight: Human (from AI proposals)
    agent_assisted: AI (human monitors)
    agent_autonomous: AI

  error_recovery:
    human_only: Human fixes
    human_oversight: Human approves fixes
    agent_assisted: AI attempts, human reviews
    agent_autonomous: AI handles completely

### @block::children @kind:entity

ChildSpecs:
  - "@ref:speclang/agent-support-levels/levels" – Definitions of levels
  - "@ref:speclang/agent-support-levels/behaviors" – Behavior matrix

### @block::usage @kind:entity

Usage:
  header_field: agent_support
  required_for_autonomous: true
  
  Validation:
    - Level must be one of the four defined values
    - Must be present in header for validation to succeed
