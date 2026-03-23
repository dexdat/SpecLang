# speclang-header lines:9
id: "@speclang/agent-support"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, support, levels]
children: ["@speclang/agent-support/human-only"]
short: Agent support level implementations
---

# Agent Support Implementations

This spec directory contains implementations for each agent support level.

## Overview

### @block::levels @kind:entity

AgentSupportLevels:
  human_only:
    description: Human makes all decisions, AI assists
    autonomy: 0%
    
  human_oversight:
    description: AI proposes, human approves
    autonomy: 25%
    
  agent_assisted:
    description: AI executes, human supervises
    autonomy: 50%
    
  agent_autonomous:
    description: AI operates independently
    autonomy: 100%

### @block::implementation @kind:entity

ImplementationDetails:
  human_only:
    tools: []
    human_decisions: all
    
  human_oversight:
    tools: [propose, review]
    human_decisions: final
    
  agent_assisted:
    tools: [execute, report]
    human_decisions: critical
    
  agent_autonomous:
    tools: [all]
    human_decisions: none

### @block::children @kind:entity

ChildSpecs:
  - "@ref:speclang/agent-support/human-only" – Human-only agent support module

### @block::usage @kind:entity

UsageExample:
  header_field: agent_support
  valid_values:
    - agent_autonomous
    - agent_assisted
    - human_oversight
    - human_only
  default: human_only
  
  Example:
    code: |
      # speclang-header lines:10
      id: "@specs/my-feature"
      agent_support: agent_autonomous
      ---
